@echo off
REM IT Monitoring Agent MSI Builder - Simple Wrapper Script
REM This batch file provides a simple interface to build the MSI

setlocal enabledelayedexpansion

echo.
echo ============================================
echo IT Monitoring Agent MSI Builder
echo ============================================
echo.

REM Check for PowerShell
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found
    echo Please ensure PowerShell is installed and in PATH
    pause
    exit /b 1
)

REM Parse command line arguments
set VERSION=1.0.0
set CLEAN=
set SKIP_PYTHON=

:parse_args
if "%~1"=="" goto :end_parse
if /i "%~1"=="-v" (
    set VERSION=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--version" (
    set VERSION=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-clean" (
    set CLEAN=-Clean
    shift
    goto :parse_args
)
if /i "%~1"=="--clean" (
    set CLEAN=-Clean
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-python" (
    set SKIP_PYTHON=-SkipPythonDownload
    shift
    goto :parse_args
)
if /i "%~1"=="-h" goto :show_help
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="/?" goto :show_help

echo Unknown option: %~1
goto :show_help

:end_parse

REM Change to script directory
cd /d "%~dp0"

echo Building MSI version %VERSION%...
echo.

REM Run the PowerShell build script
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0Build-Production-MSI.ps1" -Version "%VERSION%" %CLEAN% %SKIP_PYTHON%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo BUILD SUCCESSFUL!
    echo ============================================
    echo.
    echo The MSI installer has been created in the output\ folder
    echo.
) else (
    echo.
    echo ============================================
    echo BUILD FAILED!
    echo ============================================
    echo.
    echo Please check the error messages above.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

pause
exit /b 0

:show_help
echo.
echo Usage: build.bat [options]
echo.
echo Options:
echo   -v, --version VERSION    Set the MSI version (default: 1.0.0)
echo   --clean                  Clean up build artifacts after build
echo   --skip-python            Skip Python download (use existing)
echo   -h, --help, /?           Show this help message
echo.
echo Examples:
echo   build.bat                          Build with default version 1.0.0
echo   build.bat -v 1.2.3                 Build version 1.2.3
echo   build.bat --version 2.0.0 --clean  Build version 2.0.0 and clean up
echo   build.bat --skip-python            Build using cached Python download
echo.
pause
exit /b 0
