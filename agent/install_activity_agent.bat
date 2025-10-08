@echo off
REM Activity Monitor Agent Installer for Windows
REM Run as Administrator

echo ========================================
echo Activity Monitor Agent Installer
echo ========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: This script requires Administrator privileges
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Installing Python dependencies...
python -m pip install --upgrade pip
python -m pip install -r activity_agent_requirements.txt

if %errorLevel% NEQ 0 (
    echo ERROR: Failed to install Python dependencies
    echo Make sure Python is installed and added to PATH
    pause
    exit /b 1
)

echo.
echo ========================================
echo Configuration
echo ========================================
echo.

REM Prompt for configuration
set /p SERVER_URL="Enter server URL (e.g., https://your-server.com/api/activity-monitor): "
set /p AGENT_TOKEN="Enter agent token: "
set /p USER_ID="Enter user ID: "

REM Create configuration file
echo { > agent_config.json
echo   "server_url": "%SERVER_URL%", >> agent_config.json
echo   "agent_token": "%AGENT_TOKEN%", >> agent_config.json
echo   "user_id": "%USER_ID%", >> agent_config.json
echo   "system_name": "%COMPUTERNAME%", >> agent_config.json
echo   "report_interval": 300, >> agent_config.json
echo   "enable_browser_history": true, >> agent_config.json
echo   "enable_file_monitoring": true, >> agent_config.json
echo   "enable_network_monitoring": true, >> agent_config.json
echo   "max_cache_size": 100 >> agent_config.json
echo } >> agent_config.json

echo.
echo Configuration saved to agent_config.json
echo.

REM Install as Windows service
echo Installing as Windows Service...
python install_service.py install

if %errorLevel% EQU 0 (
    echo.
    echo ========================================
    echo Installation Complete!
    echo ========================================
    echo.
    echo The Activity Monitor Agent has been installed as a Windows service.
    echo.
    echo To start the service:
    echo   net start ActivityMonitorAgent
    echo.
    echo To stop the service:
    echo   net stop ActivityMonitorAgent
    echo.
    echo Starting service now...
    net start ActivityMonitorAgent
) else (
    echo.
    echo ERROR: Failed to install Windows service
    echo You can still run the agent manually:
    echo   python activity_monitor_agent.py
)

echo.
pause

