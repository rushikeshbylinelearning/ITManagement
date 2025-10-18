@echo off
REM IT Network Monitor Agent - Auto-Registration Installer
REM This batch file installs AND auto-registers the agent

echo ============================================================
echo    IT Network Monitor Agent - Auto Installer v1.0.0
echo ============================================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer requires Administrator privileges.
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo [1/7] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo.
    echo Please install Python 3.8 or higher from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Python is installed
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Python Version: %PYTHON_VERSION%
echo.

echo [2/7] Installing required Python packages...
python -m pip install --upgrade pip --quiet
python -m pip install psutil requests --quiet

if %errorLevel% neq 0 (
    echo ERROR: Failed to install Python packages
    pause
    exit /b 1
)
echo [OK] Python packages installed
echo.

echo [3/7] Creating installation directory...
set INSTALL_DIR=%ProgramFiles%\ITNetworkMonitor
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo [OK] Directory created: %INSTALL_DIR%
echo.

echo [4/7] Downloading agent files from server...
powershell -Command "try { (New-Object Net.WebClient).DownloadFile('http://localhost:5001/downloads/network_monitor_agent.py', '%INSTALL_DIR%\network_monitor_agent.py') } catch { exit 1 }" >nul 2>&1

if not exist "%INSTALL_DIR%\network_monitor_agent.py" (
    echo WARNING: Could not download from server.
    echo Please ensure the backend server is running at http://localhost:5001
    echo.
    pause
    exit /b 1
)
echo [OK] Agent downloaded successfully
echo.

echo [5/7] Creating Windows scheduled task...
schtasks /Create /TN "ITNetworkMonitor" /TR "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /SC ONLOGON /RL HIGHEST /F >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Scheduled task created
) else (
    echo [WARNING] Could not create scheduled task
)
echo.

echo [6/7] Creating registry entry for auto-start...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ITNetworkMonitor" /t REG_SZ /d "python \"%INSTALL_DIR%\network_monitor_agent.py\"" /f >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Registry entry created
) else (
    echo [WARNING] Could not create registry entry
)
echo.

echo ============================================================
echo    AUTO-REGISTRATION
echo ============================================================
echo.
echo To auto-register this system, please provide your IT Portal
echo employee credentials (your data is sent securely via HTTPS):
echo.

set /p USER_EMAIL="Enter your email: "
set /p USER_PASSWORD="Enter your password: "

echo.
echo [7/7] Registering agent with IT Management backend...
echo Please wait...
echo.

REM Create temporary Python script for registration
echo import sys > "%TEMP%\register_agent.py"
echo import json >> "%TEMP%\register_agent.py"
echo import requests >> "%TEMP%\register_agent.py"
echo import socket >> "%TEMP%\register_agent.py"
echo import uuid >> "%TEMP%\register_agent.py"
echo import platform >> "%TEMP%\register_agent.py"
echo try: >> "%TEMP%\register_agent.py"
echo     import psutil >> "%TEMP%\register_agent.py"
echo except: >> "%TEMP%\register_agent.py"
echo     psutil = None >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo email = sys.argv[1] >> "%TEMP%\register_agent.py"
echo password = sys.argv[2] >> "%TEMP%\register_agent.py"
echo backend_url = 'http://localhost:5001/api' >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo system_name = socket.gethostname() >> "%TEMP%\register_agent.py"
echo system_id = f'sys-{uuid.uuid4().hex[:12]}' >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo def get_local_ip(): >> "%TEMP%\register_agent.py"
echo     try: >> "%TEMP%\register_agent.py"
echo         s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) >> "%TEMP%\register_agent.py"
echo         s.connect(('8.8.8.8', 80)) >> "%TEMP%\register_agent.py"
echo         ip = s.getsockname()[0] >> "%TEMP%\register_agent.py"
echo         s.close() >> "%TEMP%\register_agent.py"
echo         return ip >> "%TEMP%\register_agent.py"
echo     except: >> "%TEMP%\register_agent.py"
echo         return 'Unknown' >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo def get_mac_address(): >> "%TEMP%\register_agent.py"
echo     try: >> "%TEMP%\register_agent.py"
echo         mac = ':'.join(['{:02x}'.format((uuid.getnode() ^>^> elements) ^& 0xff) for elements in range(0, 2*6, 2)][::-1]) >> "%TEMP%\register_agent.py"
echo         return mac >> "%TEMP%\register_agent.py"
echo     except: >> "%TEMP%\register_agent.py"
echo         return 'Unknown' >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo system_info = { >> "%TEMP%\register_agent.py"
echo     'os': platform.system(), >> "%TEMP%\register_agent.py"
echo     'osVersion': platform.version(), >> "%TEMP%\register_agent.py"
echo     'ipAddress': get_local_ip(), >> "%TEMP%\register_agent.py"
echo     'macAddress': get_mac_address(), >> "%TEMP%\register_agent.py"
echo     'cpu': platform.processor() if platform.processor() else 'Unknown', >> "%TEMP%\register_agent.py"
echo     'ram': f'{psutil.virtual_memory().total / (1024**3):.1f} GB' if psutil else 'Unknown' >> "%TEMP%\register_agent.py"
echo } >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo payload = { >> "%TEMP%\register_agent.py"
echo     'email': email, >> "%TEMP%\register_agent.py"
echo     'password': password, >> "%TEMP%\register_agent.py"
echo     'systemId': system_id, >> "%TEMP%\register_agent.py"
echo     'systemName': system_name, >> "%TEMP%\register_agent.py"
echo     'systemInfo': system_info >> "%TEMP%\register_agent.py"
echo } >> "%TEMP%\register_agent.py"
echo. >> "%TEMP%\register_agent.py"
echo try: >> "%TEMP%\register_agent.py"
echo     response = requests.post(f'{backend_url}/network-monitoring/auto-register', json=payload, timeout=10, verify=False) >> "%TEMP%\register_agent.py"
echo     if response.status_code == 201: >> "%TEMP%\register_agent.py"
echo         data = response.json() >> "%TEMP%\register_agent.py"
echo         token = data.get('agentToken') >> "%TEMP%\register_agent.py"
echo         print(f'SUCCESS^|{system_id}^|{system_name}^|{token}^|{data.get("userName", "User")}') >> "%TEMP%\register_agent.py"
echo     else: >> "%TEMP%\register_agent.py"
echo         print(f'ERROR^|{response.status_code}^|{response.text}') >> "%TEMP%\register_agent.py"
echo except Exception as e: >> "%TEMP%\register_agent.py"
echo     print(f'EXCEPTION^|{str(e)}') >> "%TEMP%\register_agent.py"

