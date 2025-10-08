@echo off
setlocal enabledelayedexpansion

REM ============================================
REM NOTICE: This file has been replaced!
REM Please use INSTALL.bat instead
REM ============================================

echo.
echo ========================================
echo NOTICE: Installer Replaced
echo ========================================
echo.
echo This installer has been replaced with a simpler version.
echo.
echo Please use INSTALL.bat instead.
echo.
echo INSTALL.bat is easier to use and more reliable.
echo.
pause
exit /b 0

REM ============================================
REM OLD CODE BELOW (KEPT FOR REFERENCE)
REM ============================================

title IT Management Monitoring Agent Installer (OLD)

REM ============================================
REM GET REGISTRATION TOKEN FROM URL PARAMETER
REM ============================================

REM Check if token was passed as parameter
set "REGISTRATION_TOKEN=%1"
if "%REGISTRATION_TOKEN%"=="" (
    echo [WARNING] No registration token provided. Agent will use default configuration.
    set "REGISTRATION_TOKEN=temp-registration-token"
)

REM ============================================
REM CHECK ADMINISTRATOR PRIVILEGES
REM ============================================

echo.
echo ========================================
echo IT Management Monitoring Agent Installer
echo ========================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This installer requires Administrator privileges.
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Running with Administrator privileges
echo.

REM ============================================
REM CREATE TEMPORARY POWERSHELL SCRIPT
REM ============================================

set "TempPS=%TEMP%\install_monitoring_agent_%RANDOM%.ps1"

echo Creating installer script...

