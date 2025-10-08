# IT Management Monitoring Agent - Enterprise Deployment Guide

## Overview

This guide covers enterprise-wide deployment of the IT Management Monitoring Agent MSI installer using various deployment methods.

---

## Deployment Methods

### 1. Group Policy (Active Directory)

**Best for:** Organizations using Active Directory with Group Policy

#### Prerequisites
- Domain controller with Group Policy Management
- Network share accessible by all computers
- MSI installer built and tested

#### Step-by-Step

1. **Create network share:**
   ```cmd
   # On file server
   mkdir E:\Software\IT-Monitoring
   copy ITMonitoringAgent-1.0.0.msi E:\Software\IT-Monitoring\
   
   # Share the folder
   net share ITMonitoring=E:\Software\IT-Monitoring /GRANT:Everyone,READ
   ```

2. **Create MSI transform (.mst) for configuration:**
   
   Option A: Use Orca (Windows SDK):
   ```cmd
   # Download Windows SDK
   # Install Orca MSI editor
   # Open ITMonitoringAgent-1.0.0.msi
   # Go to Property table
   # Modify BACKENDURL, REGISTRATIONURL, etc.
   # Transform → Generate Transform
   # Save as company-config.mst
   ```

   Option B: Use command-line:
   ```cmd
   # Create answer file with properties
   echo BACKENDURL=https://your-backend.com > install.properties
   echo REGISTRATIONURL=https://your-backend.com/register >> install.properties
   echo REGISTRATIONTOKEN=your-company-token >> install.properties
   ```

3. **Create Group Policy Object:**
   ```
   Open: Group Policy Management Console (gpmc.msc)
   Right-click on your domain → Create a GPO in this domain
   Name: "Deploy IT Monitoring Agent"
   ```

4. **Configure software installation:**
   ```
   Edit GPO
   Navigate to: Computer Configuration → Policies → Software Settings → Software Installation
   Right-click → New → Package
   Browse to: \\fileserver\ITMonitoring\ITMonitoringAgent-1.0.0.msi
   Deployment method: Assigned (recommended) or Published
   ```

5. **Add transform file (if created):**
   ```
   Right-click package → Properties
   Go to: Modifications tab
   Click: Add
   Select: company-config.mst
   ```

6. **Configure deployment options:**
   ```
   Properties → Deployment tab:
   ☑ Uninstall this application when it falls out of the scope of management
   ☑ Install this application at logon
   Installation user interface options: Basic (or None for silent)
   
   Properties → Advanced:
   Ignore language when deploying this package: Yes
   Make this 32-bit X86 application available to Win64 machines: No (we're 64-bit only)
   ```

7. **Link GPO to OUs:**
   ```
   Right-click on target OU (e.g., "Workstations")
   Link an Existing GPO
   Select: "Deploy IT Monitoring Agent"
   ```

8. **Force update (for testing):**
   ```cmd
   # On client computer
   gpupdate /force
   # Reboot to trigger installation
   shutdown /r /t 60
   ```

9. **Monitor deployment:**
   ```cmd
   # Group Policy Results
   gpresult /r
   
   # View installed software
   wmic product get name,version
   ```

---

### 2. Microsoft Endpoint Manager (Intune)

**Best for:** Cloud-managed devices, hybrid environments

#### Setup

1. **Login to Intune portal:**
   ```
   https://endpoint.microsoft.com
   ```

2. **Upload MSI:**
   ```
   Apps → All apps → Add
   App type: Line-of-business app
   Select app package file: ITMonitoringAgent-1.0.0.msi
   ```

3. **Configure app information:**
   ```
   Name: IT Management Monitoring Agent
   Description: System monitoring agent for IT management
   Publisher: Your Company IT
   Category: Computer Management
   Show this as a featured app: No
   Information URL: https://your-intranet/it-monitoring
   Privacy URL: https://your-company.com/privacy
   ```

4. **Configure installation:**
   ```
   Install command:
   msiexec /i ITMonitoringAgent-1.0.0.msi BACKENDURL="https://backend.com" REGISTRATIONTOKEN="token" /quiet /norestart
   
   Uninstall command:
   msiexec /x {PRODUCT-CODE-GUID} /quiet /norestart
   
   Install behavior: System
   Device restart behavior: Determine behavior based on return codes
   ```

5. **Detection rules:**
   ```
   Rules format: Manually configure detection rules
   
   Rule 1:
   Rule type: File
   Path: C:\Program Files\ITMonitoringAgent
   File or folder: monitoring_agent.py
   Detection method: File or folder exists
   
   Rule 2:
   Rule type: Registry
   Key path: HKEY_LOCAL_MACHINE\SOFTWARE\ITMonitoringAgent
   Value name: Version
   Detection method: String comparison
   Operator: Equals
   Value: 1.0.0
   ```

