# Build script for IT Monitoring Agent MSI installer
# Requires WiX Toolset 3.11+ installed

param(
    [string]$Version = "1.0.0",
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IT Monitoring Agent MSI Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for WiX Toolset
Write-Host "[1/7] Checking for WiX Toolset..." -ForegroundColor Yellow

$wixPath = "${env:WIX}bin"
if (-not (Test-Path $wixPath)) {
    Write-Host "✗ WiX Toolset not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install WiX Toolset 3.11 or later:" -ForegroundColor Yellow
    Write-Host "  Download from: https://wixtoolset.org/releases/" -ForegroundColor White
    Write-Host "  Or use: dotnet tool install --global wix" -ForegroundColor White
    Write-Host ""
    exit 1
}

$candle = Join-Path $wixPath "candle.exe"
$light = Join-Path $wixPath "light.exe"

Write-Host "✓ WiX found at: $wixPath" -ForegroundColor Green

# Check prerequisites
Write-Host "[2/7] Checking prerequisites..." -ForegroundColor Yellow

$requiredFiles = @(
    "Product.wxs",
    "CustomUI.wxs",
    "InstallHelper.ps1",
    "service_wrapper.py",
    "License.txt",
    "README.txt"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "✗ Required file missing: $file" -ForegroundColor Red
        exit 1
    }
}

# Copy agent files from parent directory
Write-Host "[3/7] Copying agent files..." -ForegroundColor Yellow

$agentSource = "..\..\agent\monitoring_agent.py"
$reqSource = "..\..\agent\requirements.txt"

if (Test-Path $agentSource) {
    Copy-Item $agentSource "monitoring_agent.py" -Force
    Write-Host "✓ Copied monitoring_agent.py" -ForegroundColor Green
} else {
    Write-Host "✗ monitoring_agent.py not found at $agentSource" -ForegroundColor Red
    exit 1
}

if (Test-Path $reqSource) {
    Copy-Item $reqSource "requirements.txt" -Force
    Write-Host "✓ Copied requirements.txt" -ForegroundColor Green
} else {
    Write-Host "⚠ requirements.txt not found, creating default" -ForegroundColor Yellow
    @"
psutil>=5.9.0
requests>=2.28.0
watchdog>=2.1.9
pywin32>=304
"@ | Set-Content "requirements.txt"
}

# Download NSSM if not present
Write-Host "[4/7] Obtaining NSSM..." -ForegroundColor Yellow

if (-not (Test-Path "nssm.exe")) {
    Write-Host "Downloading NSSM..." -ForegroundColor Gray
    
    try {
        $nssmZip = "nssm-2.24.zip"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://nssm.cc/release/$nssmZip" -OutFile $nssmZip -UseBasicParsing
        
        Expand-Archive -Path $nssmZip -DestinationPath "." -Force
        Copy-Item "nssm-2.24\win64\nssm.exe" "nssm.exe" -Force
        
        Remove-Item $nssmZip -Force
        Remove-Item "nssm-2.24" -Recurse -Force
        
        Write-Host "✓ NSSM downloaded" -ForegroundColor Green
    } catch {
        Write-Host "⚠ NSSM download failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "⚠ Installer will require manual NSSM placement" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ NSSM already present" -ForegroundColor Green
}

# Create placeholder icon if missing
if (-not (Test-Path "icon.ico")) {
    Write-Host "⚠ icon.ico not found, using default" -ForegroundColor Yellow
    # WiX will use default icon
}

# Compile WiX source files
Write-Host "[5/7] Compiling WiX source files..." -ForegroundColor Yellow

try {
    # Compile Product.wxs
    & $candle Product.wxs -ext WixUIExtension -ext WixUtilExtension -out obj\Product.wixobj
    if ($LASTEXITCODE -ne 0) { throw "Candle failed for Product.wxs" }
    Write-Host "✓ Product.wxs compiled" -ForegroundColor Green
    
    # Compile CustomUI.wxs
    & $candle CustomUI.wxs -ext WixUIExtension -out obj\CustomUI.wixobj
    if ($LASTEXITCODE -ne 0) { throw "Candle failed for CustomUI.wxs" }
    Write-Host "✓ CustomUI.wxs compiled" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Compilation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Link into MSI
Write-Host "[6/7] Linking MSI package..." -ForegroundColor Yellow

$msiOutput = "ITMonitoringAgent-$Version.msi"

try {
    & $light obj\Product.wixobj obj\CustomUI.wixobj `
        -ext WixUIExtension `
        -ext WixUtilExtension `
        -out $msiOutput `
        -cultures:en-US `
        -loc Product.en-US.wxl 2>$null
    
    if ($LASTEXITCODE -ne 0) { throw "Light failed" }
    
    Write-Host "✓ MSI created: $msiOutput" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Linking failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Note: Localization file (Product.en-US.wxl) is optional" -ForegroundColor Gray
    
    # Try without localization
    & $light obj\Product.wixobj obj\CustomUI.wixobj `
        -ext WixUIExtension `
        -ext WixUtilExtension `
        -out $msiOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MSI created without localization: $msiOutput" -ForegroundColor Green
    } else {
        Write-Host "✗ Build failed" -ForegroundColor Red
        exit 1
    }
}

# Cleanup
if ($Clean) {
    Write-Host "[7/7] Cleaning up..." -ForegroundColor Yellow
    Remove-Item "obj" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "monitoring_agent.py" -Force -ErrorAction SilentlyContinue
    Remove-Item "requirements.txt" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Cleanup complete" -ForegroundColor Green
}

# Summary
$msiSize = (Get-Item $msiOutput).Length / 1MB
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output: $msiOutput" -ForegroundColor White
Write-Host "Size: $($msiSize.ToString('F2')) MB" -ForegroundColor Gray
Write-Host ""
Write-Host "To install:" -ForegroundColor Cyan
Write-Host "  Interactive: Double-click $msiOutput" -ForegroundColor White
Write-Host "  Silent: msiexec /i $msiOutput /quiet /norestart" -ForegroundColor White
Write-Host ""
Write-Host "To install with parameters:" -ForegroundColor Cyan
Write-Host '  msiexec /i $msiOutput BACKENDURL="https://backend.com" REGISTRATIONTOKEN="token123" /quiet' -ForegroundColor White
Write-Host ""



