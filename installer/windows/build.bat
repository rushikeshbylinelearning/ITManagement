@echo off
REM IT Management Monitoring Agent - Windows Installer Build Script
REM This script builds the NSIS installer package

echo ========================================
echo IT Monitoring Agent Installer Builder
echo ========================================
echo.

REM Check if NSIS is installed
where makensis >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: NSIS is not installed or not in PATH
    echo.
    echo Please install NSIS from https://nsis.sourceforge.io/Download
    echo Or add NSIS to your PATH environment variable
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking prerequisites...
if not exist "..\..\agent\monitoring_agent.py" (
    echo ERROR: monitoring_agent.py not found
    echo Expected location: ..\..\agent\monitoring_agent.py
    pause
    exit /b 1
)

echo [2/4] Copying files to installer directory...
copy /Y "..\..\agent\monitoring_agent.py" "monitoring_agent.py" >nul
copy /Y "..\..\agent\requirements.txt" "requirements.txt" >nul
copy /Y "service_wrapper.py" "service_wrapper.py" >nul
copy /Y "License.txt" "License.txt" >nul
copy /Y "README.txt" "README.txt" >nul

echo [3/4] Building installer with NSIS...
makensis /V2 ITMonitoringAgent.nsi

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Installer created: ITMonitoringAgent-Setup-1.0.0.exe
    echo.
    echo To test the installer:
    echo 1. Right-click ITMonitoringAgent-Setup-1.0.0.exe
    echo 2. Select "Run as Administrator"
    echo 3. Follow the installation wizard
    echo.
    echo [4/4] Cleaning up temporary files...
    del monitoring_agent.py >nul 2>&1
    del requirements.txt >nul 2>&1
    del service_wrapper.py >nul 2>&1
    del License.txt >nul 2>&1
    del README.txt >nul 2>&1
    echo.
    echo Build complete!
) else (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
)

pause




