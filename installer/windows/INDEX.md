# 📑 Windows Installer - Complete File Index

## 🌟 START HERE

**New to this? Start with one of these:**

### For Installation: `INSTALL.bat` ⭐⭐⭐⭐⭐
```
Right-click → Run as administrator → Done!
```

### For Verification: `Verify-Installation.ps1` ⭐⭐⭐⭐⭐
```powershell
.\Verify-Installation.ps1
```

### For Help: `START_HERE.md` ⭐⭐⭐⭐⭐
Quick reference for all tasks

---

## 📂 File Organization

### 🟢 Ready-to-Use Scripts

| File | Purpose | Who Uses It | How to Use |
|------|---------|-------------|------------|
| **INSTALL.bat** | Easy installation | End users | Right-click → Run as Admin |
| **Install-ITMonitoringAgent.ps1** | Robust installer | IT admins, automation | `.\Install-ITMonitoringAgent.ps1` |
| **Verify-Installation.ps1** | Check if working | Everyone | `.\Verify-Installation.ps1` |
| **test_installer.ps1** | Legacy diagnostics | IT staff | `.\test_installer.ps1 -CheckStatus` |

### 📘 Documentation (Read These!)

| File | Content | Best For |
|------|---------|----------|
| **START_HERE.md** | Quick reference index | Finding what you need |
| **COMPLETE_GUIDE.md** | Everything in one place | IT administrators |
| **QUICK_START.md** | 5-minute installation | End users |
| **ROBUST_INSTALLER_README.md** | PowerShell installer details | Developers |
| **IMPROVEMENTS_COMPARISON.md** | What was fixed | Technical review |
| **INSTALLATION_INSTRUCTIONS.md** | Step-by-step with screenshots | End users |
| **SCRIPT_GUIDE.md** | Which script does what | Avoiding confusion |
| **INSTALLER_README.md** | NSIS installer guide | Build engineers |

### ⚙️ Build Files (Optional)

| File | Purpose | When to Use |
|------|---------|-------------|
| **ITMonitoringAgent.nsi** | NSIS installer definition | Building .exe installer |
| **build.ps1** | Build NSIS installer (advanced) | Creating installer package |
| **build.bat** | Build NSIS installer (simple) | Creating installer package |

### 🔧 Component Files

| File | Purpose | Auto-Copied By |
|------|---------|----------------|
| **monitoring_agent.py** | The actual monitoring agent | Installer |
| **service_wrapper.py** | Windows service code | Installer |
| **requirements.txt** | Python dependencies | Installer |
| **License.txt** | EULA | Installer |
| **README.txt** | User manual | Installer |

---

## 🎯 Usage Flowchart

```
┌─────────────────────────────────────────┐
│       What do you want to do?           │
└───────────────┬─────────────────────────┘
                │
    ┌───────────┼───────────┬─────────────┬─────────────┐
    │           │           │             │             │
    ▼           ▼           ▼             ▼             ▼
┌───────┐  ┌────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
│Install│  │ Verify │  │  Build  │  │  Deploy │  │   Help   │
└───┬───┘  └───┬────┘  └────┬────┘  └────┬────┘  └────┬─────┘
    │          │             │             │            │
    ▼          ▼             ▼             ▼            ▼
INSTALL.bat  Verify-    build.ps1   Install-...   START_HERE
             Install.ps1              -Silent       .md
```

---

## 🚀 Quick Start Paths

### Path A: "I just want to install it"

1. **Double-click:** `INSTALL.bat`
2. Click **Yes** when asked for admin
3. Wait 2-3 minutes
4. When asked, type `Y` to open portal
5. **Done!**

---

### Path B: "I need to deploy to 100 computers"

1. **Read:** `ROBUST_INSTALLER_README.md` → Deployment Scenarios
2. **Customize:** Parameters in GPO/SCCM command
3. **Use:** `Install-ITMonitoringAgent.ps1 -Silent`
4. **Monitor:** Portal for new registrations
5. **Verify:** Sample computers with `Verify-Installation.ps1`

---

### Path C: "Something's not working"

