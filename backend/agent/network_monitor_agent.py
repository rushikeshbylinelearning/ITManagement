#!/usr/bin/env python3
"""
IT Management Network Monitoring Agent
Version: 1.0.0

This agent monitors network traffic on Windows systems and reports to the IT Management backend.
It runs as a background service and automatically starts on system boot.
"""

import os
import sys
import time
import json
import socket
import psutil
import requests
import threading
import subprocess
from datetime import datetime
from collections import defaultdict
from urllib.parse import urlparse
import ctypes
import winreg
import uuid
import platform

# Configuration
AGENT_VERSION = "1.0.0"
CONFIG_FILE = os.path.join(os.path.expanduser("~"), ".it_monitor", "config.json")
LOG_FILE = os.path.join(os.path.expanduser("~"), ".it_monitor", "agent.log")
BACKEND_URL = "http://localhost:5001/api"  # Development environment
BACKUP_BACKEND_URL = "https://itmanagement.bylinelms.com/api"  # Production fallback
UPDATE_INTERVAL = 10  # seconds
HEARTBEAT_INTERVAL = 60  # seconds

class NetworkMonitorAgent:
    def __init__(self):
        self.system_id = None
        self.system_name = None
        self.agent_token = None
        self.backend_url = BACKEND_URL
        self.is_running = True
        self.network_stats = defaultdict(lambda: {'upload': 0, 'download': 0, 'count': 0})
        self.last_net_io = None
        self.session = requests.Session()
        
        # Domain mapping for better service identification
        self.domain_mapping = {
            # Social Media
            'facebook.com': 'Facebook',
            'instagram.com': 'Instagram',
            'twitter.com': 'Twitter',
            'linkedin.com': 'LinkedIn',
            'tiktok.com': 'TikTok',
            'snapchat.com': 'Snapchat',
            
            # Video Platforms
            'youtube.com': 'YouTube',
            'vimeo.com': 'Vimeo',
            'twitch.tv': 'Twitch',
            'netflix.com': 'Netflix',
            'hulu.com': 'Hulu',
            'disney.com': 'Disney+',
            'amazon.com': 'Amazon Prime',
            
            # Communication
            'zoom.us': 'Zoom',
            'teams.microsoft.com': 'Microsoft Teams',
            'meet.google.com': 'Google Meet',
            'webex.com': 'Webex',
            'slack.com': 'Slack',
            'discord.com': 'Discord',
            'whatsapp.com': 'WhatsApp',
            'telegram.org': 'Telegram',
            
            # Productivity
            'office.com': 'Microsoft Office',
            'google.com': 'Google Services',
            'docs.google.com': 'Google Docs',
            'drive.google.com': 'Google Drive',
            'dropbox.com': 'Dropbox',
            'onedrive.live.com': 'OneDrive',
            'notion.so': 'Notion',
            'trello.com': 'Trello',
            'asana.com': 'Asana',
            
            # Development
            'github.com': 'GitHub',
            'gitlab.com': 'GitLab',
            'bitbucket.org': 'Bitbucket',
            'stackoverflow.com': 'Stack Overflow',
            'stackexchange.com': 'Stack Exchange',
            'dev.to': 'Dev.to',
            'medium.com': 'Medium',
            
            # News & Information
            'cnn.com': 'CNN',
            'bbc.com': 'BBC',
            'reuters.com': 'Reuters',
            'nytimes.com': 'New York Times',
            'washingtonpost.com': 'Washington Post',
            'theguardian.com': 'The Guardian',
            'reddit.com': 'Reddit',
            
            # E-commerce
            'amazon.com': 'Amazon',
            'ebay.com': 'eBay',
            'shopify.com': 'Shopify',
            'paypal.com': 'PayPal',
            'stripe.com': 'Stripe',
            
            # Cloud Services
            'aws.amazon.com': 'Amazon Web Services',
            'azure.microsoft.com': 'Microsoft Azure',
            'cloud.google.com': 'Google Cloud',
            'digitalocean.com': 'DigitalOcean',
            'linode.com': 'Linode',
            
            # Other Popular Services
            'spotify.com': 'Spotify',
            'apple.com': 'Apple Services',
            'adobe.com': 'Adobe',
            'salesforce.com': 'Salesforce',
            'hubspot.com': 'HubSpot',
            'mailchimp.com': 'Mailchimp'
        }
        
        # Ensure config directory exists
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        
        # Load or create configuration
        self.load_config()
        
    def log(self, message):
        """Log message to file and console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        
        try:
            with open(LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(log_message + "\n")
        except Exception as e:
            print(f"Failed to write to log file: {e}")
    
    def load_config(self):
        """Load configuration from file or create new"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self.system_id = config.get('system_id')
                    self.system_name = config.get('system_name')
                    self.agent_token = config.get('agent_token')
                    self.backend_url = config.get('backend_url', BACKEND_URL)
                    self.log(f"Configuration loaded for system: {self.system_name}")
            except Exception as e:
                self.log(f"Error loading config: {e}")
                self.create_new_config()
        else:
            self.create_new_config()
    
    def create_new_config(self):
        """Create new system configuration"""
        self.system_name = socket.gethostname()
        self.system_id = f"sys-{uuid.uuid4().hex[:12]}"
        self.log(f"Created new system ID: {self.system_id}")
    
    def save_config(self):
        """Save configuration to file"""
        config = {
            'system_id': self.system_id,
            'system_name': self.system_name,
            'agent_token': self.agent_token,
            'backend_url': self.backend_url,
            'agent_version': AGENT_VERSION
        }
        
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=2)
            self.log("Configuration saved successfully")
        except Exception as e:
            self.log(f"Error saving config: {e}")
    
    def get_system_info(self):
        """Get system information"""
        try:
            cpu_info = platform.processor()
            ram_info = f"{psutil.virtual_memory().total / (1024**3):.1f} GB"
            
            return {
                'os': platform.system(),
                'osVersion': platform.version(),
                'cpu': cpu_info,
                'ram': ram_info,
                'ipAddress': self.get_local_ip(),
                'macAddress': self.get_mac_address()
            }
        except Exception as e:
            self.log(f"Error getting system info: {e}")
            return {}
    
    def get_local_ip(self):
        """Get local IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "Unknown"
    
    def get_mac_address(self):
        """Get MAC address"""
        try:
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff)
                           for elements in range(0, 2*6, 2)][::-1])
            return mac
        except:
            return "Unknown"
    
    def register_with_backend(self):
        """Register this agent with the backend"""
        self.log("Attempting to register with backend...")
        
        # This function should be called manually after installation
        # with a valid user session token
        self.log("Please complete registration through the IT portal")
        return False
    
    def set_token(self, token):
        """Set the agent token (called during installation/registration)"""
        self.agent_token = token
        self.save_config()
        self.log("Agent token configured successfully")
    
    def get_network_connections(self):
        """Get active network connections"""
        connections = []
        
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    connections.append({
                        'local': f"{conn.laddr.ip}:{conn.laddr.port}",
                        'remote': f"{conn.raddr.ip}:{conn.raddr.port}",
                        'pid': conn.pid
                    })
        except Exception as e:
            self.log(f"Error getting connections: {e}")
        
        return connections
    
    def resolve_ip_to_domain(self, ip):
        """Resolve IP address to domain name with improved logic and fallback"""
        try:
            # Skip private IP addresses
            if self.is_private_ip(ip):
                return ip
            
            # Check if we have a known service mapping for this IP
            service_name = self.get_service_name_by_ip(ip)
            if service_name:
                return service_name
            
            # Try reverse DNS lookup with timeout
            try:
                domain = socket.gethostbyaddr(ip)[0]
            except (socket.herror, socket.gaierror, OSError):
                # DNS resolution failed, use IP with generic service name
                return f"service-{ip.split('.')[-1]}"
            except Exception:
                # Any other DNS error, use IP with generic service name
                return f"service-{ip.split('.')[-1]}"
            
            # Clean up domain name
            domain = domain.lower().strip()
            
            # Skip if it's just an IP-like domain
            if self.is_ip_like(domain):
                return f"service-{ip.split('.')[-1]}"
            
            # Extract main domain (e.g., youtube.com from www.youtube.com)
            parts = domain.split('.')
            if len(parts) >= 2:
                # Remove common subdomains
                main_domain = '.'.join(parts[-2:])
                
                # Skip CDN and cloud provider domains that don't represent the actual service
                cdn_domains = [
                    'amazonaws.com', 'cloudfront.net', 'akamai.net', 'fastly.com',
                    'cloudflare.com', 'maxcdn.com', 'jsdelivr.net', 'unpkg.com',
                    'cdnjs.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com',
                    'linodeusercontent.com', 'digitaloceanspaces.com', 'azureedge.net'
                ]
                
                if main_domain in cdn_domains:
                    # Try to get more specific info from the full domain
                    if len(parts) >= 3:
                        # Check if there's a service identifier in the subdomain
                        subdomain = parts[0]
                        service_indicators = ['api', 'www', 'app', 'service', 'cdn', 'static', 'assets']
                        if subdomain not in service_indicators:
                            return f"{subdomain}.{main_domain}"
                    return main_domain
                
                # Check if we have a friendly name for this domain
                friendly_name = self.domain_mapping.get(main_domain)
                if friendly_name:
                    return friendly_name
                
                return main_domain
            return domain
        except Exception as e:
            # Final fallback - use IP with generic service name
            return f"service-{ip.split('.')[-1]}"
    
    def get_service_name_by_ip(self, ip):
        """Get service name based on IP address ranges"""
        try:
            # Common service IP ranges
            ip_parts = ip.split('.')
            if len(ip_parts) != 4:
                return None
            
            first_octet = int(ip_parts[0])
            second_octet = int(ip_parts[1])
            
            # Google services
            if first_octet == 142 and second_octet in [250, 251]:
                return "Google Services"
            elif first_octet == 172 and second_octet == 217:
                return "Google Services"
            elif first_octet == 216 and second_octet == 58:
                return "Google Services"
            elif first_octet == 74 and second_octet == 125:
                return "Google Services"
            
            # Microsoft services
            elif first_octet == 13 and second_octet == 107:
                return "Microsoft Services"
            elif first_octet == 20 and second_octet == 42:
                return "Microsoft Services"
            elif first_octet == 40 and second_octet == 126:
                return "Microsoft Services"
            
            # Cloudflare
            elif first_octet == 104 and second_octet == 18:
                return "Cloudflare"
            elif first_octet == 172 and second_octet == 64:
                return "Cloudflare"
            
            # AWS
            elif first_octet == 52 and second_octet in [201, 202, 203, 204, 205]:
                return "Amazon Web Services"
            elif first_octet == 54 and second_octet in [236, 237, 238, 239, 240]:
                return "Amazon Web Services"
            
            # Akamai
            elif first_octet == 159 and second_octet == 41:
                return "Akamai CDN"
            
            # Facebook/Meta
            elif first_octet == 31 and second_octet == 13:
                return "Facebook Services"
            elif first_octet == 66 and second_octet == 220:
                return "Facebook Services"
            
            return None
        except:
            return None
    
    def is_private_ip(self, ip):
        """Check if IP is private/internal"""
        try:
            import ipaddress
            return ipaddress.ip_address(ip).is_private
        except:
            # Fallback for older Python versions
            private_ranges = [
                '10.', '172.16.', '172.17.', '172.18.', '172.19.',
                '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                '172.30.', '172.31.', '192.168.', '127.', '169.254.'
            ]
            return any(ip.startswith(prefix) for prefix in private_ranges)
    
    def is_ip_like(self, domain):
        """Check if domain looks like an IP address"""
        try:
            # Check if it's a valid IP
            socket.inet_aton(domain)
            return True
        except:
            # Check if it contains mostly numbers and dots
            if domain.count('.') >= 2 and sum(c.isdigit() for c in domain) > len(domain) * 0.5:
                return True
            return False
    
    def monitor_network_traffic(self):
        """Monitor network traffic and categorize by domain"""
        try:
            # Get current network I/O stats
            net_io = psutil.net_io_counters()
            
            if self.last_net_io is None:
                self.last_net_io = net_io
                return
            
            # Calculate differences (bytes sent/received since last check)
            bytes_sent = net_io.bytes_sent - self.last_net_io.bytes_sent
            bytes_recv = net_io.bytes_recv - self.last_net_io.bytes_recv
            
            # Convert to MB
            upload_mb = bytes_sent / (1024 * 1024)
            download_mb = bytes_recv / (1024 * 1024)
            
            # Get active connections
            connections = self.get_network_connections()
            
            # Map connections to domains and estimate data usage
            domain_usage = defaultdict(lambda: {'upload': 0, 'download': 0, 'count': 0})
            
            if connections and len(connections) > 0:
                # Distribute bandwidth across active connections
                upload_per_conn = upload_mb / len(connections)
                download_per_conn = download_mb / len(connections)
                
                for conn in connections:
                    try:
                        remote_ip = conn['remote'].split(':')[0]
                        domain = self.resolve_ip_to_domain(remote_ip)
                        
                        domain_usage[domain]['upload'] += upload_per_conn
                        domain_usage[domain]['download'] += download_per_conn
                        domain_usage[domain]['count'] += 1
                    except Exception as e:
                        pass
            elif upload_mb > 0 or download_mb > 0:
                # If there's network activity but no connections, create a generic entry
                domain_usage['system-activity']['upload'] = upload_mb
                domain_usage['system-activity']['download'] = download_mb
                domain_usage['system-activity']['count'] = 1
            
            # Update cumulative stats
            for domain, usage in domain_usage.items():
                self.network_stats[domain]['upload'] += usage['upload']
                self.network_stats[domain]['download'] += usage['download']
                self.network_stats[domain]['count'] += usage['count']
            
            self.last_net_io = net_io
            
        except Exception as e:
            self.log(f"Error monitoring network: {e}")
    
    def send_data_to_backend(self):
        """Send collected network data to backend"""
        if not self.agent_token:
            self.log("No agent token configured. Please register this agent.")
            return False
        
        try:
            # Prepare website data
            websites = []
            for domain, stats in self.network_stats.items():
                total_data = stats['upload'] + stats['download']
                if total_data > 0:  # Only send if there's actual data
                    websites.append({
                        'domain': domain,
                        'dataUsedMB': round(total_data, 2),
                        'uploadMB': round(stats['upload'], 2),
                        'downloadMB': round(stats['download'], 2),
                        'requestCount': int(stats['count'])
                    })
            
            # Calculate totals
            total_upload = sum(w['uploadMB'] for w in websites)
            total_download = sum(w['downloadMB'] for w in websites)
            
            # Prepare payload
            payload = {
                'totalUploadMB': round(total_upload, 2),
                'totalDownloadMB': round(total_download, 2),
                'websites': websites,
                'agentVersion': AGENT_VERSION,
                'systemInfo': self.get_system_info()
            }
            
            # Send to backend
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            # Try primary backend URL
            try:
                response = self.session.post(
                    f"{self.backend_url}/network-monitoring/logs",
                    json=payload,
                    headers=headers,
                    timeout=10,
                    verify=True  # Verify SSL in production
                )
            except:
                # Fallback to backup URL (localhost for development)
                response = self.session.post(
                    f"{BACKUP_BACKEND_URL}/network-monitoring/logs",
                    json=payload,
                    headers=headers,
                    timeout=10,
                    verify=False
                )
            
            if response.status_code == 201:
                self.log(f"Data sent successfully: {total_upload + total_download:.2f} MB total")
                # Clear stats after successful send
                self.network_stats.clear()
                return True
            else:
                self.log(f"Failed to send data: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"Error sending data to backend: {e}")
            return False
    
    def send_heartbeat(self):
        """Send heartbeat to backend"""
        if not self.agent_token:
            return
        
        try:
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            try:
                response = self.session.post(
                    f"{self.backend_url}/network-monitoring/heartbeat",
                    headers=headers,
                    timeout=5,
                    verify=True
                )
            except:
                response = self.session.post(
                    f"{BACKUP_BACKEND_URL}/network-monitoring/heartbeat",
                    headers=headers,
                    timeout=5,
                    verify=False
                )
            
            if response.status_code == 200:
                self.log("Heartbeat sent successfully")
            
        except Exception as e:
            self.log(f"Heartbeat failed: {e}")
    
    def heartbeat_loop(self):
        """Background thread for sending heartbeats"""
        while self.is_running:
            self.send_heartbeat()
            time.sleep(HEARTBEAT_INTERVAL)
    
    def run(self):
        """Main agent loop"""
        self.log(f"Starting IT Network Monitor Agent v{AGENT_VERSION}")
        self.log(f"System: {self.system_name} ({self.system_id})")
        
        # Start heartbeat thread
        heartbeat_thread = threading.Thread(target=self.heartbeat_loop, daemon=True)
        heartbeat_thread.start()
        
        last_send_time = time.time()
        
        try:
            while self.is_running:
                # Monitor network traffic
                self.monitor_network_traffic()
                
                # Send data every UPDATE_INTERVAL seconds
                if time.time() - last_send_time >= UPDATE_INTERVAL:
                    self.send_data_to_backend()
                    last_send_time = time.time()
                
                time.sleep(1)  # Check every second
                
        except KeyboardInterrupt:
            self.log("Agent stopped by user")
        except Exception as e:
            self.log(f"Agent error: {e}")
        finally:
            self.is_running = False
            self.log("Agent shutdown complete")
    
    def stop(self):
        """Stop the agent"""
        self.is_running = False

def main():
    """Main entry point"""
    agent = NetworkMonitorAgent()
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'register' and len(sys.argv) > 2:
            # Register with token
            token = sys.argv[2]
            agent.set_token(token)
            print(f"Agent registered successfully!")
            print(f"System ID: {agent.system_id}")
            print(f"System Name: {agent.system_name}")
            return
        
        elif command == 'status':
            print(f"System ID: {agent.system_id}")
            print(f"System Name: {agent.system_name}")
            print(f"Token Configured: {'Yes' if agent.agent_token else 'No'}")
            print(f"Version: {AGENT_VERSION}")
            return
        
        elif command == 'test':
            print("Running in test mode (60 seconds)...")
            agent.run()
            return
    
    # Run the agent
    agent.run()

if __name__ == "__main__":
    main()


