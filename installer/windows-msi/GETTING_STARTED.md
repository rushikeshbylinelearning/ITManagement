# MSI Installer - Getting Started

## 🎯 What You Need

**To BUILD the MSI:**
- WiX Toolset 3.11+ (https://wixtoolset.org/releases/)
- Windows 10/11
- Agent source files

**To INSTALL the MSI:**
- Windows 10/11 (64-bit)
- Administrator privileges
- Internet connection (for dependencies)

---

## 🚀 Quick Start - Build in 3 Steps

### Step 1: Install WiX Toolset

```
1. Go to: https://wixtoolset.org/releases/
2. Download WiX Toolset (wix311.exe)
3. Run installer with defaults
4. Restart command prompt
```

### Step 2: Build the MSI

```batch
cd installer\windows-msi
build.bat
```

**OR**

```powershell
cd installer\windows-msi
.\build-msi.ps1
```

### Step 3: Test the MSI

```
1. Double-click ITMonitoringAgent-1.0.0.msi
2. Click through wizard
3. Agent installs automatically
4. Service starts
5. Portal opens
```

---

## ⚡ Super Quick Commands

```batch
REM Build MSI
cd installer\windows-msi
build.bat

REM Install MSI (interactive)
ITMonitoringAgent-1.0.0.msi

REM Install MSI (silent)
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart

REM Uninstall
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet
```

---

## 📚 Full Documentation

| File | Content |
|------|---------|
| **MSI_INSTALLER_README.md** | Complete guide (you should read this!) |
| **GETTING_STARTED.md** | This file - quick start |
| **Product.wxs** | WiX main product definition |
| **CustomUI.wxs** | Custom configuration dialog |
| **InstallHelper.ps1** | Installation helper script |

---

## ✅ Success Checklist

After building:
- [ ] MSI file exists: `ITMonitoringAgent-1.0.0.msi`
- [ ] MSI size is ~5-10 MB
- [ ] No build errors

After installing:
- [ ] Service exists: `Get-Service ITMonitoringAgent`
- [ ] Service is running
- [ ] Files in: `C:\Program Files\ITMonitoringAgent\`
- [ ] Config.json exists
- [ ] Computer appears in IT Portal

---

## 🐛 Quick Fixes

### Build fails: "WiX not found"
```
Install WiX from: https://wixtoolset.org/releases/
```

### Build fails: "monitoring_agent.py not found"
```powershell
Copy-Item ..\..\agent\monitoring_agent.py .
.\build-msi.ps1
```

### Install fails: "Error 1603"
```batch
REM Install with log
msiexec /i ITMonitoringAgent-1.0.0.msi /l*v install.log
REM Read install.log for errors
```

---

## 🎉 You're Ready!

1. **Build:** `build.bat`
2. **Test:** Double-click the MSI
3. **Deploy:** Distribute to users

For complete details, see **MSI_INSTALLER_README.md**

---

**Version:** 1.0.0  
**Build Time:** ~30 seconds  
**Install Time:** 2-3 minutes



