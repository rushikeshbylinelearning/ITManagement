# IT Management Monitoring Agent - Installation Binaries

This directory contains the installation scripts and binaries for the IT Management Monitoring Agent across different platforms.

## Directory Contents

- `monitoring_agent_installer.sh` - Linux installation script
- `monitoring_agent_installer_macos.sh` - macOS installation script
- `monitoring_agent_installer.ps1` - Windows PowerShell installation script
- `monitoring_agent_installer.exe` - Windows executable installer (generated)

## Prerequisites

Before installing the agent, ensure the following prerequisites are met:

### All Platforms
- Python 3.7 or higher
- pip (Python package manager)
- Internet connection (for downloading dependencies)
- Administrator/sudo privileges

### Platform-Specific Requirements

#### Linux
- systemd (for service management)
- curl or wget

#### macOS
- Xcode Command Line Tools (for some Python packages)
- Homebrew (recommended for Python installation)

#### Windows
- Python with "Add to PATH" option enabled
- PowerShell 5.0 or higher (included in Windows 10/11)

## Installation Instructions

### Linux

```bash
# Download the installer
curl -O https://your-backend-url/api/monitoring/agent/download/linux?token=YOUR_TOKEN

# Make executable
chmod +x monitoring_agent_installer.sh

# Run installer with sudo
sudo ./monitoring_agent_installer.sh
```

During installation, you will be prompted for:
- Backend URL
- Registration URL
- Registration Token (provided by the web portal)

### macOS

```bash
# Download the installer
curl -O https://your-backend-url/api/monitoring/agent/download/macos?token=YOUR_TOKEN

# Make executable
chmod +x monitoring_agent_installer_macos.sh

# Run installer with sudo
sudo ./monitoring_agent_installer_macos.sh
```

### Windows

**Option 1: Using PowerShell Script**

```powershell
# Download the installer
Invoke-WebRequest -Uri "https://your-backend-url/api/monitoring/agent/download/windows?token=YOUR_TOKEN" -OutFile "monitoring_agent_installer.ps1"

# Run as Administrator
powershell -ExecutionPolicy Bypass -File .\monitoring_agent_installer.ps1
```

**Option 2: Using Executable (Recommended)**

1. Download `monitoring_agent_installer.exe` from the web portal
2. Right-click and select "Run as Administrator"
3. Follow the installation wizard

## Zero-Touch Installation Flow

The monitoring agent is designed for zero-touch deployment:

1. **User Login**: User logs into the IT Management web portal
2. **Agent Detection**: Frontend automatically detects if agent is installed
3. **Token Generation**: If not installed, a one-time registration token is generated (expires in 5 minutes)
4. **Auto-Download**: Installer is automatically downloaded based on detected OS
5. **User Execution**: User runs the downloaded installer
6. **Auto-Registration**: Agent automatically registers with backend using the token
7. **Service Start**: Agent starts as a system service and begins telemetry reporting

## What the Agent Monitors

The monitoring agent collects the following telemetry data:

### System Metrics
- CPU usage (overall and per-core)
- Memory usage (RAM)
- Disk usage
- Network interfaces and MAC addresses
- Operating system information

### Process Information
- Running processes (PID, name, executable path)
- CPU usage per process
- Memory usage per process
- Process command lines (sanitized)

### Network Activity
- Active network connections
- Bandwidth usage per process
- Connection protocols (TCP/UDP)
- Local and remote addresses/ports

### File Events (Optional)
- File creation, modification, deletion
- File operations in monitored directories
- File metadata (size, type, timestamp)

### Privacy & Security

**What is NOT collected:**
- File contents
- Keystrokes
- Screenshots
- Personal documents
- Browser history (only active connections)
- Passwords or credentials

All data is transmitted securely over HTTPS with TLS encryption.

## Service Management

### Linux (systemd)

```bash
# View status
sudo systemctl status it-monitoring-agent

# View logs
sudo journalctl -u it-monitoring-agent -f

# Restart service
sudo systemctl restart it-monitoring-agent

# Stop service
sudo systemctl stop it-monitoring-agent

# Disable service
sudo systemctl disable it-monitoring-agent
```

### macOS (LaunchAgent)

