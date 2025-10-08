# Windows MSI Installer - Complete Guide

## Overview

This directory contains a professional **Windows MSI installer** for the IT Management Monitoring Agent, built with WiX Toolset. It provides a traditional "Next → Next → Finish" installation experience with full automation.

## ✨ Key Features

✅ **Professional MSI Package**
- Standard Windows Installer (MSI) format
- Digital signature support
- Add/Remove Programs integration
- Automatic upgrade handling

✅ **Automated Installation**
- One-click installation
- Automatic Python dependency installation
- Automatic Windows service creation
- No PowerShell execution required

✅ **Custom Configuration Dialog**
- Backend URL input
- Registration URL input  
- Registration Token input (password-masked)
- Polling interval configuration
- "Open Portal" checkbox

✅ **Silent Installation Support**
- Command-line parameters
- GPO deployment ready
- SCCM/Intune compatible
- Unattended installation

✅ **Service Management**
- NSSM-based service creation
- Automatic log rotation
- Failure recovery configured
- Auto-start on boot

---

## 📦 What's Included

### Source Files

```
installer/windows-msi/
├── Product.wxs              # Main WiX product definition
├── CustomUI.wxs             # Custom configuration dialog
├── InstallHelper.ps1        # PowerShell helper for custom actions
├── build-msi.ps1            # Build script (PowerShell)
├── build.bat                # Build script (simple batch)
├── service_wrapper.py       # Windows service wrapper
├── License.txt              # EULA
├── README.txt               # User documentation
├── monitoring_agent.py      # Agent (auto-copied from agent/)
├── requirements.txt         # Dependencies (auto-copied)
└── nssm.exe                 # NSSM (auto-downloaded)
```

### Generated Output

- **ITMonitoringAgent-1.0.0.msi** - The installable MSI package

---

## 🚀 Building the MSI

### Prerequisites

1. **WiX Toolset 3.11+**
   ```
   Download from: https://wixtoolset.org/releases/
   Install with defaults
   ```

2. **Visual Studio Build Tools** (optional, for advanced features)
   ```
   Download from: https://visualstudio.microsoft.com/downloads/
   Select "Build Tools for Visual Studio"
   ```

3. **Files in place**
   - `monitoring_agent.py` (copied from `../../agent/`)
   - `service_wrapper.py`
   - `nssm.exe` (auto-downloaded if missing)

### Build Steps

#### Method 1: Simple Batch Script

```batch
cd installer\windows-msi
build.bat
```

#### Method 2: PowerShell Script

```powershell
cd installer\windows-msi
.\build-msi.ps1
```

#### Method 3: Manual Build

```batch
REM Copy agent files
copy ..\..\agent\monitoring_agent.py .
copy ..\..\agent\requirements.txt .

REM Compile WiX files
candle Product.wxs -ext WixUIExtension -ext WixUtilExtension -out obj\Product.wixobj
candle CustomUI.wxs -ext WixUIExtension -out obj\CustomUI.wixobj

REM Link into MSI
light obj\Product.wixobj obj\CustomUI.wixobj -ext WixUIExtension -ext WixUtilExtension -out ITMonitoringAgent-1.0.0.msi
```

### Output

```
✓ ITMonitoringAgent-1.0.0.msi created
Size: ~5-8 MB
```

---

## 📥 Installing the MSI

### Interactive Installation

1. **Double-click** `ITMonitoringAgent-1.0.0.msi`
2. Click **Next** on Welcome screen
3. **Accept** license agreement
4. **Enter configuration**:
   - Backend URL (pre-filled)
   - Registration URL (pre-filled)
   - Registration Token (if you have one)
   - Polling Interval (default: 60 seconds)
   - ✓ Check "Open IT Management Portal" (optional)
5. Click **Next**
6. **Wait** for installation (2-3 minutes)
7. Click **Finish**
8. Portal opens automatically (if selected)

### Silent Installation

```batch
REM Basic silent install
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart

REM With configuration
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart BACKENDURL="https://backend.com/api" REGISTRATIONTOKEN="token123"

REM Full parameters
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart BACKENDURL="https://backend.com/api/monitoring/events" REGISTRATIONURL="https://backend.com/api/monitoring/register" REGISTRATIONTOKEN="abc123" POLLINGINTERVAL="30" OPENPORTAL="0"

REM With logging
msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart /l*v install.log
```

### Uninstallation

```batch
REM Interactive
msiexec /x ITMonitoringAgent-1.0.0.msi

REM Silent
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
```

---

## 🎯 MSI Properties (Command-Line Parameters)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `BACKENDURL` | String | https://itmanagement.company.com/api/monitoring/events | Backend API URL |
| `REGISTRATIONURL` | String | https://itmanagement.company.com/api/monitoring/register | Registration endpoint |
| `REGISTRATIONTOKEN` | String | (empty) | One-time registration token |
| `POLLINGINTERVAL` | Integer | 60 | Telemetry interval (seconds) |
| `OPENPORTAL` | 0 or 1 | 1 | Open portal after install |
| `INSTALLFOLDER` | Path | C:\Program Files\ITMonitoringAgent | Installation directory |

---

## 🔧 What the Installer Does

### Step-by-Step Installation Process

1. **Welcome Screen**
   - Displays product information
   - Privacy notice about monitoring

2. **License Agreement**
   - Shows EULA
   - Requires acceptance to continue

3. **Configuration Dialog**
   - User enters/confirms URLs and token
   - Sets polling interval
   - Chooses portal launch option

4. **Installation Progress**
   - Copies files to Program Files
   - Installs Python dependencies via pip
   - Creates config.json
   - Creates Windows service with NSSM
   - Configures firewall
   - Starts service

5. **Completion**
   - Shows success message
   - Opens portal (if selected)
   - Creates Start Menu shortcuts

### File Layout After Installation

```
C:\Program Files\ITMonitoringAgent\
├── monitoring_agent.py           # Main agent
├── service_wrapper.py            # Service wrapper
├── config.json                   # Configuration (auto-generated)
├── requirements.txt              # Python dependencies list
├── nssm.exe                      # Service manager
├── InstallHelper.ps1             # MSI helper script
├── README.txt                    # User manual
├── LICENSE.txt                   # EULA
├── msi_install.log               # Installation log
├── logs\
│   ├── service.log               # Service stdout
│   └── service_error.log         # Service stderr
└── cache\
    └── telemetry_cache.json      # Offline telemetry cache
```

### Registry Entries

```
HKLM\SOFTWARE\ITMonitoringAgent\
├── InstallPath = "C:\Program Files\ITMonitoringAgent"
├── BackendUrl = "https://..."
├── RegistrationUrl = "https://..."
└── Version = "1.0.0"
```

### Windows Service

- **Name:** ITMonitoringAgent
- **Display Name:** IT Management Monitoring Agent
- **Description:** Monitors system performance and security
- **Startup Type:** Automatic
- **Recovery:** Restart on failure (3 times)
- **Working Directory:** C:\Program Files\ITMonitoringAgent
- **Logs:** service.log, service_error.log

### Start Menu Shortcuts

```
Start Menu\Programs\IT Monitoring Agent\
├── View Agent Logs
├── Agent Configuration
├── IT Management Portal
└── Uninstall IT Monitoring Agent
```

---

## 🎓 Enterprise Deployment

### Group Policy Deployment

1. **Copy MSI to network share:**
```batch
copy ITMonitoringAgent-1.0.0.msi \\fileserver\IT\Software\
```

2. **Create GPO:**
   - Open Group Policy Management
   - Create new GPO: "IT Monitoring Agent"
   - Edit GPO
   - Computer Configuration → Policies → Software Settings → Software Installation
   - Right-click → New → Package
   - Browse to `\\fileserver\IT\Software\ITMonitoringAgent-1.0.0.msi`
   - Select "Assigned"

3. **Configure MSI properties (optional):**
   - Properties → Modifications → Add
   - Create MST transform file with parameters

