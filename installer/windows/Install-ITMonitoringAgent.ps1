#Requires -RunAsAdministrator

<#
.SYNOPSIS
    IT Management Monitoring Agent - Robust Windows Installer

.DESCRIPTION
    Professional installer for IT Management Monitoring Agent with:
    - Automatic agent download
    - Robust Python/pip detection and dependency installation
    - NSSM-based Windows service creation
    - Full transcript logging
    - Unattended installation support
    - Automatic portal launch
    - Comprehensive error handling

.PARAMETER BackendUrl
    Backend API URL for telemetry submission (default: https://itmanagement.company.com/api/monitoring/events)

.PARAMETER RegistrationUrl
    Agent registration endpoint URL (default: https://itmanagement.company.com/api/monitoring/register)

.PARAMETER RegistrationToken
    One-time registration token for agent authentication (optional but recommended)

.PARAMETER AgentUrl
    URL to download monitoring_agent.py if not present locally

.PARAMETER InstallPath
    Installation directory (default: C:\Program Files\ITMonitoringAgent)

.PARAMETER PollingInterval
    Telemetry collection interval in seconds (default: 60)

.PARAMETER Silent
    Run in silent mode with no user prompts

.PARAMETER SkipPortalLaunch
    Skip opening the IT Management Portal after installation

.EXAMPLE
    .\Install-ITMonitoringAgent.ps1
    Interactive installation with defaults

.EXAMPLE
    .\Install-ITMonitoringAgent.ps1 -BackendUrl "https://backend.com/api" -RegistrationToken "abc123" -Silent
    Unattended installation with custom parameters

.NOTES
    Author: IT Management Team
    Version: 2.0.0
    Requires: Windows 10/11, PowerShell 5.1+, Administrator privileges
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$BackendUrl = "https://itmanagement.company.com/api/monitoring/events",
    
    [Parameter(Mandatory = $false)]
    [string]$RegistrationUrl = "https://itmanagement.company.com/api/monitoring/register",
    
    [Parameter(Mandatory = $false)]
    [string]$RegistrationToken = "",
    
    [Parameter(Mandatory = $false)]
    [string]$AgentUrl = "",
    
    [Parameter(Mandatory = $false)]
    [string]$InstallPath = "C:\Program Files\ITMonitoringAgent",
    
    [Parameter(Mandatory = $false)]
    [int]$PollingInterval = 60,
    
    [Parameter(Mandatory = $false)]
    [switch]$Silent = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipPortalLaunch = $false
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$Script:Config = @{
    ServiceName        = "ITMonitoringAgent"
    ServiceDisplayName = "IT Management Monitoring Agent"
    ServiceDescription = "Monitors system performance and security for IT management"
    AgentFileName      = "monitoring_agent.py"
    ServiceWrapperName = "service_wrapper.py"
    ConfigFileName     = "config.json"
    RequirementsFile   = "requirements.txt"
    NSSMUrl            = "https://nssm.cc/release/nssm-2.24.zip"
    NSSMFileName       = "nssm.exe"
    PortalUrl          = "https://itmanagement.company.com"
    MinPythonVersion   = [Version]"3.7.0"
    LogFileName        = "installation_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    MaxRetries         = 3
    RetryDelaySeconds  = 5
}

# ============================================================================
# GLOBAL VARIABLES
# ============================================================================

$Script:PythonPath = $null
$Script:InstallDir = $InstallPath
$Script:LogPath = Join-Path $env:TEMP $Script:Config.LogFileName
$Script:NSSMPath = $null
$Script:InstallationSuccess = $false

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Level = 'Info'
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Write to transcript
    Write-Output $logMessage
    
    # Write to console with colors
    switch ($Level) {
        'Success' { Write-Host $Message -ForegroundColor Green }
        'Warning' { Write-Host $Message -ForegroundColor Yellow }
        'Error'   { Write-Host $Message -ForegroundColor Red }
        default   { Write-Host $Message -ForegroundColor White }
    }
}

function Write-Header {
    param([string]$Title)
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param(
        [string]$Message,
        [int]$Step,
        [int]$TotalSteps
    )
    
    Write-Host ""
    Write-Host "[$Step/$TotalSteps] $Message" -ForegroundColor Cyan
    Write-Log -Message "Step $Step/$TotalSteps: $Message" -Level Info
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

function Test-Administrator {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-WindowsVersion {
    $osVersion = [System.Environment]::OSVersion.Version
    
    # Windows 10 is version 10.0
    if ($osVersion.Major -ge 10) {
        Write-Log "✓ Windows version check passed: $($osVersion)" -Level Success
        return $true
    }
    
    Write-Log "✗ Windows 10 or higher required. Current: $osVersion" -Level Error
    return $false
}

function Test-DiskSpace {
    param([int]$RequiredMB = 500)
    
    $drive = (Split-Path $Script:InstallDir -Qualifier)
    $disk = Get-PSDrive -Name $drive.TrimEnd(':')
    $freeMB = [math]::Round($disk.Free / 1MB)
    
    if ($freeMB -ge $RequiredMB) {
        Write-Log "✓ Disk space check passed: $freeMB MB available" -Level Success
        return $true
    }
    
    Write-Log "✗ Insufficient disk space. Required: $RequiredMB MB, Available: $freeMB MB" -Level Error
    return $false
}

# ============================================================================
# PYTHON DETECTION AND VALIDATION
# ============================================================================

function Find-Python {
    Write-Log "Detecting Python installation..." -Level Info
    
    # Try python command first
    try {
        $version = & python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $Script:PythonPath = "python"
            Write-Log "✓ Found Python via 'python' command: $version" -Level Success
            return $true
        }
    }
    catch {
        Write-Log "Python not found via 'python' command" -Level Warning
    }
    
    # Try py launcher
    try {
        $version = & py --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $Script:PythonPath = "py"
            Write-Log "✓ Found Python via 'py' launcher: $version" -Level Success
            return $true
        }
    }
    catch {
        Write-Log "Python not found via 'py' launcher" -Level Warning
    }
    
    # Try common installation paths
    $commonPaths = @(
        "C:\Python310\python.exe",
        "C:\Python39\python.exe",
        "C:\Python38\python.exe",
        "C:\Python37\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python39\python.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $Script:PythonPath = $path
            $version = & $path --version 2>&1
            Write-Log "✓ Found Python at: $path ($version)" -Level Success
            return $true
        }
    }
    
    Write-Log "✗ Python not found" -Level Error
    return $false
}

