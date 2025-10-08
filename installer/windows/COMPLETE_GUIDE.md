# Complete Windows Installer Guide - Everything You Need

## 🎯 Quick Decision Matrix

**I want to...** → **Use this script:**

| Goal | Script | Command |
|------|--------|---------|
| **Install the agent on my computer** | `Install-ITMonitoringAgent.ps1` | `.\Install-ITMonitoringAgent.ps1` |
| **Install silently (automated)** | `Install-ITMonitoringAgent.ps1` | `.\Install-ITMonitoringAgent.ps1 -Silent -RegistrationToken "..."` |
| **Check if agent is working** | `Verify-Installation.ps1` | `.\Verify-Installation.ps1` |
| **View diagnostic info** | `test_installer.ps1` | `.\test_installer.ps1 -CheckStatus` |
| **Build NSIS installer** | `build.ps1` | `.\build.ps1` |
| **Test after installation** | `Verify-Installation.ps1` | `.\Verify-Installation.ps1` |

---

## 📦 Available Installer Methods

### Method 1: PowerShell Script (Recommended) ⭐

**File:** `Install-ITMonitoringAgent.ps1`

**Pros:**
- ✅ No build step required
- ✅ Easy to customize
- ✅ Works on all Windows 10/11
- ✅ Full logging and error handling
- ✅ Silent mode for automation
- ✅ Automatic dependency installation

**Cons:**
- ⚠️ Requires PowerShell 5.1+ (included in Windows 10/11)
- ⚠️ Execution policy must allow scripts

**Usage:**
```powershell
# Interactive
.\Install-ITMonitoringAgent.ps1

# Silent with parameters
.\Install-ITMonitoringAgent.ps1 -BackendUrl "https://backend.com" -RegistrationToken "token123" -Silent
```

---

### Method 2: NSIS Installer (.exe)

**File:** `ITMonitoringAgent-Setup-1.0.0.exe` (built from `ITMonitoringAgent.nsi`)

**Pros:**
- ✅ Traditional "Next → Next → Finish" UI
- ✅ Single .exe file
- ✅ Can be code-signed
- ✅ Familiar to users

**Cons:**
- ⚠️ Requires NSIS to build
- ⚠️ Harder to customize
- ⚠️ Build step required

**Build:**
```powershell
.\build.ps1
# Creates: ITMonitoringAgent-Setup-1.0.0.exe
```

**Usage:**
```
Right-click ITMonitoringAgent-Setup-1.0.0.exe
→ Run as Administrator
→ Follow wizard
```

---

## 🚀 Complete Installation Walkthrough

### For IT Administrators - Deploying to 100+ Computers

**Step 1: Prepare deployment package**

Create a shared folder:
```
\\fileserver\IT\MonitoringAgent\
├── Install-ITMonitoringAgent.ps1
├── monitoring_agent.py
├── service_wrapper.py
├── requirements.txt
├── README.txt
└── LICENSE.txt
```

**Step 2: Create token generation script**

```powershell
# generate-tokens.ps1
$adminToken = "your-admin-jwt-token"
$computers = Get-ADComputer -Filter * | Select-Object -ExpandProperty Name

foreach ($computer in $computers) {
    # Generate token for each computer
    $token = Invoke-RestMethod `
        -Uri "https://itmanagement.company.com/api/auth/agent-token" `
        -Method Post `
        -Headers @{Authorization = "Bearer $adminToken"; "Content-Type" = "application/json"} `
        -Body (@{hostname = $computer; os = "windows"} | ConvertTo-Json)
    
    # Store token for deployment
    "$computer,$($token.token)" | Add-Content tokens.csv
}
```

**Step 3: Deploy via GPO**

1. Open Group Policy Management
2. Create new GPO: "IT Monitoring Agent Deployment"
3. Edit GPO → Computer Configuration → Policies → Windows Settings → Scripts → Startup
4. Add script:
```powershell
PowerShell.exe -ExecutionPolicy Bypass -File "\\fileserver\IT\MonitoringAgent\Install-ITMonitoringAgent.ps1" -BackendUrl "https://itmanagement.company.com/api" -RegistrationToken "%TOKEN%" -Silent
```

**Step 4: Link GPO to target OUs**

---

### For End Users - Installing on Your Computer