### SCCM Deployment

**Application Creation:**

1. **General:**
   - Name: IT Management Monitoring Agent
   - Version: 1.0.0

2. **Deployment Type:**
   - Type: Windows Installer (*.msi)
   - Content location: `\\server\share\ITMonitoringAgent-1.0.0.msi`

3. **Installation Program:**
```batch
msiexec /i ITMonitoringAgent-1.0.0.msi BACKENDURL="https://backend.company.com/api" REGISTRATIONTOKEN="%TOKEN%" /quiet /norestart
```

4. **Uninstall Program:**
```batch
msiexec /x {PRODUCT-GUID} /quiet /norestart
```

5. **Detection Method:**
   - File exists: `C:\Program Files\ITMonitoringAgent\monitoring_agent.py`
   - Or Registry: `HKLM\SOFTWARE\ITMonitoringAgent\Version` equals "1.0.0"

6. **User Experience:**
   - Installation behavior: Install for system
   - Log on requirement: Whether or not a user is logged on
   - Visibility: Hidden
   - Maximum runtime: 30 minutes

### Intune Deployment

**App Type:** Line-of-business app (MSI)

**App information:**
- Name: IT Management Monitoring Agent
- Description: System monitoring for IT management
- Publisher: Your Company IT

**Program:**
- Install command: `msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart`
- Uninstall command: `msiexec /x {PRODUCT-GUID} /quiet /norestart`

**Requirements:**
- Operating system: Windows 10 1607+
- Architecture: x64

**Detection rules:**
- Rule type: File
- Path: `C:\Program Files\ITMonitoringAgent`
- File or folder: `monitoring_agent.py`
- Detection method: File or folder exists

---

## 🐛 Troubleshooting

### Build Issues

**Error: "WiX Toolset not found"**

**Solution:**
```
1. Download WiX from https://wixtoolset.org/releases/
2. Install with default options
3. Restart command prompt
4. Verify: echo %WIX%
5. Run build script again
```

**Error: "monitoring_agent.py not found"**

**Solution:**
```powershell
# Make sure you're in the right directory
cd installer\windows-msi

# Copy agent file
Copy-Item ..\..\agent\monitoring_agent.py .

# Run build again
.\build-msi.ps1
```

**Error: "Candle.exe failed with error"**

**Check:**
- WiX source files have valid XML
- All referenced files exist
- No syntax errors in .wxs files

### Installation Issues

**Error: "Installation failed with error 1603"**

**Check MSI log:**
```batch
msiexec /i ITMonitoringAgent-1.0.0.msi /l*v install_log.txt
```

Review `install_log.txt` for specific errors.

**Common causes:**
- Python not installed and auto-install failed
- Network issues downloading dependencies
- Insufficient disk space
- Conflicting software

**Error: "Service failed to start"**

**Check:**
```powershell
# View MSI installation log
Get-Content "C:\Program Files\ITMonitoringAgent\msi_install.log"

# View service error log
Get-Content "C:\Program Files\ITMonitoringAgent\logs\service_error.log"

# Try manual start
Start-Service ITMonitoringAgent
```

---

## 🔒 Security & Code Signing

### Code Signing the MSI

**Why sign?**
- Prevents security warnings
- Verifies publisher identity
- Required for some enterprise deployments

**How to sign:**

```powershell
# Using signtool (Windows SDK)
$signtool = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe"

# Sign with certificate
& $signtool sign /f "C:\Certs\certificate.pfx" /p "password" /t http://timestamp.digicert.com /d "IT Monitoring Agent" ITMonitoringAgent-1.0.0.msi

# Verify signature
& $signtool verify /pa ITMonitoringAgent-1.0.0.msi
```

### Best Practices

1. **Use EV Code Signing Certificate** (Extended Validation)
   - No SmartScreen warnings
   - Immediate trust
   - Required for kernel drivers (not applicable here)

2. **Timestamp the signature**
   - Signature remains valid after certificate expires
   - Use reliable timestamp server