(
echo # IT Management Monitoring Agent Installer
echo # Auto-generated PowerShell Script
echo.
echo $ErrorActionPreference = 'Continue'
echo.
echo Write-Host "========================================" -ForegroundColor Green
echo Write-Host "IT Management Monitoring Agent Installer" -ForegroundColor Green  
echo Write-Host "========================================" -ForegroundColor Green
echo Write-Host ""
echo.
echo # Configuration
echo $InstallDir = "C:\Program Files\ITMonitoringAgent"
echo $ServiceName = "ITMonitoringAgent"
echo.
echo try {
echo     # Step 1: Check Python
echo     Write-Host "[1/6] Checking Python..." -ForegroundColor Cyan
echo     $pythonCmd = $null
echo     try {
echo         $version = ^& python --version 2^>^&1
echo         if ^($version -match "Python"^) {
echo             $pythonCmd = "python"
echo             Write-Host "  Found Python: $version" -ForegroundColor Green
echo         }
echo     } catch {}
echo.    
echo     if ^(-not $pythonCmd^) {
echo         Write-Host "  Python not found. Please install Python 3.7+ first." -ForegroundColor Red
echo         Write-Host "  Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
echo         throw "Python not installed"
echo     }
echo     Write-Host ""
echo.
echo     # Step 2: Create directories
echo     Write-Host "[2/6] Creating directories..." -ForegroundColor Cyan
echo     if ^(-not ^(Test-Path $InstallDir^)^) {
echo         New-Item -ItemType Directory -Path $InstallDir -Force ^| Out-Null
echo     }
echo     New-Item -ItemType Directory -Path "$InstallDir\logs" -Force ^| Out-Null
echo     New-Item -ItemType Directory -Path "$InstallDir\cache" -Force ^| Out-Null
echo     Write-Host "  Created: $InstallDir" -ForegroundColor Green
echo     Write-Host ""
echo.
echo     # Step 3: Copy monitoring agent files
echo     Write-Host "[3/6] Copying monitoring agent files..." -ForegroundColor Cyan
echo.    
echo     # Get the directory where this batch file is located
echo     $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
echo.    
echo     # Copy the real monitoring agent
echo     $sourceAgent = Join-Path $scriptDir "monitoring_agent.py"
echo     $sourceReq = Join-Path $scriptDir "requirements.txt"
echo.    
echo     if ^(Test-Path $sourceAgent^) {
echo         Copy-Item $sourceAgent "$InstallDir\monitoring_agent.py" -Force
echo         Write-Host "  Copied monitoring_agent.py" -ForegroundColor Green
echo     } else {
echo         Write-Host "  Warning: monitoring_agent.py not found in installer directory" -ForegroundColor Yellow
echo     }
echo.    
echo     if ^(Test-Path $sourceReq^) {
echo         Copy-Item $sourceReq "$InstallDir\requirements.txt" -Force
echo         Write-Host "  Copied requirements.txt" -ForegroundColor Green
echo     } else {
echo         Write-Host "  Warning: requirements.txt not found in installer directory" -ForegroundColor Yellow
echo     }
echo.    
echo     # Create config.json with registration token
echo     $registrationToken = "%REGISTRATION_TOKEN%"
echo     $config = @{
echo         "backend_url" = "http://localhost:5001/api/monitoring/events"
echo         "registration_url" = "http://localhost:5001/api/monitoring/register"
echo         "api_key" = "default-monitoring-key-change-me"
echo         "agent_id" = $null
echo         "registration_token" = $registrationToken
echo         "hostname" = $env:COMPUTERNAME
echo         "polling_interval" = 60
echo         "monitored_directories" = @()
echo         "log_level" = "INFO"
echo         "retry_attempts" = 3
echo         "retry_backoff" = 5
echo         "local_cache_file" = "telemetry_cache.json"
echo     }
echo.    
echo     $config ^| ConvertTo-Json -Depth 3 ^| Set-Content -Path "$InstallDir\config.json" -Encoding UTF8
echo     Write-Host "  Created config.json" -ForegroundColor Green
echo     Write-Host ""
echo.
echo     # Step 4: Install packages
echo     Write-Host "[4/6] Installing Python packages..." -ForegroundColor Cyan
echo     $packages = @^('psutil', 'requests', 'watchdog', 'pywin32'^)
echo     foreach ^($pkg in $packages^) {
echo         Write-Host "  Installing $pkg..." -ForegroundColor Gray
echo         ^& python -m pip install $pkg --quiet 2^>^&1 ^| Out-Null
echo         if ^($LASTEXITCODE -eq 0^) {
echo             Write-Host "  OK $pkg" -ForegroundColor Green
echo         } else {
echo             Write-Host "  Warning: $pkg install had issues" -ForegroundColor Yellow
echo         }
echo     }
echo     Write-Host ""
echo.
echo     # Step 5: Create Windows Service
echo     Write-Host "[5/6] Creating Windows service..." -ForegroundColor Cyan
echo.
echo     # Stop and remove existing service
echo     $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
echo     if ^($existing^) {
echo         Write-Host "  Stopping existing service..." -ForegroundColor Gray
echo         Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
echo         Start-Sleep -Seconds 2
echo         sc.exe delete $ServiceName ^| Out-Null
echo         Start-Sleep -Seconds 2
echo     }
echo.
echo     # Get Python executable path
echo     $pythonExe = ^(Get-Command python^).Source
echo     $agentPath = "$InstallDir\monitoring_agent.py"
echo     $binPath = "\`"$pythonExe\`" \`"$agentPath\`""
echo.
echo     # Create service
echo     Write-Host "  Creating service..." -ForegroundColor Gray
echo     sc.exe create $ServiceName binPath= $binPath displayname= "IT Management Monitoring Agent" start= auto ^| Out-Null
echo.    
echo     if ^($LASTEXITCODE -eq 0^) {
echo         Write-Host "  Service created successfully" -ForegroundColor Green
echo.        
echo         # Set service description
echo         sc.exe description $ServiceName "Monitors system performance and security" ^| Out-Null
echo.        
echo         # Try to start service
echo         Write-Host "  Starting service..." -ForegroundColor Gray
echo         Start-Service -Name $ServiceName -ErrorAction SilentlyContinue
echo         Start-Sleep -Seconds 2
echo.        
echo         $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
echo         if ^($svc.Status -eq 'Running'^) {
echo             Write-Host "  Service is running" -ForegroundColor Green
echo         } else {
echo             Write-Host "  Service created but not running" -ForegroundColor Yellow
echo             Write-Host "  Will start on next reboot" -ForegroundColor Yellow
echo         }
echo     } else {
echo         throw "Failed to create service"
echo     }
echo.
echo     Write-Host ""
echo     Write-Host "========================================" -ForegroundColor Green
echo     Write-Host "Installation Completed Successfully!" -ForegroundColor Green
echo     Write-Host "========================================" -ForegroundColor Green
echo     Write-Host ""
echo     Write-Host "Installation directory: $InstallDir" -ForegroundColor White
echo     Write-Host "Service name: $ServiceName" -ForegroundColor White
echo     Write-Host ""
echo     Write-Host "The monitoring agent will now register with the backend." -ForegroundColor White
echo     Write-Host "You can now close this window." -ForegroundColor White
echo     Write-Host ""
echo.
echo } catch {
echo     Write-Host ""
echo     Write-Host "========================================" -ForegroundColor Red
echo     Write-Host "Installation Failed!" -ForegroundColor Red
echo     Write-Host "========================================" -ForegroundColor Red
echo     Write-Host ""
echo     Write-Host "Error: $_" -ForegroundColor Red
echo     Write-Host ""
echo     Write-Host "Please contact IT support." -ForegroundColor Yellow
echo     Write-Host ""
echo     exit 1
echo }
) > "%TempPS%"

REM ============================================
REM RUN POWERSHELL SCRIPT
REM ============================================

echo Running installation...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%TempPS%"

set INSTALL_RESULT=%errorLevel%

REM ============================================
REM CLEANUP AND EXIT
REM ============================================

if exist "%TempPS%" del /f /q "%TempPS%"

echo.
if %INSTALL_RESULT% equ 0 (
    echo Installation completed successfully!
) else (
    echo Installation encountered errors.
)
echo.
echo Press any key to exit...
pause >nul

exit /b %INSTALL_RESULT%