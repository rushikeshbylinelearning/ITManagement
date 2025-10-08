# Windows Installer Scripts - Usage Guide

## ⚠️ IMPORTANT: Understanding the Different Scripts

There are **different scripts** for different purposes. Please read carefully!

---

## 🎯 Which Script Should I Use?

### For **BUILDING** the Installer
Use one of these:

#### Option 1: `build.bat` (Recommended for beginners)
```batch
cd installer\windows
build.bat
```
**What it does:** Creates the installer package `ITMonitoringAgent-Setup-1.0.0.exe`

#### Option 2: `build.ps1` (Advanced users)
```powershell
cd installer\windows
.\build.ps1
```
**What it does:** Same as build.bat but with more options (signing, cleaning, etc.)

### For **TESTING** an Already-Installed Agent
Use: `test_installer.ps1`

```powershell
# After the agent is installed, you can test it:
.\test_installer.ps1 -CheckStatus
.\test_installer.ps1 -ViewLogs
.\test_installer.ps1 -TestMode
```

**⚠️ Note:** `test_installer.ps1` is NOT the installer! It's for testing AFTER installation.

---

## 📦 Complete Workflow

### Step 1: Build the Installer Package
```batch
cd installer\windows
build.bat
```
**Output:** `ITMonitoringAgent-Setup-1.0.0.exe`

### Step 2: Distribute the Installer
- Copy `ITMonitoringAgent-Setup-1.0.0.exe` to end users
- Or upload to IT Portal for download
- Or deploy via GPO/SCCM

### Step 3: End Users Install
```
Right-click ITMonitoringAgent-Setup-1.0.0.exe
→ Run as Administrator
→ Follow the wizard
```

### Step 4: Test the Installation (Optional)
```powershell
.\test_installer.ps1 -CheckStatus
```

---

## 🔧 Script Descriptions

### `ITMonitoringAgent.nsi`
- **Type:** NSIS installer script
- **Purpose:** Defines how the installer works
- **You need:** NSIS installed to compile this
- **Don't run directly** - use build.bat instead

### `build.bat`
- **Type:** Build script
- **Purpose:** Compiles the NSIS script into an .exe installer
- **Usage:** `build.bat`
- **Output:** `ITMonitoringAgent-Setup-1.0.0.exe`

### `build.ps1`
- **Type:** Advanced build script
- **Purpose:** Same as build.bat but with more features
- **Usage:** `.\build.ps1 -Clean -Sign`
- **Output:** `ITMonitoringAgent-Setup-1.0.0.exe`

### `test_installer.ps1` ✅ (FIXED)
- **Type:** Testing and diagnostic script
- **Purpose:** Test an ALREADY-INSTALLED agent
- **Usage:** `.\test_installer.ps1 -CheckStatus`
- **Don't use this to install!** Use the .exe installer instead

### `service_wrapper.py`
- **Type:** Windows service wrapper
- **Purpose:** Makes the agent run as a Windows service
- **Don't run directly** - the installer handles this

---

## ❌ Common Mistakes

### ❌ WRONG: Trying to run test_installer.ps1 to install
```powershell
.\test_installer.ps1  # This does NOT install anything!
```

### ✅ CORRECT: Use the built installer
```
ITMonitoringAgent-Setup-1.0.0.exe  # This installs the agent
```

### ❌ WRONG: Running NSIS script directly
```
ITMonitoringAgent.nsi  # This won't work!
```

### ✅ CORRECT: Build first, then run
```batch
build.bat  # Creates the .exe
# Then run the .exe
```

---

## 🐛 Troubleshooting

### Error: "test_installer.ps1 cannot run as package installer"
**Problem:** You're trying to use the wrong script!

**Solution:** 
1. **To build installer:** Use `build.bat`
2. **To install agent:** Run the generated `.exe` file
3. **To test installed agent:** Use `test_installer.ps1`

### Error: "$host variable conflict"
**Problem:** This was a bug in test_installer.ps1 (now fixed!)

**Solution:** The file has been updated. Re-download or use the corrected version.

### Error: "NSIS not found"
**Problem:** NSIS is not installed

**Solution:**
1. Download NSIS from https://nsis.sourceforge.io/Download
2. Install with default options
3. Restart command prompt
4. Run `build.bat` again

### Error: "monitoring_agent.py not found"
**Problem:** Agent file is missing

**Solution:**
```batch
# Make sure you're in the right directory
cd installer\windows

# Copy the agent file
copy ..\..\agent\monitoring_agent.py .
copy ..\..\agent\requirements.txt .

# Then build
build.bat
```

---

## ✅ Quick Reference

| What I Want to Do | Script to Use | Command |
|-------------------|---------------|---------|
| Build installer | `build.bat` | `build.bat` |
| Build with options | `build.ps1` | `.\build.ps1 -Clean` |
| Install agent | `.exe file` | Right-click → Run as Admin |
| Check if installed | `test_installer.ps1` | `.\test_installer.ps1 -CheckStatus` |
| View logs | `test_installer.ps1` | `.\test_installer.ps1 -ViewLogs` |
| Test telemetry | `test_installer.ps1` | `.\test_installer.ps1 -SimulateTelemetry` |
| Uninstall | Control Panel or `test_installer.ps1` | `.\test_installer.ps1 -Uninstall` |

---

## 📞 Still Confused?

### I want to create the installer package
```batch
cd installer\windows
build.bat
```
This creates `ITMonitoringAgent-Setup-1.0.0.exe`

### I want to install the agent on my computer
```
1. Run build.bat first (see above)
2. Right-click ITMonitoringAgent-Setup-1.0.0.exe
3. Select "Run as Administrator"
4. Follow the wizard
```

### I want to test if the agent is working
```powershell
# After installation
.\test_installer.ps1 -CheckStatus
```

---

## 🎓 Understanding the Process

```
[1] Source Code
    ├── monitoring_agent.py
    └── requirements.txt
          ↓
[2] Build Script (build.bat)
    ├── Reads: ITMonitoringAgent.nsi
    ├── Copies files
    └── Compiles with NSIS
          ↓
[3] Installer Package
    └── ITMonitoringAgent-Setup-1.0.0.exe ← Give this to users
          ↓
[4] User Runs Installer
    ├── Right-click → Run as Admin
    └── Wizard installs everything
          ↓
[5] Agent is Installed
    ├── Service is running
    └── Computer appears in portal
          ↓
[6] Test (Optional)
    └── .\test_installer.ps1 -CheckStatus
```

---

**Remember:**
- **BUILD** with: `build.bat` or `build.ps1`
- **INSTALL** with: `ITMonitoringAgent-Setup-1.0.0.exe`
- **TEST** with: `test_installer.ps1`

Each script has a different job! ✨



