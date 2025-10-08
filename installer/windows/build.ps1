# IT Management Monitoring Agent - Windows Installer Build Script (PowerShell)
# This script builds the NSIS installer with advanced options

param(
    [string]$Version = "1.0.0",
    [string]$BackendURL = "https://itmanagement.company.com",
    [switch]$Clean = $false,
    [switch]$Sign = $false,
    [string]$CertificatePath = ""
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "IT Monitoring Agent Installer Builder" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check for NSIS
Write-Host "[1/6] Checking for NSIS..." -ForegroundColor Cyan
$nsisPath = Get-Command makensis -ErrorAction SilentlyContinue

if (-not $nsisPath) {
    Write-Host "ERROR: NSIS is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install NSIS from https://nsis.sourceforge.io/Download" -ForegroundColor Yellow
    Write-Host "Or add NSIS to your PATH environment variable" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ NSIS found: $($nsisPath.Source)" -ForegroundColor Green

# Check for Python
Write-Host "[2/6] Checking for Python..." -ForegroundColor Cyan
$pythonPath = Get-Command python -ErrorAction SilentlyContinue

if (-not $pythonPath) {
    Write-Host "WARNING: Python not found in PATH" -ForegroundColor Yellow
    Write-Host "The installer will download Python during installation" -ForegroundColor Yellow
} else {
    Write-Host "✓ Python found: $($pythonPath.Source)" -ForegroundColor Green
}

# Check prerequisites
Write-Host "[3/6] Checking prerequisites..." -ForegroundColor Cyan

$agentPath = "..\..\agent\monitoring_agent.py"
if (-not (Test-Path $agentPath)) {
    Write-Host "ERROR: monitoring_agent.py not found" -ForegroundColor Red
    Write-Host "Expected location: $agentPath" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Agent found: $agentPath" -ForegroundColor Green

# Copy files
Write-Host "[4/6] Copying files to installer directory..." -ForegroundColor Cyan

$filesToCopy = @(
    @{Source = "..\..\agent\monitoring_agent.py"; Dest = "monitoring_agent.py"},
    @{Source = "..\..\agent\requirements.txt"; Dest = "requirements.txt"},
    @{Source = "service_wrapper.py"; Dest = "service_wrapper.py"},
    @{Source = "License.txt"; Dest = "License.txt"},
    @{Source = "README.txt"; Dest = "README.txt"}
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file.Source) {
        Copy-Item $file.Source $file.Dest -Force
        Write-Host "  ✓ Copied $($file.Dest)" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ Warning: $($file.Source) not found" -ForegroundColor Yellow
    }
}

# Build installer
Write-Host "[5/6] Building installer with NSIS..." -ForegroundColor Cyan
Write-Host ""

$nsisArgs = @("/V2", "ITMonitoringAgent.nsi")
$process = Start-Process "makensis" -ArgumentList $nsisArgs -NoNewWindow -Wait -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installer created: ITMonitoringAgent-Setup-$Version.exe" -ForegroundColor White
    
    $installerSize = (Get-Item "ITMonitoringAgent-Setup-$Version.exe").Length / 1MB
    Write-Host "Installer size: $($installerSize.ToString('F2')) MB" -ForegroundColor Gray
    Write-Host ""
    
    # Code signing (if requested)
    if ($Sign -and $CertificatePath) {
        Write-Host "[6/6] Signing installer..." -ForegroundColor Cyan
        
        if (Test-Path $CertificatePath) {
            $signToolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe"
            
            if (Test-Path $signToolPath) {
                & $signToolPath sign /f $CertificatePath /t http://timestamp.digicert.com "ITMonitoringAgent-Setup-$Version.exe"
                Write-Host "✓ Installer signed successfully" -ForegroundColor Green
            } else {
                Write-Host "⚠ SignTool not found, skipping code signing" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠ Certificate file not found: $CertificatePath" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "To test the installer:" -ForegroundColor Yellow
    Write-Host "1. Right-click ITMonitoringAgent-Setup-$Version.exe" -ForegroundColor White
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Follow the installation wizard" -ForegroundColor White
    Write-Host ""
    
    # Clean up if requested
    if ($Clean) {
        Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
        Remove-Item "monitoring_agent.py" -Force -ErrorAction SilentlyContinue
        Remove-Item "requirements.txt" -Force -ErrorAction SilentlyContinue
        Remove-Item "service_wrapper.py" -Force -ErrorAction SilentlyContinue
        Remove-Item "License.txt" -Force -ErrorAction SilentlyContinue
        Remove-Item "README.txt" -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Cleanup complete" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Build complete!" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Exit code: $($process.ExitCode)" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    exit 1
}




