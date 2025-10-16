# Building the Windows Installer for IT Network Monitor Agent

This guide explains how to create a standalone Windows installer (.exe) for the IT Network Monitor Agent.

## Prerequisites

1. Python 3.8 or higher installed
2. PyInstaller for creating executable
3. Inno Setup (optional) for creating MSI installer

## Step 1: Install Build Tools

```bash
pip install pyinstaller
```

## Step 2: Build the Agent Executable

```bash
# Navigate to the agent directory
cd backend/agent

# Build the agent
pyinstaller --onefile --windowed --icon=icon.ico --name="ITNetworkMonitor" network_monitor_agent.py

# Build the installer
pyinstaller --onefile --icon=icon.ico --name="ITNetworkMonitor-Setup" install_agent.py
```

This will create:
- `dist/ITNetworkMonitor.exe` - The agent executable
- `dist/ITNetworkMonitor-Setup.exe` - The installer

## Step 3: Create Distribution Package

Create a folder with the following structure:

```
ITNetworkMonitor-Installer/
├── ITNetworkMonitor-Setup.exe
├── requirements.txt
├── README.txt
└── LICENSE.txt
```

## Step 4: (Optional) Create MSI Installer with Inno Setup

1. Install Inno Setup from https://jrsoftware.org/isinfo.php
2. Create an `installer.iss` script:

```iss
[Setup]
AppName=IT Network Monitor Agent
AppVersion=1.0.0
DefaultDirName={pf}\ITNetworkMonitor
DefaultGroupName=IT Network Monitor
OutputBaseFilename=ITNetworkMonitor-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin

[Files]
Source: "dist\ITNetworkMonitor-Setup.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "requirements.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "network_monitor_agent.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "service_wrapper.py"; DestDir: "{app}"; Flags: ignoreversion

[Run]
Filename: "{app}\ITNetworkMonitor-Setup.exe"; Description: "Install the monitoring agent"; Flags: postinstall nowait skipifsilent

[Icons]
Name: "{group}\Uninstall IT Network Monitor"; Filename: "{uninstallexe}"
```

3. Compile with Inno Setup to create a professional MSI installer

## Step 5: Host the Installer

Upload the installer to your backend server so employees can download it:

```
backend/
└── downloads/
    └── ITNetworkMonitor-Setup.exe
```

Make it accessible via:
```
https://your-backend.com/downloads/ITNetworkMonitor-Setup.exe
```

## Testing the Installer

1. Run `ITNetworkMonitor-Setup.exe` as Administrator
2. Follow the installation prompts
3. The agent will be installed to `C:\Program Files\ITNetworkMonitor`
4. A scheduled task will be created to run on boot
5. Register the agent through the IT portal

## Distribution to Employees

Employees should:

1. Download `ITNetworkMonitor-Setup.exe` from the IT portal
2. Run as Administrator
3. Complete installation
4. Log into IT portal (Employee section)
5. Click "Register My Computer" to get token
6. Token is automatically applied (or use command line)

## Uninstallation

To uninstall:
```bash
python "C:\Program Files\ITNetworkMonitor\install_agent.py" uninstall
```

Or through Windows "Add/Remove Programs" if using MSI installer.

## Security Notes

- The installer requires admin privileges
- The agent uses HTTPS for all communication
- Agent tokens are long-lived (1 year) but can be revoked by admin
- Network data is encrypted in transit
- No personal data or screen capture is collected

