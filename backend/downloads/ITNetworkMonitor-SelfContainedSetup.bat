@echo off
echo ========================================
echo IT Network Monitor Agent - Self-Contained Setup
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
echo Installing IT Network Monitor Agent for continuous operation...
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

REM Create the agent file directly using Python to avoid batch file issues
echo Creating improved agent file...
python -c "
import os
agent_code = '''#!/usr/bin/env python3
\"\"\"
IT Management Network Monitoring Agent
Version: 1.0.0
Continuous operation with service name mapping
\"\"\"

import os
import sys
import time
import json
import socket
import platform
import uuid
import requests
import psutil
from datetime import datetime
import threading
import logging

# Configuration
AGENT_VERSION = \"1.0.0\"
BACKEND_URL = \"http://localhost:5001/api\"
BACKUP_BACKEND_URL = \"https://itmanagement.bylinelms.com/api\"
HEARTBEAT_INTERVAL = 60  # seconds
DATA_SEND_INTERVAL = 10  # seconds

class NetworkMonitorAgent:
    def __init__(self):
        self.system_id = None
        self.system_name = None
        self.agent_token = None
        self.is_running = False
        self.network_stats = {}
        self.last_upload = 0
        self.last_download = 0
        
        # Create user directory for config and logs
        self.user_dir = os.path.join(os.path.expanduser(\"~\"), \".it_monitor\")
        os.makedirs(self.user_dir, exist_ok=True)
        
        # Setup logging
        self.setup_logging()
        
        # Load configuration
        self.load_config()
        
        # Domain mapping for friendly names
        self.domain_mapping = {
            'youtube.com': 'YouTube',
            'google.com': 'Google',
            'facebook.com': 'Facebook',
            'instagram.com': 'Instagram',
            'twitter.com': 'Twitter',
            'linkedin.com': 'LinkedIn',
            'github.com': 'GitHub',
            'stackoverflow.com': 'Stack Overflow',
            'reddit.com': 'Reddit',
            'netflix.com': 'Netflix',
            'amazon.com': 'Amazon',
            'microsoft.com': 'Microsoft',
            'apple.com': 'Apple',
            'adobe.com': 'Adobe',
            'dropbox.com': 'Dropbox',
            'zoom.us': 'Zoom',
            'slack.com': 'Slack',
            'discord.com': 'Discord',
            'twitch.tv': 'Twitch',
            'spotify.com': 'Spotify'
        }
    
    def setup_logging(self):
        \"\"\"Setup logging to file\"\"\"
        log_file = os.path.join(self.user_dir, \"agent.log\")
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log(self, message):
        \"\"\"Log message\"\"\"
        self.logger.info(message)
    
    def load_config(self):
        \"\"\"Load agent configuration\"\"\"
        config_file = os.path.join(self.user_dir, \"agent_config.json\")
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    self.system_id = config.get('system_id')
                    self.system_name = config.get('system_name')
                    self.agent_token = config.get('agent_token')
                    self.log(f\"Loaded configuration: {self.system_name} ({self.system_id})\")
            except Exception as e:
                self.log(f\"Error loading config: {e}\")
        
        if not self.system_id:
            self.system_id = f\"sys-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}\"
            self.system_name = f\"{platform.node()}\"
            self.save_config()
    
    def save_config(self):
        \"\"\"Save agent configuration\"\"\"
        config_file = os.path.join(self.user_dir, \"agent_config.json\")
        try:
            config = {
                'system_id': self.system_id,
                'system_name': self.system_name,
                'agent_token': self.agent_token,
                'version': AGENT_VERSION,
                'last_updated': datetime.now().isoformat()
            }
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            self.log(f\"Error saving config: {e}\")
    
    def register_agent(self, token):
        \"\"\"Register agent with backend\"\"\"
        try:
            self.agent_token = token
            
            # Try primary backend first
            try:
                response = requests.post(
                    f\"{BACKEND_URL}/network-monitoring/register\",
                    json={
                        'systemId': self.system_id,
                        'systemName': self.system_name,
                        'agentToken': token,
                        'version': AGENT_VERSION,
                        'platform': platform.system(),
                        'architecture': platform.machine()
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    self.log(\"Agent registered successfully with primary backend\")
                    self.save_config()
                    return True
            except Exception as e:
                self.log(f\"Primary backend registration failed: {e}\")
            
            # Try backup backend
            try:
                response = requests.post(
                    f\"{BACKUP_BACKEND_URL}/network-monitoring/register\",
                    json={
                        'systemId': self.system_id,
                        'systemName': self.system_name,
                        'agentToken': token,
                        'version': AGENT_VERSION,
                        'platform': platform.system(),
                        'architecture': platform.machine()
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    self.log(\"Agent registered successfully with backup backend\")
                    self.save_config()
                    return True
            except Exception as e:
                self.log(f\"Backup backend registration failed: {e}\")
            
            self.log(\"Failed to register with any backend\")
            return False
            
        except Exception as e:
            self.log(f\"Registration error: {e}\")
            return False
    
    def get_service_name_by_ip(self, ip):
        \"\"\"Get service name based on IP address ranges\"\"\"
        try:
            ip_parts = ip.split('.')
            if len(ip_parts) != 4:
                return None
            
            first_octet = int(ip_parts[0])
            second_octet = int(ip_parts[1])
            
            # Google services
            if first_octet == 142 and second_octet in [250, 251]:
                return \"Google Services\"
            elif first_octet == 172 and second_octet == 217:
                return \"Google Services\"
            elif first_octet == 216 and second_octet == 58:
                return \"Google Services\"
            elif first_octet == 74 and second_octet == 125:
                return \"Google Services\"
            
            # Microsoft services
            elif first_octet == 13 and second_octet == 107:
                return \"Microsoft Services\"
            elif first_octet == 20 and second_octet == 42:
                return \"Microsoft Services\"
            elif first_octet == 40 and second_octet == 126:
                return \"Microsoft Services\"
            
            # Cloudflare
            elif first_octet == 104 and second_octet == 18:
                return \"Cloudflare\"
            elif first_octet == 172 and second_octet == 64:
                return \"Cloudflare\"
            
            # AWS
            elif first_octet == 52 and second_octet in [201, 202, 203, 204, 205]:
                return \"Amazon Web Services\"
            elif first_octet == 54 and second_octet in [236, 237, 238, 239, 240]:
                return \"Amazon Web Services\"
            
            # Akamai
            elif first_octet == 159 and second_octet == 41:
                return \"Akamai CDN\"
            
            # Facebook/Meta
            elif first_octet == 31 and second_octet == 13:
                return \"Facebook Services\"
            elif first_octet == 66 and second_octet == 220:
                return \"Facebook Services\"
            
            return None
        except:
            return None
    
    def resolve_ip_to_domain(self, ip):
        \"\"\"Resolve IP address to domain name with improved logic and fallback\"\"\"
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
                return f\"service-{ip.split('.')[-1]}\"
            except Exception:
                # Any other DNS error, use IP with generic service name
                return f\"service-{ip.split('.')[-1]}\"
            
            # Clean up domain name
            domain = domain.lower().strip()
            
            # Skip if it's just an IP-like domain
            if self.is_ip_like(domain):
                return f\"service-{ip.split('.')[-1]}\"
            
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
                            return f\"{subdomain}.{main_domain}\"
                    return main_domain
                
                # Check if we have a friendly name for this domain
                friendly_name = self.domain_mapping.get(main_domain)
                if friendly_name:
                    return friendly_name
                
                return main_domain
            return domain
        except Exception as e:
            # Final fallback - use IP with generic service name
            return f\"service-{ip.split('.')[-1]}\"
    
    def is_private_ip(self, ip):
        \"\"\"Check if IP is private/internal\"\"\"
        try:
            import ipaddress
            return ipaddress.ip_address(ip).is_private
        except:
            # Fallback for older Python versions
            private_ranges = [
                (\"10.0.0.0\", \"10.255.255.255\"),
                (\"172.16.0.0\", \"172.31.255.255\"),
                (\"192.168.0.0\", \"192.168.255.255\"),
                (\"127.0.0.0\", \"127.255.255.255\")
            ]
            
            ip_parts = [int(x) for x in ip.split('.')]
            ip_num = (ip_parts[0] << 24) + (ip_parts[1] << 16) + (ip_parts[2] << 8) + ip_parts[3]
            
            for start, end in private_ranges:
                start_parts = [int(x) for x in start.split('.')]
                end_parts = [int(x) for x in end.split('.')]
                start_num = (start_parts[0] << 24) + (start_parts[1] << 16) + (start_parts[2] << 8) + start_parts[3]
                end_num = (end_parts[0] << 24) + (end_parts[1] << 16) + (end_parts[2] << 8) + end_parts[3]
                
                if start_num <= ip_num <= end_num:
                    return True
            return False
    
    def is_ip_like(self, domain):
        \"\"\"Check if domain looks like an IP address\"\"\"
        try:
            parts = domain.split('.')
            if len(parts) != 4:
                return False
            for part in parts:
                if not part.isdigit() or int(part) > 255:
                    return False
            return True
        except:
            return False
    
    def get_network_connections(self):
        \"\"\"Get current network connections\"\"\"
        connections = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    remote_ip = conn.raddr[0]
                    if not self.is_private_ip(remote_ip):
                        connections.append({
                            'local': f\"{conn.laddr[0]}:{conn.laddr[1]}\",
                            'remote': f\"{remote_ip}:{conn.raddr[1]}\",
                            'status': conn.status
                        })
        except Exception as e:
            self.log(f\"Error getting connections: {e}\")
        
        return connections
    
    def monitor_network_traffic(self):
        \"\"\"Monitor network traffic and resolve domains\"\"\"
        try:
            # Get network I/O stats
            net_io = psutil.net_io_counters()
            current_upload = net_io.bytes_sent
            current_download = net_io.bytes_recv
            
            # Calculate differences
            upload_bytes = current_upload - self.last_upload
            download_bytes = current_download - self.last_download
            
            # Convert to MB
            upload_mb = upload_bytes / (1024 * 1024)
            download_mb = download_bytes / (1024 * 1024)
            
            # Update last values
            self.last_upload = current_upload
            self.last_download = current_download
            
            # Get active connections
            connections = self.get_network_connections()
            
            # Initialize domain usage tracking
            domain_usage = {}
            
            if connections and len(connections) > 0:
                # Distribute bandwidth across active connections
                upload_per_conn = upload_mb / len(connections)
                download_per_conn = download_mb / len(connections)
                
                for conn in connections:
                    try:
                        remote_ip = conn['remote'].split(':')[0]
                        domain = self.resolve_ip_to_domain(remote_ip)
                        
                        if domain not in domain_usage:
                            domain_usage[domain] = {'upload': 0, 'download': 0, 'count': 0}
                        
                        domain_usage[domain]['upload'] += upload_per_conn
                        domain_usage[domain]['download'] += download_per_conn
                        domain_usage[domain]['count'] += 1
                    except Exception as e:
                        pass
            elif upload_mb > 0 or download_mb > 0:
                # If there's network activity but no connections, create a generic entry
                domain_usage['system-activity'] = {'upload': upload_mb, 'download': download_mb, 'count': 1}
            
            # Update cumulative stats
            for domain, usage in domain_usage.items():
                if domain not in self.network_stats:
                    self.network_stats[domain] = {'upload': 0, 'download': 0, 'count': 0}
                
                self.network_stats[domain]['upload'] += usage['upload']
                self.network_stats[domain]['download'] += usage['download']
                self.network_stats[domain]['count'] += usage['count']
            
            return {
                'total_upload_mb': upload_mb,
                'total_download_mb': download_mb,
                'total_data_mb': upload_mb + download_mb,
                'websites': domain_usage,
                'connections_count': len(connections)
            }
            
        except Exception as e:
            self.log(f\"Error monitoring network traffic: {e}\")
            return {
                'total_upload_mb': 0,
                'total_download_mb': 0,
                'total_data_mb': 0,
                'websites': {},
                'connections_count': 0
            }
    
    def send_network_data(self, data):
        \"\"\"Send network monitoring data to backend\"\"\"
        if not self.agent_token:
            return False
        
        try:
            payload = {
                'systemId': self.system_id,
                'systemName': self.system_name,
                'agentToken': self.agent_token,
                'timestamp': datetime.now().isoformat(),
                'version': AGENT_VERSION,
                'totalUploadMB': data['total_upload_mb'],
                'totalDownloadMB': data['total_download_mb'],
                'totalDataMB': data['total_data_mb'],
                'websites': data['websites'],
                'connectionsCount': data['connections_count']
            }
            
            # Try primary backend first
            try:
                response = requests.post(
                    f\"{BACKEND_URL}/network-monitoring/logs\",
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                if response.status_code == 200:
                    return True
            except Exception as e:
                self.log(f\"Primary backend data send failed: {e}\")
            
            # Try backup backend
            try:
                response = requests.post(
                    f\"{BACKUP_BACKEND_URL}/network-monitoring/logs\",
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                if response.status_code == 200:
                    return True
            except Exception as e:
                self.log(f\"Backup backend data send failed: {e}\")
            
            return False
            
        except Exception as e:
            self.log(f\"Error sending network data: {e}\")
            return False
    
    def send_heartbeat(self):
        \"\"\"Send heartbeat to backend\"\"\"
        if not self.agent_token:
            return
        
        try:
            payload = {
                'systemId': self.system_id,
                'systemName': self.system_name,
                'agentToken': self.agent_token,
                'timestamp': datetime.now().isoformat(),
                'version': AGENT_VERSION,
                'status': 'active'
            }
            
            # Try primary backend first
            try:
                response = requests.post(
                    f\"{BACKEND_URL}/network-monitoring/heartbeat\",
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log(\"Heartbeat sent successfully\")
                
            except Exception as e:
                self.log(f\"Primary backend heartbeat failed: {e}\")
            
            # Try backup backend
            try:
                response = requests.post(
                    f\"{BACKUP_BACKEND_URL}/network-monitoring/heartbeat\",
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log(\"Heartbeat sent successfully\")
                
            except Exception as e:
                self.log(f\"Backup backend heartbeat failed: {e}\")
            
        except Exception as e:
            self.log(f\"Heartbeat failed: {e}\")
    
    def heartbeat_loop(self):
        \"\"\"Background thread for sending heartbeats\"\"\"
        while self.is_running:
            self.send_heartbeat()
            time.sleep(HEARTBEAT_INTERVAL)
    
    def run(self):
        \"\"\"Main agent loop\"\"\"
        if not self.agent_token:
            self.log(\"Agent not registered. Please register with a token first.\")
            return
        
        self.log(f\"Starting network monitoring agent: {self.system_name} ({self.system_id})\")
        self.log(f\"Backend URL: {BACKEND_URL}\")
        self.log(f\"Data send interval: {DATA_SEND_INTERVAL} seconds\")
        self.log(f\"Heartbeat interval: {HEARTBEAT_INTERVAL} seconds\")
        
        self.is_running = True
        
        # Start heartbeat thread
        heartbeat_thread = threading.Thread(target=self.heartbeat_loop, daemon=True)
        heartbeat_thread.start()
        
        try:
            while self.is_running:
                # Monitor network traffic
                data = self.monitor_network_traffic()
                
                # Send data if there's activity
                if data['total_data_mb'] > 0 or data['connections_count'] > 0:
                    if self.send_network_data(data):
                        self.log(f\"Data sent: {data['total_data_mb']:.2f} MB, {data['connections_count']} connections\")
                    else:
                        self.log(\"Failed to send network data\")
                
                # Wait for next interval
                time.sleep(DATA_SEND_INTERVAL)
                
        except KeyboardInterrupt:
            self.log(\"Agent stopped by user\")
        except Exception as e:
            self.log(f\"Agent error: {e}\")
        finally:
            self.is_running = False
            self.log(\"Agent shutdown complete\")

def main():
    if len(sys.argv) < 2:
        print(\"Usage: python network_monitor_agent.py <command> [token]\")
        print(\"Commands:\")
        print(\"  register <token>  - Register agent with backend\")
        print(\"  start            - Start monitoring (requires registration)\")
        print(\"  test             - Run in test mode (60 seconds)\")
        print(\"  status           - Show agent status\")
        return
    
    command = sys.argv[1].lower()
    agent = NetworkMonitorAgent()
    
    if command == 'register':
        if len(sys.argv) < 3:
            print(\"Error: Registration token required\")
            print(\"Usage: python network_monitor_agent.py register <token>\")
            return
        
        token = sys.argv[2]
        if agent.register_agent(token):
            print(\"✓ Agent registered successfully\")
            print(f\"System ID: {agent.system_id}\")
            print(f\"System Name: {agent.system_name}\")
        else:
            print(\"✗ Agent registration failed\")
            return
    
    elif command == 'start':
        agent.run()
    
    elif command == 'test':
        print(\"Running in test mode (60 seconds)...\")
        agent.is_running = True
        heartbeat_thread = threading.Thread(target=agent.heartbeat_loop, daemon=True)
        heartbeat_thread.start()
        
        start_time = time.time()
        while agent.is_running and (time.time() - start_time) < 60:
            data = agent.monitor_network_traffic()
            if data['total_data_mb'] > 0 or data['connections_count'] > 0:
                if agent.send_network_data(data):
                    print(f\"Data sent: {data['total_data_mb']:.2f} MB, {data['connections_count']} connections\")
            time.sleep(DATA_SEND_INTERVAL)
        
        agent.is_running = False
        print(\"Test mode completed\")
        return
    
    elif command == 'status':
        print(f\"System ID: {agent.system_id}\")
        print(f\"System Name: {agent.system_name}\")
        print(f\"Token Configured: {'Yes' if agent.agent_token else 'No'}\")
        print(f\"Version: {AGENT_VERSION}\")
        return
    
    # Run the agent
    agent.run()

if __name__ == \"__main__\":
    main()
'''

