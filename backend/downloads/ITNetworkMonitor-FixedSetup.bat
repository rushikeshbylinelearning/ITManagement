@echo off
echo ========================================
echo IT Network Monitor Agent - Fixed Setup
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

REM Copy the fixed agent file
echo Copying fixed agent file...
copy "%~dp0network_monitor_agent.py" "%INSTALL_DIR%\network_monitor_agent.py" >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Agent file copied successfully
) else (
    echo ✗ Failed to copy agent file
    echo Please ensure network_monitor_agent.py is in the same directory as this installer
    pause
    exit /b 1
)

REM Install Python dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install psutil requests >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Python dependencies installed successfully
) else (
    echo ⚠ Warning: Some dependencies may not have installed properly
    echo The agent will attempt to install them when it runs
)

REM Create user directory for config and logs
set USER_DIR=%USERPROFILE%\.it_monitor
echo Creating user directory: %USER_DIR%
mkdir "%USER_DIR%" 2>nul

REM Create scheduled task for auto-start
echo Creating scheduled task for auto-start...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Scheduled task created successfully
) else (
    echo ⚠ Warning: Failed to create scheduled task
    echo You may need to start the agent manually
)

REM Start the agent
echo Starting the agent...
schtasks /Run /TN "ITNetworkMonitor" >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Agent started successfully
) else (
    echo ⚠ Warning: Failed to start agent automatically
    echo You can start it manually by running:
    echo python "%INSTALL_DIR%\network_monitor_agent.py"
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo The IT Network Monitor Agent has been installed with the following fixes:
echo ✓ Improved DNS resolution handling
echo ✓ Better network traffic monitoring
echo ✓ Auto-start configuration
echo ✓ Error handling improvements
echo.
echo Next steps:
echo 1. Go to the IT Management Portal dashboard
echo 2. Download and register the agent with your token
echo 3. The agent will automatically start monitoring network traffic
echo.
echo Installation directory: %INSTALL_DIR%
echo Config directory: %USER_DIR%
echo.
echo Press any key to exit...
pause >nul
