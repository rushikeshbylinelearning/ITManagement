@echo off
REM IT Monitoring Agent - MSI Custom Action Helper
REM This batch script replaces PowerShell custom actions
REM Called by WiX MSI installer with specific actions

setlocal enabledelayedexpansion

REM Parse command line arguments
set "ACTION=%~1"
set "INSTALL_DIR=%~2"
set "BACKEND_URL=%~3"
set "REG_URL=%~4"
set "REG_TOKEN=%~5"
set "POLLING_INTERVAL=%~6"

REM Log directory
set "LOG_DIR=C:\ProgramData\ITMonitoring"
set "LOG_FILE=%LOG_DIR%\install_log.txt"

REM Ensure log directory exists
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" 2>nul

REM Log function
call :LOG "========================================="
call :LOG "IT Monitoring Agent Installer Helper"
call :LOG "Action: %ACTION%"
call :LOG "Install Dir: %INSTALL_DIR%"
call :LOG "========================================="

REM Execute action
if /i "%ACTION%"=="CreateConfig" goto :CreateConfig
if /i "%ACTION%"=="CreateService" goto :CreateService
if /i "%ACTION%"=="StartService" goto :StartService
if /i "%ACTION%"=="RemoveService" goto :RemoveService
if /i "%ACTION%"=="NotifyBackend" goto :NotifyBackend

call :LOG "ERROR: Unknown action '%ACTION%'"
exit /b 1

REM ============================================
REM CREATE CONFIG FILE
REM ============================================
:CreateConfig
call :LOG "Creating configuration file..."

if "%INSTALL_DIR%"=="" (
    call :LOG "ERROR: INSTALL_DIR not provided"
    exit /b 1
)

set "CONFIG_FILE=%INSTALL_DIR%config.json"

REM Get hostname
for /f %%i in ('hostname') do set HOSTNAME=%%i

REM Create config.json
(
echo {
echo   "backend_url": "%BACKEND_URL%",
echo   "registration_url": "%REG_URL%",
echo   "api_key": "default-monitoring-key-change-me",
echo   "agent_id": null,
echo   "registration_token": "%REG_TOKEN%",
echo   "hostname": "%HOSTNAME%",
echo   "polling_interval": %POLLING_INTERVAL%,
echo   "monitored_directories": [],
echo   "log_level": "INFO",
echo   "retry_attempts": 3,
echo   "retry_backoff": 5,
echo   "local_cache_file": "telemetry_cache.json"
echo }
) > "%CONFIG_FILE%"

if exist "%CONFIG_FILE%" (
    call :LOG "Config file created successfully: %CONFIG_FILE%"
    exit /b 0
) else (
    call :LOG "ERROR: Failed to create config file"
    exit /b 1
)

REM ============================================
REM CREATE WINDOWS SERVICE
REM ============================================
:CreateService
call :LOG "Creating Windows service..."

if "%INSTALL_DIR%"=="" (
    call :LOG "ERROR: INSTALL_DIR not provided"
    exit /b 1
)

set "SERVICE_NAME=ITMonitoringAgent"
set "AGENT_SCRIPT=%INSTALL_DIR%monitoring_agent.py"

REM Check if service already exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    call :LOG "Service already exists, stopping and removing..."
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Find Python executable
set "PYTHON_EXE="
where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where python') do set "PYTHON_EXE=%%i"
)

if "%PYTHON_EXE%"=="" (
    REM Try common Python locations
    if exist "C:\Python39\python.exe" set "PYTHON_EXE=C:\Python39\python.exe"
    if exist "C:\Python310\python.exe" set "PYTHON_EXE=C:\Python310\python.exe"
    if exist "C:\Python311\python.exe" set "PYTHON_EXE=C:\Python311\python.exe"
    if exist "C:\Python312\python.exe" set "PYTHON_EXE=C:\Python312\python.exe"
    if exist "%INSTALL_DIR%python\python.exe" set "PYTHON_EXE=%INSTALL_DIR%python\python.exe"
)

if "%PYTHON_EXE%"=="" (
    call :LOG "ERROR: Python executable not found"
    exit /b 1
)

call :LOG "Using Python: %PYTHON_EXE%"

REM Create service
call :LOG "Creating service with sc.exe..."
sc create "%SERVICE_NAME%" binPath= "\"%PYTHON_EXE%\" \"%AGENT_SCRIPT%\"" DisplayName= "IT Management Monitoring Agent" start= auto >nul 2>&1

