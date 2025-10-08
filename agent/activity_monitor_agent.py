"""
Activity Monitor Agent for Windows
Collects user activity data and sends it to the IT Management backend.

Features:
- Bandwidth usage tracking
- Browser history collection
- System status monitoring
- File transfer logging
- Logged accounts detection
- External connection tracking
"""

import os
import sys
import json
import time
import socket
import psutil
import sqlite3
import requests
import threading
import win32api
import win32con
import win32evtlog
import win32security
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
import logging
from typing import Dict, List, Any
import subprocess
import winreg

# Configuration
AGENT_VERSION = "1.0.0"
CONFIG_FILE = "agent_config.json"
CACHE_FILE = "activity_cache.json"
LOG_FILE = "activity_agent.log"

# Default configuration
DEFAULT_CONFIG = {
    "server_url": "http://localhost:5001/api/activity-monitor",
    "agent_token": "",
    "user_id": "",
    "system_name": socket.gethostname(),
    "report_interval": 300,  # 5 minutes
    "enable_browser_history": True,
    "enable_file_monitoring": True,
    "enable_network_monitoring": True,
    "max_cache_size": 100
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
logger = logging.getLogger(__name__)


class ActivityMonitorAgent:
    """Main agent class for collecting and reporting user activity"""
    
    def __init__(self, config_path: str = CONFIG_FILE):
        self.config = self.load_config(config_path)
        self.cache = []
        self.running = False
        
        # Network tracking
        self.last_network_stats = None
        self.network_start_time = time.time()
        
        # File monitoring
        self.file_transfers = []
        
        # Application tracking
        self.app_usage = {}
        self.last_active_window = None
        
        logger.info(f"Activity Monitor Agent v{AGENT_VERSION} initialized")
    
    def load_config(self, config_path: str) -> Dict:
        """Load configuration from file or create default"""
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    # Merge with defaults
                    return {**DEFAULT_CONFIG, **config}
            except Exception as e:
                logger.error(f"Error loading config: {e}")
                return DEFAULT_CONFIG
        else:
            # Create default config file
            with open(config_path, 'w') as f:
                json.dump(DEFAULT_CONFIG, f, indent=2)
            return DEFAULT_CONFIG
    
    def save_config(self):
        """Save current configuration"""
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def collect_network_usage(self) -> Dict[str, float]:
        """Collect network bandwidth usage"""
        try:
            net_io = psutil.net_io_counters()
            
            upload_bytes = 0
            download_bytes = 0
            
            if self.last_network_stats:
                upload_bytes = net_io.bytes_sent - self.last_network_stats['bytes_sent']
                download_bytes = net_io.bytes_recv - self.last_network_stats['bytes_recv']
            
            self.last_network_stats = {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv
            }
            
            upload_mb = upload_bytes / (1024 * 1024)
            download_mb = download_bytes / (1024 * 1024)
            
            return {
                'uploadBytes': int(upload_bytes),
                'downloadBytes': int(download_bytes),
                'uploadMB': round(upload_mb, 2),
                'downloadMB': round(download_mb, 2),
                'totalMB': round(upload_mb + download_mb, 2),
                'activeConnections': len(psutil.net_connections())
            }
        except Exception as e:
            logger.error(f"Error collecting network usage: {e}")
            return {
                'uploadBytes': 0,
                'downloadBytes': 0,
                'uploadMB': 0,
                'downloadMB': 0,
                'totalMB': 0,
                'activeConnections': 0
            }
    
    def collect_browser_history(self) -> List[Dict]:
        """Collect browser history from Chrome and Edge"""
        if not self.config.get('enable_browser_history', True):
            return []
        
        websites = []
        
        # Chrome history
        chrome_history = self.get_chrome_history()
        websites.extend(chrome_history)
        
        # Edge history
        edge_history = self.get_edge_history()
        websites.extend(edge_history)
        
        return websites
    
    def get_chrome_history(self) -> List[Dict]:
        """Get Chrome browser history"""
        websites = []
        
        try:
            # Chrome history path
            chrome_path = os.path.join(
                os.environ['LOCALAPPDATA'],
                'Google', 'Chrome', 'User Data', 'Default', 'History'
            )
            
            if not os.path.exists(chrome_path):
                return websites
            
            # Copy to temp file (Chrome locks the database)
            temp_path = chrome_path + '_temp'
            try:
                import shutil
                shutil.copy2(chrome_path, temp_path)
                
                conn = sqlite3.connect(temp_path)
                cursor = conn.cursor()
                
                # Get URLs from last reporting interval
                cutoff_time = int((time.time() - self.config['report_interval']) * 1000000)
                
                query = """
                    SELECT url, title, visit_count, last_visit_time
                    FROM urls
                    WHERE last_visit_time > ?
                    ORDER BY last_visit_time DESC
                    LIMIT 100
                """
                
                cursor.execute(query, (cutoff_time,))
                rows = cursor.fetchall()
                
                for row in rows:
                    url, title, visit_count, last_visit = row
                    
                    # Convert Chrome timestamp to Python datetime
                    visit_time = datetime(1601, 1, 1) + timedelta(microseconds=last_visit)
                    
                    try:
                        from urllib.parse import urlparse
                        domain = urlparse(url).netloc
                    except:
                        domain = url.split('/')[2] if len(url.split('/')) > 2 else 'unknown'
                    
                    websites.append({
                        'url': url,
                        'title': title or domain,
                        'domain': domain,
                        'duration': 0,  # Chrome doesn't track duration
                        'visitTime': visit_time.isoformat()
                    })
                
                conn.close()
                os.remove(temp_path)
                
            except Exception as e:
                logger.error(f"Error reading Chrome history database: {e}")
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except:
                        pass
        
        except Exception as e:
            logger.error(f"Error accessing Chrome history: {e}")
        
        return websites
    
    def get_edge_history(self) -> List[Dict]:
        """Get Microsoft Edge browser history"""
        websites = []
        
        try:
            # Edge history path
            edge_path = os.path.join(
                os.environ['LOCALAPPDATA'],
                'Microsoft', 'Edge', 'User Data', 'Default', 'History'
            )
            
            if not os.path.exists(edge_path):
                return websites
            
            # Same process as Chrome (Edge uses Chromium)
            temp_path = edge_path + '_temp'
            try:
                import shutil
                shutil.copy2(edge_path, temp_path)
                
                conn = sqlite3.connect(temp_path)
                cursor = conn.cursor()
                
                cutoff_time = int((time.time() - self.config['report_interval']) * 1000000)
                
                query = """
                    SELECT url, title, visit_count, last_visit_time
                    FROM urls
                    WHERE last_visit_time > ?
                    ORDER BY last_visit_time DESC
                    LIMIT 100
                """
                
                cursor.execute(query, (cutoff_time,))
                rows = cursor.fetchall()
                
                for row in rows:
                    url, title, visit_count, last_visit = row
                    visit_time = datetime(1601, 1, 1) + timedelta(microseconds=last_visit)
                    
                    try:
                        from urllib.parse import urlparse
                        domain = urlparse(url).netloc
                    except:
                        domain = url.split('/')[2] if len(url.split('/')) > 2 else 'unknown'
                    
                    websites.append({
                        'url': url,
                        'title': title or domain,
                        'domain': domain,
                        'duration': 0,
                        'visitTime': visit_time.isoformat()
                    })
                
                conn.close()
                os.remove(temp_path)
                
            except Exception as e:
                logger.error(f"Error reading Edge history database: {e}")
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except:
                        pass
        
        except Exception as e:
            logger.error(f"Error accessing Edge history: {e}")
        
        return websites
    
    def collect_system_status(self) -> Dict:
        """Collect current system status"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Get system uptime
            boot_time = psutil.boot_time()
            uptime_seconds = int(time.time() - boot_time)
            
            # Get idle time (Windows-specific)
            idle_time = self.get_idle_time()
            
            # Count active applications
            active_apps = len([p for p in psutil.process_iter(['name']) if p.info['name']])
            
            return {
                'cpuUsage': round(cpu_percent, 2),
                'memoryUsage': round(memory.percent, 2),
                'memoryUsedMB': round(memory.used / (1024 * 1024), 2),
                'memoryTotalMB': round(memory.total / (1024 * 1024), 2),
                'diskUsage': round(disk.percent, 2),
                'uptime': uptime_seconds,
                'activeApps': active_apps,
                'idleTime': idle_time
            }
        except Exception as e:
            logger.error(f"Error collecting system status: {e}")
            return {}
    
    def get_idle_time(self) -> int:
        """Get Windows idle time in seconds"""
        try:
            import ctypes
            
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [
                    ('cbSize', ctypes.c_uint),
                    ('dwTime', ctypes.c_uint),
                ]
            
            lastInputInfo = LASTINPUTINFO()
            lastInputInfo.cbSize = ctypes.sizeof(LASTINPUTINFO)
            
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lastInputInfo)):
                millis = ctypes.windll.kernel32.GetTickCount() - lastInputInfo.dwTime
                return millis // 1000
            
            return 0
        except Exception as e:
            logger.error(f"Error getting idle time: {e}")
            return 0
    
    def collect_application_usage(self) -> List[Dict]:
        """Collect application usage information"""
        applications = []
        
        try:
            import win32process
            import win32gui
            
            def window_callback(hwnd, windows):
                if win32gui.IsWindowVisible(hwnd):
                    try:
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        process = psutil.Process(pid)
                        window_title = win32gui.GetWindowText(hwnd)
                        
                        if window_title:
                            windows.append({
                                'appName': process.name(),
                                'windowTitle': window_title,
                                'processName': process.name(),
                                'isActive': hwnd == win32gui.GetForegroundWindow()
                            })
                    except:
                        pass
            
            windows = []
            win32gui.EnumWindows(window_callback, windows)
            
            # Deduplicate and summarize
            app_map = {}
            for window in windows:
                key = window['processName']
                if key not in app_map:
                    app_map[key] = window
            
            applications = list(app_map.values())
            
        except Exception as e:
            logger.error(f"Error collecting application usage: {e}")
        
        return applications
    
    def collect_file_transfers(self) -> List[Dict]:
        """Collect file transfer events"""
        # Return cached file transfers and clear
        transfers = self.file_transfers.copy()
        self.file_transfers.clear()
        return transfers
    
    def monitor_file_events(self):
        """Monitor file system events (runs in background thread)"""
        # This would use a file system watcher
        # Simplified implementation - can be enhanced with win32file API
        pass
    
    def collect_logged_accounts(self) -> List[Dict]:
        """Collect logged in accounts from browsers and email clients"""
        accounts = []
        
        try:
            # Check for Chrome profiles
            chrome_profiles = self.get_chrome_profiles()
            accounts.extend(chrome_profiles)
            
            # Check for Edge profiles
            edge_profiles = self.get_edge_profiles()
            accounts.extend(edge_profiles)
            
            # Check for Outlook accounts
            outlook_accounts = self.get_outlook_accounts()
            accounts.extend(outlook_accounts)
            
        except Exception as e:
            logger.error(f"Error collecting logged accounts: {e}")
        
        return accounts
    
    def get_chrome_profiles(self) -> List[Dict]:
        """Get Chrome user profiles"""
        accounts = []
        
        try:
            chrome_path = os.path.join(
                os.environ['LOCALAPPDATA'],
                'Google', 'Chrome', 'User Data'
            )
            
            if not os.path.exists(chrome_path):
                return accounts
            
            # Read local state to get profiles
            local_state_file = os.path.join(chrome_path, 'Local State')
            if os.path.exists(local_state_file):
                with open(local_state_file, 'r', encoding='utf-8') as f:
                    local_state = json.load(f)
                    
                    profiles = local_state.get('profile', {}).get('info_cache', {})
                    
                    for profile_name, profile_data in profiles.items():
                        accounts.append({
                            'browser': 'Chrome',
                            'platform': 'Google',
                            'email': profile_data.get('user_name', profile_data.get('name', 'Unknown')),
                            'accountType': 'Browser Profile',
                            'loginTime': datetime.now().isoformat()
                        })
        
        except Exception as e:
            logger.error(f"Error getting Chrome profiles: {e}")
        
        return accounts
    
    def get_edge_profiles(self) -> List[Dict]:
        """Get Edge user profiles"""
        accounts = []
        
        try:
            edge_path = os.path.join(
                os.environ['LOCALAPPDATA'],
                'Microsoft', 'Edge', 'User Data'
            )
            
            if not os.path.exists(edge_path):
                return accounts
            
            local_state_file = os.path.join(edge_path, 'Local State')
            if os.path.exists(local_state_file):
                with open(local_state_file, 'r', encoding='utf-8') as f:
                    local_state = json.load(f)
                    
                    profiles = local_state.get('profile', {}).get('info_cache', {})
                    
                    for profile_name, profile_data in profiles.items():
                        accounts.append({
                            'browser': 'Edge',
                            'platform': 'Microsoft',
                            'email': profile_data.get('user_name', profile_data.get('name', 'Unknown')),
                            'accountType': 'Browser Profile',
                            'loginTime': datetime.now().isoformat()
                        })
        
        except Exception as e:
            logger.error(f"Error getting Edge profiles: {e}")
        
        return accounts
    
    def get_outlook_accounts(self) -> List[Dict]:
        """Get Outlook email accounts from registry"""
        accounts = []
        
        try:
            # Try to read Outlook registry keys
            key_path = r"Software\Microsoft\Office\Outlook\OMI Account Manager\Accounts"
            
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path)
                i = 0
                while True:
                    try:
                        account_name = winreg.EnumKey(key, i)
                        accounts.append({
                            'browser': 'Outlook',
                            'platform': 'Microsoft',
                            'email': account_name,
                            'accountType': 'Email',
                            'loginTime': datetime.now().isoformat()
                        })
                        i += 1
                    except WindowsError:
                        break
                
                winreg.CloseKey(key)
            except WindowsError:
                pass
        
        except Exception as e:
            logger.error(f"Error getting Outlook accounts: {e}")
        
        return accounts
    
    def collect_external_connections(self) -> List[Dict]:
        """Collect external network connections"""
        connections = []
        
        try:
            # Get all network connections
            net_connections = psutil.net_connections(kind='inet')
            
            # Filter for established external connections
            for conn in net_connections:
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    remote_ip = conn.raddr.ip
                    remote_port = conn.raddr.port
                    local_port = conn.laddr.port if conn.laddr else 0
                    
                    # Skip local connections
                    if remote_ip.startswith('127.') or remote_ip.startswith('192.168.') or remote_ip.startswith('10.'):
                        continue
                    
                    # Get location info (would need GeoIP database - simplified here)
                    location = self.get_ip_location(remote_ip)
                    
                    connections.append({
                        'remoteIP': remote_ip,
                        'remotePort': remote_port,
                        'localPort': local_port,
                        'protocol': 'TCP' if conn.type == socket.SOCK_STREAM else 'UDP',
                        'location': location,
                        'connectionTime': datetime.now().isoformat(),
                        'status': conn.status
                    })
        
        except Exception as e:
            logger.error(f"Error collecting external connections: {e}")
        
        return connections
    
    def get_ip_location(self, ip: str) -> Dict:
        """Get geographic location for IP address"""
        # Simplified - would use GeoIP database or API
        try:
            # For demo purposes, use a free API (rate-limited)
            # In production, use local GeoIP database
            response = requests.get(f'http://ip-api.com/json/{ip}', timeout=2)
            if response.status_code == 200:
                data = response.json()
                return {
                    'country': data.get('country', 'Unknown'),
                    'city': data.get('city', 'Unknown'),
                    'coordinates': {
                        'lat': data.get('lat', 0),
                        'lng': data.get('lon', 0)
                    }
                }
        except:
            pass
        
        return {
            'country': 'Unknown',
            'city': 'Unknown',
            'coordinates': {'lat': 0, 'lng': 0}
        }
    
    def collect_all_data(self) -> Dict[str, Any]:
        """Collect all monitoring data"""
        logger.info("Collecting activity data...")
        
        data = {
            'userId': self.config.get('user_id'),
            'userName': os.environ.get('USERNAME', 'Unknown'),
            'systemName': self.config['system_name'],
            'timestamp': datetime.now().isoformat(),
            'network': self.collect_network_usage(),
            'websites': self.collect_browser_history(),
            'systemStatus': self.collect_system_status(),
            'applications': self.collect_application_usage(),
            'fileTransfers': self.collect_file_transfers(),
            'loggedAccounts': self.collect_logged_accounts(),
            'externalConnections': self.collect_external_connections(),
            'agentVersion': AGENT_VERSION,
            'osVersion': f"{sys.platform} {platform.release()}",
            'reportInterval': self.config['report_interval']
        }
        
        logger.info(f"Collected data: {len(data['websites'])} websites, "
                   f"{len(data['applications'])} apps, "
                   f"{len(data['externalConnections'])} connections")
        
        return data
    
    def send_data(self, data: Dict[str, Any]) -> bool:
        """Send collected data to server"""
        try:
            url = f"{self.config['server_url']}/upload"
            headers = {
                'Content-Type': 'application/json',
                'X-Agent-Token': self.config['agent_token']
            }
            
            response = requests.post(url, json=data, headers=headers, timeout=30)
            
            if response.status_code == 201:
                logger.info("Data sent successfully")
                result = response.json()
                logger.info(f"Risk score: {result.get('riskScore', 0)}")
                return True
            else:
                logger.error(f"Failed to send data: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending data: {e}")
            return False
    
    def cache_data(self, data: Dict[str, Any]):
        """Cache data locally when server is unreachable"""
        self.cache.append(data)
        
        # Limit cache size
        if len(self.cache) > self.config['max_cache_size']:
            self.cache = self.cache[-self.config['max_cache_size']:]
        
        # Save to file
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(self.cache, f)
        except Exception as e:
            logger.error(f"Error saving cache: {e}")
    
    def send_cached_data(self):
        """Send any cached data"""
        if not self.cache:
            return
        
        logger.info(f"Sending {len(self.cache)} cached records...")
        
        successful = []
        for data in self.cache:
            if self.send_data(data):
                successful.append(data)
        
        # Remove successfully sent data from cache
        for data in successful:
            self.cache.remove(data)
        
        # Update cache file
        if successful:
            try:
                with open(CACHE_FILE, 'w') as f:
                    json.dump(self.cache, f)
            except Exception as e:
                logger.error(f"Error updating cache: {e}")
    
    def send_heartbeat(self):
        """Send heartbeat to server"""
        try:
            url = f"{self.config['server_url']}/heartbeat"
            headers = {
                'Content-Type': 'application/json',
                'X-Agent-Token': self.config['agent_token']
            }
            
            data = {
                'systemName': self.config['system_name'],
                'agentVersion': AGENT_VERSION,
                'status': 'running'
            }
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                logger.debug("Heartbeat sent successfully")
        except Exception as e:
            logger.debug(f"Heartbeat error: {e}")
    
    def run(self):
        """Main agent loop"""
        logger.info("Starting Activity Monitor Agent...")
        self.running = True
        
        # Validate configuration
        if not self.config.get('agent_token'):
            logger.error("Agent token not configured. Please set agent_token in config.")
            return
        
        if not self.config.get('user_id'):
            logger.warning("User ID not configured. Some features may not work.")
        
        # Initial network stats
        self.collect_network_usage()
        
        # Send initial heartbeat
        self.send_heartbeat()
        
        # Main loop
        iteration = 0
        while self.running:
            try:
                # Collect and send data
                data = self.collect_all_data()
                
                if self.send_data(data):
                    # Try to send cached data if send was successful
                    self.send_cached_data()
                else:
                    # Cache data if send failed
                    self.cache_data(data)
                
                # Send heartbeat every 5 iterations
                iteration += 1
                if iteration % 5 == 0:
                    self.send_heartbeat()
                
                # Wait for next interval
                logger.info(f"Waiting {self.config['report_interval']} seconds until next report...")
                time.sleep(self.config['report_interval'])
                
            except KeyboardInterrupt:
                logger.info("Agent stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(60)  # Wait a minute before retrying
        
        self.running = False
        logger.info("Activity Monitor Agent stopped")
    
    def stop(self):
        """Stop the agent"""
        self.running = False


# Import platform module
import platform


def main():
    """Main entry point"""
    print(f"Activity Monitor Agent v{AGENT_VERSION}")
    print("=" * 50)
    
    agent = ActivityMonitorAgent()
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\nShutting down...")
        agent.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

