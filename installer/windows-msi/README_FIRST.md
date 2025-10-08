# ⚡ READ THIS FIRST - MSI Installer

## 🚨 Your Questions Answered

### Q: "There was an error in test_installer.ps1, is it fixed?"

**A:** ✅ **YES! Fixed!** 

The error was a `$host` variable conflict (line 139). Changed to `$serverHost`.

**Location:** `installer/windows/test_installer.ps1` (in the other directory)

**But wait!** - You don't need that script for the MSI installer!

---

### Q: "Cannot run this as package installer?"

**A:** Correct! The `test_installer.ps1` is NOT an installer!

**Here's what each script does:**

| Script | Purpose | Use It For |
|--------|---------|------------|
| ❌ `test_installer.ps1` | **Testing only** | Checking IF agent is installed |
| ✅ **`INSTALL.bat`** | **Easy installer** | Installing the agent |
| ✅ **`Install-ITMonitoringAgent.ps1`** | **Robust installer** | Installing the agent |
| ✅ **`ITMonitoringAgent.msi`** | **MSI installer** | Installing the agent (BUILD THIS FIRST!) |

---

## ✅ What You Should Actually Do

### To BUILD the MSI Installer:

```batch
cd installer\windows-msi
build.bat
```

**This creates:** `ITMonitoringAgent-1.0.0.msi`

### To INSTALL the Agent (after building):

**Option A: Double-click the MSI**
```
1. Find: ITMonitoringAgent-1.0.0.msi
2. Double-click it
3. Follow wizard (Next → Next → Finish)
4. Done!
```

**Option B: Silent installation**
```batch
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart
```

---

## 🎯 MSI vs PowerShell vs Test Script

### MSI Installer (.msi file)
```
ITMonitoringAgent-1.0.0.msi
```
- ✅ **This INSTALLS the agent**
- ✅ Professional wizard UI
- ✅ Best for end users
- ⚠️ Must build it first: `build.bat`

### PowerShell Installer (.ps1 file)
```
Install-ITMonitoringAgent.ps1
```
- ✅ **This INSTALLS the agent**
- ✅ No build needed
- ✅ Best for IT admins
- ⚠️ Located in `installer/windows/` (different directory!)

### Test Script (.ps1 file) - NOT AN INSTALLER!
```
test_installer.ps1
```
- ❌ **This DOES NOT install anything**
- ✅ Only checks IF agent is installed
- ✅ For diagnostics only
- ⚠️ This is what had the error (now fixed)

---

## 🚀 Quick Start - Just Tell Me What to Do!

### Step 1: Build the MSI

```batch
cd installer\windows-msi
build.bat
```

**Requirements:**
- WiX Toolset installed (get from: https://wixtoolset.org/releases/)

**Output:**
```
✓ ITMonitoringAgent-1.0.0.msi created
```

### Step 2: Install the MSI

```
Double-click ITMonitoringAgent-1.0.0.msi
```

**OR for silent:**
```batch
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet
```

### Step 3: Verify It Worked

```powershell
Get-Service ITMonitoringAgent
```

**Should show:** `Status: Running`

**OR run:**
```powershell
cd installer\windows
.\Verify-Installation.ps1
```

---

## 🐛 If Build Fails

### Error: "WiX Toolset not found"

**Solution:**
```
1. Download WiX from: https://wixtoolset.org/releases/
2. Install wix311.exe
3. Restart command prompt
4. Try build.bat again
```

### Error: "monitoring_agent.py not found"

**Solution:**
```powershell
# Make sure you're in windows-msi directory
cd installer\windows-msi

# Copy agent file
Copy-Item ..\..\agent\monitoring_agent.py .

# Try again
.\build-msi.ps1
```

---

## 📚 Documentation You Should Read

1. **GETTING_STARTED.md** ← Start here!
2. **MSI_INSTALLER_README.md** ← Complete guide
3. **MSI_IMPLEMENTATION_SUMMARY.md** ← What was built

---

## ⚡ Super Quick Commands

```batch
REM In installer\windows-msi directory:

REM Build MSI
build.bat

REM Install MSI (interactive)
ITMonitoringAgent-1.0.0.msi

REM Install MSI (silent)
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet

REM Check if agent is running
powershell "Get-Service ITMonitoringAgent"
```

---

## 🎉 Summary

**The Error:** Fixed! ✅ (test_installer.ps1 had $host variable conflict)

**The Confusion:** Clarified! ✅ (test script is NOT an installer)

**The Solution:**
1. **Build MSI:** `build.bat`
2. **Install MSI:** Double-click it
3. **Verify:** `Get-Service ITMonitoringAgent`

**Everything is ready!** 🚀

---

**Still confused?** Read GETTING_STARTED.md for complete walkthrough.

**Need help?** Email support@company.com with the error and log files.



