# IT Management Monitoring Agent Installer - Windows PowerShell Script
# Robust and corrected version

param(
    [string]$BackendUrl = "https://itmanagement.company.com/api/monitoring/events",
    [string]$RegistrationUrl = "https://itmanagement.company.com/api/monitoring/register",
    [string]$RegistrationToken = "",
    [string]$AgentUrl = ""
)

$ErrorActionPreference = "Stop"

# ===== CONFIGURATION =====
$InstallDir = "C:\Program Files\ITMonitoringAgent"
$ServiceName = "ITMonitoringAgent"
$ServiceDisplayName = "IT Management Monitoring Agent"
$ConfigFile = "$InstallDir\config.json"
$RequirementsFile = "$InstallDir\requirements.txt"
$PythonMinVersion = [version]"3.7.0"
$LogFile = "$InstallDir\install.log"

# ===== COLOR FUNCTIONS =====
function Write-Color {
    param(
        [System.ConsoleColor]$Color,
        [string]$Message
    )
    $oldColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Color
    Write-Host $Message
    $Host.UI.RawUI.ForegroundColor = $oldColor
}

function Write-Success {
    param([string]$msg)
    Write-Color Green "✓ $msg"
}

function Write-WarningCustom {
    param([string]$msg)
    Write-Color Yellow "⚠ $msg"
}

function Write-ErrorCustom {
    param([string]$msg)
    Write-Color Red "✗ $msg"
}

function Write-Info {
    param([string]$msg)
    Write-Color Cyan "ℹ $msg"
}

Write-Color Green "========================================"
Write-Color Green "IT Management Monitoring Agent Installer"
Write-Color Green "Windows Version"
Write-Color Green "========================================"
Write-Host ""

# ===== ADMIN CHECK =====
Write-Info "Checking administrator privileges..."
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-ErrorCustom "This script must be run as Administrator."
    Write-Host ""
    Write-Host "Please right-click this script and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}
Write-Success "Running with administrator privileges"

# ===== PYTHON CHECK =====
Write-Info "Checking for Python 3..."
$pythonExe = $null