6. **Requirements:**
   ```
   Operating system: Windows 10 1607+
   Architecture: x64
   Minimum OS: Windows 10 1607
   ```

7. **Assignments:**
   ```
   Required: IT-Managed-Devices group
   Available for enrolled devices: All Devices
   Uninstall: (empty, unless removing from devices)
   ```

8. **Monitor:**
   ```
   Apps → All apps → IT Management Monitoring Agent → Device install status
   Check installation progress, failures, and success rate
   ```

---

### 3. SCCM (System Center Configuration Manager)

**Best for:** Large enterprises with existing SCCM infrastructure

#### Deployment

1. **Create application:**
   ```
   Software Library → Application Management → Applications
   Right-click → Create Application
   Type: Windows Installer (*.msi file)
   Location: \\fileserver\ITMonitoring\ITMonitoringAgent-1.0.0.msi
   ```

2. **Configure deployment type:**
   ```
   Installation program:
   msiexec /i ITMonitoringAgent-1.0.0.msi BACKENDURL="https://backend.com" REGISTRATIONTOKEN="token" /quiet /norestart
   
   Uninstall program:
   msiexec /x {PRODUCT-CODE-GUID} /quiet /norestart
   
   Installation behavior: Install for system
   Logon requirement: Whether or not a user is logged on
   Installation program visibility: Hidden
   Maximum allowed run time: 30 minutes
   ```

3. **Detection method:**
   ```
   Use Windows Installer detection
   Product code: {from MSI properties}
   
   OR create custom detection:
   
   Setting Type: File System
   Type: File
   Path: C:\Program Files\ITMonitoringAgent
   File: monitoring_agent.py
   This file or folder must exist on the target system
   ```

4. **Requirements:**
   ```
   Operating System: Windows 10 (64-bit) or Windows 11
   ```

5. **Distribute content:**
   ```
   Right-click application → Distribute Content
   Select distribution points
   ```

6. **Deploy:**
   ```
   Right-click application → Deploy
   Collection: All Windows 10 Workstations
   Purpose: Required
   Schedule: ASAP
   User experience: Install automatically
   Allow users to view and interact: No
   Software Installation: Install
   System restart: Suppress reboot (unless required)
   ```

7. **Monitor:**
   ```
   Monitoring → Deployments
   Select: IT Management Monitoring Agent deployment
   View Status → Success rate, errors, in progress
   ```

---

### 4. PDQ Deploy

**Best for:** Small to medium IT teams, quick deployments

#### Setup

1. **Create package:**
   ```
   Packages → New Package
   Name: IT Monitoring Agent
   Install Step → Add Install Step
   Install file: ITMonitoringAgent-1.0.0.msi
   ```

2. **Configure install step:**
   ```
   Install file: ITMonitoringAgent-1.0.0.msi
   Parameters: BACKENDURL="https://backend.com" REGISTRATIONTOKEN="token" /quiet /norestart
   Success codes: 0,3010
   ```

3. **Add conditions (optional):**
   ```
   Conditions → Add Condition
   Type: File Does Not Exist
   Path: C:\Program Files\ITMonitoringAgent\monitoring_agent.py
   ```

4. **Deploy:**
   ```
   Select package
   Choose Targets → Select computers or collections
   Deploy Now
   ```

5. **Monitor:**
   ```
   View real-time deployment status
   Check for errors or failed deployments
   Retry failed deployments
   ```

---

### 5. PowerShell Remote Installation

**Best for:** Ad-hoc installations, specific computers

#### Script

```powershell
# remote-install.ps1
param(
    [string[]]$ComputerNames,
    [string]$MsiPath = "\\fileserver\ITMonitoring\ITMonitoringAgent-1.0.0.msi",
    [string]$BackendUrl = "https://backend.com/api/monitoring/events",
    [string]$RegistrationUrl = "https://backend.com/api/monitoring/register",
    [string]$RegistrationToken = "your-token-here"
)

$installArgs = @(
    "/i",
    "`"$MsiPath`"",
    "BACKENDURL=`"$BackendUrl`"",
    "REGISTRATIONURL=`"$RegistrationUrl`"",
    "REGISTRATIONTOKEN=`"$RegistrationToken`"",
    "/quiet",
    "/norestart",
    "/l*v",
    "`"C:\Temp\agent-install.log`""
)

