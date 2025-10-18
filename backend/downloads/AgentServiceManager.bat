@echo off
echo ========================================
echo IT Network Monitor Agent - Service Manager
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

:menu
echo.
echo Select an option:
echo 1. Check service status
echo 2. Start service
echo 3. Stop service
echo 4. Restart service
echo 5. View service logs
echo 6. Uninstall service
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto uninstall
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
goto menu

:status
echo.
echo Checking service status...
sc query "ITNetworkMonitor" | findstr "STATE"
echo.
goto menu

:start
echo.
echo Starting service...
sc start "ITNetworkMonitor"
if %errorLevel% == 0 (
    echo ✓ Service started successfully
) else (
    echo ✗ Failed to start service
)
echo.
goto menu

:stop
echo.
echo Stopping service...
sc stop "ITNetworkMonitor"
if %errorLevel% == 0 (
    echo ✓ Service stopped successfully
) else (
    echo ✗ Failed to stop service
)
echo.
goto menu

:restart
echo.
echo Restarting service...
sc stop "ITNetworkMonitor"
timeout /t 3 /nobreak >nul
sc start "ITNetworkMonitor"
if %errorLevel% == 0 (
    echo ✓ Service restarted successfully
) else (
    echo ✗ Failed to restart service
)
echo.
goto menu

:logs
echo.
echo Opening service logs...
if exist "%ProgramFiles%\ITNetworkMonitor\service.log" (
    notepad "%ProgramFiles%\ITNetworkMonitor\service.log"
) else (
    echo Log file not found at: %ProgramFiles%\ITNetworkMonitor\service.log
)
echo.
goto menu

:uninstall
echo.
echo WARNING: This will completely remove the IT Network Monitor Agent!
set /p confirm="Are you sure you want to uninstall? (y/n): "
if /i "%confirm%"=="y" (
    echo Uninstalling agent...
    python "%ProgramFiles%\ITNetworkMonitor\install_agent.py" uninstall
    if %errorLevel% == 0 (
        echo ✓ Agent uninstalled successfully
    ) else (
        echo ✗ Uninstallation failed
    )
) else (
    echo Uninstallation cancelled
)
echo.
goto menu

:exit
echo.
echo Goodbye!
pause
exit /b 0