**Step 1: Download**
1. Login to IT Management Portal
2. Dialog appears: "System Monitoring Agent Setup"
3. Click "Download Agent"
4. Save file to Downloads folder

**Step 2: Install**
1. Open Downloads folder
2. Find `Install-ITMonitoringAgent.ps1`
3. Right-click → **Run with PowerShell**
   - If you see "Run anyway" prompt, click it
4. Click **Yes** when asked for Administrator privileges

**Step 3: Follow Prompts**
1. Read the introduction
2. Press any key to continue
3. Wait for installation (2-3 minutes)
4. When asked "Open IT Portal?", type `Y` and press Enter

**Step 4: Verify**
1. Browser opens to IT Portal
2. Login if needed
3. Click "Monitoring" in sidebar
4. Your computer should appear in the list within 2-3 minutes

---

## 🔍 Verification & Testing

### Quick Health Check

```powershell
.\Verify-Installation.ps1
```

**Expected Output:**
```
[1] Installation Directory
✓ Directory exists - C:\Program Files\ITMonitoringAgent

[2] Required Files
✓ monitoring_agent.py
✓ service_wrapper.py
✓ config.json
✓ requirements.txt

[3] Windows Service
✓ Service exists - ITMonitoringAgent
✓ Service running - Running
✓ Auto-start configured - Automatic

[4] Configuration
✓ Config file valid
✓ Backend URL configured - https://...
✓ Hostname set - YOUR-COMPUTER
✓ Agent registered - Agent ID: abc12345...

✓ VERIFICATION PASSED
```

### Manual Verification Steps

**1. Check Service:**
```powershell
Get-Service ITMonitoringAgent
```
Should show: `Status: Running`

**2. Check Logs:**
```powershell
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 20
```
Should show recent agent activity (no errors)

**3. Check in IT Portal:**
1. Login to portal
2. Go to Monitoring
3. Find your computer
4. Status should be "Online" 🟢

**4. Check Network:**
```powershell
# Should show active connection to backend
netstat -ano | Select-String "443"
```

---

## 🐛 Troubleshooting

### Problem: "Execution policy restricts script"

**Error:**
```
.\Install-ITMonitoringAgent.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
# Temporarily bypass (for this session only)
PowerShell.exe -ExecutionPolicy Bypass -File ".\Install-ITMonitoringAgent.ps1"

# Or allow all scripts (permanent)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problem: "Must run as Administrator"

**Error:**
```
Administrator privileges required!
Please right-click and select 'Run as Administrator'
```

**Solution:**
1. Open PowerShell **as Administrator**:
   - Search for "PowerShell"
   - Right-click "Windows PowerShell"
   - Select "Run as administrator"
2. Navigate to installer directory
3. Run script again

### Problem: Python Not Found

**Error:**
```
Python not found. Please install Python 3.7+
```

**Solution:**
```powershell
# Option 1: winget (Windows 11)
winget install Python.Python.3.10

# Option 2: Chocolatey
choco install python

# Option 3: Manual download
# Go to https://www.python.org/downloads/
# Download Python 3.10+
# Run installer
# ✅ Check "Add Python to PATH"
```

### Problem: Dependencies Won't Install

**Error:**
```
Failed to install Python dependencies after 3 attempts
```

**Solutions:**

1. **Check internet connection**
2. **Configure proxy** (if behind corporate firewall):
```powershell
$env:HTTP_PROXY="http://proxy.company.com:8080"
$env:HTTPS_PROXY="http://proxy.company.com:8080"
```

3. **Install manually**:
```powershell
python -m pip install --upgrade pip
python -m pip install psutil requests watchdog pywin32
```

4. **Use offline installer** (download wheels first)

### Problem: Service Won't Start

**Check Event Viewer:**
```powershell
Get-EventLog -LogName Application -Source ITMonitoringAgent -Newest 10
```

**Check Service Logs:**
```powershell
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log"
```

**Common Causes:**
- Python packages not installed
- Config file missing or invalid
- Network connectivity issues
- Agent file missing

**Solution:**
```powershell
# Try running agent manually
cd "C:\Program Files\ITMonitoringAgent"
python monitoring_agent.py

