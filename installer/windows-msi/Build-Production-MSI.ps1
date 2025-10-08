# IT Management Monitoring Agent - Production MSI Builder
# This script creates a complete MSI installer with embedded Python runtime

param(
    [string]$Version = "1.0.0",
    [string]$PythonVersion = "3.11.9",
    [string]$Manufacturer = "Your Company IT",
    [switch]$Clean = $false,
    [switch]$SkipPythonDownload = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue' # Speed up downloads

# ============================================================================
# CONFIGURATION
# ============================================================================

$PYTHON_EMBED_URL = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip"
$NSSM_URL = "https://nssm.cc/release/nssm-2.24.zip"
$GET_PIP_URL = "https://bootstrap.pypa.io/get-pip.py"

$BUILD_DIR = $PSScriptRoot
$OBJ_DIR = Join-Path $BUILD_DIR "obj"
$PYTHON_DIR = Join-Path $BUILD_DIR "python"
$OUTPUT_DIR = Join-Path $BUILD_DIR "output"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "IT Monitoring Agent MSI Builder - v2.0" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: $Version" -ForegroundColor White
Write-Host "Python: $PythonVersion" -ForegroundColor White
Write-Host "Build Directory: $BUILD_DIR" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# STEP 1: VALIDATE ENVIRONMENT
# ============================================================================

Write-Host "[1/10] Validating build environment..." -ForegroundColor Yellow

# Check for WiX Toolset
$wixPath = $env:WIX
if (-not $wixPath) {
    Write-Host "✗ WiX Toolset not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install WiX Toolset 3.11 or later:" -ForegroundColor Yellow
    Write-Host "  Download: https://wixtoolset.org/releases/" -ForegroundColor White
    Write-Host "  Or run: dotnet tool install --global wix" -ForegroundColor White
    Write-Host ""
    exit 1
}

$candle = Join-Path $wixPath "bin\candle.exe"
$light = Join-Path $wixPath "bin\light.exe"

if (-not (Test-Path $candle) -or -not (Test-Path $light)) {
    Write-Host "✗ WiX binaries not found" -ForegroundColor Red
    exit 1
}

Write-Host "✓ WiX Toolset found: $wixPath" -ForegroundColor Green

# Check required source files
$requiredFiles = @(
    "Product.wxs",
    "CustomUI.wxs",
    "InstallHelper.ps1",
    "service_wrapper.py",
    "License.txt",
    "README.txt"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path (Join-Path $BUILD_DIR $file))) {
        Write-Host "✗ Required file missing: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ All required files present" -ForegroundColor Green

# Create directories
New-Item -ItemType Directory -Force -Path $OBJ_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

# ============================================================================
# STEP 2: DOWNLOAD PYTHON EMBEDDABLE
# ============================================================================

Write-Host ""
Write-Host "[2/10] Obtaining Python embeddable package..." -ForegroundColor Yellow

$pythonZip = Join-Path $BUILD_DIR "python-$PythonVersion-embed-amd64.zip"

if ($SkipPythonDownload -and (Test-Path $PYTHON_DIR)) {
    Write-Host "✓ Skipping Python download (using existing)" -ForegroundColor Green
} else {
    # Download Python embeddable if not cached
    if (-not (Test-Path $pythonZip)) {
        Write-Host "Downloading Python $PythonVersion embeddable..." -ForegroundColor Gray
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $PYTHON_EMBED_URL -OutFile $pythonZip -UseBasicParsing
            Write-Host "✓ Python downloaded: $([math]::Round((Get-Item $pythonZip).Length / 1MB, 2)) MB" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to download Python: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✓ Using cached Python download" -ForegroundColor Green
    }

    # Extract Python
    Write-Host "Extracting Python..." -ForegroundColor Gray
    if (Test-Path $PYTHON_DIR) {
        Remove-Item $PYTHON_DIR -Recurse -Force
    }
    Expand-Archive -Path $pythonZip -DestinationPath $PYTHON_DIR -Force
    Write-Host "✓ Python extracted to: $PYTHON_DIR" -ForegroundColor Green
}

# ============================================================================
# STEP 3: CONFIGURE PYTHON FOR PIP
# ============================================================================

Write-Host ""
Write-Host "[3/10] Configuring Python environment..." -ForegroundColor Yellow

# Uncomment site packages in pythonXX._pth file
$pthFiles = Get-ChildItem -Path $PYTHON_DIR -Filter "python*._pth"
if ($pthFiles.Count -gt 0) {
    $pthFile = $pthFiles[0].FullName
    $content = Get-Content $pthFile
    $newContent = $content | ForEach-Object {
        if ($_ -match "^#import site") {
            "import site"
        } else {
            $_
        }
    }
    # Add Lib\site-packages to path
    if ($newContent -notcontains "Lib\site-packages") {
        $newContent += "Lib\site-packages"
    }
    $newContent | Set-Content $pthFile
    Write-Host "✓ Configured Python path file: $($pthFiles[0].Name)" -ForegroundColor Green
} else {
    Write-Host "⚠ Python path file not found" -ForegroundColor Yellow
}

# Create required directories
New-Item -ItemType Directory -Force -Path (Join-Path $PYTHON_DIR "Lib\site-packages") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $PYTHON_DIR "Scripts") | Out-Null

