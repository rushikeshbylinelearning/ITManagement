# Test Installation Script for IT Monitoring Agent MSI
# This script tests the MSI installation in various scenarios

param(
    [string]$MsiPath = ".\output\ITMonitoringAgent-1.0.0.msi",
    [ValidateSet('Interactive', 'Silent', 'SilentWithLog', 'CustomParams', 'All')]
    [string]$TestMode = 'Interactive',
    [string]$BackendUrl = "http://localhost:5001/api/monitoring/events",
    [string]$RegistrationUrl = "http://localhost:5001/api/monitoring/register",
    [string]$RegistrationToken = "test-token-12345"
)

$ErrorActionPreference = "Continue"

function Write-TestHeader {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-TestResult {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✓ $Message" -ForegroundColor Green
    } else {
        Write-Host "✗ $Message" -ForegroundColor Red
    }
}

function Test-Prerequisites {
    Write-TestHeader "Testing Prerequisites"
    
    # Check if MSI exists
    $msiExists = Test-Path $MsiPath
    Write-TestResult $msiExists "MSI file exists: $MsiPath"
    
    if (-not $msiExists) {
        Write-Host "Please build the MSI first using build.bat" -ForegroundColor Red
        return $false
    }
    
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    Write-TestResult $isAdmin "Running as Administrator"
    
    if (-not $isAdmin) {
        Write-Host "This script requires Administrator privileges" -ForegroundColor Red
        Write-Host "Please run as Administrator" -ForegroundColor Yellow
        return $false
    }
    
    # Check if agent is already installed
    $agentInstalled = Test-Path "C:\Program Files\ITMonitoringAgent"
    if ($agentInstalled) {
        Write-Host "⚠ Agent already installed - will uninstall first" -ForegroundColor Yellow
        
        Write-Host "Uninstalling existing agent..." -ForegroundColor Gray
        $uninstallResult = Start-Process msiexec.exe -ArgumentList "/x `"$MsiPath`" /quiet /norestart" -Wait -PassThru
        
        Start-Sleep -Seconds 5
        
        $stillInstalled = Test-Path "C:\Program Files\ITMonitoringAgent"
        Write-TestResult (-not $stillInstalled) "Existing agent uninstalled"
    }
    
    return $true
}

function Test-InteractiveInstall {
    Write-TestHeader "Test 1: Interactive Installation"
    
    Write-Host "Starting interactive installation..." -ForegroundColor Yellow
    Write-Host "Please follow the wizard and complete the installation" -ForegroundColor Yellow
    Write-Host ""
    
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$MsiPath`"" -Wait -PassThru
    
    $exitCode = $process.ExitCode
    $success = ($exitCode -eq 0) -or ($exitCode -eq 3010)
    
    Write-Host ""
    Write-TestResult $success "Installation completed (Exit code: $exitCode)"
    
    return $success
}

function Test-SilentInstall {
    Write-TestHeader "Test 2: Silent Installation"
    
    Write-Host "Installing silently..." -ForegroundColor Yellow
    
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$MsiPath`" /quiet /norestart" -Wait -PassThru
    
    $exitCode = $process.ExitCode
    $success = ($exitCode -eq 0) -or ($exitCode -eq 3010)
    
    Write-TestResult $success "Silent installation completed (Exit code: $exitCode)"
    
    return $success
}

function Test-SilentInstallWithLog {
    Write-TestHeader "Test 3: Silent Installation with Logging"
    
    $logFile = Join-Path $env:TEMP "agent-install-test.log"
    Write-Host "Installing silently with log: $logFile" -ForegroundColor Yellow
    
    $process = Start-Process msiexec.exe -ArgumentList "/i `"$MsiPath`" /quiet /norestart /l*v `"$logFile`"" -Wait -PassThru
    
    $exitCode = $process.ExitCode
    $success = ($exitCode -eq 0) -or ($exitCode -eq 3010)
    
    Write-TestResult $success "Installation completed (Exit code: $exitCode)"
    Write-TestResult (Test-Path $logFile) "Log file created"
    
    if (Test-Path $logFile) {
        Write-Host "Log file: $logFile" -ForegroundColor Gray
    }
    
    return $success
}

function Test-CustomParameters {
    Write-TestHeader "Test 4: Installation with Custom Parameters"
    
    Write-Host "Installing with custom parameters..." -ForegroundColor Yellow
    Write-Host "  Backend URL: $BackendUrl" -ForegroundColor Gray
    Write-Host "  Registration URL: $RegistrationUrl" -ForegroundColor Gray
    Write-Host "  Registration Token: $RegistrationToken" -ForegroundColor Gray
    
    $arguments = @(
        "/i",
        "`"$MsiPath`"",
        "BACKENDURL=`"$BackendUrl`"",
        "REGISTRATIONURL=`"$RegistrationUrl`"",
        "REGISTRATIONTOKEN=`"$RegistrationToken`"",
        "POLLINGINTERVAL=`"30`"",
        "OPENPORTAL=`"0`"",
        "/quiet",
        "/norestart"
    )
    
    $process = Start-Process msiexec.exe -ArgumentList $arguments -Wait -PassThru
    
    $exitCode = $process.ExitCode
    $success = ($exitCode -eq 0) -or ($exitCode -eq 3010)
    
    Write-TestResult $success "Installation completed (Exit code: $exitCode)"
    
    return $success
}

function Test-Installation {
    Write-TestHeader "Verifying Installation"
    
    Start-Sleep -Seconds 5
    
    # Check installation directory
    $installDirExists = Test-Path "C:\Program Files\ITMonitoringAgent"
    Write-TestResult $installDirExists "Installation directory exists"
    
    # Check Python
    $pythonExists = Test-Path "C:\Program Files\ITMonitoringAgent\python\python.exe"
    Write-TestResult $pythonExists "Bundled Python exists"
    
    # Check agent script
    $agentExists = Test-Path "C:\Program Files\ITMonitoringAgent\monitoring_agent.py"
    Write-TestResult $agentExists "Agent script exists"
    
    # Check config file
    $configExists = Test-Path "C:\Program Files\ITMonitoringAgent\config.json"
    Write-TestResult $configExists "Configuration file exists"
    
    if ($configExists) {
        $config = Get-Content "C:\Program Files\ITMonitoringAgent\config.json" | ConvertFrom-Json
        Write-Host "  Backend URL: $($config.backend_url)" -ForegroundColor Gray
        Write-Host "  Hostname: $($config.hostname)" -ForegroundColor Gray
        Write-Host "  Polling Interval: $($config.polling_interval)s" -ForegroundColor Gray
    }
    
    # Check service
    $service = Get-Service -Name "ITMonitoringAgent" -ErrorAction SilentlyContinue
    $serviceExists = $null -ne $service
    Write-TestResult $serviceExists "Windows service exists"
    
    if ($serviceExists) {
        $serviceRunning = $service.Status -eq 'Running'
        Write-TestResult $serviceRunning "Service is running (Status: $($service.Status))"
        
        Write-Host "  Display Name: $($service.DisplayName)" -ForegroundColor Gray
        Write-Host "  Start Type: $($service.StartType)" -ForegroundColor Gray
    }
    
    # Check logs
    Start-Sleep -Seconds 5
    
    $logExists = Test-Path "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log"
    Write-TestResult $logExists "Agent log file exists"
    
    if ($logExists) {
        Write-Host ""
        Write-Host "Recent log entries:" -ForegroundColor Yellow
        Get-Content "C:\Program Files\ITMonitoringAgent\logs\monitoring_agent.log" -Tail 10 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    
    # Check registry
    $regExists = Test-Path "HKLM:\SOFTWARE\ITMonitoringAgent"
    Write-TestResult $regExists "Registry keys exist"
    
    if ($regExists) {
        $regValues = Get-ItemProperty -Path "HKLM:\SOFTWARE\ITMonitoringAgent"
        Write-Host "  Install Path: $($regValues.InstallPath)" -ForegroundColor Gray
        Write-Host "  Version: $($regValues.Version)" -ForegroundColor Gray
    }
    
    # Overall success
    $overallSuccess = $installDirExists -and $pythonExists -and $agentExists -and $configExists -and $serviceExists
    
    Write-Host ""
    if ($overallSuccess) {
        Write-Host "✓ INSTALLATION VERIFIED SUCCESSFULLY" -ForegroundColor Green
    } else {
        Write-Host "✗ INSTALLATION VERIFICATION FAILED" -ForegroundColor Red
    }
    
    return $overallSuccess
}

function Test-Uninstall {
    Write-TestHeader "Testing Uninstallation"
    
    Write-Host "Uninstalling agent..." -ForegroundColor Yellow
    
    $process = Start-Process msiexec.exe -ArgumentList "/x `"$MsiPath`" /quiet /norestart" -Wait -PassThru
    
    $exitCode = $process.ExitCode
    $success = ($exitCode -eq 0) -or ($exitCode -eq 3010)
    
    Write-TestResult $success "Uninstall completed (Exit code: $exitCode)"
    
    Start-Sleep -Seconds 5
    
    # Verify removal
    $serviceExists = $null -ne (Get-Service -Name "ITMonitoringAgent" -ErrorAction SilentlyContinue)
    Write-TestResult (-not $serviceExists) "Service removed"
    
    $dirExists = Test-Path "C:\Program Files\ITMonitoringAgent"
    Write-TestResult (-not $dirExists) "Installation directory removed"
    
    $regExists = Test-Path "HKLM:\SOFTWARE\ITMonitoringAgent"
    Write-TestResult (-not $regExists) "Registry keys removed"
    
    return $success
}

# Main execution
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "IT Monitoring Agent MSI - Test Suite" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MSI Path: $MsiPath" -ForegroundColor White
Write-Host "Test Mode: $TestMode" -ForegroundColor White
Write-Host ""

# Check prerequisites
if (-not (Test-Prerequisites)) {
    exit 1
}

# Run tests based on mode
$testResults = @()

switch ($TestMode) {
    'Interactive' {
        $result = Test-InteractiveInstall
        Start-Sleep -Seconds 3
        $verifyResult = Test-Installation
        $testResults += @{Name="Interactive Install"; Success=$result -and $verifyResult}
    }
    
    'Silent' {
        $result = Test-SilentInstall
        Start-Sleep -Seconds 3
        $verifyResult = Test-Installation
        $testResults += @{Name="Silent Install"; Success=$result -and $verifyResult}
    }
    
    'SilentWithLog' {
        $result = Test-SilentInstallWithLog
        Start-Sleep -Seconds 3
        $verifyResult = Test-Installation
        $testResults += @{Name="Silent Install with Log"; Success=$result -and $verifyResult}
    }
    
    'CustomParams' {
        $result = Test-CustomParameters
        Start-Sleep -Seconds 3
        $verifyResult = Test-Installation
        $testResults += @{Name="Install with Custom Params"; Success=$result -and $verifyResult}
    }
    
    'All' {
        # Test 1: Silent install
        Write-Host "===== Running All Tests =====" -ForegroundColor Magenta
        $result1 = Test-SilentInstall
        Start-Sleep -Seconds 3
        $verify1 = Test-Installation
        $testResults += @{Name="Silent Install"; Success=$result1 -and $verify1}
        
        Test-Uninstall
        Start-Sleep -Seconds 3
        
        # Test 2: Silent with log
        $result2 = Test-SilentInstallWithLog
        Start-Sleep -Seconds 3
        $verify2 = Test-Installation
        $testResults += @{Name="Silent with Log"; Success=$result2 -and $verify2}
        
        Test-Uninstall
        Start-Sleep -Seconds 3
        
        # Test 3: Custom parameters
        $result3 = Test-CustomParameters
        Start-Sleep -Seconds 3
        $verify3 = Test-Installation
        $testResults += @{Name="Custom Parameters"; Success=$result3 -and $verify3}
    }
}

# Final uninstall
if ($TestMode -ne 'All') {
    Write-Host ""
    Write-Host "Would you like to uninstall the agent? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        Test-Uninstall
    }
}

# Summary
Write-TestHeader "Test Summary"

foreach ($result in $testResults) {
    Write-TestResult $result.Success $result.Name
}

$allSuccess = ($testResults | Where-Object {-not $_.Success}).Count -eq 0

Write-Host ""
if ($allSuccess) {
    Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
Write-Host ""