function Test-PythonVersion {
    if (-not $Script:PythonPath) {
        return $false
    }
    
    try {
        $versionOutput = & $Script:PythonPath --version 2>&1
        
        if ($versionOutput -match 'Python (\d+)\.(\d+)\.(\d+)') {
            $version = [Version]"$($Matches[1]).$($Matches[2]).$($Matches[3])"
            
            if ($version -ge $Script:Config.MinPythonVersion) {
                Write-Log "✓ Python version check passed: $version" -Level Success
                return $true
            }
            else {
                Write-Log "✗ Python version $version is below minimum required $($Script:Config.MinPythonVersion)" -Level Error
                return $false
            }
        }
    }
    catch {
        Write-Log "✗ Failed to check Python version: $($_.Exception.Message)" -Level Error
    }
    
    return $false
}

function Install-PythonDependencies {
    Write-Log "Installing Python dependencies..." -Level Info
    
    # Upgrade pip first
    Write-Log "Upgrading pip..." -Level Info
    $upgradeCmd = "& `"$Script:PythonPath`" -m pip install --upgrade pip --quiet"
    
    try {
        Invoke-Expression $upgradeCmd | Out-Null
        Write-Log "✓ pip upgraded successfully" -Level Success
    }
    catch {
        Write-Log "⚠ pip upgrade failed (continuing anyway): $($_.Exception.Message)" -Level Warning
    }
    
    # Install required packages with retry logic
    $packages = @(
        "psutil>=5.9.0",
        "requests>=2.28.0",
        "watchdog>=2.1.9",
        "pywin32>=304"
    )
    
    foreach ($package in $packages) {
        $success = $false
        
        for ($i = 1; $i -le $Script:Config.MaxRetries; $i++) {
            try {
                Write-Log "Installing $package (attempt $i/$($Script:Config.MaxRetries))..." -Level Info
                
                $installCmd = "& `"$Script:PythonPath`" -m pip install `"$package`" --quiet --disable-pip-version-check"
                Invoke-Expression $installCmd | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✓ $package installed successfully" -Level Success
                    $success = $true
                    break
                }
            }
            catch {
                Write-Log "Attempt $i failed: $($_.Exception.Message)" -Level Warning
                
                if ($i -lt $Script:Config.MaxRetries) {
                    Write-Log "Retrying in $($Script:Config.RetryDelaySeconds) seconds..." -Level Info
                    Start-Sleep -Seconds $Script:Config.RetryDelaySeconds
                }
            }
        }
        
        if (-not $success) {
            Write-Log "✗ Failed to install $package after $($Script:Config.MaxRetries) attempts" -Level Error
            return $false
        }
    }
    
    # Verify installations
    Write-Log "Verifying Python packages..." -Level Info
    try {
        $verifyCmd = "& `"$Script:PythonPath`" -c `"import psutil, requests, watchdog, win32service`""
        Invoke-Expression $verifyCmd 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ All Python dependencies verified" -Level Success
            return $true
        }
    }
    catch {
        Write-Log "✗ Package verification failed: $($_.Exception.Message)" -Level Error
    }
    
    return $false
}

