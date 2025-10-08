# IT Management Monitoring Agent - Professional Windows MSI Installer

## 🎯 Overview

This is a **production-ready Windows MSI installer** for the IT Management Monitoring Agent. It provides a complete, self-contained installation package that requires **zero manual setup** from end users.

### ✨ Key Features

- ✅ **Bundled Python Runtime** - No Python installation required
- ✅ **Wizard Installation UI** - Professional "Next → Next → Finish" experience
- ✅ **Silent Installation** - Full support for unattended enterprise deployment
- ✅ **Windows Service** - Automatic background operation using NSSM or pywin32
- ✅ **Auto-Configuration** - Generates config.json with all settings
- ✅ **Auto-Start** - Service starts automatically after installation
- ✅ **Clean Uninstall** - Complete removal including service and registry
- ✅ **Enterprise Ready** - GPO, Intune, SCCM deployment support
- ✅ **Error Handling** - Graceful failure with detailed logging
- ✅ **Upgrade Support** - Seamless upgrades from older versions

### 📦 What's Included

The MSI bundles everything needed:

- Python 3.11.9 embeddable distribution (~12 MB)
- Python packages: psutil, requests, watchdog, pywin32
- NSSM service manager for reliable Windows service
- Monitoring agent script (monitoring_agent.py)
- Service wrapper for pywin32 fallback
- Configuration generator
- Installation helpers and documentation

---

## 🚀 Quick Start

### Build the MSI (5 minutes)

1. **Install WiX Toolset:**
   - Download from https://wixtoolset.org/releases/
   - Or run: `dotnet tool install --global wix`

2. **Build:**
   ```cmd
   cd installer\windows-msi
   build.bat
   ```

3. **Find your MSI:**
   ```
   output\ITMonitoringAgent-1.0.0.msi
   ```

That's it! The build script handles everything automatically.

### Test Installation

Double-click the MSI to test interactively, or run:

```cmd
powershell -ExecutionPolicy Bypass .\test-install.ps1 -TestMode Silent
```

---

## 📚 Documentation

### For Building

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md)** - Complete build documentation (50+ pages)

### For Deployment

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Enterprise deployment methods
  - Group Policy (Active Directory)
  - Microsoft Intune
  - SCCM
  - PDQ Deploy
  - PowerShell remote installation

### For End Users

- **[README.txt](README.txt)** - End-user documentation included in installer
- **[License.txt](License.txt)** - License agreement

---

## 📁 Project Structure

```
installer/windows-msi/
├── 📄 Build-Production-MSI.ps1      # Main build script (auto-downloads Python)
├── 📄 build.bat                      # Simple wrapper for build script
├── 📄 Product.wxs                    # WiX main installer definition
├── 📄 CustomUI.wxs                   # Custom wizard UI dialogs
├── 📄 InstallHelper.ps1              # MSI custom actions (config, service)
├── 📄 service_wrapper.py             # Python Windows service wrapper
├── 📄 test-install.ps1               # Installation test suite
│
├── 📄 README_MSI_INSTALLER.md        # This file - overview
├── 📄 QUICK_START.md                 # 5-minute quick start guide
├── 📄 PRODUCTION_BUILD_GUIDE.md      # Complete build documentation
├── 📄 DEPLOYMENT_GUIDE.md            # Enterprise deployment guide
├── 📄 License.txt                    # EULA for installer
├── 📄 README.txt                     # End-user documentation
│
├── 📁 python/                        # (auto-generated) Bundled Python
├── 📁 obj/                           # (auto-generated) Build artifacts
└── 📁 output/                        # (auto-generated) Final MSI
```

---

## 🛠️ Build Requirements

| Component | Version | Required | Download |
|-----------|---------|----------|----------|
| **WiX Toolset** | 3.11+ | ✅ Yes | https://wixtoolset.org/releases/ |
| **PowerShell** | 5.1+ | ✅ Yes | Included with Windows 10/11 |
| **Internet** | - | ✅ Yes (first build) | For downloading Python/NSSM |
| **Windows** | 10/11 | ✅ Yes | Build environment |
| **.NET SDK** | 4.5+ | Optional | For `dotnet tool install wix` |