```bash
# View status
launchctl list | grep com.company.it-monitoring-agent

# View logs
tail -f /usr/local/it-monitoring-agent/agent.log

# Restart service
launchctl unload ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist
launchctl load ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist

# Stop service
launchctl unload ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist
```

### Windows (Service)

```powershell
# View status
Get-Service -Name ITMonitoringAgent

# View logs
Get-Content "C:\Program Files\ITMonitoringAgent\monitoring_agent.log" -Tail 50

# Restart service
Restart-Service -Name ITMonitoringAgent

# Stop service
Stop-Service -Name ITMonitoringAgent
```

## Troubleshooting

### Agent Won't Start

1. Check if Python 3 is installed: `python3 --version` or `python --version`
2. Check if dependencies are installed: `pip3 list | grep psutil`
3. Check configuration file: Ensure `config.json` has valid token and URLs
4. Check logs for specific error messages

### Registration Fails

- **Token Expired**: Registration tokens expire after 5 minutes. Generate a new token from the web portal.
- **Network Issues**: Ensure the system can reach the backend URL.
- **Invalid Token**: Ensure the token was copied correctly.

### No Telemetry Data

1. Check if agent service is running
2. Check network connectivity to backend
3. Check API key configuration (after registration)
4. Review agent logs for errors

### High Resource Usage

The agent is designed to be lightweight, but if you experience high resource usage:

1. Increase `polling_interval` in config.json (default: 60 seconds)
2. Reduce monitored directories
3. Check for network issues causing retry loops

## Uninstallation

### Linux

```bash
sudo systemctl stop it-monitoring-agent
sudo systemctl disable it-monitoring-agent
sudo rm /etc/systemd/system/it-monitoring-agent.service
sudo rm -rf /opt/it-monitoring-agent
sudo systemctl daemon-reload
```

### macOS

```bash
launchctl unload ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist
rm ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist
sudo rm -rf /usr/local/it-monitoring-agent
```

### Windows

```powershell
# Stop and remove service
python "C:\Program Files\ITMonitoringAgent\service_wrapper.py" stop
python "C:\Program Files\ITMonitoringAgent\service_wrapper.py" remove

# Delete installation directory
Remove-Item -Path "C:\Program Files\ITMonitoringAgent" -Recurse -Force
```

## Building Custom Installers

For administrators who want to customize the installation:

### Creating a Self-Contained Linux Package

```bash
# Create a package directory
mkdir agent-package
cd agent-package

# Copy agent script and installer
cp ../agent/monitoring_agent.py .
cp monitoring_agent_installer.sh .

# Create tarball
tar -czf it-monitoring-agent-linux.tar.gz *

# Users can extract and run:
# tar -xzf it-monitoring-agent-linux.tar.gz
# sudo ./monitoring_agent_installer.sh
```

### Creating Windows EXE (using PyInstaller)

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --windowed --icon=agent.ico monitoring_agent_installer.py

# Output will be in dist/monitoring_agent_installer.exe
```

## Support

For issues or questions:
- Check the monitoring dashboard for agent status
- Review agent logs
- Contact IT Support with agent ID and hostname

## Configuration Reference

### config.json Fields

```json
{
  "backend_url": "Backend telemetry endpoint URL",
  "registration_url": "Backend registration endpoint URL",
  "registration_token": "One-time token for registration (cleared after use)",
  "api_key": "API key for telemetry (set after registration)",
  "agent_id": "Unique agent identifier (set after registration)",
  "hostname": "System hostname",
  "polling_interval": "Seconds between telemetry transmissions (default: 60)",
  "monitored_directories": "Array of directory paths to monitor for file events",
  "log_level": "Logging level (DEBUG, INFO, WARNING, ERROR)",
  "retry_attempts": "Number of retry attempts for failed transmissions",
  "retry_backoff": "Seconds to wait between retries",
  "local_cache_file": "Path to cache file for offline telemetry"
}
```

## Security Best Practices

1. **Token Security**: Never share registration tokens. They expire after 5 minutes.
2. **HTTPS Only**: Ensure all communication uses HTTPS in production.
3. **Least Privilege**: Agent runs with minimum required privileges.
4. **Audit Logs**: All agent activity is logged for audit purposes.
5. **Data Retention**: Telemetry data is automatically purged after 30 days.

## License

Copyright © 2024 Your Company. All rights reserved.




