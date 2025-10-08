# IT Management Monitoring Agent - Windows Installer

## Overview

This directory contains everything needed to build a professional Windows installer for the IT Management Monitoring Agent using NSIS (Nullsoft Scriptable Install System).

## What's Included

### Core Files

- **`ITMonitoringAgent.nsi`** - Main NSIS installer script with wizard UI
- **`service_wrapper.py`** - Windows service wrapper for the Python agent
- **`License.txt`** - End User License Agreement (EULA)
- **`README.txt`** - User documentation included with installation

### Build Scripts

- **`build.bat`** - Batch script to build the installer (simple)
- **`build.ps1`** - PowerShell script to build the installer (advanced features)
- **`test_installer.ps1`** - Comprehensive testing and diagnostic script

### Auto-Copied Files (from agent directory)

These files are automatically copied during build:
- `monitoring_agent.py` - The main monitoring agent
- `requirements.txt` - Python dependencies

## Prerequisites

### Required Software

1. **NSIS 3.0+**
   - Download: https://nsis.sourceforge.io/Download
   - Install with default options
   - Verify: Open command prompt and run `makensis /VERSION`

2. **Python 3.7+** (for development/testing)
   - Download: https://www.python.org/downloads/
   - Check "Add Python to PATH" during installation
   - Verify: `python --version`

3. **Windows 10 SDK** (optional, for code signing)
   - Only needed if you want to sign the installer
   - Download: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

### Recommended Tools

- **Visual Studio Code** - For editing scripts
- **Git** - For version control
- **Windows Terminal** - Better PowerShell experience

## Building the Installer

### Quick Build (Batch Script)

```batch
cd installer\windows
build.bat
```

This will:
1. Check for NSIS installation
2. Copy agent files from `../../agent/`
3. Build the installer
4. Create `ITMonitoringAgent-Setup-1.0.0.exe`
5. Clean up temporary files

### Advanced Build (PowerShell)

```powershell
cd installer\windows
.\build.ps1
```

**With options:**
```powershell
# Build with cleanup
.\build.ps1 -Clean

# Build with code signing
.\build.ps1 -Sign -CertificatePath "C:\Certs\mycert.pfx"

# Build with custom version
.\build.ps1 -Version "1.0.1"
```

### Manual Build

If you prefer to build manually:

```batch
cd installer\windows

REM Copy files
copy ..\..\agent\monitoring_agent.py .
copy ..\..\agent\requirements.txt .

REM Build installer
makensis ITMonitoringAgent.nsi
```

## Installer Features

### Wizard Pages

1. **Welcome** - Introduction and privacy notice
2. **License Agreement** - EULA acceptance
3. **Installation Directory** - Choose install location (default: C:\Program Files\ITMonitoringAgent)
4. **Installation Progress** - Shows installation steps
5. **Finish** - Completion with options

### What the Installer Does

1. **System Checks**
   - Verifies Windows 10/11 64-bit
   - Checks administrator privileges
   - Validates disk space (100 MB minimum)

2. **Dependency Installation**
   - Checks for Python 3.7+
   - Downloads and installs Python if needed
   - Installs required Python packages:
     - psutil
     - requests
     - watchdog
     - pywin32

3. **Agent Installation**
   - Creates installation directory
   - Copies agent files
   - Creates configuration file
   - Sets up logging and cache directories

4. **Service Creation**
   - Installs Windows service
   - Configures automatic startup
   - Sets service description
   - Configures failure recovery

5. **Security Configuration**
   - Sets file permissions
   - Adds firewall rules for outbound HTTPS
   - Encrypts sensitive configuration

6. **Post-Installation**
   - Starts the service
   - Creates Start Menu shortcuts
   - Registers uninstaller
   - Optionally opens IT Management Portal

### Command-Line Installation

For silent/automated deployment:

```batch
REM Silent installation with defaults
ITMonitoringAgent-Setup-1.0.0.exe /S

REM Silent install with custom token
ITMonitoringAgent-Setup-1.0.0.exe /S /Token="abc123xyz789"

REM Silent install with custom backend URL
ITMonitoringAgent-Setup-1.0.0.exe /S /BackendURL="https://custom-backend.com/api/monitoring/events"

REM Silent uninstall
"C:\Program Files\ITMonitoringAgent\uninstall.exe" /S
```

## Configuration

### Pre-Configured Installation

To create an installer with pre-configured settings:

1. Edit `ITMonitoringAgent.nsi`
2. Find the `ConfigureAgent` function
3. Modify default values:

```nsis
${If} $BackendURL == ""
    StrCpy $BackendURL "https://your-backend.com/api/monitoring/events"
${EndIf}
```

### Dynamic Configuration

Pass configuration at install time:

```batch
installer.exe /BackendURL="https://backend.com/api" /Token="registration-token"
```

### Post-Installation Configuration

After installation, edit:
```
C:\Program Files\ITMonitoringAgent\config.json
```

Then restart the service:
```powershell
Restart-Service ITMonitoringAgent
```

## Testing

### Test Installation

```powershell
# Check installation status
.\test_installer.ps1 -CheckStatus

# View logs
.\test_installer.ps1 -ViewLogs

# Run all diagnostics
.\test_installer.ps1 -TestMode

# Send test telemetry
.\test_installer.ps1 -SimulateTelemetry
```

### Manual Testing Checklist