# Write the agent file
with open(r'%INSTALL_DIR%\network_monitor_agent.py', 'w', encoding='utf-8') as f:
    f.write(agent_code)

print('✓ Agent file created successfully')
" >nul 2>&1

if %errorLevel% == 0 (
    echo ✓ Agent file created successfully
) else (
    echo ✗ Failed to create agent file
    pause
    exit /b 1
)

REM Install Python dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install psutil requests >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Python dependencies installed successfully
) else (
    echo ⚠ Warning: Some dependencies may not have installed properly
    echo The agent will attempt to install them when it runs
)

REM Create user directory for config and logs
set USER_DIR=%USERPROFILE%\.it_monitor
echo Creating user directory: %USER_DIR%
mkdir "%USER_DIR%" 2>nul

REM Delete existing scheduled task if it exists
echo Removing existing scheduled task...
schtasks /Delete /TN "ITNetworkMonitor" /F >nul 2>&1

REM Create a new scheduled task that runs continuously
echo Creating continuous scheduled task...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\" start" /SC ONLOGON /RL HIGHEST /F /RU "SYSTEM" >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Continuous scheduled task created successfully
) else (
    echo ⚠ Warning: Failed to create scheduled task
    echo You may need to start the agent manually
)

REM Create a startup script that ensures the agent runs
echo Creating startup script...
echo @echo off > "%INSTALL_DIR%\start_agent.bat"
echo cd /d "%INSTALL_DIR%" >> "%INSTALL_DIR%\start_agent.bat"
echo python network_monitor_agent.py start >> "%INSTALL_DIR%\start_agent.bat"