# Watch for errors
# Fix any issues
# Then restart service
Restart-Service ITMonitoringAgent
```

### Problem: Computer Not in Portal

**Checklist:**
- [ ] Service is running? `Get-Service ITMonitoringAgent`
- [ ] Config has registration token? `notepad "C:\Program Files\ITMonitoringAgent\config.json"`
- [ ] No errors in logs? `Get-Content "...\logs\service_error.log"`
- [ ] Network can reach backend? `Test-NetConnection backend.com -Port 443`
- [ ] Waited 3-5 minutes? (Initial registration takes time)

**Force re-registration:**
```powershell
# Stop service
Stop-Service ITMonitoringAgent

# Edit config.json - set agent_id to null
# Save and close

# Start service
Start-Service ITMonitoringAgent

# Check logs for registration attempt
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 50 -Wait
```

---

## 📊 Comparison of Installation Methods

| Feature | PowerShell Script | NSIS Installer | Manual Install |
|---------|-------------------|----------------|----------------|
| Ease of use | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Customization | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Silent installation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| Enterprise deployment | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| Error handling | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| Logging | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| Build required | No | Yes | No |
| File size | Small | Medium | N/A |

**Recommendation:**
- **End users:** NSIS installer (if built)
- **IT admins:** PowerShell script
- **GPO deployment:** PowerShell script
- **SCCM/Intune:** PowerShell script

---

## 📋 Complete Command Reference

### Installation

```powershell
# Basic installation
.\Install-ITMonitoringAgent.ps1

# With all parameters
.\Install-ITMonitoringAgent.ps1 `
    -BackendUrl "https://backend.company.com/api/monitoring/events" `
    -RegistrationUrl "https://backend.company.com/api/monitoring/register" `
    -RegistrationToken "abc123xyz789" `
    -AgentUrl "https://downloads.company.com/monitoring_agent.py" `
    -InstallPath "C:\CustomPath\ITMonitor" `
    -PollingInterval 30 `
    -Silent `
    -SkipPortalLaunch
```

### Verification

```powershell
# Full verification
.\Verify-Installation.ps1

# Quick check
Get-Service ITMonitoringAgent

# Detailed service info
Get-Service ITMonitoringAgent | Format-List *
```

### Diagnostics

```powershell
# Using test_installer.ps1 (legacy diagnostics)
.\test_installer.ps1 -CheckStatus
.\test_installer.ps1 -ViewLogs
.\test_installer.ps1 -TestMode

# Or use new verification
.\Verify-Installation.ps1
```

### Service Management

```powershell
# Start
Start-Service ITMonitoringAgent

# Stop
Stop-Service ITMonitoringAgent

# Restart
Restart-Service ITMonitoringAgent

# Status
Get-Service ITMonitoringAgent | Select-Object Status, StartType

# Full details
Get-Service ITMonitoringAgent | Format-List *
```

### Log Management

```powershell
# View service log (real-time)
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service.log" -Tail 50 -Wait

# View error log
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log" -Tail 50

# View agent internal log
Get-Content "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log" -Tail 50

# View installation log
Get-Content "$env:TEMP\installation_*.log" | Select-Object -Last 100
```

### Configuration

```powershell
# View config
Get-Content "C:\Program Files\ITMonitoringAgent\config.json" | ConvertFrom-Json | Format-List

# Edit config
notepad "C:\Program Files\ITMonitoringAgent\config.json"

# After editing, restart service
Restart-Service ITMonitoringAgent
```

### Uninstallation

```powershell
# Stop service
Stop-Service ITMonitoringAgent -Force

# Remove service
sc.exe delete ITMonitoringAgent

# Remove files
Remove-Item "C:\Program Files\ITMonitoringAgent" -Recurse -Force

# Remove firewall rule
Remove-NetFirewallRule -DisplayName "IT Monitoring Agent" -ErrorAction SilentlyContinue
```

---

## 🎓 Scenarios

### Scenario A: First-Time Installation (Interactive)

```powershell
# Step 1: Open PowerShell as Administrator
# Step 2: Navigate to installer directory
cd D:\Downloads\ITMonitoringAgent

# Step 3: Run installer
.\Install-ITMonitoringAgent.ps1

# Step 4: Press any key when prompted
# Step 5: Wait for installation (2-3 minutes)
# Step 6: When asked "Open Portal?", type Y
# Step 7: Login to portal and verify
```

### Scenario B: Mass Deployment (100+ Computers)

```powershell
# On deployment server:

# 1. Create network share
New-Item "\\fileserver\IT\MonitoringAgent" -ItemType Directory
Copy-Item * "\\fileserver\IT\MonitoringAgent\"

# 2. Create GPO startup script
$scriptContent = @'
PowerShell.exe -ExecutionPolicy Bypass -NoProfile -File "\\fileserver\IT\MonitoringAgent\Install-ITMonitoringAgent.ps1" -BackendUrl "https://itmanagement.company.com/api/monitoring/events" -RegistrationUrl "https://itmanagement.company.com/api/monitoring/register" -Silent
'@

# 3. Apply to computer OU
# 4. Force GP update: gpupdate /force
# 5. Monitor installations via IT Portal
```

### Scenario C: Development/Testing

```powershell
# Use local backend
.\Install-ITMonitoringAgent.ps1 `
    -BackendUrl "http://localhost:5001/api/monitoring/events" `
    -RegistrationUrl "http://localhost:5001/api/monitoring/register" `
    -RegistrationToken "test-token-123" `
    -InstallPath "C:\Dev\ITMonitor"

# Verify
.\Verify-Installation.ps1

# Watch logs real-time
Get-Content "C:\Dev\ITMonitor\logs\service.log" -Tail 20 -Wait
```

### Scenario D: Re-installation/Update

```powershell
# Just run installer again
.\Install-ITMonitoringAgent.ps1 -Silent

# Installer will:
# - Stop existing service
# - Update files
# - Restart service
```

---

## 📝 Best Practices

### For IT Administrators

1. **Test in lab first**
   - Install on test VM
   - Verify functionality
   - Check portal integration
   - Test for 24 hours

2. **Pilot deployment**
   - Deploy to 10-20 users
   - Monitor for issues
   - Collect feedback
   - Adjust parameters

3. **Production rollout**
   - Deploy in waves (100 computers at a time)
   - Monitor installation logs
   - Watch for errors in portal
   - Have helpdesk ready

4. **Ongoing maintenance**
   - Check portal daily for offline agents
   - Review error logs weekly
   - Update agents quarterly
   - Audit configurations monthly

### For Developers

1. **Version control**
   - Track all script changes
   - Document modifications
   - Tag releases

2. **Testing**
   - Test on clean Windows 10
   - Test on clean Windows 11
   - Test with/without Python
   - Test with corporate proxy
   - Test on domain vs workgroup

3. **Documentation**
   - Update docs with every change
   - Include examples
   - Document parameters
   - Add troubleshooting for new issues

---

## 🎯 Success Criteria

Installation is successful if:

- [x] Script completes without errors
- [x] Service is created and running
- [x] Configuration file is valid
- [x] Logs show agent activity
- [x] Computer appears in IT Portal within 5 minutes
- [x] Telemetry data is flowing
- [x] No errors in error logs
- [x] Service survives reboot

---

## 📞 Getting Help

### Self-Service (Try This First)

1. **Run verification:**
```powershell
.\Verify-Installation.ps1
```

2. **Check logs:**
```powershell
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log" -Tail 50
```

3. **Restart service:**
```powershell
Restart-Service ITMonitoringAgent
```

4. **Re-run installer:**
```powershell
.\Install-ITMonitoringAgent.ps1
```

### Contact IT Support

If self-service doesn't work:

**Email:** support@company.com  
**Portal:** https://itmanagement.company.com  
**Phone:** Extension 5555

**Include this information:**
- Installation log: `%TEMP%\installation_*.log`
- Service error log: `...\ITMonitoringAgent\logs\service_error.log`
- Verification output: `.\Verify-Installation.ps1`
- Windows version: `systeminfo | findstr OS`
- When issue started

---

## 🎉 Summary

**You now have:**
- ✅ Robust PowerShell installer
- ✅ Professional NSIS installer
- ✅ Comprehensive documentation
- ✅ Testing and verification tools
- ✅ Troubleshooting guides
- ✅ Deployment strategies

**Choose your installation method:**
- **End users:** Download and run from IT Portal
- **IT admins:** Use PowerShell script for automation
- **Enterprise:** Deploy via GPO/SCCM

**Everything is production-ready!** 🚀

---

**Last Updated:** 2024  
**Version:** 2.0.0  
**Status:** ✅ Complete