---

## 🎨 Build Options

### Basic Build

```cmd
build.bat
```

Creates: `output\ITMonitoringAgent-1.0.0.msi`

### Custom Version

```cmd
build.bat --version 1.2.3
```

Creates: `output\ITMonitoringAgent-1.2.3.msi`

### With Cleanup

```cmd
build.bat --version 1.0.0 --clean
```

Removes build artifacts after successful build.

### Skip Python Download

```cmd
build.bat --skip-python
```

Uses previously downloaded Python (faster for repeated builds).

### PowerShell (Advanced)

```powershell
.\Build-Production-MSI.ps1 `
    -Version "1.2.3" `
    -PythonVersion "3.11.9" `
    -Manufacturer "Your Company IT" `
    -Clean
```

---

## 📦 Installation Methods

### Interactive (End Users)

```cmd
# Double-click the MSI, or:
msiexec /i ITMonitoringAgent-1.0.0.msi
```

User follows wizard, enters configuration.

### Silent (Enterprise)

```cmd
msiexec /i ITMonitoringAgent-1.0.0.msi ^
  BACKENDURL="https://backend.com/api/monitoring/events" ^
  REGISTRATIONURL="https://backend.com/api/monitoring/register" ^
  REGISTRATIONTOKEN="your-token-here" ^
  /quiet /norestart
```

No user interaction required.

### Group Policy

1. Create network share with MSI
2. Create GPO → Software Installation
3. Assign MSI to computers
4. Deploy via GPO refresh

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.

### Microsoft Intune

1. Upload MSI as Line-of-Business app
2. Configure installation command
3. Assign to device groups
4. Monitor deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.

---

## 🔧 Configuration

### MSI Properties

Configure via command-line or GPO transforms:

| Property | Description | Default |
|----------|-------------|---------|
| `BACKENDURL` | Backend API endpoint | `https://itmanagement.company.com/api/monitoring/events` |
| `REGISTRATIONURL` | Registration endpoint | `https://itmanagement.company.com/api/monitoring/register` |
| `REGISTRATIONTOKEN` | One-time registration token | (empty) |
| `POLLINGINTERVAL` | Data collection interval (seconds) | `60` |
| `OPENPORTAL` | Open web portal after install | `1` (yes) |

### Example

```cmd
msiexec /i ITMonitoringAgent-1.0.0.msi ^
  BACKENDURL="https://prod.backend.com/api/monitoring/events" ^
  REGISTRATIONURL="https://prod.backend.com/api/monitoring/register" ^
  REGISTRATIONTOKEN="abc123def456" ^
  POLLINGINTERVAL="30" ^
  OPENPORTAL="0" ^
  /quiet /norestart
```

---

## ✅ Testing

### Test Suite

Run comprehensive tests:

```powershell
powershell -ExecutionPolicy Bypass .\test-install.ps1 -TestMode All
```

Test modes:
- `Interactive` - Manual wizard installation
- `Silent` - Unattended installation
- `SilentWithLog` - Silent with detailed logging
- `CustomParams` - Test custom configuration
- `All` - Run all tests sequentially

### Verification

After installation, verify:

```cmd
# Service running?
sc query ITMonitoringAgent

# Files installed?
dir "C:\Program Files\ITMonitoringAgent"

# Agent working?
type "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log"

# Registry keys?
reg query HKLM\SOFTWARE\ITMonitoringAgent
```

### Test VM

**Always test on a clean Windows VM before production!**

Requirements:
- Windows 10 or 11 (64-bit)
- No Python installed
- Administrator access
- Network connectivity to backend

---

## 🎯 What Gets Installed

### Installation Location