3. **Verify before distribution**
   - Test signed MSI on clean machine
   - Verify no security warnings

---

## 📊 Comparison: MSI vs PowerShell Installer

| Feature | PowerShell Script | MSI Installer | Winner |
|---------|-------------------|---------------|--------|
| **Ease of Use** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | MSI |
| **Familiar UI** | ⭐⭐ | ⭐⭐⭐⭐⭐ | MSI |
| **Silent Install** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Tie |
| **Customization** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | PowerShell |
| **Build Complexity** | ⭐⭐⭐⭐⭐ (none) | ⭐⭐ (requires WiX) | PowerShell |
| **File Size** | Small (~2MB) | Medium (~8MB) | PowerShell |
| **Uninstall** | Manual | ⭐⭐⭐⭐⭐ Automatic | MSI |
| **Upgrade Handling** | Manual | ⭐⭐⭐⭐⭐ Automatic | MSI |
| **GPO Deployment** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | MSI |
| **Code Signing** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | MSI |

### When to Use Which?

**Use MSI when:**
- Deploying to non-technical end users
- Need familiar Windows installer UI
- Want automatic uninstall handling
- Deploying via GPO (preferred method)
- Need code signing for trust
- Want automatic upgrade detection

**Use PowerShell when:**
- Need maximum flexibility
- Frequent updates/iterations
- Development/testing
- Don't want to install WiX
- Need custom logic
- Quick deployment

**Recommendation:** Use **both**!
- MSI for end users and production
- PowerShell for development and quick fixes

---

## 📝 Customization

### Change Default URLs

Edit `Product.wxs`:

```xml
<Property Id="BACKENDURL" Value="https://your-backend.com/api/monitoring/events">
```

### Change Installation Directory

Edit `Product.wxs`:

```xml
<Directory Id="INSTALLFOLDER" Name="YourCustomFolder">
```

### Add Custom Files

Edit `Product.wxs`:

```xml
<File Id="YourFile"
      Source="yourfile.txt"
      Checksum="yes" />
```

### Modify Service Configuration

Edit `InstallHelper.ps1` in the `CreateService` section.

---

## 🧪 Testing

### Test Matrix

| Scenario | Test | Expected Result |
|----------|------|-----------------|
| Clean Windows 10 | Install MSI | ✓ Success |
| Windows 11 | Install MSI | ✓ Success |
| Python pre-installed | Install MSI | ✓ Uses existing Python |
| No Python | Install MSI | ✓ Installs Python |
| Silent install | msiexec /quiet | ✓ Success, no UI |
| With parameters | msiexec BACKENDURL="..." | ✓ Uses provided values |
| Upgrade | Install newer version | ✓ Upgrades automatically |
| Uninstall | Via Control Panel | ✓ Clean removal |

### Testing Checklist

- [ ] MSI builds without errors
- [ ] MSI installs on clean Windows 10
- [ ] MSI installs on Windows 11
- [ ] Python dependencies install correctly
- [ ] Service is created and started
- [ ] Configuration dialog accepts input
- [ ] Config.json is generated correctly
- [ ] Portal opens after install (if selected)
- [ ] Start Menu shortcuts work
- [ ] Service survives reboot
- [ ] Computer appears in IT Portal
- [ ] Telemetry flows correctly
- [ ] Uninstall removes everything
- [ ] Silent install works
- [ ] Parameters are respected
- [ ] MSI log shows no errors

---

## 📋 MSI Properties Reference

### Standard MSI Properties

```batch
REM Installation directory
INSTALLFOLDER="D:\CustomPath\ITMonitoring"

REM Skip UI completely
/quiet or /qn

REM Show progress only
/passive or /qb

REM Enable verbose logging
/l*v logfile.txt

REM No restart
/norestart

REM Force restart
/forcerestart
```

### Custom Properties