# ============================================================================
# DOWNLOAD FUNCTIONS
# ============================================================================

function Get-FileFromUrl {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$Description = "file"
    )
    
    Write-Log "Downloading $Description from: $Url" -Level Info
    
    for ($i = 1; $i -le $Script:Config.MaxRetries; $i++) {
        try {
            # Use TLS 1.2
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($Url, $OutputPath)
            $webClient.Dispose()
            
            if (Test-Path $OutputPath) {
                Write-Log "✓ $Description downloaded successfully" -Level Success
                return $true
            }
        }
        catch {
            Write-Log "Download attempt $i failed: $($_.Exception.Message)" -Level Warning
            
            if ($i -lt $Script:Config.MaxRetries) {
                Write-Log "Retrying in $($Script:Config.RetryDelaySeconds) seconds..." -Level Info
                Start-Sleep -Seconds $Script:Config.RetryDelaySeconds
            }
        }
    }
    
    Write-Log "✗ Failed to download $Description after $($Script:Config.MaxRetries) attempts" -Level Error
    return $false
}

function Get-MonitoringAgent {
    $agentPath = Join-Path $Script:InstallDir $Script:Config.AgentFileName
    
    # Check if agent file already exists
    if (Test-Path $agentPath) {
        Write-Log "✓ Monitoring agent file already exists: $agentPath" -Level Success
        return $true
    }
    
    # Try to find agent in current directory
    $localAgent = Join-Path $PSScriptRoot $Script:Config.AgentFileName
    if (Test-Path $localAgent) {
        Write-Log "Found agent in script directory, copying..." -Level Info
        Copy-Item $localAgent $agentPath -Force
        Write-Log "✓ Agent file copied successfully" -Level Success
        return $true
    }
    
    # Try to download if URL provided
    if ($AgentUrl) {
        Write-Log "Agent not found locally, downloading from URL..." -Level Info
        return Get-FileFromUrl -Url $AgentUrl -OutputPath $agentPath -Description "monitoring agent"
    }
    
    Write-Log "✗ Monitoring agent file not found and no download URL provided" -Level Error
    Write-Log "Please provide agent file or use -AgentUrl parameter" -Level Error
    return $false
}

