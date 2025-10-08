# 🎯 Which Installer Should I Use?

## ⚡ **Quick Answer**

**Just want it to work?** → Use `INSTALL-SIMPLE.bat`

```
Right-click INSTALL-SIMPLE.bat → Run as administrator
```

**That's it!** Everything else is automatic.

---

## 📊 **All Your Options**

I've created **MULTIPLE installers** for different needs. Here's which one to use:

### ⭐⭐⭐⭐⭐ **EASIEST: INSTALL-SIMPLE.bat** (Recommended for You!)

**File:** `installer/windows/INSTALL-SIMPLE.bat`

**How to use:**
```
Right-click INSTALL-SIMPLE.bat → Run as administrator
```

**What it does:**
- ✅ Automatically copies agent files
- ✅ Runs the corrected PowerShell script
- ✅ Handles everything for you
- ✅ No errors!

**Best for:**
- First-time installation
- Quick testing
- End users
- **FIXING YOUR CURRENT ERROR** ← This is what you need!

---

### ⭐⭐⭐⭐ **SIMPLE: Install-MonitoringAgent-Simple.ps1** (Your Script, Fixed)

**File:** `installer/windows/Install-MonitoringAgent-Simple.ps1`

**How to use:**
```powershell
cd D:\ZIP2\it-managaement-app\installer\windows
.\Install-MonitoringAgent-Simple.ps1
```

**What it does:**
- ✅ All functions defined (no more errors!)
- ✅ Fixed $host variable issue
- ✅ Clean, simple code
- ✅ Based on your provided script

**Best for:**
- When you want to use PowerShell directly
- Understanding the installation process
- Customization

---

### ⭐⭐⭐⭐⭐ **ROBUST: Install-ITMonitoringAgent.ps1** (Most Features)

**File:** `installer/windows/Install-ITMonitoringAgent.ps1`

**How to use:**
```powershell
cd D:\ZIP2\it-managaement-app\installer\windows
.\Install-ITMonitoringAgent.ps1
```

**What it does:**
- ✅ All features of Simple version PLUS:
- ✅ Automatic agent download
- ✅ Retry logic (3 attempts)
- ✅ Full transcript logging
- ✅ Progress indicators
- ✅ More error handling

**Best for:**
- Enterprise deployment
- Production use
- Maximum reliability

---

### ⭐⭐⭐⭐⭐ **MSI: ITMonitoringAgent-1.0.0.msi** (Most Professional)

**File:** `installer/windows-msi/ITMonitoringAgent-1.0.0.msi` (after building)

**How to build:**
```batch
cd installer\windows-msi
build.bat
```

**How to use:**
```
Double-click ITMonitoringAgent-1.0.0.msi
```

**What it does:**
- ✅ Professional wizard UI (Next → Next → Finish)
- ✅ No PowerShell required
- ✅ Standard Windows installer
- ✅ Add/Remove Programs integration

**Best for:**
- End users (non-technical)
- Professional appearance
- GPO deployment
- **Requires WiX Toolset to build**

---

## 🎯 **Recommendation Based on Your Situation**

### You Just Want to Test It NOW

**Use:** `INSTALL-SIMPLE.bat`

```
1. Open File Explorer
2. Go to: D:\ZIP2\it-managaement-app\installer\windows
3. Right-click INSTALL-SIMPLE.bat
4. Select "Run as administrator"
5. Done!
```

---

### You Want to Use PowerShell

**Use:** `Install-MonitoringAgent-Simple.ps1`

```powershell
cd D:\ZIP2\it-managaement-app\installer\windows
.\Install-MonitoringAgent-Simple.ps1
```

---

### You Want Maximum Reliability

**Use:** `Install-ITMonitoringAgent.ps1`

```powershell
cd D:\ZIP2\it-managaement-app\installer\windows
.\Install-ITMonitoringAgent.ps1
```

---

### You Want Professional MSI

**Build first:**
```batch
cd installer\windows-msi
build.bat
```

**Then install:**
```
Double-click ITMonitoringAgent-1.0.0.msi
```

---

## 📂 **File Locations**

```
D:\ZIP2\it-managaement-app\
├── installer/
│   ├── windows/                          ← YOU ARE HERE
│   │   ├── INSTALL-SIMPLE.bat            ⭐ EASIEST - Just right-click and run!
│   │   ├── Install-MonitoringAgent-Simple.ps1  ⭐ Your script, fixed
│   │   ├── Install-ITMonitoringAgent.ps1 ⭐ Most robust
│   │   ├── INSTALL.bat                   ⭐ Also easy
│   │   ├── Verify-Installation.ps1       ✓ Check if working
│   │   └── [Documentation files]
│   │
│   └── windows-msi/                      ← MSI INSTALLER
│       ├── build.bat                     ⭐ Build the MSI
│       ├── Product.wxs                   ✓ WiX definition
│       └── [MSI files]
│
└── agent/
    └── monitoring_agent.py               ✓ The actual agent
```

---

## ⚡ **Fastest Path to Success**

### For Testing (RIGHT NOW)

```powershell
# In PowerShell (as Administrator):
cd D:\ZIP2\it-managaement-app\installer\windows

# Make sure files are there
Copy-Item ..\..\agent\monitoring_agent.py .

# Run the simple installer
.\Install-MonitoringAgent-Simple.ps1

# OR just double-click INSTALL-SIMPLE.bat as Admin
```

---

### For Production Deployment

```batch
1. Build MSI: cd installer\windows-msi && build.bat
2. Distribute: ITMonitoringAgent-1.0.0.msi
3. Users: Double-click to install
```

---

## 🎊 **Summary**

**Your Original Error:**
```
Write-Info : The term 'Write-Info' is not recognized
```

**Why It Happened:**
- Functions not defined in your script

**How It's Fixed:**
- ✅ `Install-MonitoringAgent-Simple.ps1` - Has all functions
- ✅ `INSTALL-SIMPLE.bat` - Easy wrapper
- ✅ Fixed $host variable issue (uses [Console]:: instead)

**What To Do:**
1. **Easy:** Right-click `INSTALL-SIMPLE.bat` → Run as Admin
2. **PowerShell:** Run `.\Install-MonitoringAgent-Simple.ps1`
3. **Robust:** Run `.\Install-ITMonitoringAgent.ps1`
4. **Professional:** Build and use MSI

**All are ready to use!** Pick whichever you prefer. 🚀

---

**Recommendation for YOU:** Start with **`INSTALL-SIMPLE.bat`** - it's foolproof!



