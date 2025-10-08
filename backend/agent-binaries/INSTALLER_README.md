# IT Monitoring Agent - One-Click Installer

## ✅ **SIMPLE INSTALLATION (Recommended)**

### **Step 1: Download These Files**
You need these 4 files in the same folder:
- `INSTALL.bat` ← **This is what you double-click**
- `Install-MonitoringAgent.ps1` ← PowerShell script
- `monitoring_agent.py` ← The monitoring agent
- `requirements.txt` ← Python packages

### **Step 2: Run as Administrator**
1. Right-click `INSTALL.bat`
2. Select **"Run as administrator"**
3. Wait for installation to complete
4. Done!

---

## 📋 **What Gets Installed**

- **Location**: `C:\Program Files\ITMonitoringAgent\`
- **Service Name**: `ITMonitoringAgent`
- **Service Status**: Starts automatically
- **Python Packages**: psutil, requests, watchdog, pywin32

---

## 🔧 **How It Works**

1. **Checks** if Python is installed
2. **Creates** installation directory
3. **Copies** monitoring agent files
4. **Installs** Python packages
5. **Creates** Windows service
6. **Starts** the monitoring agent

---

## ⚠️ **Requirements**

- **Windows 10** or later
- **Python 3.7+** installed and in PATH
- **Administrator** privileges
- **Internet connection** (for downloading Python packages)

---

## 🐛 **Troubleshooting**

### "Python not found"
**Solution**: Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### "Access denied" or "This script must be run as Administrator"
**Solution**: Right-click `INSTALL.bat` → "Run as administrator"

### "Service created but not running"
**Solution**: The service will start on next reboot, or manually start it:
```cmd
net start ITMonitoringAgent
```

### Check if service is running:
```cmd
sc query ITMonitoringAgent
```

### View installation directory:
```cmd
dir "C:\Program Files\ITMonitoringAgent"
```

---

## 📁 **File Structure After Installation**

```
C:\Program Files\ITMonitoringAgent\
├── monitoring_agent.py      ← Main agent
├── requirements.txt          ← Dependencies
├── config.json              ← Configuration
├── logs\                    ← Log files
└── cache\                   ← Cached data
```

---

## 🔐 **Security**

- Agent runs as Windows service
- Connects to backend via HTTP/HTTPS
- Uses registration token for authentication
- Logs stored locally

---

## 📞 **Support**

If installation fails:
1. Check the error message
2. Verify Python is installed: `python --version`
3. Run as Administrator
4. Check antivirus isn't blocking
5. Contact IT support

---

## 🗑️ **Uninstallation**

To remove the agent:

1. Stop the service:
   ```cmd
   net stop ITMonitoringAgent
   ```

2. Delete the service:
   ```cmd
   sc delete ITMonitoringAgent
   ```

3. Remove the directory:
   ```cmd
   rmdir /s "C:\Program Files\ITMonitoringAgent"
   ```

---

**Version**: 1.0.0  
**Last Updated**: October 2025