function Get-NSSM {
    $nssmDir = Join-Path $env:TEMP "nssm"
    $nssmZip = Join-Path $env:TEMP "nssm.zip"
    $Script:NSSMPath = Join-Path $nssmDir "nssm-2.24\win64\nssm.exe"
    
    # Check if NSSM already exists
    if (Test-Path $Script:NSSMPath) {
        Write-Log "✓ NSSM already available" -Level Success
        return $true
    }
    
    # Try to find NSSM in PATH
    $nssmInPath = Get-Command nssm -ErrorAction SilentlyContinue
    if ($nssmInPath) {
        $Script:NSSMPath = $nssmInPath.Source
        Write-Log "✓ NSSM found in PATH: $($Script:NSSMPath)" -Level Success
        return $true
    }
    
    # Download NSSM
    Write-Log "Downloading NSSM (Non-Sucking Service Manager)..." -Level Info
    
    if (-not (Get-FileFromUrl -Url $Script:Config.NSSMUrl -OutputPath $nssmZip -Description "NSSM")) {
        Write-Log "⚠ NSSM download failed, will attempt to use sc.exe fallback" -Level Warning
        return $false
    }
    
    # Extract NSSM
    try {
        Expand-Archive -Path $nssmZip -DestinationPath $nssmDir -Force
        
        if (Test-Path $Script:NSSMPath) {
            Write-Log "✓ NSSM extracted successfully" -Level Success
            return $true
        }
    }
    catch {
        Write-Log "⚠ NSSM extraction failed: $($_.Exception.Message)" -Level Warning
    }
    
    return $false
}

# ============================================================================
# INSTALLATION FUNCTIONS
# ============================================================================

function New-InstallationDirectory {
    Write-Log "Creating installation directory..." -Level Info
    
    try {
        if (-not (Test-Path $Script:InstallDir)) {
            New-Item -ItemType Directory -Path $Script:InstallDir -Force | Out-Null
        }
        
        # Create subdirectories
        $subDirs = @("logs", "cache")
        foreach ($dir in $subDirs) {
            $path = Join-Path $Script:InstallDir $dir
            if (-not (Test-Path $path)) {
                New-Item -ItemType Directory -Path $path -Force | Out-Null
            }
        }
        
        Write-Log "✓ Installation directory created: $Script:InstallDir" -Level Success
        return $true
    }
    catch {
        Write-Log "✗ Failed to create installation directory: $($_.Exception.Message)" -Level Error
        return $false
    }
}

function Copy-RequiredFiles {
    Write-Log "Copying required files..." -Level Info
    
    $files = @(
        $Script:Config.ServiceWrapperName,
        $Script:Config.RequirementsFile,
        "README.txt",
        "LICENSE.txt"
    )
    
    foreach ($file in $files) {
        $sourcePath = Join-Path $PSScriptRoot $file
        $destPath = Join-Path $Script:InstallDir $file
        
        if (Test-Path $sourcePath) {
            try {
                Copy-Item $sourcePath $destPath -Force
                Write-Log "✓ Copied $file" -Level Success
            }
            catch {
                Write-Log "⚠ Failed to copy $file: $($_.Exception.Message)" -Level Warning
            }
        }
        else {
            Write-Log "⚠ Source file not found: $file" -Level Warning
        }
    }
    
    return $true
}