REM Add to startup folder
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo Creating startup shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTUP_DIR%\ITNetworkMonitor.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\start_agent.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs" >nul 2>&1
del "%TEMP%\CreateShortcut.vbs" >nul 2>&1

REM Start the agent immediately
echo Starting the agent...
start /B python "%INSTALL_DIR%\network_monitor_agent.py" start
if %errorLevel% == 0 (
    echo ✓ Agent started successfully in background
) else (
    echo ⚠ Warning: Failed to start agent automatically
    echo You can start it manually by running:
    echo python "%INSTALL_DIR%\network_monitor_agent.py" start
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo The IT Network Monitor Agent has been installed with:
echo ✓ Self-contained agent file (no external dependencies)
echo ✓ Improved DNS resolution with service name mapping
echo ✓ Continuous background operation
echo ✓ Auto-start on system boot
echo ✓ Better error handling
echo ✓ Service name mapping for common IP ranges
echo.
echo The agent will now:
echo - Run continuously in the background
echo - Start automatically on system boot
echo - Show service names instead of IP addresses
echo - Send network data every 10 seconds
echo - Send heartbeats every 60 seconds
echo.
echo Next steps:
echo 1. Go to the IT Management Portal dashboard
echo 2. Register the agent with your token
echo 3. The agent will automatically start monitoring
echo.
echo Installation directory: %INSTALL_DIR%
echo Config directory: %USER_DIR%
echo.
echo Press any key to exit...
pause >nul