```
C:\Program Files\ITMonitoringAgent\
├── python\                     # Python 3.11.9 embeddable
│   ├── python.exe
│   ├── python311.dll
│   ├── Lib\
│   └── Scripts\
├── monitoring_agent.py         # Main agent script
├── service_wrapper.py          # Windows service wrapper
├── config.json                 # Configuration file
├── nssm.exe                    # Service manager
├── requirements.txt            # Dependency list
├── InstallHelper.ps1           # Installation helper
├── README.txt                  # Documentation
├── License.txt                 # License
├── logs\                       # Agent logs
│   ├── monitoring_agent.log
│   ├── service.log
│   └── service_error.log
└── cache\                      # Telemetry cache
    └── telemetry_cache.json
```

### Windows Service

```
Service Name: ITMonitoringAgent
Display Name: IT Management Monitoring Agent
Description: Monitors system performance and security for IT management
Startup Type: Automatic
Log On As: Local System
```

### Registry Keys

```
HKLM\SOFTWARE\ITMonitoringAgent\
  - InstallPath
  - BackendUrl
  - RegistrationUrl
  - Version
```

### Start Menu Shortcuts

```
Start Menu → IT Management Monitoring Agent\
  - View Agent Logs
  - Agent Configuration
  - IT Management Portal
  - Uninstall IT Monitoring Agent
```

### Firewall Rules

```
Rule: IT Monitoring Agent
Direction: Outbound
Action: Allow
Program: C:\Program Files\ITMonitoringAgent\python\python.exe
```

---

## 🔄 Upgrades

The MSI handles upgrades automatically:

```cmd
# Install newer version over older
msiexec /i ITMonitoringAgent-1.2.0.msi /quiet /norestart
```

The installer will:
1. Stop the service
2. Remove old files
3. Install new files
4. Preserve configuration
5. Restart the service

### Upgrade Code

The `UpgradeCode` in `Product.wxs` identifies the product:

```xml
<?define UpgradeCode="12345678-1234-1234-1234-123456789012" ?>
```

**Important:** Don't change this GUID - it enables automatic upgrades!

---

## 🗑️ Uninstallation

### Interactive

```
Control Panel → Programs and Features → IT Management Monitoring Agent → Uninstall
```

Or from Start Menu → Uninstall shortcut.

### Silent

```cmd
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
```

Or use Product Code:

```cmd
msiexec /x {PRODUCT-CODE-GUID} /quiet /norestart
```

### What Gets Removed

- ✅ All installed files
- ✅ Windows service (stopped and deleted)
- ✅ Registry keys
- ✅ Start menu shortcuts
- ✅ Firewall rules
- ⚠️ Logs preserved (configurable)

---

## 🎨 Customization

### Company Branding

1. **Change product name** in `Product.wxs`:
   ```xml
   <?define ProductName="Your Company IT Agent" ?>
   <?define Manufacturer="Your Company Name" ?>
   ```

2. **Add your icon** (493×58 and 493×312 pixels):
   ```
   Save as icon.ico in windows-msi folder
   ```

3. **Customize wizard images** in `CustomUI.wxs`

4. **Generate new UpgradeCode**:
   ```powershell
   [guid]::NewGuid()
   ```

### Default URLs

Edit `Product.wxs`:

```xml
<Property Id="BACKENDURL" Value="https://your-backend.com/api/monitoring/events" />
<Property Id="REGISTRATIONURL" Value="https://your-backend.com/api/monitoring/register" />
```

### Service Configuration

Edit `InstallHelper.ps1` in `CreateService` action:

```powershell
# Change service display name
& $nssmPath set $ServiceName DisplayName "Your Custom Name"

# Change polling interval default
# Edit Product.wxs
<Property Id="POLLINGINTERVAL" Value="30" />
```

---

## 🔍 Troubleshooting

### Build Issues

**WiX not found:**
```
Install WiX Toolset from https://wixtoolset.org/releases/
Restart terminal after installation
```

**Python download fails:**
```
Check internet connection
Or download manually and use --skip-python
```

**Candle.exe errors:**
```
Check Product.wxs syntax
Review line numbers in error output
Ensure all source files exist
```

### Installation Issues

**Service won't start:**
```
Check: C:\Program Files\ITMonitoringAgent\logs\service_error.log
Check: Event Viewer → Windows Logs → Application
Common: Backend URL unreachable, config.json invalid
```

**Missing dependencies:**
```
Run: C:\Program Files\ITMonitoringAgent\python\python.exe -c "import psutil"
If error, reinstall or run InstallHelper.ps1 manually
```

**Registration fails:**
```
Check backend URL accessibility
Verify registration token is valid
Check network firewall rules
```

### Logs

Installation logs:
```
C:\Program Files\ITMonitoringAgent\msi_install.log
%TEMP%\MSI*.log
```

Service logs:
```
C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log
C:\Program Files\ITMonitoringAgent\logs\service_error.log
```

Windows Event Log:
```
Event Viewer → Windows Logs → Application
Filter: Source = "ITMonitoringAgent" or "MsiInstaller"
```

---

## 📊 MSI Details

### Package Info

- **Format:** Windows Installer 2.0+
- **Scope:** Per-Machine (requires admin)
- **Platform:** x64 only
- **Size:** ~30-40 MB (includes Python)
- **Compression:** Cabinet embedded
- **UI Level:** Full wizard or silent

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 3010 | Success, reboot required |
| 1602 | User cancelled |
| 1603 | Fatal error |
| 1619 | MSI package not found |

### Silent Install Exit Codes

Check with:
```cmd
echo %ERRORLEVEL%
```

---

## 🔐 Security

### Code Signing (Recommended)

```powershell
# Sign the MSI
signtool sign /f "cert.pfx" /p "password" `
  /t http://timestamp.digicert.com `
  /d "IT Management Monitoring Agent" `
  ITMonitoringAgent-1.0.0.msi

# Verify
signtool verify /pa ITMonitoringAgent-1.0.0.msi
```

Benefits:
- Prevents SmartScreen warnings
- Builds user trust
- Prevents tampering
- Required by many enterprises

### Permissions

Service runs as:
- **Local System** (default)
- Has network access for backend communication
- Can monitor all system processes and files

Configuration file:
- Restricted ACLs (Administrators + SYSTEM only)
- Protects registration tokens

---

## 📈 Production Deployment Checklist

Before deploying to production:

- [ ] Test on clean Windows 10 VM
- [ ] Test on clean Windows 11 VM  
- [ ] Verify service auto-starts
- [ ] Confirm backend registration works
- [ ] Test silent installation
- [ ] Test uninstallation
- [ ] Code sign MSI (recommended)
- [ ] Update version number
- [ ] Set production backend URLs
- [ ] Generate unique registration tokens
- [ ] Test firewall rules
- [ ] Verify log rotation
- [ ] Document deployment procedure
- [ ] Train help desk staff
- [ ] Notify users (if required)
- [ ] Prepare rollback plan
- [ ] Pilot with small group
- [ ] Monitor pilot deployments
- [ ] Full deployment approval

---

## 📞 Support

### Documentation

- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Build Guide:** [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **End User:** [README.txt](README.txt)

### Resources

- **WiX Documentation:** https://wixtoolset.org/documentation/
- **Python Embeddable:** https://docs.python.org/3/using/windows.html
- **NSSM:** https://nssm.cc/
- **Windows Installer:** https://docs.microsoft.com/en-us/windows/win32/msi/

### Contact

- **IT Operations:** it-operations@company.com
- **Help Desk:** Extension 5555
- **Internal Wiki:** https://wiki.company.com/it-monitoring

---

## 📄 License

Copyright © 2024 Your Company Name. All rights reserved.

---

## 🎉 Acknowledgments

- **WiX Toolset** - Open-source Windows installer framework
- **NSSM** - Non-Sucking Service Manager
- **Python Software Foundation** - Python runtime
- **psutil, requests, watchdog** - Python packages

---

**Version:** 2.0  
**Last Updated:** October 2024  
**Status:** Production Ready ✅  
**Maintained by:** IT Operations Team

---

## 🚀 Get Started Now

```cmd
cd installer\windows-msi
build.bat
```

**That's it!** Your production-ready MSI will be in `output\` folder in ~5 minutes.

For questions or issues, see [PRODUCTION_BUILD_GUIDE.md](PRODUCTION_BUILD_GUIDE.md) or contact IT Operations.