function New-ConfigurationFile {
    Write-Log "Creating configuration file..." -Level Info
    
    $configPath = Join-Path $Script:InstallDir $Script:Config.ConfigFileName
    
    $config = @{
        backend_url          = $BackendUrl
        registration_url     = $RegistrationUrl
        registration_token   = $RegistrationToken
        api_key              = $null
        agent_id             = $null
        hostname             = $env:COMPUTERNAME
        polling_interval     = $PollingInterval
        monitored_directories = @()
        log_level            = "INFO"
        retry_attempts       = 3
        retry_backoff        = 5
        local_cache_file     = (Join-Path $Script:InstallDir "cache\telemetry_cache.json")
    }
    
    try {
        $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8
        
        # Set restrictive permissions on config file
        $acl = Get-Acl $configPath
        $acl.SetAccessRuleProtection($true, $false)
        
        # Add SYSTEM full control
        $systemRule = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM", "FullControl", "Allow")
        $acl.AddAccessRule($systemRule)
        
        # Add Administrators full control
        $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "Allow")
        $acl.AddAccessRule($adminRule)
        
        Set-Acl -Path $configPath -AclObject $acl
        
        Write-Log "✓ Configuration file created: $configPath" -Level Success
        
        if ($RegistrationToken) {
            Write-Log "⚠ Registration token stored in plaintext. Consider using encryption for production." -Level Warning
        }
        
        return $true
    }
    catch {
        Write-Log "✗ Failed to create configuration file: $($_.Exception.Message)" -Level Error
        return $false
    }
}

# ============================================================================
# SERVICE MANAGEMENT
# ============================================================================

function Remove-ExistingService {
    Write-Log "Checking for existing service..." -Level Info
    
    $service = Get-Service -Name $Script:Config.ServiceName -ErrorAction SilentlyContinue
    
    if ($service) {
        Write-Log "Existing service found, removing..." -Level Warning
        
        # Stop service if running
        if ($service.Status -eq 'Running') {
            try {
                Stop-Service -Name $Script:Config.ServiceName -Force -ErrorAction Stop
                Write-Log "✓ Service stopped" -Level Success
            }
            catch {
                Write-Log "⚠ Failed to stop service: $($_.Exception.Message)" -Level Warning
            }
        }
        
        # Remove service
        try {
            & sc.exe delete $Script:Config.ServiceName | Out-Null
            Start-Sleep -Seconds 2
            Write-Log "✓ Existing service removed" -Level Success
        }
        catch {
            Write-Log "⚠ Failed to remove service: $($_.Exception.Message)" -Level Warning
        }
    }
    else {
        Write-Log "✓ No existing service found" -Level Success
    }
}

function New-ServiceWithNSSM {
    Write-Log "Creating Windows service with NSSM..." -Level Info
    
    $agentPath = Join-Path $Script:InstallDir $Script:Config.AgentFileName
    $logPath = Join-Path $Script:InstallDir "logs\service.log"
    $errorLogPath = Join-Path $Script:InstallDir "logs\service_error.log"
    
    try {
        # Install service
        $installArgs = "install $($Script:Config.ServiceName) `"$Script:PythonPath`" `"$agentPath`""
        Start-Process -FilePath $Script:NSSMPath -ArgumentList $installArgs -Wait -NoNewWindow
        
        # Configure service
        & $Script:NSSMPath set $Script:Config.ServiceName DisplayName $Script:Config.ServiceDisplayName
        & $Script:NSSMPath set $Script:Config.ServiceName Description $Script:Config.ServiceDescription
        & $Script:NSSMPath set $Script:Config.ServiceName Start SERVICE_AUTO_START
        & $Script:NSSMPath set $Script:Config.ServiceName AppDirectory $Script:InstallDir
        & $Script:NSSMPath set $Script:Config.ServiceName AppStdout $logPath
        & $Script:NSSMPath set $Script:Config.ServiceName AppStderr $errorLogPath
        & $Script:NSSMPath set $Script:Config.ServiceName AppStdoutCreationDisposition 4  # Append
        & $Script:NSSMPath set $Script:Config.ServiceName AppStderrCreationDisposition 4  # Append
        & $Script:NSSMPath set $Script:Config.ServiceName AppRotateFiles 1
        & $Script:NSSMPath set $Script:Config.ServiceName AppRotateOnline 1
        & $Script:NSSMPath set $Script:Config.ServiceName AppRotateBytes 10485760  # 10MB
        
        # Set failure recovery
        & $Script:NSSMPath set $Script:Config.ServiceName AppExit Default Restart
        & $Script:NSSMPath set $Script:Config.ServiceName AppRestartDelay 60000  # 60 seconds
        
        Write-Log "✓ Service created successfully with NSSM" -Level Success
        return $true
    }
    catch {
        Write-Log "✗ Failed to create service with NSSM: $($_.Exception.Message)" -Level Error
        return $false
    }
}

