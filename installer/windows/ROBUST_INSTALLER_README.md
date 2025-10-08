# Robust Windows PowerShell Installer - Documentation

## Overview

This is a **production-ready, enterprise-grade** PowerShell installer for the IT Management Monitoring Agent. It addresses all known issues with fragile installation scripts and provides a robust, automated installation experience.

## ✨ Key Improvements Over Previous Version

### 1. **Automatic Agent Download** ✅
- Supports `-AgentUrl` parameter for automatic download
- Falls back to local file search
- Proper error handling if agent not found

### 2. **Robust Python Detection** ✅
- Tries `python`, `py` launcher, and common install paths
- Validates Python version (minimum 3.7)
- Clear error messages with instructions

### 3. **Reliable Dependency Installation** ✅
- Uses `python -m pip` for all operations
- Automatic pip upgrade
- Retry logic with configurable attempts
- Quiet mode to reduce noise
- Package verification after installation

### 4. **NSSM-Based Service Creation** ✅
- Uses NSSM (Non-Sucking Service Manager) for reliable service management
- Automatic NSSM download if not present
- Falls back to sc.exe/pywin32 if NSSM unavailable
- Proper stdout/stderr logging
- Service auto-restart on failure
- Log rotation built-in

### 5. **Comprehensive Logging** ✅
- Full transcript logging to file
- Color-coded console output
- Timestamp on every action
- Detailed error messages
- Post-install log file preserved

### 6. **Automated Portal Launch** ✅
- Prompts user to open IT Management Portal
- Uses default browser
- Skippable in silent mode

### 7. **Unattended Installation** ✅
- Fully supports silent/automated deployment
- All parameters can be passed via command line
- No user interaction required in silent mode
- Perfect for GPO/SCCM deployment

### 8. **Security Enhancements** ✅
- Restrictive ACLs on config file
- TLS 1.2 enforced for downloads
- Warning about plaintext token storage
- Recommendation for encryption

### 9. **Professional UX** ✅
- Progress indicators with step numbers
- Clear success/warning/error messages
- Comprehensive installation summary
- Helpful next steps
- Useful command reference

## 🚀 Usage Examples

### Interactive Installation (Default)

```powershell
.\Install-ITMonitoringAgent.ps1
```

This will:
- Use default backend URL
- Prompt for user confirmation
- Show all progress
- Offer to open portal at the end

### Unattended Installation with Token

```powershell
.\Install-ITMonitoringAgent.ps1 `
    -BackendUrl "https://itmanagement.company.com/api/monitoring/events" `
    -RegistrationUrl "https://itmanagement.company.com/api/monitoring/register" `
    -RegistrationToken "abc123xyz789" `
    -Silent
```

### Installation with Agent Download

```powershell
.\Install-ITMonitoringAgent.ps1 `
    -AgentUrl "https://itmanagement.company.com/downloads/monitoring_agent.py" `
    -RegistrationToken "token123" `
    -Silent
```

### Custom Installation Path

```powershell
.\Install-ITMonitoringAgent.ps1 `
    -InstallPath "D:\ITMonitoring" `
    -PollingInterval 30 `
    -SkipPortalLaunch
```

### Enterprise Deployment (GPO/SCCM)

```powershell
PowerShell.exe -ExecutionPolicy Bypass -File "\\server\share\Install-ITMonitoringAgent.ps1" `
    -BackendUrl "https://backend.company.com/api" `
    -RegistrationToken "%TOKEN%" `
    -Silent