```batch
REM Backend configuration
BACKENDURL="https://backend.company.com/api/monitoring/events"
REGISTRATIONURL="https://backend.company.com/api/monitoring/register"
REGISTRATIONTOKEN="your-token-here"

REM Agent settings
POLLINGINTERVAL="30"

REM UI options
OPENPORTAL="0"  (0=no, 1=yes)
```

### Example: Complete Silent Install

```batch
msiexec /i ITMonitoringAgent-1.0.0.msi ^
  /quiet ^
  /norestart ^
  /l*v "%TEMP%\ITMonitor_install.log" ^
  INSTALLFOLDER="C:\Program Files\ITMonitoringAgent" ^
  BACKENDURL="https://itmanagement.company.com/api/monitoring/events" ^
  REGISTRATIONURL="https://itmanagement.company.com/api/monitoring/register" ^
  REGISTRATIONTOKEN="abc123xyz789" ^
  POLLINGINTERVAL="60" ^
  OPENPORTAL="0"
```

---

## 🔄 Updates & Upgrades

### Updating to New Version

The MSI handles upgrades automatically:

1. **Build new version:**
```powershell
.\build-msi.ps1 -Version "1.0.1"
```

2. **Install new version:**
```batch
msiexec /i ITMonitoringAgent-1.0.1.msi
```

3. **MSI will:**
   - Detect existing installation
   - Stop service
   - Replace files
   - Preserve configuration
   - Restart service

### Patch vs Upgrade

**Minor updates** (1.0.0 → 1.0.1):
- Create new MSI with updated version
- Install over existing

**Major updates** (1.0.0 → 2.0.0):
- May require uninstall-reinstall
- Or create upgrade code mapping

---

## 🆘 Support

### Common Issues

**Issue: MSI won't install - "Another version is installed"**

**Solution:**
```batch
REM Uninstall old version first
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet
REM Install new version
msiexec /i ITMonitoringAgent-1.0.1.msi
```

**Issue: "Python not found" during installation**

**Check:**
- MSI installation log: `msiexec /i ... /l*v log.txt`
- Look for Python installation step
- May need to pre-install Python manually

**Issue: Custom action failed**

**Debug:**
```batch
REM Install with verbose logging
msiexec /i ITMonitoringAgent-1.0.0.msi /l*vx debug.log

REM Search log for "CustomAction" and "return value 3"
findstr /C:"CustomAction" /C:"return value 3" debug.log
```

### Getting Help

**Documentation:**
- This file (MSI_INSTALLER_README.md)
- COMPLETE_GUIDE.md (overall guide)
- WiX documentation: https://wixtoolset.org/documentation/

**Support:**
- Email: support@company.com
- Portal: https://itmanagement.company.com

**When reporting issues:**
- Include MSI installation log
- Include `msi_install.log` from install directory
- Include Windows version and architecture
- Describe expected vs actual behavior

---

## ✅ Production Checklist

Before deploying MSI to production:

- [ ] Test on clean Windows 10
- [ ] Test on Windows 11
- [ ] Test with Python pre-installed
- [ ] Test without Python
- [ ] Test silent installation
- [ ] Test with all parameters
- [ ] Test upgrade from previous version
- [ ] Test uninstallation
- [ ] Sign MSI with code signing certificate
- [ ] Test on domain-joined computer
- [ ] Verify no antivirus false positives
- [ ] Document deployment process
- [ ] Train helpdesk staff
- [ ] Prepare rollback plan

---

## 🎉 Conclusion

The MSI installer provides a **professional, user-friendly** installation experience ideal for:

- ✅ End-user self-installation
- ✅ Enterprise mass deployment
- ✅ GPO/SCCM/Intune deployment
- ✅ Professional appearance
- ✅ Automatic upgrade handling

**Recommended for:**
- Production deployments
- Non-technical users
- Compliance requirements
- Enterprise environments

**Build it:**
```powershell
.\build-msi.ps1
```

**Deploy it:**
```batch
Double-click ITMonitoringAgent-1.0.0.msi
```

**Done!** ✅

---

**Version:** 1.0.0  
**Technology:** WiX Toolset 3.11  
**Status:** ✅ Production Ready



