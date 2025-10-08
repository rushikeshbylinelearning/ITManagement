# IT Management Monitoring Agent Installer - Windows PowerShell Script
# This script installs and configures the monitoring agent on Windows systems

param(
    [string]$BackendUrl,
    [string]$RegistrationUrl,
    [string]$RegistrationToken
)

$ErrorActionPreference = "Stop"

# Configuration
$InstallDir = "C:\Program Files\ITMonitoringAgent"
$ServiceName = "ITMonitoringAgent"
$ServiceDisplayName = "IT Management Monitoring Agent"
$ConfigFile = "config.json"
$AgentScript = "monitoring_agent.py"
$RequirementsFile = "requirements.txt"
$PythonMinVersion = [version]"3.7.0"

# Colors for console output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✓ $message"
}

function Write-Error-Custom($message) {
    Write-ColorOutput Red "✗ $message"
}

function Write-Warning-Custom($message) {
    Write-ColorOutput Yellow "⚠ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ $message"
}

Write-ColorOutput Green "========================================"
Write-ColorOutput Green "IT Management Monitoring Agent Installer"
Write-ColorOutput Green "Windows Version"
Write-ColorOutput Green "========================================"
Write-Output ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error-Custom "This script must be run as Administrator"
    Write-Output "Please right-click and select 'Run as Administrator'"
    exit 1
}

# Check for Python 3
Write-Info "Checking for Python 3..."
try {
    $pythonVersion = & python --version 2>&1
    if ($pythonVersion -match "Python (\d+\.\d+\.\d+)") {
        $version = [version]$Matches[1]
        if ($version -lt $PythonMinVersion) {
            Write-Error-Custom "Python version $version is too old. Minimum required: $PythonMinVersion"
            Write-Output "Please install Python 3.7 or higher from https://www.python.org/downloads/"
            exit 1
        }
        Write-Success "Found Python $version"
    }
} catch {
    Write-Error-Custom "Python 3 is not installed"
    Write-Output "Please install Python 3.7 or higher from https://www.python.org/downloads/"
    Write-Output "Make sure to check 'Add Python to PATH' during installation"
    exit 1
}

# Check for pip
Write-Info "Checking for pip..."
try {
    $pipVersion = & pip --version 2>&1
    Write-Success "Found pip"
} catch {
    Write-Error-Custom "pip is not installed"
    Write-Output "Please reinstall Python with pip support"
    exit 1
}

# Create installation directory
Write-Info "Creating installation directory..."
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}
Set-Location $InstallDir

# Create requirements.txt
Write-Info "Creating requirements file..."
$requirementsContent = @"
psutil>=5.9.0
requests>=2.28.0
watchdog>=2.1.9
pywin32>=304
"@
Set-Content -Path $RequirementsFile -Value $requirementsContent

# Check if agent script exists
if (Test-Path "$env:TEMP\monitoring_agent.py") {
    Write-Info "Copying agent script..."
    Copy-Item "$env:TEMP\monitoring_agent.py" -Destination $InstallDir
} else {
    Write-Warning-Custom "Agent script not found. Please manually copy monitoring_agent.py to $InstallDir"
}

# Install Python dependencies
Write-Info "Installing Python dependencies..."
try {
    & pip install -r $RequirementsFile --quiet
    Write-Success "Dependencies installed"
} catch {
    Write-Error-Custom "Failed to install dependencies: $_"
    exit 1
}

# Prompt for configuration if not provided
if (-not $BackendUrl) {
    $BackendUrl = Read-Host "Backend URL (e.g., https://itmanagement.company.com/api/monitoring/events)"
}
if (-not $RegistrationUrl) {
    $RegistrationUrl = Read-Host "Registration URL (e.g., https://itmanagement.company.com/api/monitoring/register)"
}
if (-not $RegistrationToken) {
    $RegistrationToken = Read-Host "Registration Token"
}

# Create configuration file
Write-Info "Creating configuration file..."
$config = @{
    backend_url = $BackendUrl
    registration_url = $RegistrationUrl
    registration_token = $RegistrationToken
    api_key = $null
    agent_id = $null
    hostname = $env:COMPUTERNAME
    polling_interval = 60
    monitored_directories = @()
    log_level = "INFO"
    retry_attempts = 3
    retry_backoff = 5
    local_cache_file = "telemetry_cache.json"
} | ConvertTo-Json

Set-Content -Path $ConfigFile -Value $config

Write-Success "Configuration file created"

# Create Windows Service using NSSM (Non-Sucking Service Manager) or Python script as service
Write-Info "Setting up Windows Service..."

# Create a simple service wrapper script
$serviceWrapperContent = @"
import sys
import os
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket

# Add the installation directory to Python path
sys.path.insert(0, r'$InstallDir')

from monitoring_agent import MonitoringAgent

class ITMonitoringService(win32serviceutil.ServiceFramework):
    _svc_name_ = '$ServiceName'
    _svc_display_name_ = '$ServiceDisplayName'
    _svc_description_ = 'Monitors system performance and security for IT management'

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        socket.setdefaulttimeout(60)
        self.agent = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        if self.agent:
            self.agent.stop()

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()

    def main(self):
        os.chdir(r'$InstallDir')
        self.agent = MonitoringAgent('$ConfigFile')
        try:
            self.agent.run()
        except Exception as e:
            servicemanager.LogErrorMsg(f'Service error: {str(e)}')

if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(ITMonitoringService)
"@

Set-Content -Path "service_wrapper.py" -Value $serviceWrapperContent

# Install the service
Write-Info "Installing Windows Service..."
try {
    & python service_wrapper.py install
    Write-Success "Service installed"
    
    # Start the service
    Write-Info "Starting service..."
    & python service_wrapper.py start
    
    Start-Sleep -Seconds 3
    
    # Check service status
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Output ""
        Write-ColorOutput Green "========================================"
        Write-Success "Installation successful!"
        Write-ColorOutput Green "========================================"
        Write-Output ""
        Write-Output "Service Status: Running"
        Write-Output "Installation Directory: $InstallDir"
        Write-Output "Service Name: $ServiceName"
        Write-Output ""
        Write-Output "Useful commands:"
        Write-Output "  View service: Get-Service -Name $ServiceName"
        Write-Output "  Restart service: Restart-Service -Name $ServiceName"
        Write-Output "  Stop service: Stop-Service -Name $ServiceName"
        Write-Output "  View logs: Get-Content $InstallDir\monitoring_agent.log -Tail 50"
        Write-Output ""
    } else {
        Write-Warning-Custom "Service may not have started correctly"
        Write-Output "Check Event Viewer for service errors"
    }
} catch {
    Write-Error-Custom "Failed to install service: $_"
    Write-Output "You may need to install the service manually"
    exit 1
}




