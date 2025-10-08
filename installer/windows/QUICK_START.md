# IT Monitoring Agent - Windows Installer Quick Start

## 🚀 Quick Start (5 Minutes)

### For Developers - Building the Installer

1. **Install NSIS** (one-time setup)
   ```
   Download from: https://nsis.sourceforge.io/Download
   Run installer with defaults
   ```

2. **Build the installer**
   ```batch
   cd installer\windows
   build.bat
   ```

3. **Test it!**
   - Right-click `ITMonitoringAgent-Setup-1.0.0.exe`
   - Select "Run as Administrator"
   - Follow the wizard

### For End Users - Installing the Agent

1. **Download** the installer from IT Management Portal
2. **Right-click** the downloaded file → "Run as Administrator"
3. **Click Next** through the wizard
4. **Click Finish** (portal opens automatically)
5. **Login** to the IT Management Portal
6. **Done!** Your computer is now monitored

## 📋 What to Expect

### During Installation (2-3 minutes)

The installer will:
- ✅ Check Windows version (requires 10/11)
- ✅ Install Python (if not already installed)
- ✅ Install monitoring agent
- ✅ Create Windows service
- ✅ Start monitoring automatically

### After Installation

- Service runs in background (no visible windows)
- Agent starts automatically on boot
- Data sent securely to IT Management backend
- View your computer in IT Portal → Monitoring section

## 🎯 Testing the Installation

### Method 1: Check Windows Services

1. Press `Win+R`
2. Type: `services.msc`
3. Press Enter
4. Look for "IT Management Monitoring Agent"
5. Status should be "Running"

### Method 2: Use Test Script

```powershell
cd installer\windows
.\test_installer.ps1 -CheckStatus
```

Should show:
```
✓ Service exists
  Status: Running
✓ Installation directory exists
✓ Configuration found
  Agent ID: ✓ Registered
```

### Method 3: Check IT Portal

1. Open browser
2. Go to IT Management Portal
3. Login with your credentials
4. Click "Monitoring" in sidebar
5. Your computer should appear in the list

## 🔧 Common Tasks

### View Logs

**Option 1 - File Explorer:**
```
C:\Program Files\ITMonitoringAgent\logs\
```

**Option 2 - PowerShell:**
```powershell
.\test_installer.ps1 -ViewLogs
```

### Restart Service

```powershell
Restart-Service ITMonitoringAgent
```

### Check Configuration

```powershell
notepad "C:\Program Files\ITMonitoringAgent\config.json"
```

### Uninstall

**Option 1 - Control Panel:**
1. Control Panel → Programs and Features
2. Find "IT Management Monitoring Agent"
3. Click Uninstall

**Option 2 - Start Menu:**
1. Start Menu
2. IT Management Monitoring Agent folder
3. Click "Uninstall"

**Option 3 - PowerShell:**
```powershell
.\test_installer.ps1 -Uninstall
```

## 🚨 Troubleshooting

### Problem: "Service won't start"

**Solution:**
```powershell
# Check logs
Get-Content "C:\Program Files\ITMonitoringAgent\logs\*.log" -Tail 50

# Verify Python
python --version

# Reinstall dependencies
cd "C:\Program Files\ITMonitoringAgent"
python -m pip install -r requirements.txt
```

### Problem: "Computer doesn't appear in portal"

**Check:**
1. Service is running: `Get-Service ITMonitoringAgent`
2. Network connectivity to backend
3. Agent has registered (check logs for "registered successfully")
4. Wait 2-3 minutes for initial telemetry

### Problem: "Python installation failed"

**Solution:**
```
1. Uninstall the agent
2. Download Python from python.org
3. Install Python (check "Add to PATH")
4. Run agent installer again
```

## 📊 What Gets Monitored

### System Metrics (every 60 seconds)
- CPU usage
- RAM usage
- Disk usage
- Network activity

### Processes
- Running applications
- Resource consumption
- Process details

### Network
- Bandwidth usage
- Connection data
- Active connections

### Files (optional)
- File operations in monitored directories
- Metadata only (no file contents)

## 🔒 Privacy & Security

### What is Collected:
✅ System performance data
✅ Process names and resource usage
✅ Network connection metadata
✅ File operation metadata

### What is NOT Collected:
❌ File contents or documents
❌ Keystrokes or screenshots
❌ Passwords or credentials
❌ Personal browsing history

All data transmitted via HTTPS encryption.

## 🎓 Advanced Usage

### Silent Installation

For IT administrators deploying via GPO or SCCM:

```batch
REM Basic silent install
ITMonitoringAgent-Setup.exe /S

REM With registration token
ITMonitoringAgent-Setup.exe /S /Token="your-token-here"

REM With custom backend
ITMonitoringAgent-Setup.exe /S /BackendURL="https://custom.com/api"
```

### Manual Service Management

```powershell
# Check status
Get-Service ITMonitoringAgent

# Start
Start-Service ITMonitoringAgent

# Stop
Stop-Service ITMonitoringAgent

# Restart
Restart-Service ITMonitoringAgent

# View startup type
Get-Service ITMonitoringAgent | Select-Object Name, StartType, Status
```

### Configuration Changes

After editing config, restart service:

```powershell
# Edit config
notepad "C:\Program Files\ITMonitoringAgent\config.json"

# Restart to apply changes
Restart-Service ITMonitoringAgent

# Verify changes took effect
.\test_installer.ps1 -CheckStatus
```

### Test Telemetry

Send a test telemetry packet:

```powershell
.\test_installer.ps1 -SimulateTelemetry
```

Should output:
```
✓ Telemetry submitted successfully!
  Alerts triggered: 0
```

## 📞 Getting Help

### Self-Service

1. **Check logs**
   ```
   C:\Program Files\ITMonitoringAgent\logs\
   ```

2. **Run diagnostics**
   ```powershell
   .\test_installer.ps1 -TestMode
   ```

3. **Review documentation**
   - INSTALLER_README.md (detailed guide)
   - README.txt (user guide)

### IT Support

- Email: support@company.com
- Portal: https://itmanagement.company.com
- Internal Extension: 5555

### Report Issues

Include this information:
- Windows version
- Service status: `Get-Service ITMonitoringAgent`
- Recent logs (last 50 lines)
- Error messages
- When the issue started

## ✅ Installation Checklist

Before contacting support, verify:

- [ ] Windows 10 or 11 (64-bit)
- [ ] Administrator privileges
- [ ] Internet connectivity
- [ ] Service is installed
- [ ] Service is running
- [ ] Configuration file exists
- [ ] Logs show no errors
- [ ] Can reach backend URL
- [ ] Waited 2-3 minutes for initial sync

## 🔄 Updates

### How Updates Work

1. New installer released
2. Download from IT Portal
3. Run installer (will upgrade existing)
4. Service restarts automatically
5. Done!

### Checking Version

```powershell
# Check installed version
Get-ItemProperty "C:\Program Files\ITMonitoringAgent\monitoring_agent.py" | Select-Object VersionInfo

# Or check in portal
# IT Portal → Monitoring → Your Computer → Agent Version
```

## 🎉 Success!

If you see your computer in the IT Management Portal under "Monitoring", everything is working correctly!

**Next Steps:**
1. Explore the monitoring dashboard
2. View your system metrics
3. Check for any alerts
4. Customize monitoring settings (optional)

---

**Need help?** Contact IT Support or visit the IT Management Portal.

**Last Updated:** 2024
**Version:** 1.0.0




