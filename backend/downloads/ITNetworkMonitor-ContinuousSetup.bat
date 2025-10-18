@echo off
echo ========================================
echo IT Network Monitor Agent - Continuous Setup
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
echo Installing IT Network Monitor Agent for continuous operation...
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

REM Copy the improved agent file
echo Copying improved agent file...
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

REM Delete existing scheduled task if it exists
echo Removing existing scheduled task...
schtasks /Delete /TN "ITNetworkMonitor" /F >nul 2>&1

REM Create a new scheduled task that runs continuously
echo Creating continuous scheduled task...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F /RU "SYSTEM" >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ Continuous scheduled task created successfully
) else (
    echo ⚠ Warning: Failed to create scheduled task
    echo You may need to start the agent manually
)

REM Create a startup script that ensures the agent runs
echo Creating startup script...
echo @echo off > "%INSTALL_DIR%\start_agent.bat"
echo cd /d "%INSTALL_DIR%" >> "%INSTALL_DIR%\start_agent.bat"
echo python network_monitor_agent.py >> "%INSTALL_DIR%\start_agent.bat"

REM Add to startup folder
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo Creating startup shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%STARTUP_DIR%\ITNetworkMonitor.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\start_agent.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs" >nul 2>&1
del "%TEMP%\CreateShortcut.vbs" >nul 2>&1

REM Start the agent immediately
echo Starting the agent...
start /B python "%INSTALL_DIR%\network_monitor_agent.py"
if %errorLevel% == 0 (
    echo ✓ Agent started successfully in background
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
echo The IT Network Monitor Agent has been installed with:
echo ✓ Improved DNS resolution with service name mapping
echo ✓ Continuous background operation
echo ✓ Auto-start on system boot
echo ✓ Better error handling
echo ✓ Service name mapping for common IP ranges
echo.
echo The agent will now:
echo - Run continuously in the background
echo - Start automatically on system boot
echo - Show service names instead of IP addresses
echo - Send network data every 10 seconds
echo - Send heartbeats every 60 seconds
echo.
echo Next steps:
echo 1. Go to the IT Management Portal dashboard
echo 2. Register the agent with your token
echo 3. The agent will automatically start monitoring
echo.
echo Installation directory: %INSTALL_DIR%
echo Config directory: %USER_DIR%
echo.
echo Press any key to exit...
pause >nul
