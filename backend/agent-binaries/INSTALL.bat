@echo off
REM IT Management Monitoring Agent - One-Click Installer
REM Simple batch wrapper for PowerShell installer

title IT Management Monitoring Agent Installer

REM ============================================
REM CHECK ADMINISTRATOR PRIVILEGES
REM ============================================

echo.
echo ========================================
echo IT Monitoring Agent - One-Click Install
echo ========================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This installer requires Administrator privileges.
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Running with Administrator privileges
echo.

REM ============================================
REM GET REGISTRATION TOKEN FROM PARAMETER
REM ============================================

set "REGISTRATION_TOKEN=%1"
if "%REGISTRATION_TOKEN%"=="" (
    set "REGISTRATION_TOKEN=temp-registration-token"
)

REM ============================================
REM RUN POWERSHELL INSTALLER
REM ============================================

echo Starting installation...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-MonitoringAgent.ps1" -RegistrationToken "%REGISTRATION_TOKEN%"

set INSTALL_RESULT=%errorLevel%

REM ============================================
REM SHOW RESULT
REM ============================================

echo.
if %INSTALL_RESULT% equ 0 (
    echo ========================================
    echo Installation completed successfully!
    echo ========================================
) else (
    echo ========================================
    echo Installation encountered errors.
    echo ========================================
)
echo.
echo Press any key to exit...
pause >nul

exit /b %INSTALL_RESULT%

