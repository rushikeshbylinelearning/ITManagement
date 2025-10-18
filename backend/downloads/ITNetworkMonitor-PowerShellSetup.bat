@echo off
echo ========================================
echo IT Network Monitor Agent - PowerShell Setup
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

REM Create the agent file using PowerShell to avoid batch file issues
echo Creating network monitor agent using PowerShell...
powershell -Command "& {
$agentCode = @'
#!/usr/bin/env python3
\"\"\"
IT Management Network Monitoring Agent
Version: 1.0.0

This agent monitors network traffic on Windows systems and reports to the IT Management backend.
It runs as a background service and automatically starts on system boot.
\"\"\"

import os
import sys
import time
import json
import socket
import requests
import threading
from datetime import datetime
from collections import defaultdict

try:
    import psutil
except ImportError:
    print(\"ERROR: psutil is not installed. Installing now...\")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psutil'])
    import psutil

# Configuration
AGENT_VERSION = \"1.0.0\"
CONFIG_FILE = os.path.join(os.path.expanduser(\"~\"), \".it_monitor\", \"config.json\")
LOG_FILE = os.path.join(os.path.expanduser(\"~\"), \".it_monitor\", \"agent.log\")
BACKEND_URL = \"https://itmanagement.bylinelms.com/api\"
UPDATE_INTERVAL = 10
HEARTBEAT_INTERVAL = 60

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
            'facebook.com': 'Facebook', 'instagram.com': 'Instagram', 'twitter.com': 'Twitter',
            'linkedin.com': 'LinkedIn', 'tiktok.com': 'TikTok', 'snapchat.com': 'Snapchat',
            'youtube.com': 'YouTube', 'vimeo.com': 'Vimeo', 'twitch.tv': 'Twitch',
            'netflix.com': 'Netflix', 'hulu.com': 'Hulu', 'disney.com': 'Disney+',
            'amazon.com': 'Amazon Prime', 'zoom.us': 'Zoom', 'teams.microsoft.com': 'Microsoft Teams',
            'meet.google.com': 'Google Meet', 'webex.com': 'Webex', 'slack.com': 'Slack',
            'discord.com': 'Discord', 'whatsapp.com': 'WhatsApp', 'telegram.org': 'Telegram',
            'office.com': 'Microsoft Office', 'google.com': 'Google Services',
            'docs.google.com': 'Google Docs', 'drive.google.com': 'Google Drive',
            'dropbox.com': 'Dropbox', 'onedrive.live.com': 'OneDrive', 'notion.so': 'Notion',
            'trello.com': 'Trello', 'asana.com': 'Asana', 'github.com': 'GitHub',
            'gitlab.com': 'GitLab', 'bitbucket.org': 'Bitbucket', 'stackoverflow.com': 'Stack Overflow',
            'stackexchange.com': 'Stack Exchange', 'dev.to': 'Dev.to', 'medium.com': 'Medium',
            'cnn.com': 'CNN', 'bbc.com': 'BBC', 'reuters.com': 'Reuters', 'nytimes.com': 'New York Times',
            'washingtonpost.com': 'Washington Post', 'theguardian.com': 'The Guardian',
            'reddit.com': 'Reddit', 'amazon.com': 'Amazon', 'ebay.com': 'eBay',
            'shopify.com': 'Shopify', 'paypal.com': 'PayPal', 'stripe.com': 'Stripe',
            'aws.amazon.com': 'Amazon Web Services', 'azure.microsoft.com': 'Microsoft Azure',
            'cloud.google.com': 'Google Cloud', 'digitalocean.com': 'DigitalOcean',
            'linode.com': 'Linode', 'spotify.com': 'Spotify', 'apple.com': 'Apple Services',
            'adobe.com': 'Adobe', 'salesforce.com': 'Salesforce', 'hubspot.com': 'HubSpot',
            'mailchimp.com': 'Mailchimp'
        }
        
        # Ensure config directory exists
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        
        # Load or create configuration
        self.load_config()
        
    def log(self, message):
        timestamp = datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")
        log_message = f\"[{timestamp}] {message}\"
        print(log_message)
        
        try:
            with open(LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(log_message + \"\\n\")
        except Exception as e:
            print(f\"Failed to write to log file: {e}\")
    
    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    self.system_id = config.get('system_id')
                    self.system_name = config.get('system_name')
                    self.agent_token = config.get('agent_token')
                    self.backend_url = config.get('backend_url', BACKEND_URL)
                    self.log(f\"Configuration loaded for system: {self.system_name}\")
            except Exception as e:
                self.log(f\"Error loading config: {e}\")
                self.create_new_config()
        else:
            self.create_new_config()
    
    def create_new_config(self):
        import uuid
        self.system_name = socket.gethostname()
        self.system_id = f\"sys-{uuid.uuid4().hex[:12]}\"
        self.log(f\"Created new system ID: {self.system_id}\")
    
    def save_config(self):
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
            self.log(\"Configuration saved successfully\")
        except Exception as e:
            self.log(f\"Error saving config: {e}\")
    
    def set_token(self, token):
        self.agent_token = token
        self.save_config()
        self.log(\"Agent token configured successfully\")
    
    def get_network_connections(self):
        connections = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    connections.append({
                        'local': f\"{conn.laddr.ip}:{conn.laddr.port}\",
                        'remote': f\"{conn.raddr.ip}:{conn.raddr.port}\",
                        'pid': conn.pid
                    })
        except Exception as e:
            self.log(f\"Error getting connections: {e}\")
        return connections
    
    def resolve_ip_to_domain(self, ip):
        try:
            if self.is_private_ip(ip):
                return ip
            
            domain = socket.gethostbyaddr(ip)[0]
            domain = domain.lower().strip()
            
            if self.is_ip_like(domain):
                return ip
            
            parts = domain.split('.')
            if len(parts) >= 2:
                main_domain = '.'.join(parts[-2:])
                
                cdn_domains = [
                    'amazonaws.com', 'cloudfront.net', 'akamai.net', 'fastly.com',
                    'cloudflare.com', 'maxcdn.com', 'jsdelivr.net', 'unpkg.com',
                    'cdnjs.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com',
                    'linodeusercontent.com', 'digitaloceanspaces.com', 'azureedge.net'
                ]
                
                if main_domain in cdn_domains:
                    if len(parts) >= 3:
                        subdomain = parts[0]
                        service_indicators = ['api', 'www', 'app', 'service', 'cdn', 'static', 'assets']
                        if subdomain not in service_indicators:
                            return f\"{subdomain}.{main_domain}\"
                    return main_domain
                
                friendly_name = self.domain_mapping.get(main_domain)
                if friendly_name:
                    return friendly_name
                
                return main_domain
            return domain
        except Exception as e:
            self.log(f\"DNS resolution failed for {ip}: {e}\")
            return ip
    
    def is_private_ip(self, ip):
        try:
            import ipaddress
            return ipaddress.ip_address(ip).is_private
        except:
            private_ranges = [
                '10.', '172.16.', '172.17.', '172.18.', '172.19.',
                '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                '172.30.', '172.31.', '192.168.', '127.', '169.254.'
            ]
            return any(ip.startswith(prefix) for prefix in private_ranges)
    
    def is_ip_like(self, domain):
        try:
            socket.inet_aton(domain)
            return True
        except:
            if domain.count('.') >= 2 and sum(c.isdigit() for c in domain) > len(domain) * 0.5:
                return True
            return False
    
    def monitor_network_traffic(self):
        try:
            net_io = psutil.net_io_counters()
            
            if self.last_net_io is None:
                self.last_net_io = net_io
                return
            
            bytes_sent = net_io.bytes_sent - self.last_net_io.bytes_sent
            bytes_recv = net_io.bytes_recv - self.last_net_io.bytes_recv
            
            upload_mb = bytes_sent / (1024 * 1024)
            download_mb = bytes_recv / (1024 * 1024)
            
            connections = self.get_network_connections()
            domain_usage = defaultdict(lambda: {'upload': 0, 'download': 0, 'count': 0})
            
            if connections:
                upload_per_conn = upload_mb / len(connections)
                download_per_conn = download_mb / len(connections)
                
                for conn in connections:
                    try:
                        remote_ip = conn['remote'].split(':')[0]
                        domain = self.resolve_ip_to_domain(remote_ip)
                        domain_usage[domain]['upload'] += upload_per_conn
                        domain_usage[domain]['download'] += download_per_conn
                        domain_usage[domain]['count'] += 1
                    except:
                        pass
            
            for domain, usage in domain_usage.items():
                self.network_stats[domain]['upload'] += usage['upload']
                self.network_stats[domain]['download'] += usage['download']
                self.network_stats[domain]['count'] += usage['count']
            
            self.last_net_io = net_io
        except Exception as e:
            self.log(f\"Error monitoring network: {e}\")
    
    def send_data_to_backend(self):
        if not self.agent_token:
            self.log(\"No agent token configured. Please register this agent.\")
            return False
        
        try:
            websites = []
            for domain, stats in self.network_stats.items():
                total_data = stats['upload'] + stats['download']
                if total_data > 0:
                    websites.append({
                        'domain': domain,
                        'dataUsedMB': round(total_data, 2),
                        'uploadMB': round(stats['upload'], 2),
                        'downloadMB': round(stats['download'], 2),
                        'requestCount': int(stats['count'])
                    })
            
            total_upload = sum(w['uploadMB'] for w in websites)
            total_download = sum(w['downloadMB'] for w in websites)
            
            payload = {
                'totalUploadMB': round(total_upload, 2),
                'totalDownloadMB': round(total_download, 2),
                'websites': websites,
                'agentVersion': AGENT_VERSION,
                'systemInfo': self.get_system_info()
            }
            
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            try:
                response = self.session.post(
                    f\"{self.backend_url}/network-monitoring/logs\",
                    json=payload,
                    headers=headers,
                    timeout=10,
                    verify=True
                )
            except:
                response = self.session.post(
                    f\"{self.backend_url}/network-monitoring/logs\",
                    json=payload,
                    headers=headers,
                    timeout=10,
                    verify=False
                )
            
            if response.status_code == 201:
                self.log(f\"Data sent successfully: {total_upload + total_download:.2f} MB total\")
                self.network_stats.clear()
                return True
            else:
                self.log(f\"Failed to send data: {response.status_code} - {response.text}\")
                return False
                
        except Exception as e:
            self.log(f\"Error sending data to backend: {e}\")
            return False
    
    def get_system_info(self):
        try:
            import platform
            cpu_info = platform.processor()
            ram_info = f\"{psutil.virtual_memory().total / (1024**3):.1f} GB\"
            return {
                'os': platform.system(),
                'osVersion': platform.version(),
                'cpu': cpu_info,
                'ram': ram_info,
                'ipAddress': self.get_local_ip(),
                'macAddress': self.get_mac_address()
            }
        except Exception as e:
            self.log(f\"Error getting system info: {e}\")
            return {}
    
    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect((\"8.8.8.8\", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return \"Unknown\"
    
    def get_mac_address(self):
        try:
            import uuid
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff)
                           for elements in range(0, 2*6, 2)][::-1])
            return mac
        except:
            return \"Unknown\"
    
    def send_heartbeat(self):
        if not self.agent_token:
            return
        
        try:
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            try:
                response = self.session.post(
                    f\"{self.backend_url}/network-monitoring/heartbeat\",
                    headers=headers,
                    timeout=5,
                    verify=True
                )
            except:
                response = self.session.post(
                    f\"{self.backend_url}/network-monitoring/heartbeat\",
                    headers=headers,
                    timeout=5,
                    verify=False
                )
            
            if response.status_code == 200:
                self.log(\"Heartbeat sent successfully\")
            
        except Exception as e:
            self.log(f\"Heartbeat failed: {e}\")
    
    def heartbeat_loop(self):
        while self.is_running:
            self.send_heartbeat()
            time.sleep(HEARTBEAT_INTERVAL)
    
    def run(self):
        self.log(f\"Starting IT Network Monitor Agent v{AGENT_VERSION}\")
        self.log(f\"System: {self.system_name} ({self.system_id})\")
        
        heartbeat_thread = threading.Thread(target=self.heartbeat_loop, daemon=True)
        heartbeat_thread.start()
        
        last_send_time = time.time()
        
        try:
            while self.is_running:
                self.monitor_network_traffic()
                
                if time.time() - last_send_time >= UPDATE_INTERVAL:
                    self.send_data_to_backend()
                    last_send_time = time.time()
                
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.log(\"Agent stopped by user\")
        except Exception as e:
            self.log(f\"Agent error: {e}\")
        finally:
            self.is_running = False
            self.log(\"Agent shutdown complete\")
    
    def stop(self):
        self.is_running = False

def main():
    agent = NetworkMonitorAgent()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'register' and len(sys.argv) > 2:
            token = sys.argv[2]
            agent.set_token(token)
            print(f\"Agent registered successfully!\")
            print(f\"System ID: {agent.system_id}\")
            print(f\"System Name: {agent.system_name}\")
            return
        
        elif command == 'status':
            print(f\"System ID: {agent.system_id}\")
            print(f\"System Name: {agent.system_name}\")
            print(f\"Token Configured: {'Yes' if agent.agent_token else 'No'}\")
            print(f\"Version: {AGENT_VERSION}\")
            return
        
        elif command == 'test':
            print(\"Running in test mode (60 seconds)...\")
            agent.run()
            return
    
    agent.run()

if __name__ == \"__main__\":
    main()
'@
    $agentCode | Out-File -FilePath '%INSTALL_DIR%\network_monitor_agent.py' -Encoding UTF8
}"

if %errorLevel% neq 0 (
    echo ✗ Failed to create agent file using PowerShell
    echo Please check PowerShell execution policy
    pause
    exit /b 1
)

echo ✓ Agent file created successfully using PowerShell

REM Install Python dependencies
echo Installing Python dependencies...
python -m pip install psutil requests --quiet
if %errorLevel% neq 0 (
    echo ⚠ Some dependencies failed to install, but continuing...
)

echo ✓ Dependencies installation completed

REM Create scheduled task
echo Creating Windows scheduled task...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F
if %errorLevel% neq 0 (
    echo ✗ Failed to create scheduled task
    echo You can start the agent manually by running:
    echo python "%INSTALL_DIR%\network_monitor_agent.py"
    pause
    exit /b 1
)

echo ✓ Scheduled task created successfully

REM Start the agent
echo Starting agent...
schtasks /Run /TN "ITNetworkMonitor"
if %errorLevel% neq 0 (
    echo ⚠ Task created but failed to start
    echo You can start it manually later
) else (
    echo ✓ Agent started successfully
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
echo 4. Run this command to register:
echo    python "%INSTALL_DIR%\network_monitor_agent.py" register YOUR_TOKEN_HERE
echo.
echo The agent will continue running in the background.
echo You can check its status in Task Scheduler (taskschd.msc)
echo.

echo Press any key to exit...
pause >nul


