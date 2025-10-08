# IT Management Monitoring Agent Installer - Windows PowerShell Script
# Corrected version with all issues resolved

param(
    [string]$BackendUrl = "https://itmanagement.company.com/api/monitoring/events",
    [string]$RegistrationUrl = "https://itmanagement.company.com/api/monitoring/register",
    [string]$RegistrationToken = ""
)

$ErrorActionPreference = "Stop"

# ===== FUNCTIONS =====
function Write-ColorOutput {
    param(
        [System.ConsoleColor]$Color,
        [string]$Message
    )
    # FIXED: Don't use $host variable - use $Host (capital H) or alternative
    $previousColor = [Console]::ForegroundColor
    [Console]::ForegroundColor = $Color
    Write-Host $Message
    [Console]::ForegroundColor = $previousColor
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput Green "✓ $Message"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-ColorOutput Red "✗ $Message"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-ColorOutput Yellow "⚠ $Message"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput Cyan "ℹ $Message"
}

# ===== CONFIGURATION =====
$InstallDir = "C:\Program Files\ITMonitoringAgent"
$ServiceName = "ITMonitoringAgent"
$ServiceDisplayName = "IT Management Monitoring Agent"
$ConfigFile = "$InstallDir\config.json"
$RequirementsFile = "$InstallDir\requirements.txt"
$PythonMinVersion = [version]"3.7.0"

# ===== START INSTALLER =====
Clear-Host
Write-ColorOutput Green "========================================"
Write-ColorOutput Green "IT Management Monitoring Agent Installer"
Write-ColorOutput Green "Windows Version"
Write-ColorOutput Green "========================================"
Write-Host ""

# ===== CHECK ADMIN =====
Write-Info "Checking administrator privileges..."
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error-Custom "This script must be run as Administrator."
    Write-Host ""
    Write-Host "Please right-click this script and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}
Write-Success "Running with administrator privileges"

# ===== CHECK PYTHON =====
Write-Info "Checking for Python 3..."
$pythonExe = $null

try {
    # Try python command
    $pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
    
    # Try py launcher if python not found
    if (-not $pythonExe) {
        $pythonExe = (Get-Command py -ErrorAction SilentlyContinue).Source
    }
    
    # Try common install paths
    if (-not $pythonExe) {
        $commonPaths = @(
            "C:\Python310\python.exe",
            "C:\Python39\python.exe",
            "C:\Python38\python.exe",
            "C:\Python37\python.exe"
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

    # Verify version
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
    Write-Error-Custom "Python 3.7+ is required but not found."
    Write-Host ""
    Write-Host "Please install Python from:" -ForegroundColor Yellow
    Write-Host "  https://www.python.org/downloads/" -ForegroundColor White
    Write-Host ""
    Write-Host "Make sure to check 'Add Python to PATH' during installation!" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# ===== CREATE INSTALL DIR =====
Write-Info "Creating installation directories..."
try {
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    if (-not (Test-Path "$InstallDir\logs")) {
        New-Item -ItemType Directory -Path "$InstallDir\logs" -Force | Out-Null
    }
    if (-not (Test-Path "$InstallDir\cache")) {
        New-Item -ItemType Directory -Path "$InstallDir\cache" -Force | Out-Null
    }
    Write-Success "Installation directory created: $InstallDir"
} catch {
    Write-Error-Custom "Failed to create installation directory: $($_.Exception.Message)"
    pause
    exit 1
}

# ===== CREATE REQUIREMENTS.TXT =====
Write-Info "Creating requirements.txt..."
$requirementsContent = @"
psutil>=5.9.0
requests>=2.28.0
watchdog>=2.1.9
pywin32>=304
"@
Set-Content -Path $RequirementsFile -Value $requirementsContent
Write-Success "requirements.txt created"

# ===== CHECK/COPY AGENT SCRIPT =====
Write-Info "Obtaining monitoring agent..."
$AgentFile = "$InstallDir\monitoring_agent.py"

# Check multiple locations
if (Test-Path $AgentFile) {
    Write-Success "Agent file already exists at $AgentFile"
} elseif (Test-Path "$env:TEMP\monitoring_agent.py") {
    Copy-Item "$env:TEMP\monitoring_agent.py" -Destination $AgentFile -Force
    Write-Success "Copied agent from TEMP directory"
} elseif (Test-Path ".\monitoring_agent.py") {
    Copy-Item ".\monitoring_agent.py" -Destination $AgentFile -Force
    Write-Success "Copied agent from current directory"
} else {
    Write-Error-Custom "Agent script not found!"
    Write-Host ""
    Write-Host "Please place monitoring_agent.py in one of these locations:" -ForegroundColor Yellow
    Write-Host "  1. Current directory: $(Get-Location)" -ForegroundColor White
    Write-Host "  2. TEMP directory: $env:TEMP" -ForegroundColor White
    Write-Host "  3. Install directory: $InstallDir" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# Copy service wrapper if exists
if (Test-Path ".\service_wrapper.py") {
    Copy-Item ".\service_wrapper.py" -Destination "$InstallDir\service_wrapper.py" -Force
    Write-Success "Service wrapper copied"
}

# ===== INSTALL PYTHON DEPENDENCIES =====
Write-Info "Installing Python dependencies (this may take a few minutes)..."
Write-Host ""

try {
    Write-Host "  Upgrading pip..." -ForegroundColor Gray
    & $pythonExe -m pip install --upgrade pip --quiet --disable-pip-version-check 2>&1 | Out-Null
    
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
    Write-Info "Verifying installations..."
    & $pythonExe -c "import psutil, requests, watchdog, win32service" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All packages verified"
    } else {
        Write-Warning-Custom "Package verification failed, but continuing..."
    }
} catch {
    Write-Error-Custom "Failed to install dependencies: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "You can try installing manually:" -ForegroundColor Yellow
    Write-Host "  $pythonExe -m pip install psutil requests watchdog pywin32" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Continue anyway? (Y/N)"
    if ($response -notmatch '^[Yy]') {
        exit 1
    }
}

# ===== CONFIGURATION INPUT =====
Write-Host ""
Write-Info "Agent Configuration"
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
    Write-Success "Configuration file created: $ConfigFile"
} catch {
    Write-Error-Custom "Failed to create configuration file: $($_.Exception.Message)"
    pause
    exit 1
}

# ===== DOWNLOAD/CHECK NSSM =====
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
        Write-Warning-Custom "NSSM download failed: $($_.Exception.Message)"
        Write-Host ""
        Write-Host "Please download NSSM manually from:" -ForegroundColor Yellow
        Write-Host "  https://nssm.cc/download" -ForegroundColor White
        Write-Host "Extract and place nssm.exe in:" -ForegroundColor Yellow
        Write-Host "  $nssmPath" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
} else {
    Write-Success "NSSM found at $nssmPath"
}

# ===== INSTALL SERVICE =====
Write-Info "Installing Windows service..."

# Remove existing service if present
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Info "Removing existing service..."
    try {
        if ($existingService.Status -eq 'Running') {
            Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
        }
        & sc.exe delete $ServiceName 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Write-Success "Existing service removed"
    } catch {
        Write-Warning-Custom "Failed to remove existing service"
    }
}

