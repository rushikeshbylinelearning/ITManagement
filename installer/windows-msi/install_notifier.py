"""
IT Monitoring Agent - Installation Notifier
Sends installation notification to backend server
No external dependencies - uses only Python standard library
"""

import json
import os
import sys
import socket
import platform
from datetime import datetime
from urllib import request, error
from urllib.parse import urljoin
import time

# Configuration
DEFAULT_BACKEND_URL = "http://localhost:5001"
INSTALL_LOG_DIR = r"C:\ProgramData\ITMonitoring"
INSTALL_LOG_FILE = os.path.join(INSTALL_LOG_DIR, "install_log.txt")
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def log_message(message):
    """Write log message to both console and log file"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}"
    
    # Print to console
    print(log_line)
    
    # Write to log file
    try:
        # Ensure log directory exists
        os.makedirs(INSTALL_LOG_DIR, exist_ok=True)
        
        with open(INSTALL_LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_line + '\n')
    except Exception as e:
        print(f"Warning: Could not write to log file: {e}")


def get_system_info():
    """Collect system information"""
    try:
        hostname = socket.gethostname()
        username = os.environ.get('USERNAME', 'Unknown')
        os_name = platform.system()
        os_version = platform.version()
        
        return {
            'hostname': hostname,
            'username': username,
            'os': os_name,
            'os_version': os_version,
            'status': 'installed',
            'timestamp': datetime.now().isoformat(),
            'installer_version': '1.0.0'
        }
    except Exception as e:
        log_message(f"Error collecting system info: {e}")
        return None


def send_installation_notification(backend_url, data, retry_count=0):
    """
    Send installation notification to backend server
    Returns True on success, False on failure
    """
    endpoint = urljoin(backend_url.rstrip('/') + '/', 'api/monitoring/agent/install-notify')
    
    try:
        log_message(f"Sending installation notification to: {endpoint}")
        log_message(f"Data: hostname={data.get('hostname')}, username={data.get('username')}")
        
        # Prepare request
        json_data = json.dumps(data).encode('utf-8')
        
        req = request.Request(
            endpoint,
            data=json_data,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'ITMonitoringAgent-Installer/1.0'
            },
            method='POST'
        )
        
        # Send request with timeout
        with request.urlopen(req, timeout=10) as response:
            response_data = response.read().decode('utf-8')
            response_json = json.loads(response_data)
            
            if response.status == 200:
                log_message(f"✅ Installation notification sent successfully!")
                log_message(f"Response: {response_json.get('msg', 'Success')}")
                return True
            else:
                log_message(f"❌ Server returned status code: {response.status}")
                log_message(f"Response: {response_data}")
                return False
                
    except error.HTTPError as e:
        log_message(f"❌ HTTP Error: {e.code} - {e.reason}")
        try:
            error_body = e.read().decode('utf-8')
            log_message(f"Error details: {error_body}")
        except:
            pass
        return False
        
    except error.URLError as e:
        log_message(f"❌ URL Error: {e.reason}")
        
        # Retry logic
        if retry_count < MAX_RETRIES:
            retry_count += 1
            log_message(f"Retrying in {RETRY_DELAY} seconds... (Attempt {retry_count}/{MAX_RETRIES})")
            time.sleep(RETRY_DELAY)
            return send_installation_notification(backend_url, data, retry_count)
        else:
            log_message(f"❌ Failed after {MAX_RETRIES} retries")
            return False
            
    except Exception as e:
        log_message(f"❌ Unexpected error: {type(e).__name__}: {e}")
        return False


def read_backend_url_from_config():
    """Read backend URL from MSI configuration"""
    try:
        # Try reading from registry (set by MSI)
        import winreg
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\ITMonitoringAgent", 0, winreg.KEY_READ)
        backend_url, _ = winreg.QueryValueEx(key, "BackendUrl")
        winreg.CloseKey(key)
        
        if backend_url:
            log_message(f"Backend URL from registry: {backend_url}")
            return backend_url
    except Exception as e:
        log_message(f"Could not read backend URL from registry: {e}")
    
    # Fallback to default
    return DEFAULT_BACKEND_URL


def main():
    """Main entry point"""
    log_message("=" * 60)
    log_message("IT Monitoring Agent - Installation Notifier")
    log_message("=" * 60)
    
    # Get system information
    system_info = get_system_info()
    
    if not system_info:
        log_message("❌ Failed to collect system information")
        return 1
    
    log_message(f"Hostname: {system_info['hostname']}")
    log_message(f"Username: {system_info['username']}")
    log_message(f"OS: {system_info['os']} {system_info['os_version']}")
    log_message(f"Timestamp: {system_info['timestamp']}")
    
    # Get backend URL
    backend_url = read_backend_url_from_config()
    
    # Allow backend URL override from command line
    if len(sys.argv) > 1:
        backend_url = sys.argv[1]
        log_message(f"Backend URL from command line: {backend_url}")
    
    log_message(f"Target backend: {backend_url}")
    log_message("")
    
    # Send notification
    success = send_installation_notification(backend_url, system_info)
    
    log_message("")
    log_message("=" * 60)
    
    if success:
        log_message("✅ Installation notification completed successfully")
        log_message("=" * 60)
        log_message("")
        log_message(f"Installation log saved to: {INSTALL_LOG_FILE}")
        return 0
    else:
        log_message("⚠️ Installation notification failed")
        log_message("=" * 60)
        log_message("")
        log_message("The agent has been installed, but the backend server was not notified.")
        log_message("This is not critical - the agent will register on its first heartbeat.")
        log_message(f"For troubleshooting, check the log at: {INSTALL_LOG_FILE}")
        # Return 0 anyway - notification failure should not fail installation
        return 0


if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        log_message(f"❌ Fatal error: {type(e).__name__}: {e}")
        import traceback
        log_message(traceback.format_exc())
        sys.exit(1)


