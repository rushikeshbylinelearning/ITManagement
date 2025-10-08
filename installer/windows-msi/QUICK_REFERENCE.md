# IT Monitoring Agent MSI - Quick Reference Card

## 🚀 Quick Start

### Build MSI
```batch
cd installer\windows-msi
build.bat
```

### Install Agent
```batch
install.bat -backend http://your-server:5001
```

### Silent Install
```batch
msiexec.exe /i ITMonitoringAgent-1.0.0.msi ^
  BACKENDURL="http://your-server:5001" /quiet
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `Product.wxs` | WiX MSI configuration |
| `install_helper.bat` | Custom actions (replaces PowerShell) |
| `install_notifier.py` | Sends installation notification |
| `build.bat` | Builds the MSI |
| `install.bat` | Wrapper for easy installation |

---

## 🔧 Installation Sequence

1. **InstallFiles** - Copy files to `C:\Program Files\ITMonitoringAgent\`
2. **CreateConfig** - Generate `config.json`
3. **CreateService** - Create Windows service
4. **StartService** - Start the agent
5. **NotifyBackend** - Send installation notification

---

## 🌐 Backend Endpoints

### Installation Notification
```
POST /api/monitoring/agent/install-notify
```
**Payload:**
```json
{
  "hostname": "DESKTOP-ABC",
  "username": "john.doe",
  "status": "installed",
  "timestamp": "2025-10-08T14:30:00Z"
}
```

### Agent Registration
```
POST /api/monitoring/register
```
**Payload:**
```json
{
  "token": "one-time-token",
  "hostname": "DESKTOP-ABC",
  "os": "Windows",
  "os_version": "10.0.19045"
}
```

---

## 📊 Logs

| Log File | Location |
|----------|----------|
| Installation Log | `C:\ProgramData\ITMonitoring\install_log.txt` |
| MSI Install Log | `%TEMP%\ITMonitoringAgent-Install.log` |
| Agent Runtime Log | `C:\Program Files\ITMonitoringAgent\logs\agent.log` |

---

## 🛠️ Troubleshooting Commands

### Check Service Status
```batch
sc query ITMonitoringAgent
```

### Start Service
```batch
sc start ITMonitoringAgent
```

### Stop Service
```batch
sc stop ITMonitoringAgent
```

### View Installation Log
```batch
type C:\ProgramData\ITMonitoring\install_log.txt
```

### Check Registry Settings
```batch
reg query HKLM\SOFTWARE\ITMonitoringAgent
```

### Reinstall (Uninstall + Install)
```batch
msiexec.exe /x ITMonitoringAgent-1.0.0.msi /quiet
install.bat -backend http://your-server:5001
```

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Service is running: `sc query ITMonitoringAgent`
- [ ] Config exists: `dir "C:\Program Files\ITMonitoringAgent\config.json"`
- [ ] Installation log created: `dir C:\ProgramData\ITMonitoring\install_log.txt`
- [ ] Backend received notification (check backend logs)
- [ ] Host appears in admin dashboard

---

## 🔍 Common Issues

### Installation notification fails
**Solution:** Check backend URL and network connectivity
```batch
curl http://your-server:5001/api/monitoring/agent/install-notify
```

### Service won't start
**Solution:** Verify Python is installed
```batch
python --version
where python
```

### Files not copied
**Solution:** Check MSI build included all files
```batch
dir "C:\Program Files\ITMonitoringAgent\"
```

---

## 🎯 Test Installation Notification

### Using Node.js Test Script
```batch
cd backend\scripts
node testInstallNotification.js http://localhost:5001
```

### Manual Test with cURL
```batch
curl -X POST http://localhost:5001/api/monitoring/agent/install-notify ^
  -H "Content-Type: application/json" ^
  -d "{\"hostname\":\"TEST-PC\",\"username\":\"testuser\",\"status\":\"installed\",\"timestamp\":\"2025-10-08T14:30:00Z\"}"
```

---

## 📦 Distribution

### Network Share
```batch
copy output\ITMonitoringAgent-1.0.0.msi \\fileserver\share\
```

### GPO Deployment
1. Copy MSI to network share
2. Create new GPO: Computer Configuration → Software Installation
3. Add MSI with BACKENDURL parameter

### SCCM/Intune
Package the MSI with install parameters:
```
msiexec.exe /i ITMonitoringAgent-1.0.0.msi BACKENDURL="http://server:5001" /quiet /norestart
```

---

## 🔐 Security Notes

- ✅ No PowerShell required
- ✅ All communication over HTTP/HTTPS
- ✅ Installation notification has no authentication (pre-registration)
- ✅ Agent registration uses one-time tokens
- ✅ Telemetry uses API key authentication

---

## 📞 Support

Check logs in order:
1. `C:\ProgramData\ITMonitoring\install_log.txt` - Installation details
2. `%TEMP%\ITMonitoringAgent-Install.log` - MSI diagnostics
3. Backend server logs - Notification receipt
4. Windows Event Viewer - Service errors

---

**Version:** 1.0.0  
**Last Updated:** October 8, 2025