- [ ] Installer runs without errors
- [ ] Python is installed (if wasn't already)
- [ ] Service is created and started
- [ ] Configuration file exists
- [ ] Logs are being written
- [ ] Firewall rules are added
- [ ] Start Menu shortcuts work
- [ ] Browser opens to portal (if selected)
- [ ] Agent appears in IT Management Portal
- [ ] Telemetry data is flowing
- [ ] Uninstaller works correctly

### Test Environments

Test the installer on:
- [ ] Windows 10 (clean install, no Python)
- [ ] Windows 10 (with Python already installed)
- [ ] Windows 11
- [ ] Virtual machine
- [ ] Domain-joined computer
- [ ] Non-English Windows

## Troubleshooting

### Build Issues

**Error: "makensis is not recognized"**
- Solution: Add NSIS to PATH or use full path to makensis.exe
- Default location: `C:\Program Files (x86)\NSIS\makensis.exe`

**Error: "monitoring_agent.py not found"**
- Solution: Ensure you're running from `installer/windows/` directory
- Verify `../../agent/monitoring_agent.py` exists

**Build fails with syntax errors**
- Solution: Check NSIS version (must be 3.0+)
- Run: `makensis /VERSION`

### Installation Issues

**Installer won't run**
- Right-click installer → "Run as Administrator"
- Check Windows Defender didn't quarantine it

**Python installation fails**
- Pre-install Python manually
- Use Python from python.org (not Microsoft Store)

**Service won't start**
- Check logs: `C:\Program Files\ITMonitoringAgent\logs\`
- Verify Python packages installed: `pip list`
- Run manually: `python "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"`

**Agent doesn't appear in portal**
- Check service status: `Get-Service ITMonitoringAgent`
- Verify network connectivity
- Check registration token hasn't expired
- Review agent logs for errors

### Common Errors

**Error: "Python not found"**
```powershell
# Install Python manually
winget install Python.Python.3.10

# Or download from python.org
```

**Error: "Access denied"**
```powershell
# Run installer as Administrator
# Or adjust permissions on install directory
```

**Error: "Service failed to start"**
```powershell
# Check event logs
Get-EventLog -LogName Application -Source ITMonitoringAgent -Newest 10

# Verify Python packages
python -m pip install -r "C:\Program Files\ITMonitoringAgent\requirements.txt"
```

## Distribution

### For End Users

1. **Build the installer**
2. **Test on clean machine**
3. **Sign the installer** (recommended for production)
4. **Upload to download portal**
5. **Provide installation instructions**

### For IT Administrators

#### Group Policy Deployment

Create GPO to deploy installer:

1. Copy installer to network share
2. Create new GPO
3. Computer Configuration → Policies → Software Settings → Software Installation
4. Right-click → New → Package
5. Select installer

#### SCCM/Intune Deployment

Package the installer for enterprise deployment:

```powershell
# Create detection method
Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"

# Install command
ITMonitoringAgent-Setup.exe /S /Token="%TOKEN%"

# Uninstall command
"C:\Program Files\ITMonitoringAgent\uninstall.exe" /S
```

### For Developers

#### Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Build Installer

on: [push]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install NSIS
        run: |
          choco install nsis -y
          
      - name: Build Installer
        run: |
          cd installer/windows
          .\build.ps1 -Clean
          
      - name: Upload Artifact
        uses: actions/upload-artifact@v2
        with:
          name: installer
          path: installer/windows/ITMonitoringAgent-Setup-*.exe
```

## Customization

### Branding

1. **Icons**: Replace in NSIS script
   ```nsis
   !define MUI_ICON "path\to\your\icon.ico"
   ```

2. **Banner Images**: Replace header/wizard images
   ```nsis
   !define MUI_HEADERIMAGE_BITMAP "path\to\header.bmp"
   !define MUI_WELCOMEFINISHPAGE_BITMAP "path\to\wizard.bmp"
   ```

3. **Company Info**: Edit these definitions
   ```nsis
   !define PRODUCT_PUBLISHER "Your Company IT"
   !define PRODUCT_WEB_SITE "https://itmanagement.company.com"
   ```

### Advanced Features

#### Add Custom Wizard Page

```nsis
Function CustomPage
  !insertmacro MUI_HEADER_TEXT "Custom Page" "Additional configuration"
  nsDialogs::Create 1018
  Pop $0
  
  ; Add controls here
  
  nsDialogs::Show
FunctionEnd

!insertmacro MUI_PAGE_CUSTOM CustomPage
```

#### Add Pre-Installation Check

```nsis
Function CheckCustomRequirement
  ; Your check here
  ${If} $0 == "fail"
    MessageBox MB_ICONSTOP "Requirement not met!"
    Quit
  ${EndIf}
FunctionEnd
```

## Version Control

Track changes to installer:

```
installer/
├── windows/
│   ├── ITMonitoringAgent.nsi (track changes)
│   ├── service_wrapper.py (track changes)
│   ├── build.ps1 (track changes)
│   ├── License.txt (review changes)
│   └── README.txt (review changes)
```

Don't track:
- `monitoring_agent.py` (copied from agent/)
- `requirements.txt` (copied from agent/)
- `*.exe` (built installers)

## Security Best Practices

1. **Code Signing**
   - Always sign production installers
   - Use EV (Extended Validation) certificate if possible
   - Timestamp signatures

2. **Update Mechanism**
   - Plan for installer updates
   - Version checking
   - Incremental updates

3. **Configuration Security**
   - Encrypt API keys in config
   - Use Windows DPAPI for sensitive data
   - Secure file permissions

## Support

For issues or questions:
- Check logs: `C:\Program Files\ITMonitoringAgent\logs\`
- Run diagnostics: `.\test_installer.ps1 -TestMode`
- Contact: support@company.com

## License

Copyright © 2024 [Your Company]. All rights reserved.

See License.txt for full license agreement.