try {
    # Try 'python' command
    $pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
    
    if (-not $pythonExe) {
        # Try 'py' launcher
        $pythonExe = (Get-Command py -ErrorAction SilentlyContinue).Source
    }
    
    if (-not $pythonExe) {
        # Try common paths
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
                $pythonExe = $path
                break
            }
        }
    }
    
    if (-not $pythonExe) {
        throw "Python not found on PATH or common locations."
    }

    # Check version
    $versionOutput = & $pythonExe --version 2>&1
    if ($versionOutput -match "Python (\d+)\.(\d+)\.(\d+)") {
        $version = [version]"$($Matches[1]).$($Matches[2]).$($Matches[3])"
        if ($version -lt $PythonMinVersion) {
            throw "Python version $version is too old. Minimum required: $PythonMinVersion"
        }
        Write-Success "Found Python $version at $pythonExe"
    } else {
        throw "Could not determine Python version"
    }
} catch {
    Write-ErrorCustom "Python 3.7+ is required but not found."
    Write-Host ""
    Write-Host "Please install Python from:" -ForegroundColor Yellow
    Write-Host "  https://www.python.org/downloads/" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Windows Package Manager:" -ForegroundColor Yellow
    Write-Host "  winget install Python.Python.3.10" -ForegroundColor White
    Write-Host ""
    Write-Host "Make sure to check 'Add Python to PATH' during installation!" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# ===== CREATE INSTALL DIR =====
Write-Info "Creating installation directory..."
try {
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    
    # Create subdirectories
    if (-not (Test-Path "$InstallDir\logs")) {
        New-Item -ItemType Directory -Path "$InstallDir\logs" -Force | Out-Null
    }
    if (-not (Test-Path "$InstallDir\cache")) {
        New-Item -ItemType Directory -Path "$InstallDir\cache" -Force | Out-Null
    }
    
    Write-Success "Installation directory created: $InstallDir"
} catch {
    Write-ErrorCustom "Failed to create installation directory: $($_.Exception.Message)"
    pause
    exit 1
}

# ===== CREATE REQUIREMENTS FILE =====
Write-Info "Creating requirements file..."
$requirementsContent = @"
psutil>=5.9.0
requests>=2.28.0
watchdog>=2.1.9
pywin32>=304
"@
try {
    Set-Content -Path $RequirementsFile -Value $requirementsContent
    Write-Success "requirements.txt created"
} catch {
    Write-WarningCustom "Failed to create requirements.txt: $($_.Exception.Message)"
}

# ===== DOWNLOAD OR COPY AGENT =====
$AgentFile = "$InstallDir\monitoring_agent.py"
Write-Info "Obtaining monitoring agent..."

# Check if agent already exists
if (Test-Path $AgentFile) {
    Write-Success "Agent file already exists at $AgentFile"
} elseif ($AgentUrl) {
    # Download from URL
    Write-Info "Downloading agent from $AgentUrl..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $AgentUrl -OutFile $AgentFile -UseBasicParsing -TimeoutSec 120
        Write-Success "Agent downloaded successfully"
    } catch {
        Write-ErrorCustom "Failed to download agent: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "Please download monitoring_agent.py manually and place it in:" -ForegroundColor Yellow
        Write-Host "  $AgentFile" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
} elseif (Test-Path ".\monitoring_agent.py") {
    # Copy from current directory
    Write-Info "Copying agent from current directory..."
    Copy-Item ".\monitoring_agent.py" $AgentFile -Force
    Write-Success "Agent file copied"
} else {
    Write-ErrorCustom "Agent file not found!"
    Write-Host ""
    Write-Host "Please either:" -ForegroundColor Yellow
    Write-Host "  1. Place monitoring_agent.py in the same directory as this script" -ForegroundColor White
    Write-Host "  2. Or provide -AgentUrl parameter to download it" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# ===== COPY SERVICE WRAPPER =====
if (Test-Path ".\service_wrapper.py") {
    Write-Info "Copying service wrapper..."
    Copy-Item ".\service_wrapper.py" "$InstallDir\service_wrapper.py" -Force
    Write-Success "Service wrapper copied"
}

# ===== INSTALL PYTHON DEPENDENCIES =====
Write-Info "Installing Python dependencies (this may take a few minutes)..."
Write-Host ""

try {
    # Upgrade pip first
    Write-Host "  Upgrading pip..." -ForegroundColor Gray
    & $pythonExe -m pip install --upgrade pip --quiet --disable-pip-version-check 2>&1 | Out-Null
    
    # Install packages
    Write-Host "  Installing psutil..." -ForegroundColor Gray
    & $pythonExe -m pip install "psutil>=5.9.0" --quiet --disable-pip-version-check 2>&1 | Out-Null
    
    Write-Host "  Installing requests..." -ForegroundColor Gray
    & $pythonExe -m pip install "requests>=2.28.0" --quiet --disable-pip-version-check 2>&1 | Out-Null
    
    Write-Host "  Installing watchdog..." -ForegroundColor Gray
    & $pythonExe -m pip install "watchdog>=2.1.9" --quiet --disable-pip-version-check 2>&1 | Out-Null
    
    Write-Host "  Installing pywin32..." -ForegroundColor Gray
    & $pythonExe -m pip install "pywin32>=304" --quiet --disable-pip-version-check 2>&1 | Out-Null
    
    Write-Host ""
    Write-Success "Python dependencies installed successfully"
    
    # Verify
    Write-Info "Verifying package installations..."
    & $pythonExe -c "import psutil, requests, watchdog, win32service" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All packages verified"
    } else {
        Write-WarningCustom "Package verification failed, but continuing..."
    }
} catch {
    Write-ErrorCustom "Failed to install Python dependencies: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "You can install manually with:" -ForegroundColor Yellow
    Write-Host "  $pythonExe -m pip install psutil requests watchdog pywin32" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Continue anyway? (Y/N)"
    if ($response -notmatch '^[Yy]') {
        exit 1
    }
}

# ===== PROMPT FOR CONFIGURATION =====
Write-Host ""
Write-Info "Configuration"
Write-Host ""

if (-not $BackendUrl -or $BackendUrl -eq "https://itmanagement.company.com/api/monitoring/events") {
    $input = Read-Host "Backend URL [$BackendUrl]"
    if ($input) { $BackendUrl = $input }
}

if (-not $RegistrationUrl -or $RegistrationUrl -eq "https://itmanagement.company.com/api/monitoring/register") {
    $input = Read-Host "Registration URL [$RegistrationUrl]"
    if ($input) { $RegistrationUrl = $input }
}

if (-not $RegistrationToken) {
    $RegistrationToken = Read-Host "Registration Token (optional, press Enter to skip)"
}

# ===== CREATE CONFIGURATION FILE =====
Write-Info "Creating configuration file..."

$configObj = @{
    backend_url = $BackendUrl
    registration_url = $RegistrationUrl
    registration_token = if ($RegistrationToken) { $RegistrationToken } else { $null }
    api_key = $null
    agent_id = $null
    hostname = $env:COMPUTERNAME
    polling_interval = 60
    monitored_directories = @()
    log_level = "INFO"
    retry_attempts = 3
    retry_backoff = 5
    local_cache_file = "$InstallDir\cache\telemetry_cache.json"
}

try {
    $configJson = $configObj | ConvertTo-Json -Depth 6
    Set-Content -Path $ConfigFile -Value $configJson -Encoding UTF8
    Write-Success "Configuration file created at $ConfigFile"
} catch {
    Write-ErrorCustom "Failed to create configuration file: $($_.Exception.Message)"
    pause
    exit 1
}

# ===== DOWNLOAD NSSM =====
$nssmPath = "$InstallDir\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Info "Downloading NSSM (Service Manager)..."
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        
        $nssmZip = "$env:TEMP\nssm.zip"
        Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $nssmZip -UseBasicParsing -TimeoutSec 60
        
        Expand-Archive -Path $nssmZip -DestinationPath "$env:TEMP\nssm" -Force
        Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" $nssmPath -Force
        
        Remove-Item $nssmZip -Force -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\nssm" -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-Success "NSSM downloaded successfully"
    } catch {
        Write-WarningCustom "NSSM download failed: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "Please download NSSM manually from:" -ForegroundColor Yellow
        Write-Host "  https://nssm.cc/download" -ForegroundColor White
        Write-Host "Extract and place nssm.exe in:" -ForegroundColor Yellow
        Write-Host "  $nssmPath" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
}

