# 🚀 START HERE - Windows Installer Quick Reference

## ⚡ Super Quick Start (30 Seconds)

### If you just want to INSTALL the agent:

**Right-click `INSTALL.bat` → Run as Administrator**

That's it! The installer will handle everything automatically.

---

## 📚 Directory Overview

```
installer/windows/
├── 🟢 INSTALL.bat                           ← **START HERE** (easiest)
├── 🟢 Install-ITMonitoringAgent.ps1         ← Robust PowerShell installer
├── 🟢 Verify-Installation.ps1               ← Check if it worked
├── 📘 START_HERE.md                          ← You are here!
├── 📘 COMPLETE_GUIDE.md                      ← Everything explained
├── 📘 QUICK_START.md                         ← 5-minute guide
├── 📘 ROBUST_INSTALLER_README.md             ← Technical details
├── 📘 IMPROVEMENTS_COMPARISON.md             ← What was fixed
├── 📘 INSTALLER_README.md                    ← NSIS installer docs
├── 📘 SCRIPT_GUIDE.md                        ← Which script does what
├── ⚙️ service_wrapper.py                     ← Windows service code
├── ⚙️ ITMonitoringAgent.nsi                  ← NSIS installer script
├── ⚙️ build.ps1                              ← Build NSIS installer
├── ⚙️ build.bat                              ← Build NSIS (simple)
├── ⚙️ test_installer.ps1                     ← Legacy testing tool
├── 📄 License.txt                            ← EULA
├── 📄 README.txt                             ← User manual
├── 🔧 monitoring_agent.py                    ← The actual agent
└── 🔧 requirements.txt                       ← Python dependencies
```

---

## 🎯 What Do You Want to Do?

### I want to INSTALL the agent on my computer
**→ Use:** `INSTALL.bat`

```
1. Right-click INSTALL.bat
2. Select "Run as administrator"
3. Wait 2-3 minutes
4. Done!
```

**Alternative:** `Install-ITMonitoringAgent.ps1`
```powershell
PowerShell -ExecutionPolicy Bypass -File Install-ITMonitoringAgent.ps1
```

---

### I want to check if it's WORKING
**→ Use:** `Verify-Installation.ps1`

```powershell
.\Verify-Installation.ps1
```

**Should show:**
```
✓ VERIFICATION PASSED
The monitoring agent is properly installed and running.
```

---

### I want to DEPLOY to many computers
**→ Use:** `Install-ITMonitoringAgent.ps1` with `-Silent`

```powershell
# GPO startup script:
PowerShell.exe -ExecutionPolicy Bypass -File "\\server\share\Install-ITMonitoringAgent.ps1" -BackendUrl "https://backend.com/api" -RegistrationToken "%TOKEN%" -Silent

# SCCM/Intune:
# Install command: PowerShell.exe -ExecutionPolicy Bypass -File ".\Install-ITMonitoringAgent.ps1" -Silent -RegistrationToken "%TOKEN%"
# Detection: Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"
```

**Read:** `ROBUST_INSTALLER_README.md` → Deployment Scenarios

---

### I want to BUILD the .exe installer
**→ Use:** `build.ps1` or `build.bat`

**Prerequisites:**
1. Install NSIS from: https://nsis.sourceforge.io/Download

**Then:**
```powershell
.\build.ps1
```

**Output:** `ITMonitoringAgent-Setup-1.0.0.exe`

**Read:** `INSTALLER_README.md`

---

### I want to TROUBLESHOOT problems
**→ Use:** `Verify-Installation.ps1` first, then check logs

**Steps:**
1. Run verification:
```powershell
.\Verify-Installation.ps1
```

2. If failed, check service logs:
```powershell
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log"
```

3. Check service status:
```powershell
Get-Service ITMonitoringAgent | Format-List *
```

4. Try restarting service:
```powershell
Restart-Service ITMonitoringAgent
```

**Read:** `COMPLETE_GUIDE.md` → Troubleshooting section

---

### I want to UNDERSTAND what was fixed
**→ Read:** `IMPROVEMENTS_COMPARISON.md`

Shows:
- What was broken
- How it was fixed
- Before/after comparisons
- Reliability improvements

---

### I want COMPLETE documentation
**→ Read:** `COMPLETE_GUIDE.md`

Contains:
- All scenarios
- All commands
- All troubleshooting
- Everything in one place

---

## 🆘 Emergency Quick Fixes

### The agent won't start!

```powershell
# 1. Check if service exists
Get-Service ITMonitoringAgent

# 2. Try starting it
Start-Service ITMonitoringAgent

# 3. Check for errors
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log" -Tail 20

# 4. Re-run installer
.\INSTALL.bat
```

### The installer fails!

```powershell
# 1. Check Python
python --version
# Should show Python 3.7+

# 2. If no Python, install it:
winget install Python.Python.3.10

# 3. Try installer again
.\INSTALL.bat
```

### My computer isn't in the portal!

```powershell
# 1. Wait 5 minutes
# 2. Check service is running
Get-Service ITMonitoringAgent

# 3. Check agent logs
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 50

# 4. Look for "registered successfully" in logs
# 5. If not registered, check registration token in config.json
```

---

## 📖 Documentation Index

### For End Users
- **START_HERE.md** (this file) - Quick reference
- **QUICK_START.md** - 5-minute installation guide
- **INSTALLATION_INSTRUCTIONS.md** - Step-by-step with screenshots

### For IT Administrators
- **COMPLETE_GUIDE.md** - Everything in one place
- **ROBUST_INSTALLER_README.md** - PowerShell installer details
- **Deployment scenarios** - GPO, SCCM, Intune

### For Developers
- **IMPROVEMENTS_COMPARISON.md** - Technical analysis of fixes
- **INSTALLER_README.md** - NSIS installer development
- **SCRIPT_GUIDE.md** - Understanding each script

---

## 💡 Pro Tips

### Tip 1: Always use INSTALL.bat
It automatically handles the execution policy and runs as admin.

### Tip 2: Use silent mode for automation
```powershell
.\Install-ITMonitoringAgent.ps1 -Silent -RegistrationToken "token123"
```

### Tip 3: Keep installation logs
```powershell
# Logs are in %TEMP%\installation_*.log
# Copy them for records:
Copy-Item "$env:TEMP\installation_*.log" "D:\InstallLogs\"
```

### Tip 4: Watch logs in real-time
```powershell
# See what the agent is doing:
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 20 -Wait
```

### Tip 5: Verify before leaving
```powershell
.\Verify-Installation.ps1
# If all checks pass, you're good!
```

---

## ⚡ TL;DR - Just Tell Me What to Do!

### To Install:
```
Right-click INSTALL.bat → Run as administrator → Wait → Done
```

### To Verify:
```powershell
.\Verify-Installation.ps1
```

### To Troubleshoot:
```powershell
Get-Service ITMonitoringAgent
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log"
```

### To Get Help:
Email: support@company.com

---

## 🎉 You're All Set!

Everything you need is in this directory. Follow the guides above based on what you want to do.

**Most common path:**
1. Run `INSTALL.bat`
2. Run `Verify-Installation.ps1`
3. Check IT Portal
4. Success! ✅

**Questions?** Read `COMPLETE_GUIDE.md` or contact IT Support.

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready



