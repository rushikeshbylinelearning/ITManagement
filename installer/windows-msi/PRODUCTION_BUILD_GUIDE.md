# IT Management Monitoring Agent - Production MSI Build Guide

## Overview

This guide provides complete instructions for building a production-ready Windows MSI installer for the IT Management Monitoring Agent. The MSI installer bundles everything needed:

- ✅ Python 3.11 embeddable runtime (no separate Python installation needed)
- ✅ All Python dependencies (psutil, requests, watchdog, pywin32)
- ✅ NSSM service manager for reliable Windows service operation
- ✅ Monitoring agent script and configuration
- ✅ Professional wizard-based installation UI
- ✅ Silent installation support for enterprise deployment
- ✅ Automatic service creation and startup
- ✅ Uninstaller with clean removal

---

## Prerequisites

### Required Software

1. **WiX Toolset 3.11 or later**
   - Download: https://wixtoolset.org/releases/
   - Or install via: `dotnet tool install --global wix`
   - After installation, ensure `%WIX%` environment variable is set

2. **PowerShell 5.1 or later** (included with Windows 10/11)

3. **Internet connection** (for downloading Python and NSSM during build)

### Optional

- Windows 10/11 VM for testing
- Code signing certificate (for production deployment)

---

## Project Structure

```
installer/windows-msi/
├── Build-Production-MSI.ps1   # Main build script (downloads Python, builds MSI)
├── build.bat                  # Simple wrapper for Build-Production-MSI.ps1
├── Product.wxs                # Main WiX installer definition
├── CustomUI.wxs               # Custom wizard UI dialogs
├── InstallHelper.ps1          # PowerShell helper for MSI custom actions
├── service_wrapper.py         # Python Windows service wrapper (pywin32)
├── License.txt                # EULA/License agreement
├── README.txt                 # End-user documentation
├── python/                    # (auto-generated) Bundled Python runtime
├── obj/                       # (auto-generated) Build artifacts
└── output/                    # (auto-generated) Final MSI output
```

---

## Building the MSI Installer

### Method 1: Using build.bat (Recommended)

The simplest way to build the MSI:

```cmd
cd installer\windows-msi
build.bat
```

This will:
1. Download Python 3.11.9 embeddable package (~12 MB)
2. Install pip and all dependencies into Python
3. Download NSSM service manager
4. Compile WiX source files
5. Create `ITMonitoringAgent-1.0.0.msi` in the `output/` folder

**Build with specific version:**

```cmd
build.bat --version 1.2.3
```

**Build with cleanup:**

```cmd
build.bat --version 1.0.0 --clean
```

**Build using cached Python (skip download):**

```cmd
build.bat --skip-python
```

### Method 2: Using PowerShell Directly

For more control over the build process:

```powershell
cd installer\windows-msi
.\Build-Production-MSI.ps1 -Version "1.0.0"
```

**Parameters:**

```powershell
.\Build-Production-MSI.ps1 `
    -Version "1.2.3" `
    -PythonVersion "3.11.9" `
    -Manufacturer "Your Company IT" `
    -Clean `
    -SkipPythonDownload
```

---

## Build Process Details

The build script performs these steps:

### Step 1-2: Environment Validation
- Checks for WiX Toolset installation
- Verifies all required source files are present

### Step 3-4: Python Preparation
- Downloads Python embeddable package from python.org
- Extracts to `python/` directory
- Configures Python path file for site-packages
- Downloads and installs pip

### Step 5: Dependency Installation
- Installs psutil (system monitoring)
- Installs requests (HTTP communication)
- Installs watchdog (file system monitoring)
- Installs pywin32 (Windows service support)
- Runs pywin32 post-install configuration

### Step 6: Utility Downloads
- Downloads NSSM 2.24 (service manager)
- Copies monitoring agent files

### Step 7: WiX Compilation
- Uses `heat.exe` to generate Python component definitions
- Creates `Python.wxs` with all Python files

### Step 8-9: MSI Creation
- Compiles `.wxs` files to `.wixobj` using `candle.exe`
- Links `.wixobj` files to create final MSI using `light.exe`

### Step 10: Output
- MSI saved to `output/ITMonitoringAgent-VERSION.msi`
- Typical size: 30-40 MB (includes full Python runtime)

---

## Testing the MSI

### Test on Clean VM

**Always test on a clean Windows 10/11 VM before production deployment!**

1. **Create test VM:**
   - Windows 10 or 11 (64-bit)
   - No Python installed
   - Administrator access

2. **Copy MSI to VM:**
   ```
   Copy output\ITMonitoringAgent-1.0.0.msi to VM
   ```

3. **Interactive installation:**
   - Double-click the MSI
   - Follow the wizard
   - Enter configuration values
   - Complete installation

4. **Verify installation:**
   ```cmd
   # Check if service exists and is running
   sc query ITMonitoringAgent
   
   # View service status
   services.msc
   
   # Check installation files
   dir "C:\Program Files\ITMonitoringAgent"
   
   # View logs
   type "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log"
   ```

5. **Check backend:**
   - Login to IT Management Portal
   - Navigate to Monitoring section
   - Verify agent appears in host list
   - Confirm telemetry data is being received

### Test Silent Installation

```cmd
# Silent install with custom parameters
msiexec /i ITMonitoringAgent-1.0.0.msi ^
  BACKENDURL="https://your-backend.com/api/monitoring/events" ^
  REGISTRATIONURL="https://your-backend.com/api/monitoring/register" ^
  REGISTRATIONTOKEN="your-registration-token-here" ^
  POLLINGINTERVAL="60" ^
  OPENPORTAL="0" ^
  /quiet /norestart /l*v install.log

# Check installation log
type install.log
```

### Test Uninstallation

```cmd
# Silent uninstall
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart

# Verify service removed
sc query ITMonitoringAgent

# Verify files removed
dir "C:\Program Files\ITMonitoringAgent"
```

---

## Customization

### Changing Default Values

Edit `Product.wxs`:

```xml
<Property Id="BACKENDURL" Value="https://your-backend.com/api/monitoring/events" />
<Property Id="REGISTRATIONURL" Value="https://your-backend.com/api/monitoring/register" />
<Property Id="POLLINGINTERVAL" Value="60" />
```

### Changing Installation Directory

Edit `Product.wxs`:

```xml
<Directory Id="INSTALLFOLDER" Name="YourCompanyMonitoring">
```

### Changing Product Information

Edit `Product.wxs`:

```xml
<?define ProductVersion="1.0.0.0" ?>
<?define ProductName="Your Company IT Agent" ?>
<?define Manufacturer="Your Company Name" ?>
<?define UpgradeCode="YOUR-NEW-GUID-HERE" ?>
```

**Important:** Generate a new `UpgradeCode` GUID for your company:
```powershell
[guid]::NewGuid()
```

### Adding Custom Branding

1. **Replace icon:**
   ```
   Save your icon as icon.ico in windows-msi folder
   ```

2. **Add custom images for wizard:**
   - Dialog banner: 493×58 pixels
   - Welcome image: 493×312 pixels
   
   Update `CustomUI.wxs` with image paths.

### Modifying Service Configuration

Edit `InstallHelper.ps1`, in the `CreateService` action:

```powershell
# Change service display name
& $nssmPath set $ServiceName DisplayName "Your Custom Name"

# Change log rotation size (in bytes)
& $nssmPath set $ServiceName AppRotateBytes 52428800  # 50 MB

# Change restart delay (in milliseconds)
& $nssmPath set $ServiceName AppRestartDelay 120000  # 2 minutes
```

---

## Enterprise Deployment

### Group Policy Software Installation

1. **Create network share:**
   ```cmd
   # On file server
   mkdir \\fileserver\software\IT-Monitoring
   copy ITMonitoringAgent-1.0.0.msi \\fileserver\software\IT-Monitoring\
   ```

2. **Create GPO:**
   - Open Group Policy Management
   - Create new GPO: "Deploy IT Monitoring Agent"
   - Edit GPO → Computer Configuration → Policies → Software Settings → Software Installation
   - Right-click → New → Package
   - Browse to `\\fileserver\software\IT-Monitoring\ITMonitoringAgent-1.0.0.msi`
   - Deployment method: **Assigned**

3. **Configure MSI properties:**
   - Right-click package → Properties → Deployment
   - Click **Advanced**
   - Set install options

4. **Create transform file (.mst)** for custom properties:
   ```cmd
   # Use Orca or Windows SDK to create .mst
   # Set BACKENDURL, REGISTRATIONTOKEN, etc.
   ```

5. **Link GPO to OUs:**
   - Link to appropriate computer OUs
   - Clients will install on next reboot

### SCCM/Intune Deployment

**SCCM:**

```cmd
# Detection method
Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"

# Install command
msiexec /i ITMonitoringAgent-1.0.0.msi BACKENDURL="..." REGISTRATIONTOKEN="..." /quiet /norestart

# Uninstall command
msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
```

**Intune:**

1. Add MSI as Line of Business app
2. Configure required properties in app settings
3. Assign to device groups
4. Monitor deployment status

### PDQ Deploy

1. Create new package
2. Add MSI installer
3. Set install command:
   ```cmd
   msiexec /i ITMonitoringAgent-1.0.0.msi BACKENDURL="https://backend.com" REGISTRATIONTOKEN="token" /quiet /norestart
   ```
4. Deploy to collections

---

## Code Signing (Recommended for Production)

### Sign the MSI

```powershell
# Using signtool from Windows SDK
signtool sign /f "YourCertificate.pfx" /p "certificate-password" `
  /t http://timestamp.digicert.com `
  /d "IT Management Monitoring Agent" `
  "ITMonitoringAgent-1.0.0.msi"

# Verify signature
signtool verify /pa "ITMonitoringAgent-1.0.0.msi"
```