# Install service with NSSM
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
    Write-Error-Custom "Failed to create service: $($_.Exception.Message)"
    
    # Try fallback to pywin32
    if (Test-Path "$InstallDir\service_wrapper.py") {
        Write-Info "Attempting fallback to pywin32 wrapper..."
        try {
            & $pythonExe "$InstallDir\service_wrapper.py" install 2>&1 | Out-Null
            & sc.exe config $ServiceName start= auto 2>&1 | Out-Null
            Write-Success "Service created with pywin32 wrapper"
        } catch {
            Write-Error-Custom "All service creation methods failed"
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
    New-NetFirewallRule -DisplayName "IT Monitoring Agent" `
        -Direction Outbound `
        -Program $pythonExe `
        -Action Allow `
        -Description "Allow IT Monitoring Agent outbound HTTPS communication" `
        -ErrorAction Stop | Out-Null
    Write-Success "Firewall rule configured"
} catch {
    Write-Warning-Custom "Firewall configuration failed: $($_.Exception.Message)"
    Write-Host "  You may need to configure firewall manually" -ForegroundColor Gray
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
        Write-Warning-Custom "Service status: $($service.Status)"
        Write-Host "  Service will start on next system boot" -ForegroundColor Gray
    }
} catch {
    Write-Warning-Custom "Failed to start service: $($_.Exception.Message)"
    Write-Host "  Check logs: $InstallDir\logs\service_stderr.log" -ForegroundColor Gray
}

# ===== INSTALLATION SUMMARY =====
Write-Host ""
Write-ColorOutput Green "========================================"
Write-ColorOutput Green "✓ Installation Completed Successfully!"
Write-ColorOutput Green "========================================"
Write-Host ""

Write-Host "Installation Details:" -ForegroundColor Cyan
Write-Host "  Location: $InstallDir" -ForegroundColor White
Write-Host "  Service: $ServiceName" -ForegroundColor White
Write-Host "  Python: $pythonExe" -ForegroundColor White
Write-Host "  Backend: $BackendUrl" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Login to IT Management Portal" -ForegroundColor White
Write-Host "  2. Navigate to Monitoring section" -ForegroundColor White
Write-Host "  3. Your computer should appear within 2-3 minutes" -ForegroundColor White
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Check status: Get-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  View logs: Get-Content '$InstallDir\logs\service_stdout.log' -Tail 50" -ForegroundColor White
Write-Host "  View errors: Get-Content '$InstallDir\logs\service_stderr.log' -Tail 50" -ForegroundColor White
Write-Host "  Restart service: Restart-Service -Name $ServiceName" -ForegroundColor White
Write-Host "  Edit config: notepad '$ConfigFile'" -ForegroundColor White
Write-Host ""

# ===== OPEN IT MANAGEMENT PORTAL =====
$portalUrl = $BackendUrl -replace '/api/monitoring/events', '/login'

Write-Host "Would you like to open the IT Management Portal now?" -ForegroundColor Cyan
$openPortal = Read-Host "Open portal? (Y/N)"

if ($openPortal.Trim().ToUpper() -eq "Y" -or $openPortal.Trim() -eq "") {
    try {
        Start-Process $portalUrl
        Write-Success "Portal opened in default browser"
        Write-Host ""
        Write-Host "Please login and check the Monitoring section to verify your computer appears" -ForegroundColor Yellow
    } catch {
        Write-Warning-Custom "Failed to open portal: $($_.Exception.Message)"
        Write-Host "  Please open manually: $portalUrl" -ForegroundColor Gray
    }
}

Write-Host ""
Write-ColorOutput Green "Installation complete!"
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



