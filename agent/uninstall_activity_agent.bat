@echo off
REM Activity Monitor Agent Uninstaller for Windows
REM Run as Administrator

echo ========================================
echo Activity Monitor Agent Uninstaller
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

echo Stopping service...
net stop ActivityMonitorAgent

echo.
echo Removing service...
python install_service.py remove

echo.
echo ========================================
echo Uninstallation Complete!
echo ========================================
echo.
echo The Activity Monitor Agent has been removed.
echo Configuration and log files have been retained.
echo.
pause

