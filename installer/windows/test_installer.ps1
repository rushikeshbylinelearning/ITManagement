# IT Management Monitoring Agent - Installer Test Script
# This script helps test the installer in various scenarios

param(
    [switch]$TestMode = $false,
    [switch]$Uninstall = $false,
    [switch]$CheckStatus = $false,
    [switch]$ViewLogs = $false,
    [switch]$SimulateTelemetry = $false
)

$INSTALL_DIR = "C:\Program Files\ITMonitoringAgent"
$SERVICE_NAME = "ITMonitoringAgent"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IT Monitoring Agent - Installer Tester" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-AdminPrivileges {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-ServiceStatus {
    Write-Host "Checking service status..." -ForegroundColor Yellow
    
    $service = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
    
    if ($service) {
        Write-Host "✓ Service exists" -ForegroundColor Green
        Write-Host "  Name: $($service.Name)" -ForegroundColor Gray
        Write-Host "  Display Name: $($service.DisplayName)" -ForegroundColor Gray
        Write-Host "  Status: $($service.Status)" -ForegroundColor $(if($service.Status -eq 'Running'){'Green'}else{'Yellow'})
        Write-Host "  Startup Type: $($service.StartType)" -ForegroundColor Gray
        
        if ($service.Status -ne 'Running') {
            Write-Host ""
            Write-Host "⚠ Service is not running!" -ForegroundColor Yellow
            Write-Host "Try starting it: Start-Service $SERVICE_NAME" -ForegroundColor White
        }
    } else {
        Write-Host "✗ Service not found" -ForegroundColor Red
        Write-Host "The agent may not be installed." -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Get-InstallationStatus {
    Write-Host "Checking installation..." -ForegroundColor Yellow
    
    if (Test-Path $INSTALL_DIR) {
        Write-Host "✓ Installation directory exists: $INSTALL_DIR" -ForegroundColor Green
        
        # Check key files
        $files = @(
            "monitoring_agent.py",
            "service_wrapper.py",
            "config.json",
            "requirements.txt"
        )
        
        foreach ($file in $files) {
            $path = Join-Path $INSTALL_DIR $file
            if (Test-Path $path) {
                Write-Host "  ✓ $file" -ForegroundColor Gray
            } else {
                Write-Host "  ✗ $file (missing)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✗ Installation directory not found" -ForegroundColor Red
        Write-Host "The agent is not installed." -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Show-Configuration {
    Write-Host "Checking configuration..." -ForegroundColor Yellow
    
    $configPath = Join-Path $INSTALL_DIR "config.json"
    
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath | ConvertFrom-Json
            
            Write-Host "✓ Configuration found" -ForegroundColor Green
            Write-Host "  Backend URL: $($config.backend_url)" -ForegroundColor Gray
            Write-Host "  Registration URL: $($config.registration_url)" -ForegroundColor Gray
            Write-Host "  Agent ID: $(if($config.agent_id){'✓ Registered'}else{'✗ Not registered'})" -ForegroundColor $(if($config.agent_id){'Green'}else{'Yellow'})
            Write-Host "  Polling Interval: $($config.polling_interval) seconds" -ForegroundColor Gray
            Write-Host "  Log Level: $($config.log_level)" -ForegroundColor Gray
        } catch {
            Write-Host "✗ Error reading configuration: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Configuration file not found" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Show-Logs {
    $logsDir = Join-Path $INSTALL_DIR "logs"
    
    if (Test-Path $logsDir) {
        $logFiles = Get-ChildItem $logsDir -Filter "*.log" | Sort-Object LastWriteTime -Descending
        
        if ($logFiles.Count -gt 0) {
            Write-Host "Latest log file: $($logFiles[0].Name)" -ForegroundColor Cyan
            Write-Host "Last modified: $($logFiles[0].LastWriteTime)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Last 20 lines:" -ForegroundColor Yellow
            Write-Host "----------------------------------------" -ForegroundColor Gray
            Get-Content $logFiles[0].FullName -Tail 20
            Write-Host "----------------------------------------" -ForegroundColor Gray
        } else {
            Write-Host "No log files found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Logs directory not found" -ForegroundColor Red
    }
}

function Test-NetworkConnectivity {
    Write-Host "Testing network connectivity..." -ForegroundColor Yellow
    
    $configPath = Join-Path $INSTALL_DIR "config.json"
    
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
        $backendUrl = $config.backend_url
        
        if ($backendUrl) {
            try {
                $uri = [System.Uri]$backendUrl
                $serverHost = $uri.Host
                
                Write-Host "  Testing connection to: $serverHost" -ForegroundColor Gray
                
                $pingResult = Test-Connection -ComputerName $serverHost -Count 1 -Quiet -ErrorAction SilentlyContinue
                
                if ($pingResult) {
                    Write-Host "  ✓ Host is reachable" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠ Host may not be reachable (ping failed)" -ForegroundColor Yellow
                }
                
                # Test HTTP/HTTPS connectivity
                try {
                    $response = Invoke-WebRequest -Uri "$($uri.Scheme)://$($uri.Host)" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                    Write-Host "  ✓ HTTP/HTTPS connection successful" -ForegroundColor Green
                } catch {
                    Write-Host "  ⚠ HTTP/HTTPS connection failed: $($_.Exception.Message)" -ForegroundColor Yellow
                }
                
            } catch {
                Write-Host "  ✗ Error testing connectivity: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
}

function Simulate-Telemetry {
    Write-Host "Simulating telemetry submission..." -ForegroundColor Yellow
    
    $configPath = Join-Path $INSTALL_DIR "config.json"
    
    if (-not (Test-Path $configPath)) {
        Write-Host "✗ Configuration not found. Agent not installed?" -ForegroundColor Red
        return
    }
    
    $config = Get-Content $configPath | ConvertFrom-Json
    
    if (-not $config.agent_id -or -not $config.api_key) {
        Write-Host "✗ Agent not registered. Run the agent first to register." -ForegroundColor Red
        return
    }
    
    # Create sample telemetry
    $telemetry = @{
        agent_id = $config.agent_id
        hostname = $env:COMPUTERNAME
        metrics = @{
            os = "Windows"
            osVersion = [System.Environment]::OSVersion.Version.ToString()
            agentVersion = "1.0.0"
            cpu = @{
                model = "Test CPU"
                cores = [System.Environment]::ProcessorCount
                usage = 45.5
            }
            ram = @{
                total = 16384
                used = 8192
                usage = 50.0
            }
            disk = @{
                total = 500
                used = 250
                usage = 50.0
            }
        }
        processes = @()
        file_events = @()
        network = @()
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    
    try {
        $headers = @{
            "X-API-Key" = $config.api_key
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $config.backend_url -Method Post -Body ($telemetry | ConvertTo-Json -Depth 10) -Headers $headers
        
        if ($response.success) {
            Write-Host "✓ Telemetry submitted successfully!" -ForegroundColor Green
            Write-Host "  Alerts triggered: $($response.alertsTriggered)" -ForegroundColor Gray
        } else {
            Write-Host "✗ Telemetry submission failed: $($response.msg)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error submitting telemetry: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Uninstall-Agent {
    if (-not (Test-AdminPrivileges)) {
        Write-Host "✗ Administrator privileges required for uninstall" -ForegroundColor Red
        Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Uninstalling agent..." -ForegroundColor Yellow
    
    # Stop service
    $service = Get-Service -Name $SERVICE_NAME -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "Stopping service..." -ForegroundColor Gray
        Stop-Service -Name $SERVICE_NAME -Force
    }
    
    # Remove service
    if ($service) {
        Write-Host "Removing service..." -ForegroundColor Gray
        & sc.exe delete $SERVICE_NAME
    }
    
    # Check for uninstaller
    $uninstallerPath = Join-Path $INSTALL_DIR "uninstall.exe"
    
    if (Test-Path $uninstallerPath) {
        Write-Host "Running uninstaller..." -ForegroundColor Gray
        Start-Process $uninstallerPath -ArgumentList "/S" -Wait
        Write-Host "✓ Uninstall complete" -ForegroundColor Green
    } else {
        Write-Host "⚠ Uninstaller not found" -ForegroundColor Yellow
        Write-Host "Manually removing files..." -ForegroundColor Gray
        
        if (Test-Path $INSTALL_DIR) {
            Remove-Item $INSTALL_DIR -Recurse -Force
            Write-Host "✓ Files removed" -ForegroundColor Green
        }
    }
}

# Main execution
if (-not $TestMode -and -not $Uninstall -and -not $CheckStatus -and -not $ViewLogs -and -not $SimulateTelemetry) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\test_installer.ps1 -CheckStatus         Check installation and service status" -ForegroundColor White
    Write-Host "  .\test_installer.ps1 -ViewLogs           View recent log entries" -ForegroundColor White
    Write-Host "  .\test_installer.ps1 -TestMode           Run all diagnostic tests" -ForegroundColor White
    Write-Host "  .\test_installer.ps1 -SimulateTelemetry  Send test telemetry to backend" -ForegroundColor White
    Write-Host "  .\test_installer.ps1 -Uninstall          Uninstall the agent" -ForegroundColor White
    Write-Host ""
    exit
}

if ($CheckStatus -or $TestMode) {
    Get-InstallationStatus
    Get-ServiceStatus
    Show-Configuration
    
    if ($TestMode) {
        Test-NetworkConnectivity
    }
}

if ($ViewLogs) {
    Show-Logs
}

if ($SimulateTelemetry) {
    Simulate-Telemetry
}

if ($Uninstall) {
    $confirm = Read-Host "Are you sure you want to uninstall the agent? (y/n)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Uninstall-Agent
    } else {
        Write-Host "Uninstall cancelled" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green


