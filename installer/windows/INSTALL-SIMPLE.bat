@echo off
REM IT Monitoring Agent - Simple Installation Wrapper
REM This runs the corrected, simple PowerShell installer

echo ========================================
echo IT Monitoring Agent - Simple Installer
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo ERROR: This script must be run as Administrator
    echo.
    echo Please:
    echo   1. Right-click this file
    echo   2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Copy agent file to current directory if it exists in agent folder
if exist "..\..\agent\monitoring_agent.py" (
    echo Copying monitoring agent...
    copy "..\..\agent\monitoring_agent.py" . >nul 2>&1
)

REM Copy service wrapper if it exists
if exist "service_wrapper.py" (
    echo Copying service wrapper...
    copy "service_wrapper.py" . >nul 2>&1
)

echo.
echo Starting installation...
echo.

REM Run the simple PowerShell installer
PowerShell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0Install-MonitoringAgent-Simple.ps1" %*

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation completed successfully!
) else (
    echo.
    echo Installation failed. Please check the error messages above.
)

echo.
pause



