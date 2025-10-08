@echo off
REM IT Management Monitoring Agent - Installation Script for Windows

echo ==================================
echo IT Management Monitoring Agent
echo Installation Script for Windows
echo ==================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.7 or later.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python version:
python --version

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Generate default configuration
echo Generating default configuration...
python monitoring_agent.py --generate-config

echo.
echo ==================================
echo Installation complete!
echo ==================================
echo.
echo Next steps:
echo 1. Edit config.json and set your backend URL and API key
echo 2. Run the agent: venv\Scripts\python.exe monitoring_agent.py
echo.
echo To run as a Windows service:
echo 1. Install NSSM: https://nssm.cc/download
echo 2. Run: nssm install MonitoringAgent
echo 3. Set Application Path to: %CD%\venv\Scripts\python.exe
echo 4. Set Arguments to: %CD%\monitoring_agent.py
echo 5. Start the service: nssm start MonitoringAgent
echo.
pause