function New-ServiceWithSC {
    Write-Log "Creating Windows service with sc.exe (fallback)..." -Level Info
    
    $serviceWrapperPath = Join-Path $Script:InstallDir $Script:Config.ServiceWrapperName
    
    # Check if service wrapper exists
    if (-not (Test-Path $serviceWrapperPath)) {
        Write-Log "✗ Service wrapper not found: $serviceWrapperPath" -Level Error
        return $false
    }
    
    try {
        # Install service using Python service wrapper
        $installCmd = "& `"$Script:PythonPath`" `"$serviceWrapperPath`" install"
        Invoke-Expression $installCmd
        
        if ($LASTEXITCODE -eq 0) {
            # Set service description
            & sc.exe description $Script:Config.ServiceName $Script:Config.ServiceDescription
            
            # Configure auto-start
            & sc.exe config $Script:Config.ServiceName start= auto
            
            # Configure failure recovery
            & sc.exe failure $Script:Config.ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000
            
            Write-Log "✓ Service created successfully with sc.exe" -Level Success
            return $true
        }
        else {
            Write-Log "✗ Service creation failed with exit code: $LASTEXITCODE" -Level Error
            return $false
        }
    }
    catch {
        Write-Log "✗ Failed to create service with sc.exe: $($_.Exception.Message)" -Level Error
        return $false
    }
}

function Start-MonitoringService {
    Write-Log "Starting monitoring service..." -Level Info
    
    try {
        Start-Service -Name $Script:Config.ServiceName -ErrorAction Stop
        Start-Sleep -Seconds 3
        
        $service = Get-Service -Name $Script:Config.ServiceName
        
        if ($service.Status -eq 'Running') {
            Write-Log "✓ Service started successfully" -Level Success
            return $true
        }
        else {
            Write-Log "⚠ Service status: $($service.Status)" -Level Warning
            return $false
        }
    }
    catch {
        Write-Log "✗ Failed to start service: $($_.Exception.Message)" -Level Error
        return $false
    }
}

# ============================================================================
# FIREWALL CONFIGURATION
# ============================================================================