```

## 📋 Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `BackendUrl` | String | No | https://itmanagement.company.com/api/monitoring/events | Backend API URL for telemetry |
| `RegistrationUrl` | String | No | https://itmanagement.company.com/api/monitoring/register | Agent registration endpoint |
| `RegistrationToken` | String | No | (empty) | One-time registration token |
| `AgentUrl` | String | No | (empty) | URL to download monitoring_agent.py |
| `InstallPath` | String | No | C:\Program Files\ITMonitoringAgent | Installation directory |
| `PollingInterval` | Int | No | 60 | Telemetry collection interval (seconds) |
| `Silent` | Switch | No | False | Run without user prompts |
| `SkipPortalLaunch` | Switch | No | False | Don't open portal after install |

## 🔧 Technical Details

### Python Detection Logic

1. Try `python --version`
2. Try `py --version` (Python launcher)
3. Check common installation paths:
   - `C:\Python310\python.exe`
   - `C:\Python39\python.exe`
   - `C:\Python38\python.exe`
   - `C:\Python37\python.exe`
   - `%LOCALAPPDATA%\Programs\Python\...\python.exe`

### Dependency Installation

Packages installed:
- `psutil>=5.9.0` - System monitoring
- `requests>=2.28.0` - HTTP communication
- `watchdog>=2.1.9` - File system monitoring
- `pywin32>=304` - Windows service support

Installation method:
```powershell
python -m pip install <package> --quiet --disable-pip-version-check
```

With retry logic (3 attempts, 5-second delay).

### Service Creation with NSSM

NSSM is downloaded from: https://nssm.cc/release/nssm-2.24.zip

Service configuration:
- **Name:** ITMonitoringAgent
- **Display Name:** IT Management Monitoring Agent
- **Startup Type:** Automatic
- **Working Directory:** Installation path
- **Stdout Log:** `logs\service.log`
- **Stderr Log:** `logs\service_error.log`
- **Log Rotation:** Enabled (10MB max)
- **Failure Recovery:** Restart after 60 seconds

### Fallback to sc.exe

If NSSM unavailable, falls back to:
```powershell
python service_wrapper.py install
sc.exe config ITMonitoringAgent start= auto
sc.exe failure ITMonitoringAgent reset= 86400 actions= restart/60000/restart/60000/restart/60000
```

### Configuration File

Generated `config.json`:
```json
{
  "backend_url": "...",
  "registration_url": "...",
  "registration_token": "...",
  "api_key": null,
  "agent_id": null,
  "hostname": "COMPUTER-NAME",
  "polling_interval": 60,
  "monitored_directories": [],
  "log_level": "INFO",
  "retry_attempts": 3,
  "retry_backoff": 5,
  "local_cache_file": "C:\\...\\cache\\telemetry_cache.json"
}
```

ACLs set to: SYSTEM and Administrators only.

## 📊 Installation Flow

```
[1] Prerequisites Check
    ├── Administrator privileges
    ├── Windows 10/11 validation
    └── Disk space check (500 MB)
          ↓
[2] Python Detection
    ├── Find Python executable
    └── Validate version >= 3.7
          ↓
[3] Directory Creation
    ├── Create install directory
    └── Create logs/ and cache/ subdirs
          ↓
[4] Agent Acquisition
    ├── Check local file
    ├── Download from URL (if provided)
    └── Verify file exists
          ↓
[5] File Operations
    ├── Copy service_wrapper.py
    ├── Copy requirements.txt
    └── Copy documentation files
          ↓
[6] Dependency Installation
    ├── Upgrade pip
    ├── Install psutil, requests, watchdog, pywin32
    └── Verify imports
          ↓
[7] Configuration
    ├── Generate config.json
    └── Set restrictive ACLs
          ↓
[8] Service Cleanup
    └── Remove existing service (if present)
          ↓
[9] NSSM Acquisition
    ├── Check if NSSM exists
    └── Download and extract if needed
          ↓
[10] Service Creation
    ├── Try NSSM method
    └── Fallback to sc.exe if needed
          ↓
[11] Firewall Configuration
    └── Add outbound HTTPS rule
          ↓
[12] Service Start
    ├── Start service
    ├── Verify status
    └── Display summary
          ↓
[13] Post-Installation
    ├── Show installation summary
    ├── Prompt to open portal
    └── Save installation log
```

## 🐛 Troubleshooting

### Installation Fails: "Python not found"

**Problem:** Python 3.7+ not installed or not in PATH

**Solution:**
```powershell
# Download Python from python.org
winget install Python.Python.3.10

# Or use Chocolatey
choco install python