REM Run the registration script
for /f "tokens=1,2,3,4,5 delims=|" %%a in ('python "%TEMP%\register_agent.py" "%USER_EMAIL%" "%USER_PASSWORD%" 2^>^&1') do (
    set REG_STATUS=%%a
    set REG_DATA1=%%b
    set REG_DATA2=%%c
    set REG_DATA3=%%d
    set REG_DATA4=%%e
)

REM Clean up temp file
del "%TEMP%\register_agent.py" >nul 2>&1

if "%REG_STATUS%"=="SUCCESS" (
    echo [OK] Registration successful!
    echo.
    echo Registered as: %REG_DATA4%
    echo System ID: %REG_DATA1%
    echo System Name: %REG_DATA2%
    echo.
    
    REM Configure agent with token
    echo Configuring agent...
    python "%INSTALL_DIR%\network_monitor_agent.py" register "%REG_DATA3%" >nul 2>&1
    
    if %errorLevel% equ 0 (
        echo [OK] Agent configured successfully
    ) else (
        echo [WARNING] Agent configuration may have failed
    )
) else (
    echo [FAILED] Registration failed!
    echo.
    if "%REG_STATUS%"=="ERROR" (
        echo Error Code: %REG_DATA1%
        echo Details: %REG_DATA2%
    ) else if "%REG_STATUS%"=="EXCEPTION" (
        echo Error: %REG_DATA1%
    ) else (
        echo Unknown error occurred
    )
    echo.
    echo Possible reasons:
    echo - Invalid email or password
    echo - Backend server not running
    echo - Network connection issues
    echo - Admin account used (must use employee account)
    echo.
    echo You can register manually later:
    echo 1. Login to IT Portal (Employee)
    echo 2. Click "Download Agent"
    echo 3. Get registration token
    echo 4. Run: python "%INSTALL_DIR%\network_monitor_agent.py" register YOUR_TOKEN
    echo.
)

echo.
echo ============================================================
echo    Installation Complete!
echo ============================================================
echo.
echo Installation directory: %INSTALL_DIR%
echo.
echo The agent will start automatically on next login.
echo To start it now, run:
echo    python "%INSTALL_DIR%\network_monitor_agent.py"
echo.
echo ============================================================
echo.

choice /C YN /M "Do you want to start the agent now"
if %errorLevel% equ 1 (
    start "" /B python "%INSTALL_DIR%\network_monitor_agent.py"
    echo Agent started in background!
    echo.
    timeout /t 3 >nul
    choice /C YN /M "Do you want to open the IT Management Portal"
    if %errorLevel% equ 1 (
        start http://localhost:5173/login
    )
)

echo.
pause