function Set-FirewallRules {
    Write-Log "Configuring Windows Firewall rules..." -Level Info
    
    try {
        # Remove existing rule if present
        Remove-NetFirewallRule -DisplayName "IT Monitoring Agent" -ErrorAction SilentlyContinue
        
        # Add rule for Python
        New-NetFirewallRule -DisplayName "IT Monitoring Agent" `
            -Direction Outbound `
            -Program $Script:PythonPath `
            -Action Allow `
            -Description "Allow IT Monitoring Agent to communicate with backend server" `
            -ErrorAction Stop | Out-Null
        
        Write-Log "✓ Firewall rules configured" -Level Success
        return $true
    }
    catch {
        Write-Log "⚠ Failed to configure firewall rules: $($_.Exception.Message)" -Level Warning
        Write-Log "You may need to configure firewall rules manually" -Level Warning
        return $false
    }
}

# ============================================================================
# POST-INSTALLATION
# ============================================================================

function Show-InstallationSummary {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✓ INSTALLATION COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Installation Details:" -ForegroundColor Cyan
    Write-Host "  Location: $Script:InstallDir"
    Write-Host "  Service Name: $($Script:Config.ServiceName)"
    Write-Host "  Service Status: " -NoNewline
    
    $service = Get-Service -Name $Script:Config.ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "Running" -ForegroundColor Green
    }
    else {
        Write-Host "Check manually" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "  Backend URL: $BackendUrl"
    Write-Host "  Registration URL: $RegistrationUrl"
    Write-Host "  Hostname: $env:COMPUTERNAME"
    Write-Host "  Polling Interval: $PollingInterval seconds"
    
    if ($RegistrationToken) {
        Write-Host "  Registration Token: Configured ✓" -ForegroundColor Green
    }
    else {
        Write-Host "  Registration Token: Not provided (manual configuration may be needed)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Check service status: Get-Service $($Script:Config.ServiceName)"
    Write-Host "  2. View logs: Get-Content `"$Script:InstallDir\logs\service.log`" -Tail 50"
    Write-Host "  3. View configuration: notepad `"$Script:InstallDir\$($Script:Config.ConfigFileName)`""
    Write-Host "  4. Login to IT Management Portal to verify your computer appears"
    
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "  Start service: Start-Service $($Script:Config.ServiceName)"
    Write-Host "  Stop service: Stop-Service $($Script:Config.ServiceName)"
    Write-Host "  Restart service: Restart-Service $($Script:Config.ServiceName)"
    Write-Host "  Check status: Get-Service $($Script:Config.ServiceName) | Select-Object *"
    
    Write-Host ""
    Write-Host "Installation log saved to: $Script:LogPath" -ForegroundColor Gray
    Write-Host ""
}

function Show-ErrorSummary {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "✗ INSTALLATION FAILED" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "Please review the installation log for details:" -ForegroundColor Yellow
    Write-Host "  $Script:LogPath"
    Write-Host ""
    
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "  1. Python not installed (minimum version 3.7 required)"
    Write-Host "  2. Internet connectivity issues (cannot download dependencies)"
    Write-Host "  3. Insufficient permissions (must run as Administrator)"
    Write-Host "  4. Firewall or antivirus blocking installation"
    Write-Host ""
    
    Write-Host "For help, contact IT Support:" -ForegroundColor Cyan
    Write-Host "  Email: support@company.com"
    Write-Host "  Portal: $($Script:Config.PortalUrl)"
    Write-Host ""
}

function Open-ITPortal {
    if ($SkipPortalLaunch) {
        Write-Log "Portal launch skipped per user request" -Level Info
        return
    }
    
    if ($Silent) {
        Write-Log "Silent mode: skipping portal launch" -Level Info
        return
    }
    
    Write-Host ""
    $response = Read-Host "Would you like to open the IT Management Portal now? (Y/n)"
    
    if ($response -eq '' -or $response -match '^[Yy]') {
        Write-Log "Opening IT Management Portal in browser..." -Level Info
        
        try {
            Start-Process "$($Script:Config.PortalUrl)/login"
            Write-Log "✓ Portal opened in default browser" -Level Success
        }
        catch {
            Write-Log "⚠ Failed to open portal: $($_.Exception.Message)" -Level Warning
            Write-Host "Please open manually: $($Script:Config.PortalUrl)/login" -ForegroundColor Yellow
        }
    }
}

# ============================================================================
# MAIN INSTALLATION FLOW
# ============================================================================

function Start-Installation {
    $totalSteps = 12
    
    try {
        # Step 1: Prerequisites check
        Write-Step -Message "Checking prerequisites" -Step 1 -TotalSteps $totalSteps
        
        if (-not (Test-WindowsVersion)) {
            throw "Windows version check failed"
        }
        
        if (-not (Test-DiskSpace)) {
            throw "Disk space check failed"
        }
        
        # Step 2: Find Python
        Write-Step -Message "Detecting Python installation" -Step 2 -TotalSteps $totalSteps
        
        if (-not (Find-Python)) {
            throw "Python not found. Please install Python 3.7 or higher from https://www.python.org/downloads/"
        }
        
        if (-not (Test-PythonVersion)) {
            throw "Python version check failed"
        }
        
        # Step 3: Create installation directory
        Write-Step -Message "Creating installation directory" -Step 3 -TotalSteps $totalSteps
        
        if (-not (New-InstallationDirectory)) {
            throw "Failed to create installation directory"
        }
        
        # Step 4: Download/copy monitoring agent
        Write-Step -Message "Obtaining monitoring agent" -Step 4 -TotalSteps $totalSteps
        
        if (-not (Get-MonitoringAgent)) {
            throw "Failed to obtain monitoring agent"
        }
        
        # Step 5: Copy required files
        Write-Step -Message "Copying required files" -Step 5 -TotalSteps $totalSteps
        Copy-RequiredFiles
        
        # Step 6: Install Python dependencies
        Write-Step -Message "Installing Python dependencies" -Step 6 -TotalSteps $totalSteps
        
        if (-not (Install-PythonDependencies)) {
            throw "Failed to install Python dependencies"
        }
        
        # Step 7: Create configuration file
        Write-Step -Message "Creating configuration file" -Step 7 -TotalSteps $totalSteps
        
        if (-not (New-ConfigurationFile)) {
            throw "Failed to create configuration file"
        }
        
        # Step 8: Remove existing service
        Write-Step -Message "Removing existing service (if present)" -Step 8 -TotalSteps $totalSteps
        Remove-ExistingService
        
        # Step 9: Get NSSM
        Write-Step -Message "Obtaining NSSM (Service Manager)" -Step 9 -TotalSteps $totalSteps
        $hasNSSM = Get-NSSM
        
        # Step 10: Create Windows service
        Write-Step -Message "Creating Windows service" -Step 10 -TotalSteps $totalSteps
        
        $serviceCreated = $false
        if ($hasNSSM) {
            $serviceCreated = New-ServiceWithNSSM
        }
        
        if (-not $serviceCreated) {
            Write-Log "Attempting fallback to sc.exe method..." -Level Warning
            $serviceCreated = New-ServiceWithSC
        }
        
        if (-not $serviceCreated) {
            throw "Failed to create Windows service"
        }
        
        # Step 11: Configure firewall
        Write-Step -Message "Configuring firewall rules" -Step 11 -TotalSteps $totalSteps
        Set-FirewallRules
        
        # Step 12: Start service
        Write-Step -Message "Starting monitoring service" -Step 12 -TotalSteps $totalSteps
        
        if (-not (Start-MonitoringService)) {
            Write-Log "⚠ Service created but failed to start. Check logs for details." -Level Warning
        }
        
        $Script:InstallationSuccess = $true
    }
    catch {
        Write-Log "Installation failed: $($_.Exception.Message)" -Level Error
        throw
    }
}

# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

# Start transcript logging
Start-Transcript -Path $Script:LogPath -Force | Out-Null

try {
    # Display header
    Clear-Host
    Write-Header "IT Management Monitoring Agent Installer v2.0"
    
    Write-Host "This installer will:" -ForegroundColor Cyan
    Write-Host "  • Verify system requirements"
    Write-Host "  • Install Python dependencies"
    Write-Host "  • Configure monitoring agent"
    Write-Host "  • Create Windows service"
    Write-Host "  • Start monitoring automatically"
    Write-Host ""
    
    if (-not $Silent) {
        Write-Host "Press any key to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Write-Host ""
    }
    
    # Run installation
    Start-Installation
    
    # Show results
    if ($Script:InstallationSuccess) {
        Show-InstallationSummary
        Open-ITPortal
    }
    else {
        Show-ErrorSummary
    }
}
catch {
    Write-Log "Fatal error: $($_.Exception.Message)" -Level Error
    Show-ErrorSummary
    exit 1
}
finally {
    Stop-Transcript | Out-Null
    
    if ($Script:InstallationSuccess) {
        Write-Host "Installation completed. Thank you!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "Installation failed. Please review errors above." -ForegroundColor Red
        exit 1
    }
}