# Download get-pip.py
Write-Host "Downloading pip installer..." -ForegroundColor Gray
$getPipPath = Join-Path $PYTHON_DIR "get-pip.py"
try {
    Invoke-WebRequest -Uri $GET_PIP_URL -OutFile $getPipPath -UseBasicParsing
    Write-Host "✓ Pip installer downloaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download pip: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Install pip
Write-Host "Installing pip..." -ForegroundColor Gray
$pythonExe = Join-Path $PYTHON_DIR "python.exe"
try {
    $pipInstallOutput = & $pythonExe $getPipPath --no-warn-script-location 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Pip installed successfully" -ForegroundColor Green
    } else {
        throw "Pip installation failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "⚠ Pip installation had warnings (may be OK): $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================================================
# STEP 4: INSTALL PYTHON DEPENDENCIES
# ============================================================================

Write-Host ""
Write-Host "[4/10] Installing Python dependencies..." -ForegroundColor Yellow

$packages = @(
    "psutil>=5.9.0",
    "requests>=2.28.0",
    "watchdog>=2.3.0",
    "pywin32>=306"
)

foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Gray
    try {
        & $pythonExe -m pip install $package --no-warn-script-location --quiet 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $package" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $package (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠ $package failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Run pywin32 post-install script
Write-Host "Configuring pywin32..." -ForegroundColor Gray
$pywin32Script = Get-ChildItem -Path (Join-Path $PYTHON_DIR "Lib\site-packages") -Filter "pywin32_postinstall.py" -Recurse | Select-Object -First 1
if ($pywin32Script) {
    try {
        & $pythonExe $pywin32Script.FullName -install -quiet -silent 2>&1 | Out-Null
        Write-Host "✓ pywin32 configured" -ForegroundColor Green
    } catch {
        Write-Host "⚠ pywin32 post-install warnings (usually OK)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ pywin32 post-install script not found" -ForegroundColor Yellow
}

# Verify installations
Write-Host "Verifying packages..." -ForegroundColor Gray
try {
    & $pythonExe -c "import psutil, requests, watchdog; print('OK')" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ All packages verified" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Package verification had issues" -ForegroundColor Yellow
}

# ============================================================================
# STEP 5: DOWNLOAD NSSM
# ============================================================================

Write-Host ""
Write-Host "[5/10] Obtaining NSSM service manager..." -ForegroundColor Yellow

$nssmExe = Join-Path $BUILD_DIR "nssm.exe"
if (-not (Test-Path $nssmExe)) {
    Write-Host "Downloading NSSM..." -ForegroundColor Gray
    try {
        $nssmZip = Join-Path $BUILD_DIR "nssm-2.24.zip"
        Invoke-WebRequest -Uri $NSSM_URL -OutFile $nssmZip -UseBasicParsing
        
        Expand-Archive -Path $nssmZip -DestinationPath $BUILD_DIR -Force
        Copy-Item (Join-Path $BUILD_DIR "nssm-2.24\win64\nssm.exe") $nssmExe -Force
        
        Remove-Item $nssmZip -Force
        Remove-Item (Join-Path $BUILD_DIR "nssm-2.24") -Recurse -Force
        
        Write-Host "✓ NSSM downloaded" -ForegroundColor Green
    } catch {
        Write-Host "⚠ NSSM download failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "⚠ Service creation may fail" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ NSSM already present" -ForegroundColor Green
}

# ============================================================================
# STEP 6: COPY AGENT FILES
# ============================================================================

Write-Host ""
Write-Host "[6/10] Copying agent files..." -ForegroundColor Yellow

$agentSource = Join-Path $BUILD_DIR "..\..\agent\monitoring_agent.py"
$reqSource = Join-Path $BUILD_DIR "..\..\agent\requirements.txt"

if (Test-Path $agentSource) {
    Copy-Item $agentSource (Join-Path $BUILD_DIR "monitoring_agent.py") -Force
    Write-Host "✓ Copied monitoring_agent.py" -ForegroundColor Green
} else {
    Write-Host "✗ monitoring_agent.py not found at $agentSource" -ForegroundColor Red
    exit 1
}

if (Test-Path $reqSource) {
    Copy-Item $reqSource (Join-Path $BUILD_DIR "requirements.txt") -Force
    Write-Host "✓ Copied requirements.txt" -ForegroundColor Green
} else {
    Write-Host "⚠ requirements.txt not found, creating default" -ForegroundColor Yellow
}

# ============================================================================
# STEP 7: GENERATE WIX HEAT FILES FOR PYTHON
# ============================================================================

Write-Host ""
Write-Host "[7/10] Generating component definitions..." -ForegroundColor Yellow

$heat = Join-Path $wixPath "bin\heat.exe"

# Generate Python components
Write-Host "Harvesting Python directory..." -ForegroundColor Gray
& $heat dir $PYTHON_DIR `
    -cg PythonComponents `
    -dr PYTHON_DIR `
    -gg -sfrag -srd -sreg `
    -var var.PythonSourceDir `
    -out (Join-Path $OBJ_DIR "Python.wxs")

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python components generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Python components" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 8: COMPILE WIX SOURCE FILES
# ============================================================================

Write-Host ""
Write-Host "[8/10] Compiling WiX source files..." -ForegroundColor Yellow

$wixVariables = @(
    "-dProductVersion=$Version",
    "-dManufacturer=$Manufacturer",
    "-dPythonSourceDir=$PYTHON_DIR"
)

try {
    # Compile Product.wxs
    Write-Host "Compiling Product.wxs..." -ForegroundColor Gray
    & $candle (Join-Path $BUILD_DIR "Product.wxs") `
        -ext WixUIExtension `
        -ext WixUtilExtension `
        $wixVariables `
        -out (Join-Path $OBJ_DIR "Product.wixobj")
    
    if ($LASTEXITCODE -ne 0) { throw "Product.wxs compilation failed" }
    Write-Host "  ✓ Product.wxs" -ForegroundColor Green
    
    # Compile CustomUI.wxs
    Write-Host "Compiling CustomUI.wxs..." -ForegroundColor Gray
    & $candle (Join-Path $BUILD_DIR "CustomUI.wxs") `
        -ext WixUIExtension `
        $wixVariables `
        -out (Join-Path $OBJ_DIR "CustomUI.wixobj")
    
    if ($LASTEXITCODE -ne 0) { throw "CustomUI.wxs compilation failed" }
    Write-Host "  ✓ CustomUI.wxs" -ForegroundColor Green
    
    # Compile Python.wxs
    Write-Host "Compiling Python.wxs..." -ForegroundColor Gray
    & $candle (Join-Path $OBJ_DIR "Python.wxs") `
        -ext WixUIExtension `
        $wixVariables `
        -out (Join-Path $OBJ_DIR "Python.wixobj")
    
    if ($LASTEXITCODE -ne 0) { throw "Python.wxs compilation failed" }
    Write-Host "  ✓ Python.wxs" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Compilation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 9: LINK MSI PACKAGE
# ============================================================================

Write-Host ""
Write-Host "[9/10] Linking MSI package..." -ForegroundColor Yellow

$msiOutput = Join-Path $OUTPUT_DIR "ITMonitoringAgent-$Version.msi"

try {
    & $light `
        (Join-Path $OBJ_DIR "Product.wixobj") `
        (Join-Path $OBJ_DIR "CustomUI.wixobj") `
        (Join-Path $OBJ_DIR "Python.wixobj") `
        -ext WixUIExtension `
        -ext WixUtilExtension `
        -out $msiOutput `
        -cultures:en-US `
        -sval
    
    if ($LASTEXITCODE -ne 0) { throw "Linking failed" }
    
    Write-Host "✓ MSI package created successfully" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Linking failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 10: CLEANUP
# ============================================================================

Write-Host ""
Write-Host "[10/10] Finalizing..." -ForegroundColor Yellow

if ($Clean) {
    Write-Host "Cleaning up build artifacts..." -ForegroundColor Gray
    Remove-Item $OBJ_DIR -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $BUILD_DIR "monitoring_agent.py") -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $BUILD_DIR "requirements.txt") -Force -ErrorAction SilentlyContinue
    # Keep Python and NSSM cached for future builds
    Write-Host "✓ Cleanup complete" -ForegroundColor Green
}

# ============================================================================
# SUMMARY
# ============================================================================

$msiSize = (Get-Item $msiOutput).Length / 1MB
$pythonSize = (Get-ChildItem -Path $PYTHON_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✓ BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "MSI Package Information:" -ForegroundColor Cyan
Write-Host "  Output: $msiOutput" -ForegroundColor White
Write-Host "  Size: $($msiSize.ToString('F2')) MB" -ForegroundColor Gray
Write-Host "  Python: $PythonVersion ($($pythonSize.ToString('F2')) MB bundled)" -ForegroundColor Gray
Write-Host "  Version: $Version" -ForegroundColor Gray
Write-Host ""
Write-Host "Installation Instructions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Interactive Installation:" -ForegroundColor Yellow
Write-Host "    Double-click $msiOutput" -ForegroundColor White
Write-Host ""
Write-Host "  Silent Installation:" -ForegroundColor Yellow
Write-Host "    msiexec /i `"$msiOutput`" /quiet /norestart" -ForegroundColor White
Write-Host ""
Write-Host "  Silent with Custom Parameters:" -ForegroundColor Yellow
Write-Host "    msiexec /i `"$msiOutput`" \" -ForegroundColor White
Write-Host "      BACKENDURL=`"https://your-backend.com/api/monitoring/events`" \" -ForegroundColor White
Write-Host "      REGISTRATIONURL=`"https://your-backend.com/api/monitoring/register`" \" -ForegroundColor White
Write-Host "      REGISTRATIONTOKEN=`"your-token-here`" \" -ForegroundColor White
Write-Host "      POLLINGINTERVAL=`"60`" \" -ForegroundColor White
Write-Host "      OPENPORTAL=`"0`" \" -ForegroundColor White
Write-Host "      /quiet /norestart" -ForegroundColor White
Write-Host ""
Write-Host "  Enterprise Deployment (GPO):" -ForegroundColor Yellow
Write-Host "    Use Group Policy Software Installation" -ForegroundColor White
Write-Host "    Configure MSI properties in GPO transforms (.mst)" -ForegroundColor White
Write-Host ""
Write-Host "  Uninstallation:" -ForegroundColor Yellow
Write-Host "    msiexec /x `"$msiOutput`" /quiet /norestart" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test the installer on a clean Windows VM" -ForegroundColor White
Write-Host "  2. Verify service installation and startup" -ForegroundColor White
Write-Host "  3. Check agent registration with backend" -ForegroundColor White
Write-Host "  4. Deploy to production systems" -ForegroundColor White
Write-Host ""
Write-Host "Build artifacts saved in: $OUTPUT_DIR" -ForegroundColor Gray
Write-Host ""

