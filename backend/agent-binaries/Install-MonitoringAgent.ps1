# IT Management Monitoring Agent Installer
# PowerShell Installation Script

param(
    [string]$RegistrationToken = "temp-registration-token"
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Green
Write-Host "IT Management Monitoring Agent Installer" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Configuration
$InstallDir = "C:\Program Files\ITMonitoringAgent"
$ServiceName = "ITMonitoringAgent"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    # Step 1: Check Python
    Write-Host "[1/6] Checking Python..." -ForegroundColor Cyan
    $pythonCmd = $null
    try {
        $version = & python --version 2>&1
        if ($version -match "Python") {
            $pythonCmd = "python"
            Write-Host "  Found Python: $version" -ForegroundColor Green
        }
    } catch {}
    
    if (-not $pythonCmd) {
        Write-Host "  Python not found. Please install Python 3.7+ first." -ForegroundColor Red
        Write-Host "  Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
        throw "Python not installed"
    }
    Write-Host ""

    # Step 2: Create directories
    Write-Host "[2/6] Creating directories..." -ForegroundColor Cyan
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    New-Item -ItemType Directory -Path "$InstallDir\logs" -Force | Out-Null
    New-Item -ItemType Directory -Path "$InstallDir\cache" -Force | Out-Null
    Write-Host "  Created: $InstallDir" -ForegroundColor Green
    Write-Host ""

    # Step 3: Copy monitoring agent files
    Write-Host "[3/6] Copying monitoring agent files..." -ForegroundColor Cyan
    
    # Copy the real monitoring agent
    $sourceAgent = Join-Path $ScriptDir "monitoring_agent.py"
    $sourceReq = Join-Path $ScriptDir "requirements.txt"
    
    if (Test-Path $sourceAgent) {
        Copy-Item $sourceAgent "$InstallDir\monitoring_agent.py" -Force
        Write-Host "  Copied monitoring_agent.py" -ForegroundColor Green
    } else {
        Write-Host "  Warning: monitoring_agent.py not found" -ForegroundColor Yellow
    }
    
    if (Test-Path $sourceReq) {
        Copy-Item $sourceReq "$InstallDir\requirements.txt" -Force
        Write-Host "  Copied requirements.txt" -ForegroundColor Green
    } else {
        Write-Host "  Warning: requirements.txt not found" -ForegroundColor Yellow
    }
    
    # Create config.json with registration token
    $config = @{
        "backend_url" = "http://localhost:5001/api/monitoring/events"
        "registration_url" = "http://localhost:5001/api/monitoring/register"
        "api_key" = "default-monitoring-key-change-me"
        "agent_id" = $null
        "registration_token" = $RegistrationToken
        "hostname" = $env:COMPUTERNAME
        "polling_interval" = 60
        "monitored_directories" = @()
        "log_level" = "INFO"
        "retry_attempts" = 3
        "retry_backoff" = 5
        "local_cache_file" = "telemetry_cache.json"
    }
    
    $config | ConvertTo-Json -Depth 3 | Set-Content -Path "$InstallDir\config.json" -Encoding UTF8
    Write-Host "  Created config.json" -ForegroundColor Green
    Write-Host ""

    # Step 4: Install packages
    Write-Host "[4/6] Installing Python packages..." -ForegroundColor Cyan
    $packages = @('psutil', 'requests', 'watchdog', 'pywin32')
    foreach ($pkg in $packages) {
        Write-Host "  Installing $pkg..." -ForegroundColor Gray
        & python -m pip install $pkg --quiet 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $pkg" -ForegroundColor Green
        } else {
            Write-Host "  ! Warning: $pkg install had issues" -ForegroundColor Yellow
        }
    }
    Write-Host ""

    # Step 5: Create Windows Service
    Write-Host "[5/6] Creating Windows service..." -ForegroundColor Cyan

    # Stop and remove existing service
    $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  Stopping existing service..." -ForegroundColor Gray
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        sc.exe delete $ServiceName | Out-Null
        Start-Sleep -Seconds 2
    }

    # Get Python executable path
    $pythonExe = (Get-Command python).Source
    $agentPath = "$InstallDir\monitoring_agent.py"
    $binPath = "`"$pythonExe`" `"$agentPath`""

    # Create service
    Write-Host "  Creating service..." -ForegroundColor Gray
    sc.exe create $ServiceName binPath= $binPath displayname= "IT Management Monitoring Agent" start= auto | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Service created successfully" -ForegroundColor Green
        
        # Set service description
        sc.exe description $ServiceName "Monitors system performance and security" | Out-Null
        
        # Try to start service
        Write-Host "  Starting service..." -ForegroundColor Gray
        Start-Service -Name $ServiceName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($svc.Status -eq 'Running') {
            Write-Host "  ✓ Service is running" -ForegroundColor Green
        } else {
            Write-Host "  ! Service created but not running" -ForegroundColor Yellow
            Write-Host "  Will start on next reboot" -ForegroundColor Yellow
        }
    } else {
        throw "Failed to create service"
    }

    Write-Host ""
    Write-Host "[6/6] Finalizing installation..." -ForegroundColor Cyan
    Write-Host "  ✓ Installation complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Installation Completed Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation directory: $InstallDir" -ForegroundColor White
    Write-Host "Service name: $ServiceName" -ForegroundColor White
    Write-Host ""
    Write-Host "The monitoring agent will now register with the backend." -ForegroundColor White
    Write-Host ""

    exit 0

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Installation Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure Python 3.7+ is installed" -ForegroundColor Yellow
    Write-Host "  2. Run as Administrator" -ForegroundColor Yellow
    Write-Host "  3. Check antivirus isn't blocking installation" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please contact IT support if the problem persists." -ForegroundColor Yellow
    Write-Host ""
    
    exit 1
}