# Then run installer again
```

### Installation Fails: "Failed to install Python dependencies"

**Problem:** Network issues, corporate proxy, or pip not working

**Solutions:**

1. **Configure proxy** (if behind corporate proxy):
```powershell
$env:HTTP_PROXY="http://proxy.company.com:8080"
$env:HTTPS_PROXY="http://proxy.company.com:8080"
.\Install-ITMonitoringAgent.ps1
```

2. **Install dependencies manually**:
```powershell
python -m pip install --upgrade pip
python -m pip install psutil requests watchdog pywin32
```

3. **Check firewall**:
```powershell
# Temporarily disable to test
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
# Run installer
# Re-enable
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

### Service Won't Start

**Check logs:**
```powershell
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log" -Tail 50
```

**Check service status:**
```powershell
Get-Service ITMonitoringAgent | Format-List *
```

**Try manual start:**
```powershell
cd "C:\Program Files\ITMonitoringAgent"
python monitoring_agent.py
```

### Agent Not Appearing in Portal

**Checklist:**
1. Service running? `Get-Service ITMonitoringAgent`
2. Network connectivity? `Test-NetConnection backend.company.com -Port 443`
3. Registration token provided? Check `config.json`
4. Wait 2-3 minutes for initial registration
5. Check agent logs for errors

### NSSM Download Fails

**Problem:** Cannot download NSSM from nssm.cc

**Solution:** Download NSSM manually and place in PATH:
```powershell
# Download from: https://nssm.cc/download
# Extract nssm.exe to C:\Windows\System32\
# Or place in script directory
```

Or use fallback:
```powershell
# Installer will automatically fallback to sc.exe method
```

## 🔒 Security Considerations

### Registration Token Storage

⚠️ **Warning:** Registration tokens are stored in plaintext in `config.json`

**Recommendations:**
1. Use short-lived tokens (5-minute expiry)
2. Token is cleared after successful registration
3. For production, consider:
   - Windows DPAPI encryption
   - Azure Key Vault integration
   - Token passed only at runtime

### Network Security

✅ **Implemented:**
- TLS 1.2 enforced for all downloads
- HTTPS for backend communication
- Firewall rules only allow outbound connections

**Recommendations:**
- Use TLS/mTLS for backend communication
- Implement certificate pinning
- Use VPN or private network for agent-backend traffic

### File Permissions

✅ **Implemented:**
- Config file: SYSTEM and Administrators only
- Installation directory: Standard Program Files ACLs
- Service runs as Local System

**Considerations:**
- Service runs with elevated privileges (required for monitoring)
- Config file protected from standard users
- Logs directory writable by service

## 📦 Deployment Scenarios

### Scenario 1: Manual Installation by End User

```powershell
# User downloads installer from IT Portal
# Right-click PowerShell script → Run with PowerShell
# Follow prompts
```

### Scenario 2: GPO Deployment

1. **Create shared network location:**
```
\\fileserver\IT\MonitoringAgent\
    ├── Install-ITMonitoringAgent.ps1
    ├── monitoring_agent.py
    ├── service_wrapper.py
    ├── requirements.txt
    └── README.txt
```

2. **Create GPO with startup script:**
```powershell
PowerShell.exe -ExecutionPolicy Bypass -File "\\fileserver\IT\MonitoringAgent\Install-ITMonitoringAgent.ps1" -BackendUrl "https://backend.company.com/api" -RegistrationToken "%RANDOM_TOKEN%" -Silent
```

3. **Link GPO to target OUs**

### Scenario 3: SCCM/Intune Deployment

**Application Definition:**
- **Install Command:**
```powershell
PowerShell.exe -ExecutionPolicy Bypass -File ".\Install-ITMonitoringAgent.ps1" -Silent -RegistrationToken "%TOKEN%"
```

- **Uninstall Command:**
```powershell
PowerShell.exe -ExecutionPolicy Bypass -Command "Stop-Service ITMonitoringAgent; sc.exe delete ITMonitoringAgent; Remove-Item 'C:\Program Files\ITMonitoringAgent' -Recurse -Force"
```

- **Detection Method:**
```powershell
Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"
```

- **Return Codes:**
  - `0` = Success
  - `1` = Failure

### Scenario 4: Automated Script with Token Generation

