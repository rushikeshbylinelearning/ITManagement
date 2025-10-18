@echo off
echo ========================================
echo IT Network Monitor Agent - Enhanced Setup
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Running with administrator privileges
) else (
    echo ✗ This script requires administrator privileges
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

    echo.
echo Installing IT Network Monitor Agent...
    echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Python is installed
) else (
    echo ✗ Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Create installation directory
set INSTALL_DIR=%ProgramFiles%\ITNetworkMonitor
echo Creating installation directory: %INSTALL_DIR%
mkdir "%INSTALL_DIR%" 2>nul

REM Create the network monitor agent file
echo Creating network_monitor_agent.py...
(
echo #!/usr/bin/env python3
echo """
echo IT Management Network Monitoring Agent
echo Version: 1.0.0
echo.
echo This agent monitors network traffic on Windows systems and reports to the IT Management backend.
echo It runs as a background service and automatically starts on system boot.
echo """
echo.
echo import os
echo import sys
echo import time
echo import json
echo import socket
echo import psutil
echo import requests
echo import threading
echo import subprocess
echo from datetime import datetime
echo from collections import defaultdict
echo from urllib.parse import urlparse
echo import ctypes
echo import winreg
echo import uuid
echo import platform
echo 
echo # Configuration
echo AGENT_VERSION = "1.0.0"
echo CONFIG_FILE = os.path.join^(os.path.expanduser^("~"^), ".it_monitor", "config.json"^)
echo LOG_FILE = os.path.join^(os.path.expanduser^("~"^), ".it_monitor", "agent.log"^)
echo BACKEND_URL = "https://itmanagement.bylinelms.com/api"
echo BACKUP_BACKEND_URL = "http://localhost:5001/api"
echo UPDATE_INTERVAL = 10
echo HEARTBEAT_INTERVAL = 60
echo 
echo class NetworkMonitorAgent:
echo     def __init__^(self^):
echo         self.system_id = None
echo         self.system_name = None
echo         self.agent_token = None
echo         self.backend_url = BACKEND_URL
echo         self.is_running = True
echo         self.network_stats = defaultdict^(lambda: {'upload': 0, 'download': 0, 'count': 0}^)
echo         self.last_net_io = None
echo         self.session = requests.Session^(^)
echo         
echo         # Domain mapping for better service identification
echo         self.domain_mapping = {
echo             'facebook.com': 'Facebook',
echo             'instagram.com': 'Instagram',
echo             'twitter.com': 'Twitter',
echo             'linkedin.com': 'LinkedIn',
echo             'youtube.com': 'YouTube',
echo             'netflix.com': 'Netflix',
echo             'zoom.us': 'Zoom',
echo             'teams.microsoft.com': 'Microsoft Teams',
echo             'meet.google.com': 'Google Meet',
echo             'slack.com': 'Slack',
echo             'discord.com': 'Discord',
echo             'github.com': 'GitHub',
echo             'stackoverflow.com': 'Stack Overflow',
echo             'google.com': 'Google Services',
echo             'amazon.com': 'Amazon',
echo             'spotify.com': 'Spotify',
echo             'apple.com': 'Apple Services'
echo         }
echo         
echo         # Ensure config directory exists
echo         os.makedirs^(os.path.dirname^(CONFIG_FILE^), exist_ok=True^)
echo         os.makedirs^(os.path.dirname^(LOG_FILE^), exist_ok=True^)
echo         
echo         # Load or create configuration
echo         self.load_config^(^)
echo         
echo     def log^(self, message^):
echo         timestamp = datetime.now^(^).strftime^("%%Y-%%m-%%d %%H:%%M:%%S"^)
echo         log_message = f"[{timestamp}] {message}"
echo         print^(log_message^)
echo         
echo         try:
echo             with open^(LOG_FILE, 'a', encoding='utf-8'^) as f:
echo                 f.write^(log_message + "\n"^)
echo         except Exception as e:
echo             print^(f"Failed to write to log file: {e}"^)
echo     
echo     def load_config^(self^):
echo         if os.path.exists^(CONFIG_FILE^):
echo             try:
echo                 with open^(CONFIG_FILE, 'r'^) as f:
echo                     config = json.load^(f^)
echo                     self.system_id = config.get^('system_id'^)
echo                     self.system_name = config.get^('system_name'^)
echo                     self.agent_token = config.get^('agent_token'^)
echo                     self.backend_url = config.get^('backend_url', BACKEND_URL^)
echo                     self.log^(f"Configuration loaded for system: {self.system_name}"^)
echo             except Exception as e:
echo                 self.log^(f"Error loading config: {e}"^)
echo                 self.create_new_config^(^)
echo         else:
echo             self.create_new_config^(^)
echo     
echo     def create_new_config^(self^):
echo         self.system_name = socket.gethostname^(^)
echo         self.system_id = f"sys-{uuid.uuid4^(^).hex[:12]}"
echo         self.log^(f"Created new system ID: {self.system_id}"^)
echo     
echo     def save_config^(self^):
echo         config = {
echo             'system_id': self.system_id,
echo             'system_name': self.system_name,
echo             'agent_token': self.agent_token,
echo             'backend_url': self.backend_url,
echo             'agent_version': AGENT_VERSION
echo         }
echo         
echo         try:
echo             with open^(CONFIG_FILE, 'w'^) as f:
echo                 json.dump^(config, f, indent=2^)
echo             self.log^("Configuration saved successfully"^)
echo         except Exception as e:
echo             self.log^(f"Error saving config: {e}"^)
echo     
echo     def get_system_info^(self^):
echo         try:
echo             cpu_info = platform.processor^(^)
echo             ram_info = f"{psutil.virtual_memory^(^).total / ^(1024**3^):.1f} GB"
echo             
echo             return {
echo                 'os': platform.system^(^),
echo                 'osVersion': platform.version^(^),
echo                 'cpu': cpu_info,
echo                 'ram': ram_info,
echo                 'ipAddress': self.get_local_ip^(^),
echo                 'macAddress': self.get_mac_address^(^)
echo             }
echo         except Exception as e:
echo             self.log^(f"Error getting system info: {e}"^)
echo             return {}
echo     
echo     def get_local_ip^(self^):
echo         try:
echo             s = socket.socket^(socket.AF_INET, socket.SOCK_DGRAM^)
echo             s.connect^(^("8.8.8.8", 80^)^)
echo             ip = s.getsockname^(^)[0]
echo             s.close^(^)
echo             return ip
echo         except:
echo             return "Unknown"
echo     
echo     def get_mac_address^(self^):
echo         try:
echo             mac = ':'.join^(['{:02x}'.format^(^(uuid.getnode^(^) ^>^> elements^) ^& 0xff^)
echo                            for elements in range^(0, 2*6, 2^)][::-1]^)
echo             return mac
echo         except:
echo             return "Unknown"
echo     
echo     def set_token^(self, token^):
echo         self.agent_token = token
echo         self.save_config^(^)
echo         self.log^("Agent token configured successfully"^)
echo     
echo     def get_network_connections^(self^):
echo         connections = []
echo         
echo         try:
echo             for conn in psutil.net_connections^(kind='inet'^):
echo                 if conn.status == 'ESTABLISHED' and conn.raddr:
echo                     connections.append^({
echo                         'local': f"{conn.laddr.ip}:{conn.laddr.port}",
echo                         'remote': f"{conn.raddr.ip}:{conn.raddr.port}",
echo                         'pid': conn.pid
echo                     }^)
echo         except Exception as e:
echo             self.log^(f"Error getting connections: {e}"^)
echo         
echo         return connections
echo     
echo     def resolve_ip_to_domain^(self, ip^):
echo         try:
echo             if self.is_private_ip^(ip^):
echo                 return ip
echo             
echo             domain = socket.gethostbyaddr^(ip^)[0]
echo             domain = domain.lower^(^).strip^(^)
echo             
echo             if self.is_ip_like^(domain^):
echo                 return ip
echo             
echo             parts = domain.split^('.'^)
echo             if len^(parts^) ^>= 2:
echo                 main_domain = '.'.join^(parts[-2:]^)
echo                 
echo                 cdn_domains = [
echo                     'amazonaws.com', 'cloudfront.net', 'akamai.net', 'fastly.com',
echo                     'cloudflare.com', 'maxcdn.com', 'jsdelivr.net', 'unpkg.com',
echo                     'cdnjs.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com',
echo                     'linodeusercontent.com', 'digitaloceanspaces.com', 'azureedge.net'
echo                 ]
echo                 
echo                 if main_domain in cdn_domains:
echo                     if len^(parts^) ^>= 3:
echo                         subdomain = parts[0]
echo                         service_indicators = ['api', 'www', 'app', 'service', 'cdn', 'static', 'assets']
echo                         if subdomain not in service_indicators:
echo                             return f"{subdomain}.{main_domain}"
echo                     return main_domain
echo                 
echo                 friendly_name = self.domain_mapping.get^(main_domain^)
echo                 if friendly_name:
echo                     return friendly_name
echo                 
echo                 return main_domain
echo             return domain
echo         except Exception as e:
echo             self.log^(f"DNS resolution failed for {ip}: {e}"^)
echo             return ip
echo     
echo     def is_private_ip^(self, ip^):
echo         try:
echo             import ipaddress
echo             return ipaddress.ip_address^(ip^).is_private
echo         except:
echo             private_ranges = [
echo                 '10.', '172.16.', '172.17.', '172.18.', '172.19.',
echo                 '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
echo                 '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
echo                 '172.30.', '172.31.', '192.168.', '127.', '169.254.'
echo             ]
echo             return any^(ip.startswith^(prefix^) for prefix in private_ranges^)
echo     
echo     def is_ip_like^(self, domain^):
echo         try:
echo             socket.inet_aton^(domain^)
echo             return True
echo         except:
echo             if domain.count^('.'^) ^>= 2 and sum^(c.isdigit^(^) for c in domain^) ^> len^(domain^) * 0.5:
echo                 return True
echo             return False
echo     
echo     def monitor_network_traffic^(self^):
echo         try:
echo             net_io = psutil.net_io_counters^(^)
echo             
echo             if self.last_net_io is None:
echo                 self.last_net_io = net_io
echo                 return
echo             
echo             bytes_sent = net_io.bytes_sent - self.last_net_io.bytes_sent
echo             bytes_recv = net_io.bytes_recv - self.last_net_io.bytes_recv
echo             
echo             upload_mb = bytes_sent / ^(1024 * 1024^)
echo             download_mb = bytes_recv / ^(1024 * 1024^)
echo             
echo             connections = self.get_network_connections^(^)
echo             
echo             domain_usage = defaultdict^(lambda: {'upload': 0, 'download': 0, 'count': 0}^)
echo             
echo             if connections:
echo                 upload_per_conn = upload_mb / len^(connections^)
echo                 download_per_conn = download_mb / len^(connections^)
echo                 
echo                 for conn in connections:
echo                     try:
echo                         remote_ip = conn['remote'].split^(':'^)[0]
echo                         domain = self.resolve_ip_to_domain^(remote_ip^)
echo                         
echo                         domain_usage[domain]['upload'] += upload_per_conn
echo                         domain_usage[domain]['download'] += download_per_conn
echo                         domain_usage[domain]['count'] += 1
echo                     except Exception as e:
echo                         pass
echo             
echo             for domain, usage in domain_usage.items^(^):
echo                 self.network_stats[domain]['upload'] += usage['upload']
echo                 self.network_stats[domain]['download'] += usage['download']
echo                 self.network_stats[domain]['count'] += usage['count']
echo             
echo             self.last_net_io = net_io
echo             
echo         except Exception as e:
echo             self.log^(f"Error monitoring network: {e}"^)
echo     
echo     def send_data_to_backend^(self^):
echo         if not self.agent_token:
echo             self.log^("No agent token configured. Please register this agent."^)
echo             return False
echo         
echo         try:
echo             websites = []
echo             for domain, stats in self.network_stats.items^(^):
echo                 total_data = stats['upload'] + stats['download']
echo                 if total_data ^> 0:
echo                     websites.append^({
echo                         'domain': domain,
echo                         'dataUsedMB': round^(total_data, 2^),
echo                         'uploadMB': round^(stats['upload'], 2^),
echo                         'downloadMB': round^(stats['download'], 2^),
echo                         'requestCount': int^(stats['count']^)
echo                     }^)
echo             
echo             total_upload = sum^(w['uploadMB'] for w in websites^)
echo             total_download = sum^(w['downloadMB'] for w in websites^)
echo             
echo             payload = {
echo                 'totalUploadMB': round^(total_upload, 2^),
echo                 'totalDownloadMB': round^(total_download, 2^),
echo                 'websites': websites,
echo                 'agentVersion': AGENT_VERSION,
echo                 'systemInfo': self.get_system_info^(^)
echo             }
echo             
echo             headers = {
echo                 'Authorization': f'Bearer {self.agent_token}',
echo                 'Content-Type': 'application/json'
echo             }
echo             
echo             try:
echo                 response = self.session.post^(
echo                     f"{self.backend_url}/network-monitoring/logs",
echo                     json=payload,
echo                     headers=headers,
echo                     timeout=10,
echo                     verify=True
echo                 ^)
echo             except:
echo                 response = self.session.post^(
echo                     f"{BACKUP_BACKEND_URL}/network-monitoring/logs",
echo                     json=payload,
echo                     headers=headers,
echo                     timeout=10,
echo                     verify=False
echo                 ^)
echo             
echo             if response.status_code == 201:
echo                 self.log^(f"Data sent successfully: {total_upload + total_download:.2f} MB total"^)
echo                 self.network_stats.clear^(^)
echo                 return True
echo             else:
echo                 self.log^(f"Failed to send data: {response.status_code} - {response.text}"^)
echo                 return False
echo                 
echo         except Exception as e:
echo             self.log^(f"Error sending data to backend: {e}"^)
echo             return False
echo     
echo     def send_heartbeat^(self^):
echo         if not self.agent_token:
echo             return
echo         
echo         try:
echo             headers = {
echo                 'Authorization': f'Bearer {self.agent_token}',
echo                 'Content-Type': 'application/json'
echo             }
echo             
echo             try:
echo                 response = self.session.post^(
echo                     f"{self.backend_url}/network-monitoring/heartbeat",
echo                     headers=headers,
echo                     timeout=5,
echo                     verify=True
echo                 ^)
echo             except:
echo                 response = self.session.post^(
echo                     f"{BACKUP_BACKEND_URL}/network-monitoring/heartbeat",
echo                     headers=headers,
echo                     timeout=5,
echo                     verify=False
echo                 ^)
echo             
echo             if response.status_code == 200:
echo                 self.log^("Heartbeat sent successfully"^)
echo             
echo         except Exception as e:
echo             self.log^(f"Heartbeat failed: {e}"^)
echo     
echo     def heartbeat_loop^(self^):
echo         while self.is_running:
echo             self.send_heartbeat^(^)
echo             time.sleep^(HEARTBEAT_INTERVAL^)
echo     
echo     def run^(self^):
echo         self.log^(f"Starting IT Network Monitor Agent v{AGENT_VERSION}"^)
echo         self.log^(f"System: {self.system_name} ^({self.system_id}^)"^)
echo         
echo         heartbeat_thread = threading.Thread^(target=self.heartbeat_loop, daemon=True^)
echo         heartbeat_thread.start^(^)
echo         
echo         last_send_time = time.time^(^)
echo         
echo         try:
echo             while self.is_running:
echo                 self.monitor_network_traffic^(^)
echo                 
echo                 if time.time^(^) - last_send_time ^>= UPDATE_INTERVAL:
echo                     self.send_data_to_backend^(^)
echo                     last_send_time = time.time^(^)
echo                 
echo                 time.sleep^(1^)
echo                 
echo         except KeyboardInterrupt:
echo             self.log^("Agent stopped by user"^)
echo         except Exception as e:
echo             self.log^(f"Agent error: {e}"^)
echo         finally:
echo             self.is_running = False
echo             self.log^("Agent shutdown complete"^)
echo     
echo     def stop^(self^):
echo         self.is_running = False
echo 
echo def main^(^):
echo     agent = NetworkMonitorAgent^(^)
echo     
echo     if len^(sys.argv^) ^> 1:
echo         command = sys.argv[1].lower^(^)
echo         
echo         if command == 'register' and len^(sys.argv^) ^> 2:
echo             token = sys.argv[2]
echo             agent.set_token^(token^)
echo             print^(f"Agent registered successfully!"^)
echo             print^(f"System ID: {agent.system_id}"^)
echo             print^(f"System Name: {agent.system_name}"^)
echo             return
echo         
echo         elif command == 'status':
echo             print^(f"System ID: {agent.system_id}"^)
echo             print^(f"System Name: {agent.system_name}"^)
echo             print^(f"Token Configured: {'Yes' if agent.agent_token else 'No'}"^)
echo             print^(f"Version: {AGENT_VERSION}"^)
echo             return
echo         
echo         elif command == 'test':
echo             print^("Running in test mode ^(60 seconds^)..."^)
echo             agent.run^(^)
echo             return
echo     
echo     agent.run^(^)
echo 
echo if __name__ == "__main__":
echo     main^(^)
) > "%INSTALL_DIR%\network_monitor_agent.py"

REM Create requirements.txt
echo Creating requirements.txt...
(
echo psutil^>=5.8.0
echo requests^>=2.25.0
) > "%INSTALL_DIR%\requirements.txt"

REM Install Python dependencies with fallback options
echo Installing Python dependencies...
echo Attempting to install with pre-compiled wheels...

REM Try installing with pre-compiled wheels first
python -m pip install --only-binary=all --upgrade pip
python -m pip install --only-binary=all psutil requests --quiet
if %errorLevel% neq 0 (
    echo ⚠ Pre-compiled wheels failed, trying alternative method...
    
    REM Try installing without psutil first
    python -m pip install requests --quiet
    if %errorLevel% neq 0 (
        echo ✗ Failed to install requests
        echo Please check your internet connection and try again
    pause
    exit /b 1
)

    REM Try to install psutil with different approach
    python -m pip install psutil --no-cache-dir --quiet
    if %errorLevel% neq 0 (
        echo ⚠ psutil installation failed, creating fallback version...
        
        REM Create a fallback version without psutil
        echo Creating fallback agent without psutil...
        goto :create_fallback_agent
    )
)

echo ✓ Dependencies installed successfully
goto :continue_installation

:create_fallback_agent
echo Creating fallback agent without psutil dependency...
(
echo #!/usr/bin/env python3
echo """
echo IT Management Network Monitoring Agent - Fallback Version
echo Version: 1.0.0
echo 
echo This is a simplified version that works without psutil.
echo """
echo 
echo import os
echo import sys
echo import time
echo import json
echo import socket
echo import requests
echo import threading
echo from datetime import datetime
echo from collections import defaultdict
echo import uuid
echo import platform
echo 
echo # Configuration
echo AGENT_VERSION = "1.0.0-fallback"
echo CONFIG_FILE = os.path.join^(os.path.expanduser^("~"^), ".it_monitor", "config.json"^)
echo LOG_FILE = os.path.join^(os.path.expanduser^("~"^), ".it_monitor", "agent.log"^)
echo BACKEND_URL = "https://itmanagement.bylinelms.com/api"
echo BACKUP_BACKEND_URL = "http://localhost:5001/api"
echo UPDATE_INTERVAL = 30
echo HEARTBEAT_INTERVAL = 60
echo 
echo class NetworkMonitorAgent:
echo     def __init__^(self^):
echo         self.system_id = None
echo         self.system_name = None
echo         self.agent_token = None
echo         self.backend_url = BACKEND_URL
echo         self.is_running = True
echo         self.network_stats = defaultdict^(lambda: {'upload': 0, 'download': 0, 'count': 0}^)
echo         self.session = requests.Session^(^)
echo         
echo         # Domain mapping for better service identification
echo         self.domain_mapping = {
echo             'facebook.com': 'Facebook',
echo             'instagram.com': 'Instagram',
echo             'twitter.com': 'Twitter',
echo             'linkedin.com': 'LinkedIn',
echo             'youtube.com': 'YouTube',
echo             'netflix.com': 'Netflix',
echo             'zoom.us': 'Zoom',
echo             'teams.microsoft.com': 'Microsoft Teams',
echo             'meet.google.com': 'Google Meet',
echo             'slack.com': 'Slack',
echo             'discord.com': 'Discord',
echo             'github.com': 'GitHub',
echo             'stackoverflow.com': 'Stack Overflow',
echo             'google.com': 'Google Services',
echo             'amazon.com': 'Amazon',
echo             'spotify.com': 'Spotify',
echo             'apple.com': 'Apple Services'
echo         }
echo         
echo         # Ensure config directory exists
echo         os.makedirs^(os.path.dirname^(CONFIG_FILE^), exist_ok=True^)
echo         os.makedirs^(os.path.dirname^(LOG_FILE^), exist_ok=True^)
echo         
echo         # Load or create configuration
echo         self.load_config^(^)
echo         
echo     def log^(self, message^):
echo         timestamp = datetime.now^(^).strftime^("%%Y-%%m-%%d %%H:%%M:%%S"^)
echo         log_message = f"[{timestamp}] {message}"
echo         print^(log_message^)
echo         
echo         try:
echo             with open^(LOG_FILE, 'a', encoding='utf-8'^) as f:
echo                 f.write^(log_message + "\n"^)
echo         except Exception as e:
echo             print^(f"Failed to write to log file: {e}"^)
echo     
echo     def load_config^(self^):
echo         if os.path.exists^(CONFIG_FILE^):
echo             try:
echo                 with open^(CONFIG_FILE, 'r'^) as f:
echo                     config = json.load^(f^)
echo                     self.system_id = config.get^('system_id'^)
echo                     self.system_name = config.get^('system_name'^)
echo                     self.agent_token = config.get^('agent_token'^)
echo                     self.backend_url = config.get^('backend_url', BACKEND_URL^)
echo                     self.log^(f"Configuration loaded for system: {self.system_name}"^)
echo             except Exception as e:
echo                 self.log^(f"Error loading config: {e}"^)
echo                 self.create_new_config^(^)
echo         else:
echo             self.create_new_config^(^)
echo     
echo     def create_new_config^(self^):
echo         self.system_name = socket.gethostname^(^)
echo         self.system_id = f"sys-{uuid.uuid4^(^).hex[:12]}"
echo         self.log^(f"Created new system ID: {self.system_id}"^)
echo     
echo     def save_config^(self^):
echo         config = {
echo             'system_id': self.system_id,
echo             'system_name': self.system_name,
echo             'agent_token': self.agent_token,
echo             'backend_url': self.backend_url,
echo             'agent_version': AGENT_VERSION
echo         }
echo         
echo         try:
echo             with open^(CONFIG_FILE, 'w'^) as f:
echo                 json.dump^(config, f, indent=2^)
echo             self.log^("Configuration saved successfully"^)
echo         except Exception as e:
echo             self.log^(f"Error saving config: {e}"^)
echo     
echo     def get_system_info^(self^):
echo         try:
echo             return {
echo                 'os': platform.system^(^),
echo                 'osVersion': platform.version^(^),
echo                 'ipAddress': self.get_local_ip^(^),
echo                 'macAddress': self.get_mac_address^(^)
echo             }
echo         except Exception as e:
echo             self.log^(f"Error getting system info: {e}"^)
echo             return {}
echo     
echo     def get_local_ip^(self^):
echo         try:
echo             s = socket.socket^(socket.AF_INET, socket.SOCK_DGRAM^)
echo             s.connect^(^("8.8.8.8", 80^)^)
echo             ip = s.getsockname^(^)[0]
echo             s.close^(^)
echo             return ip
echo         except:
echo             return "Unknown"
echo     
echo     def get_mac_address^(self^):
echo         try:
echo             mac = ':'.join^(['{:02x}'.format^(^(uuid.getnode^(^) ^>^> elements^) ^& 0xff^)
echo                            for elements in range^(0, 2*6, 2^)][::-1]^)
echo             return mac
echo         except:
echo             return "Unknown"
echo     
echo     def set_token^(self, token^):
echo         self.agent_token = token
echo         self.save_config^(^)
echo         self.log^("Agent token configured successfully"^)
echo     
echo     def get_network_connections^(self^):
echo         # Simplified version without psutil
echo         connections = []
echo         try:
echo             # Use netstat command as fallback
echo             import subprocess
echo             result = subprocess.run^(['netstat', '-an'], capture_output=True, text=True^)
echo             if result.returncode == 0:
echo                 lines = result.stdout.split^('\n'^)
echo                 for line in lines:
echo                     if 'ESTABLISHED' in line and 'TCP' in line:
echo                         parts = line.split^(^)
echo                         if len^(parts^) ^>= 4:
echo                             local = parts[1]
echo                             remote = parts[2]
echo                             if remote != '0.0.0.0:0':
echo                                 connections.append^({
echo                                     'local': local,
echo                                     'remote': remote,
echo                                     'pid': 0
echo                                 }^)
echo         except Exception as e:
echo             self.log^(f"Error getting connections: {e}"^)
echo         return connections
echo     
echo     def resolve_ip_to_domain^(self, ip^):
echo         try:
echo             if self.is_private_ip^(ip^):
echo                 return ip
echo             
echo             domain = socket.gethostbyaddr^(ip^)[0]
echo             domain = domain.lower^(^).strip^(^)
echo             
echo             if self.is_ip_like^(domain^):
echo                 return ip
echo             
echo             parts = domain.split^('.'^)
echo             if len^(parts^) ^>= 2:
echo                 main_domain = '.'.join^(parts[-2:]^)
echo                 
echo                 cdn_domains = [
echo                     'amazonaws.com', 'cloudfront.net', 'akamai.net', 'fastly.com',
echo                     'cloudflare.com', 'maxcdn.com', 'jsdelivr.net', 'unpkg.com',
echo                     'cdnjs.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com',
echo                     'linodeusercontent.com', 'digitaloceanspaces.com', 'azureedge.net'
echo                 ]
echo                 
echo                 if main_domain in cdn_domains:
echo                     if len^(parts^) ^>= 3:
echo                         subdomain = parts[0]
echo                         service_indicators = ['api', 'www', 'app', 'service', 'cdn', 'static', 'assets']
echo                         if subdomain not in service_indicators:
echo                             return f"{subdomain}.{main_domain}"
echo                     return main_domain
echo                 
echo                 friendly_name = self.domain_mapping.get^(main_domain^)
echo                 if friendly_name:
echo                     return friendly_name
echo                 
echo                 return main_domain
echo             return domain
echo         except Exception as e:
echo             self.log^(f"DNS resolution failed for {ip}: {e}"^)
echo             return ip
echo     
echo     def is_private_ip^(self, ip^):
echo         try:
echo             import ipaddress
echo             return ipaddress.ip_address^(ip^).is_private
echo         except:
echo             private_ranges = [
echo                 '10.', '172.16.', '172.17.', '172.18.', '172.19.',
echo                 '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
echo                 '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
echo                 '172.30.', '172.31.', '192.168.', '127.', '169.254.'
echo             ]
echo             return any^(ip.startswith^(prefix^) for prefix in private_ranges^)
echo     
echo     def is_ip_like^(self, domain^):
echo         try:
echo             socket.inet_aton^(domain^)
echo             return True
echo         except:
echo             if domain.count^('.'^) ^>= 2 and sum^(c.isdigit^(^) for c in domain^) ^> len^(domain^) * 0.5:
echo                 return True
echo             return False
echo     
echo     def monitor_network_traffic^(self^):
echo         # Simplified monitoring without psutil
echo         try:
echo             connections = self.get_network_connections^(^)
echo             
echo             # Estimate data usage based on connections
echo             domain_usage = defaultdict^(lambda: {'upload': 0, 'download': 0, 'count': 0}^)
echo             
echo             if connections:
echo                 # Distribute estimated data across connections
echo                 estimated_upload = 0.1  # MB per connection
echo                 estimated_download = 0.2  # MB per connection
echo                 
echo                 for conn in connections:
echo                     try:
echo                         remote_ip = conn['remote'].split^(':'^)[0]
echo                         domain = self.resolve_ip_to_domain^(remote_ip^)
echo                         
echo                         domain_usage[domain]['upload'] += estimated_upload
echo                         domain_usage[domain]['download'] += estimated_download
echo                         domain_usage[domain]['count'] += 1
echo                     except Exception as e:
echo                         pass
echo             
echo             for domain, usage in domain_usage.items^(^):
echo                 self.network_stats[domain]['upload'] += usage['upload']
echo                 self.network_stats[domain]['download'] += usage['download']
echo                 self.network_stats[domain]['count'] += usage['count']
echo             
echo         except Exception as e:
echo             self.log^(f"Error monitoring network: {e}"^)
echo     
echo     def send_data_to_backend^(self^):
echo         if not self.agent_token:
echo             self.log^("No agent token configured. Please register this agent."^)
echo             return False
echo         
echo         try:
echo             websites = []
echo             for domain, stats in self.network_stats.items^(^):
echo                 total_data = stats['upload'] + stats['download']
echo                 if total_data ^> 0:
echo                     websites.append^({
echo                         'domain': domain,
echo                         'dataUsedMB': round^(total_data, 2^),
echo                         'uploadMB': round^(stats['upload'], 2^),
echo                         'downloadMB': round^(stats['download'], 2^),
echo                         'requestCount': int^(stats['count']^)
echo                     }^)
echo             
echo             total_upload = sum^(w['uploadMB'] for w in websites^)
echo             total_download = sum^(w['downloadMB'] for w in websites^)
echo             
echo             payload = {
echo                 'totalUploadMB': round^(total_upload, 2^),
echo                 'totalDownloadMB': round^(total_download, 2^),
echo                 'websites': websites,
echo                 'agentVersion': AGENT_VERSION,
echo                 'systemInfo': self.get_system_info^(^)
echo             }
echo             
echo             headers = {
echo                 'Authorization': f'Bearer {self.agent_token}',
echo                 'Content-Type': 'application/json'
echo             }
echo             
echo             try:
echo                 response = self.session.post^(
echo                     f"{self.backend_url}/network-monitoring/logs",
echo                     json=payload,
echo                     headers=headers,
echo                     timeout=10,
echo                     verify=True
echo                 ^)
echo             except:
echo                 response = self.session.post^(
echo                     f"{BACKUP_BACKEND_URL}/network-monitoring/logs",
echo                     json=payload,
echo                     headers=headers,
echo                     timeout=10,
echo                     verify=False
echo                 ^)
echo             
echo             if response.status_code == 201:
echo                 self.log^(f"Data sent successfully: {total_upload + total_download:.2f} MB total"^)
echo                 self.network_stats.clear^(^)
echo                 return True
echo             else:
echo                 self.log^(f"Failed to send data: {response.status_code} - {response.text}"^)
echo                 return False
echo                 
echo         except Exception as e:
echo             self.log^(f"Error sending data to backend: {e}"^)
echo             return False
echo     
echo     def send_heartbeat^(self^):
echo         if not self.agent_token:
echo             return
echo         
echo         try:
echo             headers = {
echo                 'Authorization': f'Bearer {self.agent_token}',
echo                 'Content-Type': 'application/json'
echo             }
echo             
echo             try:
echo                 response = self.session.post^(
echo                     f"{self.backend_url}/network-monitoring/heartbeat",
echo                     headers=headers,
echo                     timeout=5,
echo                     verify=True
echo                 ^)
echo             except:
echo                 response = self.session.post^(
echo                     f"{BACKUP_BACKEND_URL}/network-monitoring/heartbeat",
echo                     headers=headers,
echo                     timeout=5,
echo                     verify=False
echo                 ^)
echo             
echo             if response.status_code == 200:
echo                 self.log^("Heartbeat sent successfully"^)
echo             
echo         except Exception as e:
echo             self.log^(f"Heartbeat failed: {e}"^)
echo     
echo     def heartbeat_loop^(self^):
echo         while self.is_running:
echo             self.send_heartbeat^(^)
echo             time.sleep^(HEARTBEAT_INTERVAL^)
echo     
echo     def run^(self^):
echo         self.log^(f"Starting IT Network Monitor Agent v{AGENT_VERSION}"^)
echo         self.log^(f"System: {self.system_name} ^({self.system_id}^)"^)
echo         
echo         heartbeat_thread = threading.Thread^(target=self.heartbeat_loop, daemon=True^)
echo         heartbeat_thread.start^(^)
echo         
echo         last_send_time = time.time^(^)
echo         
echo         try:
echo             while self.is_running:
echo                 self.monitor_network_traffic^(^)
echo                 
echo                 if time.time^(^) - last_send_time ^>= UPDATE_INTERVAL:
echo                     self.send_data_to_backend^(^)
echo                     last_send_time = time.time^(^)
echo                 
echo                 time.sleep^(1^)
echo                 
echo         except KeyboardInterrupt:
echo             self.log^("Agent stopped by user"^)
echo         except Exception as e:
echo             self.log^(f"Agent error: {e}"^)
echo         finally:
echo             self.is_running = False
echo             self.log^("Agent shutdown complete"^)
echo     
echo     def stop^(self^):
echo         self.is_running = False
echo 
echo def main^(^):
echo     agent = NetworkMonitorAgent^(^)
echo     
echo     if len^(sys.argv^) ^> 1:
echo         command = sys.argv[1].lower^(^)
echo         
echo         if command == 'register' and len^(sys.argv^) ^> 2:
echo             token = sys.argv[2]
echo             agent.set_token^(token^)
echo             print^(f"Agent registered successfully!"^)
echo             print^(f"System ID: {agent.system_id}"^)
echo             print^(f"System Name: {agent.system_name}"^)
echo             return
echo         
echo         elif command == 'status':
echo             print^(f"System ID: {agent.system_id}"^)
echo             print^(f"System Name: {agent.system_name}"^)
echo             print^(f"Token Configured: {'Yes' if agent.agent_token else 'No'}"^)
echo             print^(f"Version: {AGENT_VERSION}"^)
echo             return
echo         
echo         elif command == 'test':
echo             print^("Running in test mode ^(60 seconds^)..."^)
echo             agent.run^(^)
echo             return
echo     
echo     agent.run^(^)
echo 
echo if __name__ == "__main__":
echo     main^(^)
) > "%INSTALL_DIR%\network_monitor_agent.py"
echo ✓ Fallback agent created successfully
echo.
echo ⚠ Note: Using fallback version without psutil
echo    - Network monitoring will use netstat command
echo    - Data estimates may be less precise
echo    - All other features work normally
echo.

:continue_installation

REM Install as Windows scheduled task directly
echo Installing as Windows scheduled task...
cd /d "%INSTALL_DIR%"

REM Create the scheduled task XML file
echo Creating task configuration...
(
echo ^<?xml version="1.0" encoding="UTF-16"?^>
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
echo   ^<RegistrationInfo^>
echo     ^<Description^>IT Network Monitor Agent^</Description^>
echo   ^</RegistrationInfo^>
echo   ^<Triggers^>
echo     ^<LogonTrigger^>
echo       ^<Enabled^>true^</Enabled^>
echo     ^</LogonTrigger^>
echo     ^<BootTrigger^>
echo       ^<Enabled^>true^</Enabled^>
echo     ^</BootTrigger^>
echo   ^</Triggers^>
echo   ^<Principals^>
echo     ^<Principal^>
echo       ^<LogonType^>S4U^</LogonType^>
echo       ^<RunLevel^>HighestAvailable^</RunLevel^>
echo     ^</Principal^>
echo   ^</Principals^>
echo   ^<Settings^>
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^>
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^>
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^>
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^>
echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^>
echo     ^<RunOnlyIfNetworkAvailable^>true^</RunOnlyIfNetworkAvailable^>
echo     ^<Hidden^>true^</Hidden^>
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^>
echo     ^<WakeToRun^>false^</WakeToRun^>
echo     ^<ExecutionTimeLimit^>PT0S^</ExecutionTimeLimit^>
echo     ^<Priority^>7^</Priority^>
echo   ^</Settings^>
echo   ^<Actions^>
echo     ^<Exec^>
echo       ^<Command^>python^</Command^>
echo       ^<Arguments^>"%INSTALL_DIR%\network_monitor_agent.py"^</Arguments^>
echo       ^<WorkingDirectory^>%INSTALL_DIR%^</WorkingDirectory^>
echo     ^</Exec^>
echo   ^</Actions^>
echo ^</Task^>
) > "%INSTALL_DIR%\task.xml"

REM Create the scheduled task
schtasks /Create /TN "ITNetworkMonitor" /XML "%INSTALL_DIR%\task.xml" /F
if %errorLevel% neq 0 (
    echo ✗ Failed to create scheduled task
    echo Trying alternative method...
    
    REM Try creating with command line parameters
    schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F
    if %errorLevel% neq 0 (
        echo ✗ Failed to create scheduled task with alternative method
        echo Please contact IT support for assistance
        pause
        exit /b 1
    )
    echo ✓ Scheduled task created with alternative method
) else (
    echo ✓ Scheduled task created successfully
)

REM Clean up XML file
del "%INSTALL_DIR%\task.xml" 2>nul

REM Start the service
echo Starting service...
schtasks /Run /TN "ITNetworkMonitor"
if %errorLevel% neq 0 (
    echo ⚠ Service installed but failed to start
    echo You can start it manually later using Task Scheduler
    ) else (
    echo ✓ Service started successfully
)

echo.
echo ========================================
echo ✓ Installation completed successfully!
echo ========================================
echo.
echo The agent is now installed and will:
echo - Start automatically when Windows boots
echo - Run in the background without requiring CMD
echo - Monitor network traffic and report to the IT portal
echo.
echo Next steps:
echo 1. Open the IT Management Portal
echo 2. Go to the Employee section (Dashboard)
echo 3. Click the download button to get your registration token
echo 4. Register the agent with your token
echo.
echo The agent will continue running in the background.
echo You can check its status in Task Scheduler (taskschd.msc)
echo.
echo Service Management:
echo - Use AgentServiceManager.bat to manage the service
echo - Check logs at: %USERPROFILE%\.it_monitor\agent.log
echo.

echo Press any key to exit...
pause >nul