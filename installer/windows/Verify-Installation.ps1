#Requires -Version 5.1

<#
.SYNOPSIS
    Verifies IT Monitoring Agent installation

.DESCRIPTION
    Quick verification script to check if the monitoring agent is properly installed and running

.EXAMPLE
    .\Verify-Installation.ps1
#>

param()

$INSTALL_DIR = "C:\Program Files\ITMonitoringAgent"
$SERVICE_NAME = "ITMonitoringAgent"

function Write-Check {
    param(
        [string]$Item,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    $status = if ($Passed) { "✓" } else { "✗" }
    $color = if ($Passed) { "Green" } else { "Red" }
    
    Write-Host "$status " -ForegroundColor $color -NoNewline
    Write-Host $Item -NoNewline
    
    if ($Details) {
        Write-Host " - " -NoNewline -ForegroundColor Gray
        Write-Host $Details -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IT Monitoring Agent - Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Check 1: Installation directory
Write-Host "[1] Installation Directory" -ForegroundColor Yellow
$dirExists = Test-Path $INSTALL_DIR
Write-Check -Item "Directory exists" -Passed $dirExists -Details $INSTALL_DIR
$allPassed = $allPassed -and $dirExists
Write-Host ""

# Check 2: Required files
Write-Host "[2] Required Files" -ForegroundColor Yellow
$files = @("monitoring_agent.py", "service_wrapper.py", "config.json", "requirements.txt")
foreach ($file in $files) {
    $path = Join-Path $INSTALL_DIR $file
    $exists = Test-Path $path
    Write-Check -Item $file -Passed $exists -Details $path
    $allPassed = $allPassed -and $exists
}
Write-Host ""

# Check 3: Windows Service
Write-Host "[3] Windows Service" -ForegroundColor Yellow
$service = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
$serviceExists = $service -ne $null
Write-Check -Item "Service exists" -Passed $serviceExists -Details $SERVICE_NAME

if ($serviceExists) {
    $isRunning = $service.Status -eq 'Running'
    $isAutoStart = $service.StartType -eq 'Automatic'
    
    Write-Check -Item "Service running" -Passed $isRunning -Details $service.Status
    Write-Check -Item "Auto-start configured" -Passed $isAutoStart -Details $service.StartType
    
    $allPassed = $allPassed -and $isRunning
} else {
    $allPassed = $false
}
Write-Host ""

# Check 4: Configuration
Write-Host "[4] Configuration" -ForegroundColor Yellow
$configPath = Join-Path $INSTALL_DIR "config.json"
$configExists = Test-Path $configPath

if ($configExists) {
    try {
        $config = Get-Content $configPath | ConvertFrom-Json
        
        $hasBackendUrl = -not [string]::IsNullOrEmpty($config.backend_url)
        $hasHostname = -not [string]::IsNullOrEmpty($config.hostname)
        $isRegistered = -not [string]::IsNullOrEmpty($config.agent_id)
        
        Write-Check -Item "Config file valid" -Passed $true
        Write-Check -Item "Backend URL configured" -Passed $hasBackendUrl -Details $config.backend_url
        Write-Check -Item "Hostname set" -Passed $hasHostname -Details $config.hostname
        Write-Check -Item "Agent registered" -Passed $isRegistered -Details $(if($isRegistered){"Agent ID: $($config.agent_id.Substring(0,8))..."}else{"Not registered yet"})
        
        $allPassed = $allPassed -and $hasBackendUrl -and $hasHostname
    } catch {
        Write-Check -Item "Config file readable" -Passed $false -Details "Parse error"
        $allPassed = $false
    }
} else {
    Write-Check -Item "Config file exists" -Passed $false
    $allPassed = $false
}
Write-Host ""

# Check 5: Logs
Write-Host "[5] Logging" -ForegroundColor Yellow
$logsDir = Join-Path $INSTALL_DIR "logs"
$logsExist = Test-Path $logsDir

if ($logsExist) {
    $logFiles = Get-ChildItem $logsDir -Filter "*.log" -ErrorAction SilentlyContinue
    $hasLogs = $logFiles.Count -gt 0
    
    Write-Check -Item "Logs directory exists" -Passed $logsExist
    Write-Check -Item "Log files present" -Passed $hasLogs -Details "$($logFiles.Count) file(s)"
    
    if ($hasLogs) {
        $latestLog = $logFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $logAge = (Get-Date) - $latestLog.LastWriteTime
        $isRecent = $logAge.TotalMinutes -lt 5
        
        Write-Check -Item "Recent log activity" -Passed $isRecent -Details "Last: $($latestLog.LastWriteTime.ToString('HH:mm:ss'))"
    }
} else {
    Write-Check -Item "Logs directory exists" -Passed $false
}
Write-Host ""

# Check 6: Python
Write-Host "[6] Python Environment" -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    $hasPython = $LASTEXITCODE -eq 0
    Write-Check -Item "Python accessible" -Passed $hasPython -Details $pythonVersion
    
    if ($hasPython) {
        # Check packages
        $packages = @("psutil", "requests", "watchdog", "win32service")
        foreach ($pkg in $packages) {
            try {
                python -c "import $pkg" 2>&1 | Out-Null
                $hasPackage = $LASTEXITCODE -eq 0
                Write-Check -Item "$pkg package" -Passed $hasPackage
            } catch {
                Write-Check -Item "$pkg package" -Passed $false
            }
        }
    }
} catch {
    Write-Check -Item "Python accessible" -Passed $false -Details "Not in PATH"
    $allPassed = $false
}
Write-Host ""

# Check 7: Network Connectivity
Write-Host "[7] Network Connectivity" -ForegroundColor Yellow
if ($configExists) {
    try {
        $config = Get-Content $configPath | ConvertFrom-Json
        $uri = [System.Uri]$config.backend_url
        
        try {
            $connection = Test-NetConnection -ComputerName $uri.Host -Port 443 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue -InformationLevel Quiet
            Write-Check -Item "Backend reachable" -Passed $connection -Details "$($uri.Host):443"
        } catch {
            Write-Check -Item "Backend reachable" -Passed $false -Details "Cannot test"
        }
    } catch {
        Write-Check -Item "Backend URL parseable" -Passed $false
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✓ VERIFICATION PASSED" -ForegroundColor Green
    Write-Host "The monitoring agent is properly installed and running." -ForegroundColor Green
} else {
    Write-Host "✗ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "Some checks failed. Please review the errors above." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Recommendations
if (-not $allPassed) {
    Write-Host "Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "  1. Check service status: Get-Service $SERVICE_NAME"
    Write-Host "  2. View service logs: Get-Content `"$INSTALL_DIR\logs\service_error.log`" -Tail 50"
    Write-Host "  3. Try restarting service: Restart-Service $SERVICE_NAME"
    Write-Host "  4. Re-run installer if files are missing"
    Write-Host "  5. Contact IT Support if issues persist"
    Write-Host ""
}

# Quick commands
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  Check status: Get-Service $SERVICE_NAME | Format-List *"
Write-Host "  View logs: Get-Content `"$INSTALL_DIR\logs\service.log`" -Tail 50 -Wait"
Write-Host "  Restart service: Restart-Service $SERVICE_NAME"
Write-Host "  Edit config: notepad `"$INSTALL_DIR\config.json`""
Write-Host ""

exit $(if ($allPassed) { 0 } else { 1 })