# ===== SERVICE CREATION USING NSSM =====
Write-Info "Configuring Windows service..."

# Stop and remove existing service if present
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Info "Removing existing service..."
    try {
        Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
        & sc.exe delete $ServiceName 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Write-Success "Existing service removed"
    } catch {
        Write-WarningCustom "Failed to remove existing service: $($_.Exception.Message)"
    }
}

# Install service with NSSM
Write-Info "Installing Windows service..."
try {
    & $nssmPath install $ServiceName $pythonExe $AgentFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Service installed"
        
        # Configure service
        & $nssmPath set $ServiceName DisplayName $ServiceDisplayName 2>&1 | Out-Null
        & $nssmPath set $ServiceName Description "Monitors system performance and security for IT management" 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppDirectory $InstallDir 2>&1 | Out-Null
        & $nssmPath set $ServiceName Start SERVICE_AUTO_START 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppStdout "$InstallDir\logs\service_stdout.log" 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppStderr "$InstallDir\logs\service_stderr.log" 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppRotateFiles 1 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppRotateBytes 10485760 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppExit Default Restart 2>&1 | Out-Null
        & $nssmPath set $ServiceName AppRestartDelay 60000 2>&1 | Out-Null
        
        Write-Success "Service configured"
    } else {
        throw "NSSM install returned exit code $LASTEXITCODE"
    }
} catch {
    Write-ErrorCustom "Failed to create service: $($_.Exception.Message)"
    
    # Try fallback to pywin32 if service_wrapper.py exists
    $serviceWrapperPath = "$InstallDir\service_wrapper.py"
    if (Test-Path $serviceWrapperPath) {
        Write-Info "Attempting fallback to pywin32 service wrapper..."
        try {
            & $pythonExe $serviceWrapperPath install 2>&1 | Out-Null
            & sc.exe config $ServiceName start= auto 2>&1 | Out-Null
            Write-Success "Service created with pywin32 wrapper"
        } catch {
            Write-ErrorCustom "Service creation failed with all methods"
            pause
            exit 1
        }
    } else {
        pause
        exit 1
    }
}

