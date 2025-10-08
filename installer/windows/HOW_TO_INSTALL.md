# How to Install the Monitoring Agent - Simple Guide

## 🚨 THE ERROR YOU SAW

```
Write-Info : The term 'Write-Info' is not recognized...
```

**Problem:** The script was missing function definitions

**Solution:** ✅ **FIXED!** Use the corrected script below

---

## ✅ **CORRECTED SCRIPT TO USE**

Use this file:
```
installer/windows/Install-MonitoringAgent-Simple.ps1
```

This script:
- ✅ Has all functions defined BEFORE use
- ✅ Fixes the $host variable issue (uses [Console]:: instead)
- ✅ Better error messages
- ✅ Automatic NSSM download
- ✅ Multiple agent file locations checked
- ✅ Proper error handling

---

## 🚀 **How to Install - Step by Step**

### Step 1: Open PowerShell as Administrator

```
1. Press Windows Key
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Select "Run as administrator"
5. Click "Yes" when prompted
```

### Step 2: Navigate to the Installer Directory

```powershell
cd D:\ZIP2\it-managaement-app\installer\windows
```

### Step 3: Run the Fixed Installer

```powershell
.\Install-MonitoringAgent-Simple.ps1
```

### Step 4: Follow the Prompts

The installer will:
1. ✓ Check for admin privileges
2. ✓ Check for Python 3.7+
3. ✓ Create installation directory
4. ✓ Download/copy agent file
5. ✓ Install Python dependencies
6. ✓ Ask for configuration (URLs and token)
7. ✓ Download NSSM automatically
8. ✓ Create Windows service
9. ✓ Start the service
10. ✓ Ask if you want to open the portal

---

## 📋 **What You Need**

### Required

- ✅ Windows 10 or 11
- ✅ Python 3.7+ installed
  - Download from: https://www.python.org/downloads/
  - **Important:** Check "Add Python to PATH" during installation!
- ✅ Internet connection (to download dependencies and NSSM)

### Optional

- `monitoring_agent.py` in one of these locations:
  - Current directory
  - TEMP directory (`%TEMP%`)
  - Or the installer will prompt you

---

## 💡 **Quick Install (Copy & Paste)**

```powershell
# 1. Open PowerShell as Administrator

# 2. Navigate to project
cd D:\ZIP2\it-managaement-app\installer\windows

# 3. Make sure agent file is available
Copy-Item ..\..\agent\monitoring_agent.py .

# 4. Copy service wrapper
Copy-Item service_wrapper.py .

# 5. Run installer
.\Install-MonitoringAgent-Simple.ps1
```

---

## 🎯 **Expected Output**

```
========================================
IT Management Monitoring Agent Installer
Windows Version
========================================

ℹ Checking administrator privileges...
✓ Running with administrator privileges
ℹ Checking for Python 3...
✓ Found Python 3.10.11 at C:\Python310\python.exe
ℹ Creating installation directories...
✓ Installation directory created: C:\Program Files\ITMonitoringAgent
ℹ Creating requirements.txt...
✓ requirements.txt created
ℹ Obtaining monitoring agent...
✓ Copied agent from current directory
✓ Service wrapper copied
ℹ Installing Python dependencies (this may take a few minutes)...
  Upgrading pip...
  Installing psutil...
  Installing requests...
  Installing watchdog...
  Installing pywin32...

✓ Python dependencies installed successfully
ℹ Verifying installations...
✓ All packages verified

ℹ Agent Configuration

Backend URL [https://itmanagement.company.com/api/monitoring/events]: http://localhost:5001/api/monitoring/events
Registration URL [https://itmanagement.company.com/api/monitoring/register]: http://localhost:5001/api/monitoring/register
Registration Token (optional, press Enter to skip): abc123xyz789

ℹ Creating configuration file...
✓ Configuration file created: C:\Program Files\ITMonitoringAgent\config.json
ℹ Downloading NSSM (Service Manager)...
✓ NSSM downloaded successfully
ℹ Installing Windows service...
✓ Service installed
✓ Service configured
ℹ Configuring Windows Firewall...
✓ Firewall rule configured
ℹ Starting monitoring service...
✓ Service ITMonitoringAgent is running

========================================
✓ Installation Completed Successfully!
========================================

Installation Details:
  Location: C:\Program Files\ITMonitoringAgent
  Service: ITMonitoringAgent
  Python: C:\Python310\python.exe
  Backend: http://localhost:5001/api/monitoring/events

Next Steps:
  1. Login to IT Management Portal
  2. Navigate to Monitoring section
  3. Your computer should appear within 2-3 minutes

Useful Commands:
  Check status: Get-Service -Name ITMonitoringAgent
  View logs: Get-Content 'C:\Program Files\ITMonitoringAgent\logs\service_stdout.log' -Tail 50
  View errors: Get-Content 'C:\Program Files\ITMonitoringAgent\logs\service_stderr.log' -Tail 50
  Restart service: Restart-Service -Name ITMonitoringAgent
  Edit config: notepad 'C:\Program Files\ITMonitoringAgent\config.json'

Would you like to open the IT Management Portal now?
Open portal? (Y/N): Y
✓ Portal opened in default browser

Installation complete!
```

---

## 🐛 **If You Get Errors**

### Error: "Python not found"

**Solution:**
```powershell
# Install Python
winget install Python.Python.3.10

# Or download from:
# https://www.python.org/downloads/

# Make sure to check "Add Python to PATH"!
```

### Error: "Agent script not found"

**Solution:**
```powershell
# Copy agent to current directory
Copy-Item D:\ZIP2\it-managaement-app\agent\monitoring_agent.py .

# Then run installer again
.\Install-MonitoringAgent-Simple.ps1
```

### Error: "NSSM download failed"

**Solution:**
```powershell
# Download NSSM manually
# Go to: https://nssm.cc/download
# Extract nssm.exe to:
# C:\Program Files\ITMonitoringAgent\nssm.exe

# Then run installer again
```

### Error: "Dependency installation failed"

**Solution:**
```powershell
# Install manually
python -m pip install psutil requests watchdog pywin32

# Then run installer again
```

---

## ✅ **Verification**

After installation, verify it worked:

```powershell
# Check service
Get-Service ITMonitoringAgent

# Should show:
# Status      : Running
# StartType   : Automatic

# Check logs
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_stdout.log" -Tail 20

# Should show agent activity
```

---

## 📞 **Still Having Issues?**

### Quick Diagnostics

```powershell
# Run this to check everything
Get-Service ITMonitoringAgent | Format-List *
Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"
Test-Path "C:\Program Files\ITMonitoringAgent\config.json"
python --version
python -c "import psutil, requests, watchdog, win32service"
```

### Get Help

- **Check logs:** `C:\Program Files\ITMonitoringAgent\logs\service_stderr.log`
- **Email:** support@company.com
- **Documentation:** Read COMPLETE_GUIDE.md

---

## 🎯 **Summary**

**The Fix:**
- ✅ Use: `Install-MonitoringAgent-Simple.ps1`
- ✅ Has all functions defined
- ✅ No more "Write-Info not recognized" error

**To Install:**
```powershell
cd D:\ZIP2\it-managaement-app\installer\windows
.\Install-MonitoringAgent-Simple.ps1
```

**That's it!** 🎉

---

**File Location:**  
`D:\ZIP2\it-managaement-app\installer\windows\Install-MonitoringAgent-Simple.ps1`

**Status:** ✅ Fixed & Ready to Use



