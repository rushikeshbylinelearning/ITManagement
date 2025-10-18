@echo off
REM IT Network Monitor Agent - Auto-Start Fix
REM This script fixes auto-start issues for existing installations

echo ============================================================
echo    IT Network Monitor Agent - Auto-Start Fix
echo ============================================================
echo.
echo This script will fix auto-start issues by:
echo - Installing Windows Service for reliable auto-start
echo - Creating fallback scheduled task
echo - Adding registry entry for additional reliability
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires Administrator privileges.
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

set INSTALL_DIR=%ProgramFiles%\ITNetworkMonitor

REM Check if agent is already installed
if not exist "%INSTALL_DIR%\network_monitor_agent.py" (
    echo ERROR: Agent not found at %INSTALL_DIR%
    echo.
    echo Please install the agent first using:
    echo   ITNetworkMonitor-EnhancedSetup.bat
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo.
    echo Please install Python 3.8 or higher from https://www.python.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Python is installed
echo.

echo [2/6] Installing required packages for Windows Service...
python -m pip install pywin32 pywin32-ctypes --quiet
echo [OK] Windows Service packages installed
echo.

echo [3/6] Downloading service wrapper...
powershell -Command "try { (New-Object Net.WebClient).DownloadFile('http://localhost:5001/downloads/service_wrapper.py', '%INSTALL_DIR%\service_wrapper.py') } catch { exit 1 }" >nul 2>&1

if not exist "%INSTALL_DIR%\service_wrapper.py" (
    echo WARNING: Could not download service wrapper from server.
    echo Please ensure the backend server is running at http://localhost:5001
    echo.
    pause
    exit /b 1
)
echo [OK] Service wrapper downloaded
echo.

echo [4/6] Installing Windows Service...
python "%INSTALL_DIR%\service_wrapper.py" install

if %errorLevel% equ 0 (
    echo [OK] Windows Service installed successfully
    set SERVICE_INSTALLED=1
) else (
    echo [WARNING] Windows Service installation failed
    set SERVICE_INSTALLED=0
)
echo.

echo [5/6] Creating/updating scheduled task...
schtasks /Delete /TN "ITNetworkMonitor" /F >nul 2>&1
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F >nul 2>&1

if %errorLevel% equ 0 (
    echo [OK] Scheduled task created/updated
) else (
    echo [WARNING] Could not create scheduled task
)
echo.

echo [6/6] Creating/updating registry entry...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ITNetworkMonitor" /t REG_SZ /d "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /f >nul 2>&1

if %errorLevel% equ 0 (
    echo [OK] Registry entry created/updated
) else (
    echo [WARNING] Could not create registry entry
)
echo.

echo ============================================================
echo    Auto-Start Fix Complete!
echo ============================================================
echo.
if "%SERVICE_INSTALLED%"=="1" (
    echo ✓ Windows Service installed - Most reliable auto-start method
    echo ✓ Service will start automatically on system boot
    echo ✓ Scheduled task created as fallback
    echo ✓ Registry entry created for additional reliability
    echo.
    echo The agent will now start automatically when the system boots.
) else (
    echo ⚠ Windows Service installation failed
    echo ✓ Scheduled task created as fallback
    echo ✓ Registry entry created for additional reliability
    echo.
    echo The agent should start automatically via scheduled task.
)
echo.

choice /C YN /M "Do you want to start the agent now"
if %errorLevel% equ 1 (
    if "%SERVICE_INSTALLED%"=="1" (
        echo Starting Windows Service...
        python "%INSTALL_DIR%\service_wrapper.py" start
    ) else (
        echo Starting via scheduled task...
        start "" /B python "%INSTALL_DIR%\network_monitor_agent.py"
    )
    echo Agent started!
)

echo.
echo ============================================================
echo    Service Management
echo ============================================================
echo.
echo To manage the agent service:
echo   Start:   python "%INSTALL_DIR%\service_wrapper.py" start
echo   Stop:    python "%INSTALL_DIR%\service_wrapper.py" stop
echo   Status:  python "%INSTALL_DIR%\service_wrapper.py" status
echo.
echo Or use the Service Manager:
echo   AgentServiceManager.bat
echo.
echo ============================================================
echo.
pause




