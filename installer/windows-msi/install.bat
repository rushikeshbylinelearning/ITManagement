@echo off
REM IT Monitoring Agent - MSI Installation Wrapper
REM This batch file simplifies MSI installation with proper parameters
REM AUTO-ELEVATES TO ADMINISTRATOR - Just double-click to run!

setlocal enabledelayedexpansion

REM ============================================
REM AUTO-ELEVATE TO ADMINISTRATOR
REM ============================================

REM Check if already running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges...
    echo.
    
    REM Re-launch this script elevated
    powershell -Command "Start-Process '%~f0' -Verb RunAs -ArgumentList '%*'"
    exit /b
)

REM If we get here, we're running as admin!
title IT Monitoring Agent Installer [ADMIN]

REM ============================================
REM CONFIGURATION
REM ============================================

echo.
echo ========================================
echo IT Monitoring Agent Installer
echo ========================================
echo.

REM Default configuration (can be customized)
set "BACKEND_URL=http://localhost:5001"
set "MSI_FILE=output\ITMonitoringAgent-1.0.0.msi"
set "INSTALL_DIR=C:\Program Files\ITMonitoringAgent"
set "REGISTRATION_TOKEN="
set "POLLING_INTERVAL=60"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :end_parse

if /i "%~1"=="-backend" (
    set "BACKEND_URL=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-token" (
    set "REGISTRATION_TOKEN=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-dir" (
    set "INSTALL_DIR=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-interval" (
    set "POLLING_INTERVAL=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-h" goto :show_help
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="/?" goto :show_help

echo Unknown option: %~1
goto :show_help

:end_parse

REM ============================================
REM CHECK MSI FILE EXISTS
REM ============================================

if not exist "%MSI_FILE%" (
    echo ERROR: MSI file not found: %MSI_FILE%
    echo.
    echo Please build the MSI installer first by running: build.bat
    echo.
    pause
    exit /b 1
)

REM ============================================
REM DISPLAY CONFIGURATION
REM ============================================

echo Configuration:
echo   Backend URL:        %BACKEND_URL%
echo   Installation Dir:   %INSTALL_DIR%
echo   Polling Interval:   %POLLING_INTERVAL% seconds
if not "%REGISTRATION_TOKEN%"=="" (
    echo   Registration Token: %REGISTRATION_TOKEN%
)
echo   MSI File:           %MSI_FILE%
echo.

REM ============================================
REM INSTALL MSI
REM ============================================

echo Starting installation...
echo.

REM Build msiexec command
set "MSI_CMD=msiexec.exe /i "%MSI_FILE%" /qb"
set "MSI_CMD=%MSI_CMD% BACKENDURL="%BACKEND_URL%""
set "MSI_CMD=%MSI_CMD% REGISTRATIONURL="%BACKEND_URL%/api/monitoring/register""
set "MSI_CMD=%MSI_CMD% INSTALLFOLDER="%INSTALL_DIR%\""
set "MSI_CMD=%MSI_CMD% POLLINGINTERVAL="%POLLING_INTERVAL%""

if not "%REGISTRATION_TOKEN%"=="" (
    set "MSI_CMD=%MSI_CMD% REGISTRATIONTOKEN="%REGISTRATION_TOKEN%""
)

REM Add installation log
set "LOG_FILE=%TEMP%\ITMonitoringAgent-Install.log"
set "MSI_CMD=%MSI_CMD% /L*v "%LOG_FILE%""

echo Running: msiexec.exe /i %MSI_FILE%
echo.
echo Installation log will be saved to: %LOG_FILE%
echo.

REM Execute installation
%MSI_CMD%

set "INSTALL_RESULT=%errorlevel%"

echo.
echo ========================================

if %INSTALL_RESULT% equ 0 (
    echo ✅ Installation completed successfully!
    echo ========================================
    echo.
    echo The IT Monitoring Agent has been installed to:
    echo   %INSTALL_DIR%
    echo.
    echo The agent service is now running and will:
    echo   - Send installation notification to backend
    echo   - Register with backend on first heartbeat
    echo   - Begin monitoring this system
    echo.
    echo Installation log: %LOG_FILE%
    echo Agent log file:    C:\ProgramData\ITMonitoring\install_log.txt
    echo.
) else if %INSTALL_RESULT% equ 1602 (
    echo ⚠️ Installation cancelled by user
    echo ========================================
    echo.
) else if %INSTALL_RESULT% equ 1603 (
    echo ❌ Installation failed with fatal error
    echo ========================================
    echo.
    echo Please check the installation log for details:
    echo   %LOG_FILE%
    echo.
) else (
    echo ⚠️ Installation completed with code: %INSTALL_RESULT%
    echo ========================================
    echo.
    echo Please check the installation log for details:
    echo   %LOG_FILE%
    echo.
)

pause
exit /b %INSTALL_RESULT%

REM ============================================
REM HELP
REM ============================================
:show_help
echo.
echo Usage: install.bat [options]
echo.
echo Options:
echo   -backend URL         Backend server URL (default: http://localhost:5001)
echo   -token TOKEN         Registration token from admin dashboard
echo   -dir DIRECTORY       Installation directory (default: C:\Program Files\ITMonitoringAgent)
echo   -interval SECONDS    Polling interval in seconds (default: 60)
echo   -h, --help, /?       Show this help message
echo.
echo Examples:
echo   install.bat
echo   install.bat -backend http://itmanagement.company.com:5001
echo   install.bat -backend http://192.168.1.100:5001 -token abc123def456
echo   install.bat -backend http://monitor.local:5001 -interval 120
echo.
pause
exit /b 0

