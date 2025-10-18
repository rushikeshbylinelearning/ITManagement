@echo off
echo ========================================
echo IT Network Monitor Agent - Working Setup
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Running with administrator privileges
) else (
    echo ✗ This script requires administrator privileges
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo Installing IT Network Monitor Agent...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Python is installed
) else (
    echo ✗ Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Create installation directory
set INSTALL_DIR=%ProgramFiles%\ITNetworkMonitor
echo Creating installation directory: %INSTALL_DIR%
mkdir "%INSTALL_DIR%" 2>nul

REM Download the agent file directly from the server
echo Downloading agent file from server...
set BACKEND_URL=https://itmanagement.bylinelms.com

echo Downloading network_monitor_agent.py...
powershell -Command "Invoke-WebRequest -Uri '%BACKEND_URL%/downloads/network_monitor_agent.py' -OutFile '%INSTALL_DIR%\network_monitor_agent.py'"
if %errorLevel% neq 0 (
    echo ✗ Failed to download agent file
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo ✓ Agent file downloaded successfully

REM Install Python dependencies
echo Installing Python dependencies...
python -m pip install psutil requests --quiet
if %errorLevel% neq 0 (
    echo ⚠ Some dependencies failed to install, but continuing...
)

echo ✓ Dependencies installation completed

REM Create scheduled task
echo Creating Windows scheduled task...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F
if %errorLevel% neq 0 (
    echo ✗ Failed to create scheduled task
    echo You can start the agent manually by running:
    echo python "%INSTALL_DIR%\network_monitor_agent.py"
    pause
    exit /b 1
)

echo ✓ Scheduled task created successfully

REM Start the agent
echo Starting agent...
schtasks /Run /TN "ITNetworkMonitor"
if %errorLevel% neq 0 (
    echo ⚠ Task created but failed to start
    echo You can start it manually later
) else (
    echo ✓ Agent started successfully
)

echo.
echo ========================================
echo ✓ Installation completed successfully!
echo ========================================
echo.
echo The agent is now installed and will:
echo - Start automatically when Windows boots
echo - Run in the background without requiring CMD
echo - Monitor network traffic and report to the IT portal
echo.
echo Next steps:
echo 1. Open the IT Management Portal
echo 2. Go to the Employee section (Dashboard)
echo 3. Click the download button to get your registration token
echo 4. Run this command to register:
echo    python "%INSTALL_DIR%\network_monitor_agent.py" register YOUR_TOKEN_HERE
echo.
echo The agent will continue running in the background.
echo You can check its status in Task Scheduler (taskschd.msc)
echo.

echo Press any key to exit...
pause >nul