### Why Sign?

- ✅ Prevents SmartScreen warnings
- ✅ Builds user trust
- ✅ Prevents tampering
- ✅ Required by some enterprise policies

---

## Troubleshooting

### Build Errors

**Error: WiX Toolset not found**
```
Solution: Install WiX Toolset from https://wixtoolset.org/releases/
Ensure %WIX% environment variable is set
```

**Error: Failed to download Python**
```
Solution: Check internet connection
Or download manually from python.org and place in windows-msi folder
Then use --skip-python flag
```

**Error: Candle.exe failed**
```
Solution: Check Product.wxs for syntax errors
Review error messages for line numbers
Ensure all referenced files exist
```

**Error: Light.exe failed**
```
Solution: Check component GUIDs are unique
Verify all ComponentRef IDs exist
Check for duplicate file IDs
```

### Installation Errors

**Service fails to start**
```
Check: C:\Program Files\ITMonitoringAgent\logs\service_error.log
Check: Event Viewer → Windows Logs → Application
Common issues:
  - Missing Python dependencies
  - Invalid config.json
  - Network connectivity issues
```

**Python import errors**
```
Check: Python installation is complete
Run: C:\Program Files\ITMonitoringAgent\python\python.exe -c "import psutil, requests, watchdog"
Reinstall if packages missing
```

**Configuration not saved**
```
Check: config.json exists in install folder
Check: msi_install.log for errors
Ensure InstallHelper.ps1 ran successfully
```

### Build Performance

**Slow builds:**
- Use `--skip-python` after first successful build
- Python download cached in windows-msi folder
- Reuse NSSM download between builds

**Large MSI size:**
- Expected: 30-40 MB (includes Python)
- Cannot be significantly reduced without removing Python
- Consider compression for distribution

---

## Advanced Topics

### Multi-Version Support

Keep multiple Python versions:

```powershell
.\Build-Production-MSI.ps1 -Version "1.0.0" -PythonVersion "3.11.9"
.\Build-Production-MSI.ps1 -Version "1.0.0" -PythonVersion "3.12.4"
```

### Custom Build Pipeline

Integration with CI/CD:

```yaml
# Example Azure DevOps pipeline
steps:
  - task: PowerShell@2
    inputs:
      filePath: 'installer/windows-msi/Build-Production-MSI.ps1'
      arguments: '-Version $(Build.BuildNumber)'
  
  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: 'installer/windows-msi/output'
      ArtifactName: 'msi-installer'
```

### Automated Testing

```powershell
# Pester test example
Describe "MSI Installer" {
    It "Creates MSI file" {
        Test-Path "output\ITMonitoringAgent-1.0.0.msi" | Should -Be $true
    }
    
    It "MSI is properly signed" {
        # Test signature
        $sig = Get-AuthenticodeSignature "output\ITMonitoringAgent-1.0.0.msi"
        $sig.Status | Should -Be "Valid"
    }
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Test on clean Windows 10 VM
- [ ] Test on clean Windows 11 VM
- [ ] Verify service starts automatically
- [ ] Confirm agent registers with backend
- [ ] Test silent installation
- [ ] Test uninstallation
- [ ] Code sign the MSI
- [ ] Update version number
- [ ] Update backend URLs to production
- [ ] Generate unique registration tokens
- [ ] Test firewall rules
- [ ] Verify log rotation works
- [ ] Document deployment procedure
- [ ] Train help desk staff
- [ ] Notify users (if required)
- [ ] Prepare rollback plan

---

## Support and Maintenance

### Updating the Agent

1. Update `monitoring_agent.py` in `agent/` folder
2. Increment version number
3. Rebuild MSI
4. Test thoroughly
5. Deploy as upgrade (MSI handles upgrades automatically)

### Monitoring Deployments

Track installation status:
- SCCM/Intune: Built-in reporting
- GPO: Group Policy Results
- Manual: Query backend for registered agents

### Log Collection

For troubleshooting:
```cmd
# Collect agent logs
copy "C:\Program Files\ITMonitoringAgent\logs\*" \\support\logs\

# Collect MSI installation logs
copy "C:\Program Files\ITMonitoringAgent\msi_install.log" \\support\logs\

# Collect Windows Event Logs
wevtutil epl Application application.evtx
```

---

## Additional Resources

- **WiX Toolset Documentation:** https://wixtoolset.org/documentation/
- **Python Embeddable Package:** https://docs.python.org/3/using/windows.html#embedded-distribution
- **NSSM Documentation:** https://nssm.cc/usage
- **Windows Installer Best Practices:** https://docs.microsoft.com/en-us/windows/win32/msi/

---

## License

Copyright © 2024 Your Company Name. All rights reserved.

---

**Version:** 2.0  
**Last Updated:** 2024  
**Maintained by:** IT Operations Team