# ===== CONFIGURE FIREWALL =====
Write-Info "Configuring Windows Firewall..."
try {
    Remove-NetFirewallRule -DisplayName "IT Monitoring Agent" -ErrorAction SilentlyContinue 2>&1 | Out-Null
    New-NetFirewallRule -DisplayName "IT Monitoring Agent" -Direction Outbound -Program $pythonExe -Action Allow -Description "Allow IT Monitoring Agent to communicate with backend" -ErrorAction Stop | Out-Null
    Write-Success "Firewall rule added"
} catch {
    Write-WarningCustom "Failed to configure firewall: $($_.Exception.Message)"
    Write-Host "  You may need to add firewall rules manually" -ForegroundColor Gray
}

# ===== START SERVICE =====
Write-Info "Starting monitoring service..."
try {
    Start-Service -Name $ServiceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name $ServiceName
    
    if ($service.Status -eq 'Running') {
        Write-Success "Service $ServiceName is running"
    } else {
        Write-WarningCustom "Service status: $($service.Status)"
        Write-Host "  The service will start on next system boot" -ForegroundColor Gray
    }
} catch {
    Write-WarningCustom "Failed to start service: $($_.Exception.Message)"
    Write-Host "  Check logs at: $InstallDir\logs\service_stderr.log" -ForegroundColor Gray
    Write-Host "  The service will attempt to start on next system boot" -ForegroundColor Gray
}

# ===== INSTALLATION SUMMARY =====
Write-Host ""
Write-Color Green "========================================"
Write-Color Green "✓ Installation Completed Successfully!"
Write-Color Green "========================================"
Write-Host ""

Write-Host "Installation Details:" -ForegroundColor Cyan
Write-Host "  Location: $InstallDir" -ForegroundColor White
Write-Host "  Service: $ServiceName" -ForegroundColor White
Write-Host "  Python: $pythonExe" -ForegroundColor White
Write-Host "  Backend: $BackendUrl" -ForegroundColor White
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Check status: Get-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  View logs: Get-Content '$InstallDir\logs\service_stdout.log' -Tail 50" -ForegroundColor White
Write-Host "  Restart service: Restart-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Edit config: notepad '$ConfigFile'" -ForegroundColor White
Write-Host ""

# ===== OPEN IT MANAGEMENT PORTAL =====
$portalUrl = $BackendUrl -replace '/api/monitoring/events', ''

Write-Host "Would you like to open the IT Management Portal now?" -ForegroundColor Cyan
$openPortal = Read-Host "Open portal? (Y/N)"

if ($openPortal.Trim().ToUpper() -eq "Y" -or $openPortal.Trim() -eq "") {
    try {
        Start-Process "$portalUrl/login"
        Write-Success "Portal opened in default browser"
        Write-Host ""
        Write-Host "Please login to verify your computer appears in the Monitoring section" -ForegroundColor Yellow
    } catch {
        Write-WarningCustom "Failed to open portal: $($_.Exception.Message)"
        Write-Host "  Please open manually: $portalUrl/login" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Installation complete! Press any key to exit..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



