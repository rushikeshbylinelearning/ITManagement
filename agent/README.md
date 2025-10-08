# IT Management Monitoring Agent

## Quick Start Guide

### Prerequisites

- **Python 3.7 or later**
- **Internet connection** to backend server
- **Administrator/root privileges** (recommended for full monitoring capabilities)

### Installation

#### Linux

```bash
# Navigate to agent directory
cd agent

# Run installation script
chmod +x install.sh
./install.sh
```

#### Windows

```cmd
REM Navigate to agent directory
cd agent

REM Run installation script
install.bat
```

### Configuration

Edit `config.json`:

```json
{
  "backend_url": "https://yourdomain.com/api/monitoring/events",
  "api_key": "your-monitoring-api-key-from-backend",
  "hostname": "my-computer-name",
  "polling_interval": 60,
  "monitored_directories": [
    "C:\\Important\\Files",
    "/home/user/documents"
  ],
  "log_level": "INFO"
}
```

**Configuration Options:**

- `backend_url`: Full URL to monitoring API endpoint
- `api_key`: API key from backend (must match MONITORING_API_KEY in backend/.env)
- `hostname`: Custom hostname (leave null for auto-detection)
- `polling_interval`: Seconds between telemetry collections (default: 60)
- `monitored_directories`: Directories to watch for file events
- `log_level`: Logging verbosity (DEBUG, INFO, WARNING, ERROR)
- `retry_attempts`: Number of retry attempts for failed connections (default: 3)
- `retry_backoff`: Seconds between retry attempts (default: 5)

### Running the Agent

#### Manual Start

**Linux:**
```bash
./venv/bin/python3 monitoring_agent.py
```

**Windows:**
```cmd
venv\Scripts\python.exe monitoring_agent.py
```

#### Run as Service (Linux)

```bash
# Copy service file
sudo cp monitoring-agent.service /etc/systemd/system/

# Edit service file to update paths
sudo nano /etc/systemd/system/monitoring-agent.service

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable monitoring-agent

# Start service
sudo systemctl start monitoring-agent

# Check status
sudo systemctl status monitoring-agent

# View logs
sudo journalctl -u monitoring-agent -f
```

#### Run as Service (Windows)

1. **Install NSSM** (Non-Sucking Service Manager)
   - Download from: https://nssm.cc/download
   - Extract to a folder (e.g., `C:\nssm`)

2. **Install Service:**
   ```cmd
   C:\nssm\nssm.exe install MonitoringAgent
   ```

3. **Configure Service:**
   - Application Path: `C:\path\to\agent\venv\Scripts\python.exe`
   - Startup Directory: `C:\path\to\agent`
   - Arguments: `monitoring_agent.py`
   - Service Name: `MonitoringAgent`

4. **Start Service:**
   ```cmd
   nssm start MonitoringAgent
   ```

5. **Check Status:**
   ```cmd
   nssm status MonitoringAgent
   ```

6. **View Logs:**
   - Check `monitoring_agent.log` in agent directory

### Monitoring What the Agent Collects

The agent collects and sends the following data every polling interval:

#### System Metrics
- CPU: Model, core count, usage percentage
- RAM: Total, used, usage percentage
- Disk: Total, used, usage percentage
- OS: Operating system name and version
- Network: MAC address, IP address

#### Process Information
- Running processes with:
  - PID (Process ID)
  - Process name
  - User/owner
  - CPU usage
  - Memory usage
  - Start time
  - Command line

#### File Events (Real-time)
- File creation
- File modification
- File deletion
- For monitored directories only

#### Network Activity
- Active network connections
- Protocol (TCP/UDP)
- Local and remote addresses
- Bytes sent/received
- Associated process

### Logs

**Log File:** `monitoring_agent.log`

**Log Levels:**
- **DEBUG**: Detailed information for diagnosing problems
- **INFO**: General informational messages
- **WARNING**: Warning messages (non-critical issues)
- **ERROR**: Error messages (critical issues)

**View Logs:**

**Linux:**
```bash
tail -f monitoring_agent.log
```

**Windows:**
```cmd
type monitoring_agent.log
```

### Troubleshooting

#### Agent Won't Start

**Check Python version:**
```bash
python3 --version  # Linux
python --version   # Windows
```

**Verify dependencies:**
```bash
./venv/bin/pip list  # Linux
venv\Scripts\pip.exe list  # Windows
```

**Check configuration:**
```bash
cat config.json  # Linux
type config.json  # Windows
```

#### Connection Errors

**Test backend connectivity:**
```bash
curl -X GET https://yourdomain.com/api/monitoring/stats
```

**Verify API key:**
- Check that `api_key` in config.json matches backend `MONITORING_API_KEY`
- Ensure no extra spaces or special characters

**Check firewall:**
- Ensure outbound HTTPS (port 443) is allowed
- Check if backend URL is accessible

#### High CPU/Memory Usage

**Reduce polling frequency:**
```json
{
  "polling_interval": 120
}
```

**Limit monitored directories:**
```json
{
  "monitored_directories": []
}
```

#### Permission Errors

**Linux - Run with elevated privileges:**
```bash
sudo ./venv/bin/python3 monitoring_agent.py
```

**Windows - Run as Administrator:**
- Right-click on command prompt → "Run as administrator"

### Uninstalling

#### Stop and Remove Service

**Linux:**
```bash
sudo systemctl stop monitoring-agent
sudo systemctl disable monitoring-agent
sudo rm /etc/systemd/system/monitoring-agent.service
sudo systemctl daemon-reload
```

**Windows:**
```cmd
nssm stop MonitoringAgent
nssm remove MonitoringAgent confirm
```

#### Delete Agent Files

**Linux:**
```bash
cd ..
rm -rf agent
```

**Windows:**
```cmd
cd ..
rmdir /s agent
```

### Security Notes

1. **Protect your API key** - Store config.json securely
2. **Use HTTPS** - Always use encrypted connections in production
3. **Restrict file permissions** on config.json:
   ```bash
   chmod 600 config.json  # Linux
   ```
4. **Monitor logs regularly** for unauthorized access attempts
5. **Update dependencies** regularly:
   ```bash
   ./venv/bin/pip install --upgrade -r requirements.txt
   ```

### Advanced Configuration

#### Custom Agent ID

By default, the agent generates a unique ID based on hostname and MAC address. To use a custom ID:

```json
{
  "agent_id": "custom-unique-id-123"
}
```

#### Multiple Monitored Directories

```json
{
  "monitored_directories": [
    "/var/www/html",
    "/home/user/documents",
    "/etc/nginx",
    "C:\\inetpub\\wwwroot",
    "D:\\Projects"
  ]
}
```

#### Custom Cache File Location

```json
{
  "local_cache_file": "/var/cache/monitoring/telemetry_cache.json"
}
```

### Performance Tips

1. **Polling Interval**: Increase for lower resource usage (120-300 seconds recommended for non-critical systems)
2. **Directory Monitoring**: Only monitor necessary directories
3. **Log Level**: Use INFO or WARNING in production (avoid DEBUG)
4. **Network Limits**: Agent limits network connections to 50 per collection

### Getting Help

1. Check this README
2. Review `monitoring_agent.log`
3. Test backend connectivity
4. Verify configuration syntax
5. Check backend logs for errors

### Command Line Options

```bash
python monitoring_agent.py --help
python monitoring_agent.py --config /path/to/config.json
python monitoring_agent.py --generate-config
```

---

**Happy Monitoring! 🎯**