```powershell
# Generate token via API
$token = Invoke-RestMethod -Uri "https://backend.company.com/api/auth/agent-token" `
    -Method Post `
    -Headers @{Authorization = "Bearer $adminToken"} `
    -Body (@{hostname = $env:COMPUTERNAME} | ConvertTo-Json) `
    | Select-Object -ExpandProperty token

# Run installer with token
.\Install-ITMonitoringAgent.ps1 -RegistrationToken $token -Silent
```

## 📝 Logging

### Installation Log

Location: `%TEMP%\installation_YYYYMMDD_HHMMSS.log`

Contains:
- All installation steps
- Success/warning/error messages
- Timestamps
- Command outputs
- Error details

### Service Logs

Location: `C:\Program Files\ITMonitoringAgent\logs\`

Files:
- `service.log` - Stdout from agent
- `service_error.log` - Stderr from agent
- `monitoring_agent.log` - Agent's own logging

Rotation: Automatic at 10MB

### Viewing Logs

```powershell
# View installation log
Get-Content "$env:TEMP\installation_*.log" | Select-Object -Last 100

# View service logs
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 50 -Wait

# View errors only
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log" -Tail 50
```

## ✅ Verification Checklist

After installation, verify:

- [ ] Service exists: `Get-Service ITMonitoringAgent`
- [ ] Service is running: `(Get-Service ITMonitoringAgent).Status -eq 'Running'`
- [ ] Files installed: `Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"`
- [ ] Config exists: `Test-Path "C:\Program Files\ITMonitoringAgent\config.json"`
- [ ] Logs being written: `Get-Item "C:\Program Files\ITMonitoringAgent\logs\service.log"`
- [ ] No errors in error log: `Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log"`
- [ ] Computer appears in IT Portal within 3 minutes
- [ ] Telemetry flowing: Check portal for latest data

## 🎓 Advanced Usage

### Custom Backend Configuration

```powershell
.\Install-ITMonitoringAgent.ps1 `
    -BackendUrl "https://custom-backend.company.com/api/monitoring/events" `
    -RegistrationUrl "https://custom-backend.company.com/api/monitoring/register" `
    -PollingInterval 30 `
    -RegistrationToken "custom-token"
```

### Install to Custom Location

```powershell
.\Install-ITMonitoringAgent.ps1 `
    -InstallPath "D:\CustomPath\ITMonitoring"
```

### Debug Mode (Manual Steps)

```powershell
# Run with verbose output
$VerbosePreference = "Continue"
.\Install-ITMonitoringAgent.ps1 -Verbose

# Or run interactively to see all output
.\Install-ITMonitoringAgent.ps1
```

## 📞 Support

### Self-Service Diagnostics

```powershell
# Check service
Get-Service ITMonitoringAgent | Format-List *

# View recent logs
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 100

# Test Python
python -c "import psutil, requests, watchdog, win32service; print('All packages OK')"

# Check config
Get-Content "C:\Program Files\ITMonitoringAgent\config.json" | ConvertFrom-Json | Format-List
```

### Contact IT Support

- **Email:** support@company.com
- **Portal:** https://itmanagement.company.com
- **Phone:** Extension 5555

**When reporting issues, include:**
- Installation log from `%TEMP%\installation_*.log`
- Service error log
- Windows version: `systeminfo | findstr /B /C:"OS Name" /C:"OS Version"`
- Python version: `python --version`

## 🔄 Updates and Maintenance

### Updating the Agent

Simply run the installer again with the updated `monitoring_agent.py`:

```powershell
.\Install-ITMonitoringAgent.ps1 -Silent
```

The installer will:
- Stop the existing service
- Replace files
- Restart the service

### Changing Configuration

```powershell
# Edit config
notepad "C:\Program Files\ITMonitoringAgent\config.json"

# Restart service
Restart-Service ITMonitoringAgent
```

### Uninstalling

```powershell
# Stop and remove service
Stop-Service ITMonitoringAgent
sc.exe delete ITMonitoringAgent

# Remove files
Remove-Item "C:\Program Files\ITMonitoringAgent" -Recurse -Force

# Remove firewall rules
Remove-NetFirewallRule -DisplayName "IT Monitoring Agent"
```

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready  

For the latest version and updates, visit the IT Management Portal.



