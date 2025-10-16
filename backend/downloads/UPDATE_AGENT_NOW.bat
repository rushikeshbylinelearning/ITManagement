@echo off
echo ============================================================
echo   Updating IT Network Monitor Agent
echo ============================================================
echo.

REM Stop any running agent processes
echo [1/3] Stopping any running agents...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *network_monitor_agent*" 2>nul

REM Download updated agent
echo [2/3] Downloading latest agent version...
curl -o "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" http://localhost:5001/downloads/network_monitor_agent.py

if %ERRORLEVEL% EQU 0 (
    echo [OK] Agent updated successfully
) else (
    echo [ERROR] Failed to download agent. Make sure backend is running.
    pause
    exit /b 1
)

echo [3/3] Agent update complete!
echo.
echo ============================================================
echo   Next Steps:
echo ============================================================
echo 1. Restart the agent:
echo    python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
echo.
echo 2. Wait 10-20 seconds
echo.
echo 3. Refresh your dashboard
echo.
echo ============================================================

pause