if %errorlevel% equ 0 (
    call :LOG "Service created successfully"
    
    REM Set service description
    sc description "%SERVICE_NAME%" "Monitors system performance, security, and sends telemetry to IT Management backend" >nul 2>&1
    
    REM Set service to restart on failure
    sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/60000/restart/120000/restart/300000 >nul 2>&1
    
    call :LOG "Service configuration completed"
    exit /b 0
) else (
    call :LOG "ERROR: Failed to create service (error code: %errorlevel%)"
    exit /b 1
)

REM ============================================
REM START SERVICE
REM ============================================
:StartService
call :LOG "Starting Windows service..."

set "SERVICE_NAME=ITMonitoringAgent"

REM Start service
sc start "%SERVICE_NAME%" >nul 2>&1

if %errorlevel% equ 0 (
    call :LOG "Service started successfully"
    exit /b 0
) else (
    call :LOG "WARNING: Service start returned code %errorlevel%"
    call :LOG "Service will start on next reboot"
    REM Don't fail installation if service doesn't start immediately
    exit /b 0
)

REM ============================================
REM REMOVE SERVICE (UNINSTALL)
REM ============================================
:RemoveService
call :LOG "Removing Windows service..."

set "SERVICE_NAME=ITMonitoringAgent"

REM Stop service
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 /nobreak >nul

REM Delete service
sc delete "%SERVICE_NAME%" >nul 2>&1

if %errorlevel% equ 0 (
    call :LOG "Service removed successfully"
) else (
    call :LOG "WARNING: Service removal returned code %errorlevel%"
)

exit /b 0

REM ============================================
REM NOTIFY BACKEND SERVER
REM ============================================
:NotifyBackend
call :LOG "Sending installation notification to backend..."

if "%INSTALL_DIR%"=="" (
    call :LOG "ERROR: INSTALL_DIR not provided"
    exit /b 1
)

set "NOTIFIER_SCRIPT=%INSTALL_DIR%install_notifier.py"

REM Find Python executable
set "PYTHON_EXE="
where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where python') do set "PYTHON_EXE=%%i"
)

if "%PYTHON_EXE%"=="" (
    REM Try common Python locations
    if exist "C:\Python39\python.exe" set "PYTHON_EXE=C:\Python39\python.exe"
    if exist "C:\Python310\python.exe" set "PYTHON_EXE=C:\Python310\python.exe"
    if exist "C:\Python311\python.exe" set "PYTHON_EXE=C:\Python311\python.exe"
    if exist "C:\Python312\python.exe" set "PYTHON_EXE=C:\Python312\python.exe"
    if exist "%INSTALL_DIR%python\python.exe" set "PYTHON_EXE=%INSTALL_DIR%python\python.exe"
)

if "%PYTHON_EXE%"=="" (
    call :LOG "WARNING: Python not found - cannot send notification"
    call :LOG "Installation will continue, agent will register on first heartbeat"
    exit /b 0
)

if not exist "%NOTIFIER_SCRIPT%" (
    call :LOG "WARNING: Notifier script not found: %NOTIFIER_SCRIPT%"
    call :LOG "Installation will continue, agent will register on first heartbeat"
    exit /b 0
)

call :LOG "Running notifier script with Python: %PYTHON_EXE%"

REM Run notifier with backend URL as argument
if not "%BACKEND_URL%"=="" (
    "%PYTHON_EXE%" "%NOTIFIER_SCRIPT%" "%BACKEND_URL%" >> "%LOG_FILE%" 2>&1
) else (
    "%PYTHON_EXE%" "%NOTIFIER_SCRIPT%" >> "%LOG_FILE%" 2>&1
)

if %errorlevel% equ 0 (
    call :LOG "Backend notification completed successfully"
) else (
    call :LOG "WARNING: Backend notification returned code %errorlevel%"
    call :LOG "This is not critical - agent will register on first heartbeat"
)

REM Always return success - notification failure should not fail installation
exit /b 0

REM ============================================
REM LOGGING FUNCTION
REM ============================================
:LOG
set "MSG=%~1"
set "TIMESTAMP="

REM Get timestamp
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set "DATESTAMP=%%a-%%b-%%c"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIMESTAMP=%%a:%%b"

echo [%DATESTAMP% %TIMESTAMP%] %MSG%
echo [%DATESTAMP% %TIMESTAMP%] %MSG% >> "%LOG_FILE%" 2>nul

goto :eof


