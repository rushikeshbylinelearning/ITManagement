#!/usr/bin/env python3
"""
IT Management Monitoring Agent
Cross-platform system monitoring agent for Windows and Linux

This agent collects system metrics, process information, file events, and network usage,
then sends the telemetry data to the IT Management backend server.
"""

import os
import sys
import time
import json
import socket
import platform
import psutil
import requests
import logging
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path
import hashlib
import threading
from queue import Queue
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
CONFIG_FILE = 'config.json'
LOG_FILE = 'monitoring_agent.log'

# Default configuration
DEFAULT_CONFIG = {
    "backend_url": "http://localhost:5001/api/monitoring/events",
    "registration_url": "http://localhost:5001/api/monitoring/register",
    "api_key": "default-monitoring-key-change-me",
    "agent_id": None,  # Will be auto-generated if not set
    "registration_token": None,  # One-time token for registration
    "hostname": socket.gethostname(),
    "polling_interval": 60,  # seconds
    "monitored_directories": [],  # Directories to watch for file events
    "log_level": "INFO",
    "retry_attempts": 3,
    "retry_backoff": 5,  # seconds
    "local_cache_file": "telemetry_cache.json"
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('MonitoringAgent')


class FileEventHandler(FileSystemEventHandler):
    """Handler for file system events"""
    
    def __init__(self, event_queue: Queue):
        self.event_queue = event_queue
        super().__init__()
    
    def on_created(self, event):
        if not event.is_directory:
            self.event_queue.put({
                'path': event.src_path,
                'operation': 'create',
                'timestamp': datetime.utcnow().isoformat(),
                'size': self._get_file_size(event.src_path),
                'file_type': self._get_file_type(event.src_path)
            })
    
    def on_modified(self, event):
        if not event.is_directory:
            self.event_queue.put({
                'path': event.src_path,
                'operation': 'modify',
                'timestamp': datetime.utcnow().isoformat(),
                'size': self._get_file_size(event.src_path),
                'file_type': self._get_file_type(event.src_path)
            })
    
    def on_deleted(self, event):
        if not event.is_directory:
            self.event_queue.put({
                'path': event.src_path,
                'operation': 'delete',
                'timestamp': datetime.utcnow().isoformat(),
                'size': 0,
                'file_type': self._get_file_type(event.src_path)
            })
    
    @staticmethod
    def _get_file_size(path):
        try:
            return os.path.getsize(path)
        except:
            return 0
    
    @staticmethod
    def _get_file_type(path):
        return Path(path).suffix or 'unknown'


class MonitoringAgent:
    """Main monitoring agent class"""
    
    def __init__(self, config_path: str = CONFIG_FILE):
        self.config = self._load_config(config_path)
        self._setup_logging()
        self.file_event_queue = Queue()
        self.observers = []
        self.running = False
        self.telemetry_cache = []
        
        # Generate agent ID if not set
        if not self.config.get('agent_id'):
            self.config['agent_id'] = self._generate_agent_id()
            self._save_config(config_path)
        
        logger.info(f"Monitoring Agent initialized: {self.config['agent_id']}")
        logger.info(f"Hostname: {self.config['hostname']}")
        logger.info(f"Backend URL: {self.config['backend_url']}")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from file or create default"""
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    # Merge with defaults for any missing keys
                    return {**DEFAULT_CONFIG, **config}
            except Exception as e:
                logger.error(f"Error loading config: {e}")
                return DEFAULT_CONFIG.copy()
        else:
            logger.info("Config file not found, creating default configuration")
            self._save_config(config_path)
            return DEFAULT_CONFIG.copy()
    
    def _save_config(self, config_path: str):
        """Save configuration to file"""
        try:
            with open(config_path, 'w') as f:
                json.dump(self.config, f, indent=4)
            logger.info(f"Configuration saved to {config_path}")
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def _setup_logging(self):
        """Setup logging level from config"""
        level = getattr(logging, self.config['log_level'].upper(), logging.INFO)
        logger.setLevel(level)
    
    def _generate_agent_id(self) -> str:
        """Generate unique agent ID based on hostname and MAC address"""
        hostname = self.config['hostname']
        try:
            mac = ':'.join(['{:02x}'.format((psutil.net_if_addrs()[iface][0].address.replace(':', '').replace('-', ''))[i:i+2], 16) 
                           for iface in psutil.net_if_addrs() for i in range(0, 12, 2)][:6]) if psutil.net_if_addrs() else 'unknown'
        except:
            mac = 'unknown'
        agent_str = f"{hostname}-{mac}"
        return hashlib.md5(agent_str.encode()).hexdigest()[:16]
    
    def register_agent(self) -> bool:
        """
        Register agent with backend using one-time token
        Returns True if registration successful or already registered
        """
        # If already have agent_id, skip registration
        if self.config.get('agent_id'):
            logger.info("Agent already registered with ID: " + self.config['agent_id'])
            return True
        
        # Check if we have a registration token
        if not self.config.get('registration_token'):
            logger.warning("No registration token provided. Please provide a token in config.json")
            # Fallback to auto-generate ID (legacy mode)
            self.config['agent_id'] = self._generate_agent_id()
            self._save_config(CONFIG_FILE)
            return True
        
        try:
            logger.info("Attempting agent registration...")
            
            # Prepare registration data
            registration_data = {
                'token': self.config['registration_token'],
                'hostname': self.config['hostname'],
                'os': platform.system(),
                'os_version': platform.version(),
                'user': os.getenv('USER') or os.getenv('USERNAME') or 'unknown',
                'login_time': datetime.utcnow().isoformat()
            }
            
            # Send registration request
            response = requests.post(
                self.config['registration_url'],
                json=registration_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    # Store agent ID and configuration from backend
                    self.config['agent_id'] = result.get('agent_id')
                    
                    # Update config with backend settings
                    backend_config = result.get('config', {})
                    if backend_config.get('backend_url'):
                        self.config['backend_url'] = backend_config['backend_url']
                    if backend_config.get('api_key'):
                        self.config['api_key'] = backend_config['api_key']
                    if backend_config.get('polling_interval'):
                        self.config['polling_interval'] = backend_config['polling_interval']
                    if backend_config.get('monitored_directories'):
                        self.config['monitored_directories'] = backend_config['monitored_directories']
                    
                    # Clear the registration token (it's one-time use)
                    self.config['registration_token'] = None
                    
                    # Save configuration
                    self._save_config(CONFIG_FILE)
                    
                    logger.info(f"✅ Agent registered successfully! Agent ID: {self.config['agent_id']}")
                    return True
                else:
                    logger.error(f"Registration failed: {result.get('msg')}")
                    return False
            else:
                logger.error(f"Registration failed with status {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during registration: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during registration: {e}")
            return False
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system metrics (CPU, RAM, Disk)"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            memory = psutil.virtual_memory()
            ram_total = memory.total / (1024 ** 2)  # MB
            ram_used = memory.used / (1024 ** 2)  # MB
            ram_percent = memory.percent
            
            # Get disk usage for Windows (C: drive) or Linux (/)
            if platform.system() == 'Windows':
                disk = psutil.disk_usage('C:')
            else:
                disk = psutil.disk_usage('/')
            
            disk_total = disk.total / (1024 ** 3)  # GB
            disk_used = disk.used / (1024 ** 3)  # GB
            disk_percent = disk.percent
            
            # Get MAC address
            mac_address = None
            try:
                for iface, addrs in psutil.net_if_addrs().items():
                    for addr in addrs:
                        if addr.family == psutil.AF_LINK:
                            mac_address = addr.address
                            break
                    if mac_address:
                        break
            except:
                mac_address = 'unknown'
            
            return {
                'os': platform.system(),
                'osVersion': platform.version(),
                'agentVersion': '1.0.0',
                'macAddress': mac_address,
                'cpu': {
                    'model': platform.processor() or 'Unknown',
                    'cores': cpu_count,
                    'usage': cpu_percent
                },
                'ram': {
                    'total': ram_total,
                    'used': ram_used,
                    'usage': ram_percent
                },
                'disk': {
                    'total': disk_total,
                    'used': disk_used,
                    'usage': disk_percent
                }
            }
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {}
    
    def collect_processes(self) -> List[Dict[str, Any]]:
        """Collect running process information"""
        processes = []
        try:
            for proc in psutil.process_iter(['pid', 'name', 'username', 'exe', 'cmdline', 'create_time', 'status']):
                try:
                    pinfo = proc.info
                    cpu_percent = proc.cpu_percent(interval=0.1)
                    memory_info = proc.memory_info()
                    memory_mb = memory_info.rss / (1024 ** 2)
                    
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'user': pinfo['username'],
                        'exe': pinfo['exe'],
                        'cmdline': ' '.join(pinfo['cmdline']) if pinfo['cmdline'] else '',
                        'cpu_percent': cpu_percent,
                        'memory_mb': memory_mb,
                        'create_time': pinfo['create_time'],
                        'status': pinfo['status']
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as e:
            logger.error(f"Error collecting processes: {e}")
        
        return processes
    
    def collect_file_events(self) -> List[Dict[str, Any]]:
        """Collect file events from queue"""
        events = []
        while not self.file_event_queue.empty():
            events.append(self.file_event_queue.get())
        return events
    
    def collect_network_usage(self) -> List[Dict[str, Any]]:
        """Collect network usage information"""
        network_data = []
        try:
            connections = psutil.net_connections(kind='inet')
            net_io = psutil.net_io_counters(pernic=False)
            
            for conn in connections[:50]:  # Limit to 50 connections
                try:
                    if conn.pid:
                        proc = psutil.Process(conn.pid)
                        process_name = proc.name()
                    else:
                        process_name = 'System'
                    
                    network_data.append({
                        'pid': conn.pid,
                        'process': process_name,
                        'protocol': 'tcp' if conn.type == socket.SOCK_STREAM else 'udp',
                        'local_address': conn.laddr.ip if conn.laddr else None,
                        'local_port': conn.laddr.port if conn.laddr else None,
                        'remote_address': conn.raddr.ip if conn.raddr else None,
                        'remote_port': conn.raddr.port if conn.raddr else None,
                        'bytes_sent': net_io.bytes_sent,
                        'bytes_recv': net_io.bytes_recv,
                        'packets_sent': net_io.packets_sent,
                        'packets_recv': net_io.packets_recv,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as e:
            logger.error(f"Error collecting network usage: {e}")
        
        return network_data
    
    def send_telemetry(self, telemetry: Dict[str, Any]) -> bool:
        """Send telemetry data to backend with retry logic"""
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.config['api_key']
        }
        
        for attempt in range(self.config['retry_attempts']):
            try:
                logger.debug(f"Sending telemetry to {self.config['backend_url']} (attempt {attempt + 1})")
                response = requests.post(
                    self.config['backend_url'],
                    json=telemetry,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    logger.info("Telemetry sent successfully")
                    return True
                else:
                    logger.warning(f"Server returned status {response.status_code}: {response.text}")
            
            except requests.exceptions.RequestException as e:
                logger.error(f"Error sending telemetry (attempt {attempt + 1}): {e}")
                if attempt < self.config['retry_attempts'] - 1:
                    time.sleep(self.config['retry_backoff'] * (attempt + 1))
        
        # If all attempts failed, cache the telemetry
        logger.warning("Failed to send telemetry after all attempts, caching locally")
        self.telemetry_cache.append(telemetry)
        self._save_cache()
        return False
    
    def _save_cache(self):
        """Save unsent telemetry to local cache file"""
        try:
            with open(self.config['local_cache_file'], 'w') as f:
                json.dump(self.telemetry_cache, f)
        except Exception as e:
            logger.error(f"Error saving telemetry cache: {e}")
    
    def _load_cache(self):
        """Load unsent telemetry from local cache file"""
        try:
            if os.path.exists(self.config['local_cache_file']):
                with open(self.config['local_cache_file'], 'r') as f:
                    self.telemetry_cache = json.load(f)
                logger.info(f"Loaded {len(self.telemetry_cache)} cached telemetry items")
        except Exception as e:
            logger.error(f"Error loading telemetry cache: {e}")
            self.telemetry_cache = []
    
    def _send_cached_telemetry(self):
        """Try to send cached telemetry"""
        if not self.telemetry_cache:
            return
        
        logger.info(f"Attempting to send {len(self.telemetry_cache)} cached telemetry items")
        sent_items = []
        
        for telemetry in self.telemetry_cache:
            if self.send_telemetry(telemetry):
                sent_items.append(telemetry)
        
        # Remove sent items from cache
        for item in sent_items:
            self.telemetry_cache.remove(item)
        
        if sent_items:
            self._save_cache()
            logger.info(f"Successfully sent {len(sent_items)} cached items")
    
    def start_file_monitoring(self):
        """Start monitoring configured directories for file events"""
        if not self.config['monitored_directories']:
            logger.info("No directories configured for file monitoring")
            return
        
        event_handler = FileEventHandler(self.file_event_queue)
        
        for directory in self.config['monitored_directories']:
            if os.path.exists(directory):
                observer = Observer()
                observer.schedule(event_handler, directory, recursive=True)
                observer.start()
                self.observers.append(observer)
                logger.info(f"Started monitoring directory: {directory}")
            else:
                logger.warning(f"Directory not found, skipping: {directory}")
    
    def stop_file_monitoring(self):
        """Stop monitoring file events"""
        for observer in self.observers:
            observer.stop()
            observer.join()
        logger.info("Stopped file monitoring")
    
    def run(self):
        """Main agent loop"""
        self.running = True
        
        # Register agent first
        if not self.register_agent():
            logger.error("Failed to register agent. Exiting...")
            return
        
        self._load_cache()
        self.start_file_monitoring()
        
        logger.info("Monitoring agent started")
        logger.info(f"Polling interval: {self.config['polling_interval']} seconds")
        
        try:
            while self.running:
                start_time = time.time()
                
                # Try to send cached telemetry first
                self._send_cached_telemetry()
                
                # Collect telemetry
                logger.info("Collecting telemetry data...")
                
                telemetry = {
                    'agent_id': self.config['agent_id'],
                    'hostname': self.config['hostname'],
                    'metrics': self.collect_system_metrics(),
                    'processes': self.collect_processes(),
                    'file_events': self.collect_file_events(),
                    'network': self.collect_network_usage(),
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                logger.info(f"Collected {len(telemetry['processes'])} processes, "
                          f"{len(telemetry['file_events'])} file events, "
                          f"{len(telemetry['network'])} network connections")
                
                # Send telemetry
                self.send_telemetry(telemetry)
                
                # Calculate sleep time
                elapsed = time.time() - start_time
                sleep_time = max(0, self.config['polling_interval'] - elapsed)
                
                if sleep_time > 0:
                    logger.debug(f"Sleeping for {sleep_time:.2f} seconds")
                    time.sleep(sleep_time)
        
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
        finally:
            self.stop()
    
    def stop(self):
        """Stop the monitoring agent"""
        logger.info("Stopping monitoring agent...")
        self.running = False
        self.stop_file_monitoring()
        logger.info("Monitoring agent stopped")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='IT Management Monitoring Agent')
    parser.add_argument('--config', default=CONFIG_FILE, help='Path to configuration file')
    parser.add_argument('--generate-config', action='store_true', help='Generate default configuration file')
    args = parser.parse_args()
    
    if args.generate_config:
        with open(args.config, 'w') as f:
            json.dump(DEFAULT_CONFIG, f, indent=4)
        print(f"Generated default configuration file: {args.config}")
        print("Please edit the configuration file and set your backend URL and API key.")
        return
    
    agent = MonitoringAgent(args.config)
    agent.run()


if __name__ == '__main__':
    main()