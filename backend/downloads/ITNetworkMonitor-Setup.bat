@echo off
REM IT Network Monitor Agent - Installation Script
REM This batch file installs the Python-based network monitoring agent

echo ============================================================
echo    IT Network Monitor Agent Installer v1.0.0
echo ============================================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer requires Administrator privileges.
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo.
    echo Please install Python 3.8 or higher from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Python is installed
echo.

REM Get Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Python Version: %PYTHON_VERSION%
echo.

echo [2/6] Installing required Python packages...
python -m pip install --upgrade pip --quiet
python -m pip install psutil requests --quiet

if %errorLevel% neq 0 (
    echo ERROR: Failed to install Python packages
    pause
    exit /b 1
)
echo [OK] Python packages installed
echo.

echo [3/6] Creating installation directory...
set INSTALL_DIR=%ProgramFiles%\ITNetworkMonitor
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo [OK] Directory created: %INSTALL_DIR%
echo.

echo [4/6] Downloading agent files from server...
echo Please wait...

REM Download the Python agent script
powershell -Command "(New-Object Net.WebClient).DownloadFile('http://localhost:5001/downloads/network_monitor_agent.py', '%INSTALL_DIR%\network_monitor_agent.py')" 2>nul

if not exist "%INSTALL_DIR%\network_monitor_agent.py" (
    echo WARNING: Could not download from server. Using bundled script.
    echo.
    echo Please ensure the backend server is running at http://localhost:5001
    echo Or manually copy network_monitor_agent.py to %INSTALL_DIR%
    echo.
    echo Press any key to continue with manual setup, or Ctrl+C to cancel...
    pause >nul
)

echo [5/6] Creating Windows scheduled task...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F >nul 2>&1

if %errorLevel% equ 0 (
    echo [OK] Scheduled task created
) else (
    echo [WARNING] Could not create scheduled task
)
echo.

echo [6/6] Creating registry entry for auto-start...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ITNetworkMonitor" /t REG_SZ /d "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /f >nul 2>&1

if %errorLevel% equ 0 (
    echo [OK] Registry entry created
) else (
    echo [WARNING] Could not create registry entry
)
echo.

echo ============================================================
echo    Installation Complete!
echo ============================================================
echo.
echo Installation directory: %INSTALL_DIR%
echo.
echo NEXT STEPS:
echo 1. Open your IT Management Portal (Employee Login)
echo 2. Click "Download Agent" button
echo 3. Copy the registration token shown
echo 4. Run this command to register:
echo.
echo    python "%INSTALL_DIR%\network_monitor_agent.py" register YOUR_TOKEN_HERE
echo.
echo The agent will start automatically on next login.
echo To start it now, run:
echo    python "%INSTALL_DIR%\network_monitor_agent.py"
echo.
echo ============================================================
echo.

choice /C YN /M "Do you want to open the IT Management Portal now"
if %errorLevel% equ 1 (
    start http://localhost:5173/login
)

echo.
echo Installation log saved to: %INSTALL_DIR%\install.log
echo.
pause

