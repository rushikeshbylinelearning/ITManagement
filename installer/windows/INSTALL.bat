@echo off
REM IT Management Monitoring Agent - Installation Wrapper
REM This batch file makes it easy to run the PowerShell installer

echo ========================================
echo IT Management Monitoring Agent
echo Installation Wrapper
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

echo Starting PowerShell installer...
echo.

REM Run PowerShell script with execution policy bypass
PowerShell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0Install-ITMonitoringAgent.ps1" %*

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation completed successfully!
) else (
    echo.
    echo Installation failed. Please check the error messages above.
    echo.
    echo For help:
    echo   - Review installation log in %%TEMP%%
    echo   - Contact IT Support: support@company.com
    echo   - Visit: https://itmanagement.company.com
)

echo.
pause



