# IT Monitoring Agent (Go)

A lightweight cross-platform endpoint monitoring agent that collects system metrics, process information, file events, and network activity.

## Features

- **System Metrics**: CPU, RAM, Disk usage, Uptime
- **Process Monitoring**: Track running processes with CPU/memory usage
- **File System Monitoring**: Watch configured directories for file operations
- **Network Monitoring**: Monitor established network connections
- **Network Context Detection**: Detect VPN, public IP, Wi-Fi SSID
- **Domain Access Tracking**: Extract and report visited domains/IPs
- **Privacy-Focused**: No file contents, no keystrokes, metadata only

## Building the Agent

### Prerequisites
- Go 1.21 or later

### Build Instructions

**Windows:**
```bash
cd monitoring/agent-go
go mod download
go build -o monitoring-agent.exe main.go
```

**Linux:**
```bash
cd monitoring/agent-go
go mod download
go build -o monitoring-agent main.go
```

**macOS:**
```bash
cd monitoring/agent-go
go mod download
go build -o monitoring-agent main.go
```

### Cross-Compilation

Build for all platforms from any OS:

```bash
# Windows
GOOS=windows GOARCH=amd64 go build -o monitoring-agent-windows.exe main.go

# Linux
GOOS=linux GOARCH=amd64 go build -o monitoring-agent-linux main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o monitoring-agent-macos main.go
```

## Configuration

Create `config.json` in the same directory as the agent:

```json
{
  "agent_id": "unique-agent-id",
  "backend_url": "https://your-backend.com/api/monitoring/events",
  "api_key": "your-api-key-here",
  "polling_interval": 60,
  "watched_directories": [
    "/home/user/Desktop",
    "/home/user/Documents",
    "/home/user/Downloads"
  ],
  "log_level": "INFO"
}
```

**Configuration Options:**

- `agent_id`: Unique identifier for this agent (auto-generated if not provided)
- `backend_url`: URL of the monitoring backend telemetry endpoint
- `api_key`: API key for authentication (get from backend settings)
- `polling_interval`: Seconds between telemetry reports (default: 60)
- `watched_directories`: Directories to monitor for file operations
- `log_level`: Logging verbosity (DEBUG, INFO, WARNING, ERROR)

## Running the Agent

### Standard Mode
```bash
./monitoring-agent --config config.json
```

### Development Mode (Simulate Data)
```bash
./monitoring-agent --config config.json --dev
```

Development mode simulates telemetry data without actually collecting system information. Useful for testing the backend.

### Run as Service

#### Linux (systemd)

Create `/etc/systemd/system/it-monitoring-agent.service`:

```ini
[Unit]
Description=IT Monitoring Agent
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/monitoring-agent
ExecStart=/opt/monitoring-agent/monitoring-agent --config /opt/monitoring-agent/config.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable it-monitoring-agent
sudo systemctl start it-monitoring-agent
sudo systemctl status it-monitoring-agent
```

#### Windows (Service)

Use [NSSM](https://nssm.cc/) (Non-Sucking Service Manager):

```cmd
nssm install ITMonitoringAgent "C:\Program Files\ITMonitoring\monitoring-agent.exe" --config "C:\Program Files\ITMonitoring\config.json"
nssm start ITMonitoringAgent
```

#### macOS (launchd)

Create `~/Library/LaunchAgents/com.itmanagement.monitoring-agent.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.itmanagement.monitoring-agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/monitoring-agent</string>
        <string>--config</string>
        <string>/usr/local/etc/monitoring-agent/config.json</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.itmanagement.monitoring-agent.plist
```

## Telemetry Data

The agent collects and sends the following data:

### Metrics
- OS type and version
- CPU model, cores, and usage percentage
- RAM total, used, and usage percentage
- Disk total, used, and usage percentage
- System uptime
- Battery percentage (laptops)

### Network Context
- Local IP address
- Public IP address
- VPN status (detected via network interfaces)
- Wi-Fi SSID (if connected)

### Processes
- PID, name, executable path
- Command line
- Username
- CPU and memory usage
- Process status

### File Events
- File path
- Operation (create, modify, delete, rename)
- File size
- Timestamp

### Network Connections
- Process ID and name
- Protocol (TCP/UDP)
- Local and remote addresses/ports
- Bytes sent/received

### Domain Access
- Domains/IPs accessed
- Frequency and bytes transferred
- Source (agent-detected)

## Privacy & Security

### What is NOT Collected
- File contents
- Keystrokes
- Screenshots
- Webcam/microphone data
- Passwords or credentials
- Personal communications

### Security Measures
- All communication over HTTPS
- API key authentication
- No local file storage of sensitive data
- Configurable data collection (can disable process/file/network monitoring)

### Compliance
Ensure you have proper consent and legal authorization before deploying monitoring agents. See `monitoring/docs/legal-template.md` for employee notification templates.

## Troubleshooting

### Agent Won't Start
1. Check configuration file exists and is valid JSON
2. Verify backend URL is accessible
3. Check API key is correct
4. Review logs for error messages

### No Data Appearing
1. Verify agent is running: `ps aux | grep monitoring-agent` (Linux/Mac) or Task Manager (Windows)
2. Check network connectivity to backend
3. Verify API key matches backend configuration
4. Check backend logs for incoming requests

### High CPU/Memory Usage
1. Increase polling interval (reduce frequency)
2. Disable file monitoring if not needed
3. Reduce number of watched directories
4. Check for large number of running processes

### Permission Errors
- Linux/Mac: Agent may need elevated privileges for some operations
- Windows: Run as Administrator for full process visibility

## Development

### Running Tests
```bash
go test ./...
```

### Adding Features
1. Modify `main.go` to add new collection logic
2. Update `Telemetry` struct to include new data
3. Rebuild and test
4. Update backend to handle new fields

### Debugging
Enable debug logging:
```json
{
  "log_level": "DEBUG"
}
```

## License

Part of IT Management Application - Enterprise Internal Use

