# Activity Monitor Agent

A lightweight Windows service that monitors user activity and reports to the IT Management backend.

## Features

- **Network Usage Tracking**: Monitors upload/download bandwidth
- **Browser History**: Collects visited websites from Chrome and Edge
- **System Status**: CPU, memory, disk usage, uptime, idle time
- **Application Usage**: Tracks active applications and windows
- **File Transfers**: Monitors file copy/move operations
- **Logged Accounts**: Detects browser profiles and email accounts
- **External Connections**: Tracks outbound network connections

## Installation

### Prerequisites

- Windows 10 or later
- Python 3.8 or later
- Administrator privileges

### Quick Install

1. **Run the installer as Administrator**:
   ```
   Right-click install_activity_agent.bat → Run as Administrator
   ```

2. **Enter configuration details** when prompted:
   - Server URL (e.g., `https://your-server.com/api/activity-monitor`)
   - Agent Token (obtain from IT Management admin panel)
   - User ID (your user ID in the system)

3. The installer will:
   - Install Python dependencies
   - Create configuration file
   - Install as Windows service
   - Start the service automatically

### Manual Installation

If you prefer manual installation:

```bash
# Install dependencies
pip install -r activity_agent_requirements.txt

# Create configuration file
# Edit agent_config.json with your settings

# Install as service
python install_service.py install

# Start service
net start ActivityMonitorAgent
```

## Configuration

The agent is configured via `agent_config.json`:

```json
{
  "server_url": "https://your-server.com/api/activity-monitor",
  "agent_token": "your-agent-token",
  "user_id": "your-user-id",
  "system_name": "COMPUTER-NAME",
  "report_interval": 300,
  "enable_browser_history": true,
  "enable_file_monitoring": true,
  "enable_network_monitoring": true,
  "max_cache_size": 100
}
```

### Configuration Options

- `server_url`: Backend API endpoint
- `agent_token`: Authentication token for the agent
- `user_id`: User ID in the IT Management system
- `system_name`: Computer name (auto-detected)
- `report_interval`: Reporting interval in seconds (default: 300 = 5 minutes)
- `enable_browser_history`: Enable/disable browser history collection
- `enable_file_monitoring`: Enable/disable file transfer monitoring
- `enable_network_monitoring`: Enable/disable network usage tracking
- `max_cache_size`: Maximum number of cached reports when offline

## Usage

### As Windows Service (Recommended)

```bash
# Start service
net start ActivityMonitorAgent

# Stop service
net stop ActivityMonitorAgent

# Check service status
sc query ActivityMonitorAgent
```

### Manual Mode (for testing)

```bash
python activity_monitor_agent.py
```

Press Ctrl+C to stop.

## Uninstallation

Run the uninstaller as Administrator:

```
Right-click uninstall_activity_agent.bat → Run as Administrator
```

Or manually:

```bash
# Stop service
net stop ActivityMonitorAgent

# Remove service
python install_service.py remove
```

## Data Collection

### Network Usage
- Tracks bytes sent/received per reporting interval
- Counts active network connections
- Does NOT capture packet contents

### Browser History
- Reads Chrome and Edge history databases
- Only collects URLs visited during reporting interval
- Limited to last 100 visits per browser

### System Status
- CPU usage percentage
- Memory usage and available memory
- Disk usage
- System uptime
- User idle time
- Count of active applications

### Application Usage
- Lists visible windows and their processes
- Window titles
- Active/foreground application
- Does NOT capture screenshots or keystrokes

### File Transfers
- Monitors file copy/move operations
- Logs file name, size, destination
- Tracks USB, network, and cloud transfers

### Logged Accounts
- Detects browser profiles (Chrome, Edge)
- Reads Outlook account information from registry
- Does NOT capture passwords

### External Connections
- Lists established connections to external IPs
- Excludes local network (192.168.x.x, 10.x.x.x)
- Includes geolocation of remote IP
- Connection protocol and status

## Logs

Logs are written to:
- `activity_agent.log` - Agent activity log
- `service.log` - Windows service log

## Security

- All communication with server uses HTTPS
- Agent token authentication
- No sensitive data (passwords, keystrokes) collected
- Browser history databases are read-only
- Cached data stored locally in JSON format

## Troubleshooting

### Service won't start

1. Check that Python is in system PATH
2. Verify agent_config.json is valid
3. Check service.log for errors
4. Ensure agent_token is correct

### No data appearing in dashboard

1. Verify server_url is correct
2. Check agent_token is valid
3. Ensure user_id matches your account
4. Check network connectivity
5. Review activity_agent.log

### Browser history not collected

1. Ensure Chrome/Edge is closed when collection runs
2. Check file permissions on browser profile folder
3. Verify `enable_browser_history` is true

### High resource usage

1. Increase `report_interval` to reduce frequency
2. Disable features you don't need
3. Check for multiple instances running

## Privacy Notice

This agent is designed for workplace monitoring in compliance with company policies. By installing this software, you acknowledge that:

- Your computer activity is being monitored
- Data is transmitted to your organization's IT Management system
- Monitoring is for security and productivity purposes
- All data is handled according to company privacy policies

## Support

For technical support, contact your IT administrator or refer to the IT Management System documentation.

## Version

Current Version: 1.0.0

## License

Proprietary - For use only with authorized IT Management systems.