foreach ($computer in $ComputerNames) {
    Write-Host "Installing on $computer..." -ForegroundColor Yellow
    
    try {
        Invoke-Command -ComputerName $computer -ScriptBlock {
            param($args)
            
            # Create temp directory
            if (-not (Test-Path C:\Temp)) {
                New-Item -ItemType Directory -Path C:\Temp | Out-Null
            }
            
            # Run installation
            $process = Start-Process msiexec.exe -ArgumentList $args -Wait -PassThru
            
            return $process.ExitCode
        } -ArgumentList (,$installArgs)
        
        Write-Host "✓ Installation completed on $computer" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Installation failed on $computer : $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### Usage:

```powershell
# Single computer
.\remote-install.ps1 -ComputerNames "PC-001"

# Multiple computers
.\remote-install.ps1 -ComputerNames "PC-001","PC-002","PC-003"

# From text file
$computers = Get-Content computers.txt
.\remote-install.ps1 -ComputerNames $computers

# Different backend
.\remote-install.ps1 -ComputerNames "PC-001" -BackendUrl "https://prod.backend.com"
```

---

### 6. Manual Installation (End Users)

**Best for:** Small deployments, user-initiated installations

#### User Instructions:

1. **Download installer:**
   ```
   https://your-company.com/downloads/ITMonitoringAgent-1.0.0.msi
   Or from: \\fileserver\Software\ITMonitoring\ITMonitoringAgent-1.0.0.msi
   ```

2. **Run installer:**
   ```
   Double-click ITMonitoringAgent-1.0.0.msi
   Click Next through the wizard
   Accept license agreement
   Enter configuration (or use defaults)
   Click Install
   ```

3. **Verify:**
   ```
   Check Start Menu → IT Monitoring Agent
   Service should be running
   ```

---

## Post-Deployment

### Verification

Check agent registration in backend:
```
Login to IT Management Portal
Navigate to: Monitoring → Hosts
Verify new agents appear with:
  - Correct hostname
  - Status: Online
  - Last seen: Recent timestamp
```

### Monitoring

Track deployment progress:
```
Backend dashboard → Monitoring → Statistics
Expected agents: 1000
Registered agents: 973
Pending: 27
```

### Troubleshooting Failed Deployments

1. **Check client logs:**
   ```cmd
   # On failed client
   type C:\Windows\Temp\MSI*.log
   type "C:\Program Files\ITMonitoringAgent\msi_install.log"
   ```

2. **Common issues:**
   ```
   - Insufficient permissions: Run as Administrator
   - Network unavailable: Check connectivity
   - Existing installation: Uninstall first or force reinstall
   - Missing dependencies: Ensure .NET Framework 4.5+ installed
   ```

3. **Force reinstall:**
   ```cmd
   msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
   msiexec /i ITMonitoringAgent-1.0.0.msi /quiet /norestart REINSTALL=ALL REINSTALLMODE=vomus
   ```

---

## Mass Uninstallation

If you need to remove the agent:

### Group Policy
```
Remove the GPO link or delete the package from Software Installation
Agents will be removed at next policy refresh
```

### Intune
```
Change assignment from "Required" to "Uninstall"
```

### SCCM
```
Create uninstall deployment with purpose "Uninstall"
```

### PowerShell
```powershell
$computers = Get-Content computers.txt
foreach ($computer in $computers) {
    Invoke-Command -ComputerName $computer -ScriptBlock {
        msiexec /x ITMonitoringAgent-1.0.0.msi /quiet /norestart
    }
}
```

---

## Best Practices

1. **Test first:** Always pilot with small group
2. **Schedule wisely:** Deploy during maintenance windows
3. **Communicate:** Notify users if service impacts are expected
4. **Monitor closely:** Watch first 100 deployments for issues
5. **Keep logs:** Retain installation logs for troubleshooting
6. **Document:** Record deployment dates, versions, and changes
7. **Train support:** Ensure help desk knows about the agent
8. **Plan rollback:** Have uninstall procedure ready

---

## Deployment Checklist

- [ ] MSI built and tested
- [ ] MSI code signed (recommended)
- [ ] Backend URLs configured correctly
- [ ] Registration tokens generated
- [ ] Network share created (if using GPO/SCCM)
- [ ] Pilot group identified
- [ ] Help desk trained
- [ ] Users notified (if required)
- [ ] Rollback plan prepared
- [ ] Monitoring dashboard ready
- [ ] Pilot deployment successful
- [ ] Full deployment scheduled
- [ ] Post-deployment verification planned

---

## Support

For deployment assistance:
- Email: it-operations@company.com
- Internal wiki: https://wiki.company.com/it-monitoring
- Help desk: Extension 5555

---

**Version:** 1.0  
**Last Updated:** 2024  
**Maintained by:** IT Operations Team