1. **Run:** `Verify-Installation.ps1`
2. **Check:** Service status and logs
3. **Try:** Restart service
4. **If still failing:** Re-run `INSTALL.bat`
5. **If still failing:** Contact IT Support with logs

---

### Path D: "I want to understand what was fixed"

1. **Read:** `IMPROVEMENTS_COMPARISON.md`
2. **See:** Before/after comparison
3. **Review:** Technical details in `ROBUST_INSTALLER_README.md`
4. **Understand:** Each problem and solution

---

## 📊 Feature Matrix

| Feature | INSTALL.bat | Install-ITMonitoringAgent.ps1 | NSIS .exe | Verify-Installation.ps1 |
|---------|------------|-------------------------------|-----------|------------------------|
| **Easy to use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Silent mode** | No | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | N/A |
| **Custom params** | Yes (passes through) | ⭐⭐⭐⭐⭐ | Limited | N/A |
| **Error handling** | Basic | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | N/A |
| **Logging** | Minimal | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Display only |
| **Automation** | Good | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | N/A |
| **Build required** | No | No | Yes | No |

**Legend:** ⭐⭐⭐⭐⭐ = Excellent, ⭐⭐⭐⭐ = Good, ⭐⭐⭐ = Fair

---

## 💾 Backup & Version Control

### Files to Track in Git

```
✅ Track these:
├── Install-ITMonitoringAgent.ps1
├── INSTALL.bat
├── Verify-Installation.ps1
├── service_wrapper.py
├── ITMonitoringAgent.nsi
├── build.ps1
├── build.bat
├── test_installer.ps1
├── License.txt
├── README.txt
└── All .md documentation files

❌ Don't track these (auto-generated or copied):
├── monitoring_agent.py (copied from agent/)
├── requirements.txt (copied from agent/)
├── ITMonitoringAgent-Setup-*.exe (built)
└── installation_*.log (temporary)
```

### .gitignore Entries

```gitignore
# Windows Installer - auto-generated files
installer/windows/monitoring_agent.py
installer/windows/requirements.txt
installer/windows/*.exe
installer/windows/*.log
installer/windows/nssm/
```

---

## 🎁 Bonus: One-Liner Installations

### Super Quick Install (no prompts)

```powershell
PowerShell -ExecutionPolicy Bypass -Command "& {cd installer\windows; .\Install-ITMonitoringAgent.ps1 -Silent -RegistrationToken 'YOUR-TOKEN'}"
```

### Test Install (local backend)

```powershell
.\Install-ITMonitoringAgent.ps1 -BackendUrl "http://localhost:5001/api/monitoring/events" -RegistrationUrl "http://localhost:5001/api/monitoring/register" -InstallPath "C:\Dev\ITMonitor"
```

### Remote Install via PowerShell Remoting

```powershell
Invoke-Command -ComputerName RemotePC -ScriptBlock {
    PowerShell.exe -ExecutionPolicy Bypass -File "\\server\share\Install-ITMonitoringAgent.ps1" -Silent
}
```

---

## 📞 Support Quick Reference

| Issue | Check This | Command |
|-------|------------|---------|
| Won't install | Is Python installed? | `python --version` |
| Service won't start | Check error log | `Get-Content "...\service_error.log"` |
| Not in portal | Service running? | `Get-Service ITMonitoringAgent` |
| Need to verify | Run verification | `.\Verify-Installation.ps1` |
| Need full diagnostics | Run test mode | `.\test_installer.ps1 -TestMode` |

**IT Support:**
- Email: support@company.com
- Portal: https://itmanagement.company.com
- Include: Installation log + Service error log + Verify output

---

## 🎊 You're Ready!

Everything you need is here:

✅ **Installation scripts** - Multiple options  
✅ **Verification tools** - Know it works  
✅ **Documentation** - 8 comprehensive guides  
✅ **Examples** - Every scenario covered  
✅ **Support** - Clear escalation path  

**Pick your path above and go!** 🚀

---

**Quick Links:**
- **New users:** Read `QUICK_START.md`
- **IT admins:** Read `COMPLETE_GUIDE.md`
- **Developers:** Read `ROBUST_INSTALLER_README.md`
- **Confused:** Read this file again! 😊



