# ✅ One-Click Installation Guide

## 🎯 Three Ways to Install (All Auto-Elevate!)

Your IT Monitoring Agent installer now supports **three one-click installation methods**. All automatically request Administrator privileges - no need to right-click "Run as Administrator"!

---

## 🚀 Option 1: VBScript Launcher (Recommended)

**File:** `Install-Agent.vbs`

### ✨ Features
- ✅ Pure VBScript - works on any Windows system
- ✅ No PowerShell required
- ✅ Auto-elevates to Administrator
- ✅ Uses default backend URL (http://localhost:5001)

### 📋 How to Use

**Step 1:** Double-click `Install-Agent.vbs`

**Step 2:** Click "Yes" on UAC prompt

**Step 3:** Installation proceeds automatically!

### 🎥 What Happens

```
User double-clicks Install-Agent.vbs
         ↓
UAC prompt appears: "Do you want to allow this app to make changes?"
         ↓
User clicks "Yes"
         ↓
install.bat launches with admin privileges
         ↓
MSI installer runs
         ↓
Agent installed successfully!
```

---

## 🎨 Option 2: VBScript Launcher with GUI

**File:** `Install-Agent-GUI.vbs`

### ✨ Features
- ✅ User-friendly GUI prompts
- ✅ Prompts for backend URL
- ✅ Shows confirmation before installation
- ✅ Auto-elevates to Administrator

### 📋 How to Use

**Step 1:** Double-click `Install-Agent-GUI.vbs`

**Step 2:** Enter backend URL in the prompt:
```
Enter the backend server URL:

Examples:
  http://localhost:5001
  http://192.168.1.100:5001
  http://itmanagement.company.com:5001

[http://localhost:5001]
```

**Step 3:** Click OK on confirmation dialog

**Step 4:** Click "Yes" on UAC prompt

**Step 5:** Installation completes!

### 🎥 What Happens

```
User double-clicks Install-Agent-GUI.vbs
         ↓
Input dialog: "Enter backend server URL"
         ↓
User enters URL (e.g., http://192.168.1.100:5001)
         ↓
Confirmation dialog: "Ready to install IT Monitoring Agent"
         ↓
User clicks OK
         ↓
UAC prompt appears
         ↓
User clicks "Yes"
         ↓
install.bat launches with -backend parameter
         ↓
Agent installed with custom backend URL!
```

---

## ⚡ Option 3: Self-Elevating Batch File

**File:** `install.bat`

### ✨ Features
- ✅ Pure batch script with PowerShell elevation
- ✅ Accepts command-line parameters
- ✅ Auto-elevates if not already admin
- ✅ Flexible for advanced users

### 📋 How to Use

**Basic (default backend):**
1. Double-click `install.bat`
2. Click "Yes" on UAC prompt
3. Installation proceeds!

**Advanced (custom backend):**
1. Open Command Prompt
2. Navigate to installer directory:
   ```batch
   cd installer\windows-msi
   ```
3. Run with parameters:
   ```batch
   install.bat -backend http://192.168.1.100:5001
   ```
4. Click "Yes" on UAC prompt

### 🎥 What Happens

```
User double-clicks install.bat
         ↓
Batch file checks: "Am I admin?"
         ↓
If NOT admin:
  → Launches PowerShell with "Start-Process -Verb RunAs"
  → UAC prompt appears
  → User clicks "Yes"
  → Re-launches itself with admin privileges
         ↓
If already admin:
  → Proceeds directly to installation
         ↓
MSI installer runs
         ↓
Agent installed!
```

---

## 📊 Comparison

| Feature | Install-Agent.vbs | Install-Agent-GUI.vbs | install.bat |
|---------|-------------------|----------------------|-------------|
| One-click | ✅ | ✅ | ✅ |
| Auto-elevate | ✅ | ✅ | ✅ |
| No PowerShell needed | ✅ | ✅ | ❌ |
| GUI prompts | ❌ | ✅ | ❌ |
| Command-line parameters | ❌ | ❌ | ✅ |
| Best for | Simple deployment | User-friendly | Advanced users |

---

## 🎯 Recommended Usage

### For End Users (Non-Technical)
**Use:** `Install-Agent-GUI.vbs`
- Provides clear prompts
- Confirms backend URL
- User-friendly experience

### For IT Administrators
**Use:** `install.bat` with parameters
- Flexible command-line control
- Can be scripted
- Supports all installation options

### For Network Deployment
**Use:** `install.bat` in silent mode
```batch
install.bat -backend http://server:5001
```

### For Quick Testing
**Use:** `Install-Agent.vbs`
- Fastest one-click installation
- Uses default localhost backend
- Perfect for development/testing

---

## 🔧 Technical Details

### How Auto-Elevation Works

#### VBScript Method (Install-Agent.vbs)
```vbscript
Set objShell = CreateObject("Shell.Application")
objShell.ShellExecute "install.bat", "", "", "runas", 1
```
- `"runas"` parameter triggers UAC elevation
- Works on all Windows versions
- No PowerShell dependency

#### Batch File Self-Elevation (install.bat)
```batch
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
```
- Checks if already admin using `net session`
- If not admin, uses PowerShell to re-launch elevated
- Preserves command-line arguments

---

## 🛠️ Troubleshooting

### UAC Prompt Doesn't Appear

**Cause:** UAC is disabled on the system

**Solution:**
1. Open Control Panel → User Accounts → Change User Account Control settings
2. Move slider to at least the second level from top
3. Click OK and restart

### "PowerShell is not recognized"

**Cause:** PowerShell not in PATH (affects install.bat only)

**Solution:** Use `Install-Agent.vbs` instead (no PowerShell required)

### VBScript Files Open in Notepad

**Cause:** Default file association changed

**Solution:**
1. Right-click Install-Agent.vbs
2. Select "Open with" → "Windows Script Host"
3. Or run from command prompt:
   ```batch
   cscript Install-Agent.vbs
   ```

### Installation Starts But Fails

**Check:**
1. MSI file exists in `output\ITMonitoringAgent-1.0.0.msi`
2. Backend URL is correct and reachable
3. Installation logs: `C:\ProgramData\ITMonitoring\install_log.txt`

---

## 📦 Distribution Guide

### Distribute to End Users

**Recommended:** Package these files together:
```
📁 ITMonitoringAgent_Installer/
  ├── Install-Agent-GUI.vbs          ← Main installer (double-click this!)
  ├── Install-Agent.vbs              ← Alternative simple installer
  ├── install.bat                    ← Backend script
  ├── output\
  │   └── ITMonitoringAgent-1.0.0.msi
  └── README.txt                     ← Instructions
```

**README.txt content:**
```
IT Monitoring Agent Installer

INSTALLATION INSTRUCTIONS:
1. Double-click "Install-Agent-GUI.vbs"
2. Enter your company's backend URL when prompted
3. Click OK to confirm
4. Click "Yes" when Windows asks for permission
5. Installation will complete automatically

NEED HELP?
Contact IT Support: support@company.com
```

### Distribute via Network Share

```batch
\\fileserver\software\ITMonitoringAgent\Install-Agent-GUI.vbs
```

Users can double-click from the network share!

### Distribute via Email

**Zip the folder** and email with instructions:
```
Subject: Install IT Monitoring Agent

Dear Team,

Please install the IT Monitoring Agent:

1. Extract the attached zip file
2. Double-click "Install-Agent-GUI.vbs"
3. Enter backend URL: http://itmanagement.company.com:5001
4. Follow the prompts

The agent will begin monitoring your system automatically.

Questions? Contact IT Support.
```

---

## 🎓 Quick Reference

### Default Installation (Localhost)
```
Double-click: Install-Agent.vbs
```

### Custom Backend URL (GUI)
```
Double-click: Install-Agent-GUI.vbs
→ Enter URL when prompted
```

### Custom Backend URL (Command-Line)
```batch
install.bat -backend http://192.168.1.100:5001
```

### Silent Installation
```batch
install.bat -backend http://server:5001
(Then click Yes on UAC)
```

### Verify Installation
```batch
sc query ITMonitoringAgent
type C:\ProgramData\ITMonitoring\install_log.txt
```

---

## ✅ Success Checklist

After one-click installation, verify:

- [ ] UAC prompt appeared and was accepted
- [ ] Installation completed successfully
- [ ] Service is running: `sc query ITMonitoringAgent`
- [ ] Installation log exists: `C:\ProgramData\ITMonitoring\install_log.txt`
- [ ] Backend received notification (check backend logs)
- [ ] Host appears in admin dashboard

---

## 🎉 Summary

You now have **three one-click installation methods**:

1. **Install-Agent.vbs** - Simplest, one double-click
2. **Install-Agent-GUI.vbs** - User-friendly with prompts
3. **install.bat** - Flexible for advanced users

All methods:
- ✅ Auto-elevate to Administrator
- ✅ No manual "Run as Administrator" needed
- ✅ Work with one double-click
- ✅ Show UAC prompt automatically
- ✅ Install agent completely

**Just double-click and you're done!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** October 8, 2025  
**Status:** ✅ Ready for Production


