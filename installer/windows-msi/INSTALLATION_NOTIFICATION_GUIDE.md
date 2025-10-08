# IT Monitoring Agent - Installation Notification System

## Overview

This MSI-based installer system now includes **automatic installation notification** that sends tracking data to your backend server immediately after installation completes.

### What Changed

✅ **Removed PowerShell dependency** - All custom actions now use batch scripts  
✅ **Added installation tracking** - Backend receives notification when agent is installed  
✅ **Added retry logic** - Network failures are handled gracefully with 3 retry attempts  
✅ **Added comprehensive logging** - All installation events logged to `C:\ProgramData\ITMonitoring\install_log.txt`  
✅ **Real-time dashboard updates** - Admin dashboard receives WebSocket events on agent installation  

---

## Architecture

### Installation Flow

```
User runs install.bat
    ↓
Launches MSI installer (msiexec.exe)
    ↓
MSI copies files to C:\Program Files\ITMonitoringAgent\
    ↓
Custom Action: CreateConfig (install_helper.bat)
    → Creates config.json with backend URL and settings
    ↓
Custom Action: CreateService (install_helper.bat)
    → Creates Windows service using sc.exe
    ↓
Custom Action: StartService (install_helper.bat)
    → Starts the monitoring agent service
    ↓
Custom Action: NotifyBackend (install_helper.bat + install_notifier.py)
    → Sends POST request to /api/monitoring/agent/install-notify
    → Includes: hostname, username, timestamp, OS info
    → Retries up to 3 times if network fails
    ↓
Backend receives notification
    → Creates/updates Host record in database
    → Emits WebSocket event to admin dashboard
    → Sends response confirming receipt
    ↓
Installation complete!
```

### Key Components

#### 1. **install_helper.bat**
- Batch script that handles all MSI custom actions
- Replaces PowerShell completely
- Actions:
  - `CreateConfig` - Creates configuration file
  - `CreateService` - Sets up Windows service
  - `StartService` - Starts the agent service
  - `RemoveService` - Removes service on uninstall
  - `NotifyBackend` - Triggers installation notification

#### 2. **install_notifier.py**
- Python script using only standard library (no dependencies)
- Sends HTTP POST to backend endpoint
- Features:
  - Collects system information (hostname, username, OS)
  - Sends JSON payload to backend
  - Automatic retry with exponential backoff
  - Comprehensive error logging

#### 3. **Backend Endpoint: POST /api/monitoring/agent/install-notify**
- Receives installation notifications
- No authentication required (installation happens before agent registers)
- Creates/updates Host record with installation metadata
- Emits real-time WebSocket event to dashboard

#### 4. **Product.wxs (WiX Configuration)**
- Defines MSI structure and custom actions
- All custom actions use `cmd.exe`, not PowerShell
- Custom actions run in sequence after InstallFiles

---

## Backend API

### Endpoint: POST /api/monitoring/agent/install-notify

**URL:** `http://your-server:5001/api/monitoring/agent/install-notify`

**Method:** POST

**Authentication:** None required

**Request Body:**
```json
{
  "hostname": "DESKTOP-ABC123",
  "username": "john.doe",
  "status": "installed",
  "timestamp": "2025-10-08T14:30:00.000Z",
  "os": "Windows",
  "os_version": "10.0.19045",
  "installer_version": "1.0.0"
}
```

**Response (Success):**
```json
{
  "success": true,
  "msg": "Installation notification received",
  "hostId": "67890abcdef12345",
  "hostname": "DESKTOP-ABC123",
  "next_step": "Agent will register on first heartbeat"
}
```

**Response (Error):**
```json
{
  "success": false,
  "msg": "hostname and username are required"
}
```

### WebSocket Event: `monitoring:agent-installed`

When installation notification is received, the backend emits:

```javascript
{
  "event": "monitoring:agent-installed",
  "data": {
    "hostId": "67890abcdef12345",
    "hostname": "DESKTOP-ABC123",
    "username": "john.doe",
    "timestamp": "2025-10-08T14:30:00.000Z",
    "status": "installed"
  }
}
```

---

## Building the MSI Installer

### Prerequisites

1. **WiX Toolset 3.x** - Download from [wixtoolset.org](https://wixtoolset.org/releases/)
2. **Windows SDK** (for build tools)
3. **Python 3.7+** (if testing locally)

### Build Steps

#### Option 1: Using build.bat (Recommended)

```batch
cd installer\windows-msi
build.bat
```

This will:
- Download/verify Python embeddable package
- Copy agent files
- Compile WiX sources (Product.wxs, CustomUI.wxs)
- Generate MSI in `output\ITMonitoringAgent-1.0.0.msi`

#### Option 2: Manual Build

```batch
cd installer\windows-msi

REM Compile WiX files
candle.exe Product.wxs CustomUI.wxs -ext WixUIExtension -ext WixUtilExtension

REM Link into MSI
light.exe Product.wixobj CustomUI.wixobj -ext WixUIExtension -ext WixUtilExtension -out ITMonitoringAgent-1.0.0.msi
```

---

## Installing the Agent

### Option 1: Interactive Installation (Recommended)

```batch
cd installer\windows-msi
install.bat -backend http://your-server:5001
```

### Option 2: Silent Installation

```batch
msiexec.exe /i ITMonitoringAgent-1.0.0.msi ^
  BACKENDURL="http://your-server:5001" ^
  REGISTRATIONURL="http://your-server:5001/api/monitoring/register" ^
  POLLINGINTERVAL="60" ^
  /quiet /L*v install.log
```

### Option 3: Network Deployment (GPO/SCCM)

```batch
msiexec.exe /i "\\server\share\ITMonitoringAgent-1.0.0.msi" ^
  BACKENDURL="http://itmanagement.company.com:5001" ^
  /quiet /norestart
```

### Installation Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `BACKENDURL` | Backend server URL | `https://itmanagement.company.com/api/monitoring/events` |
| `REGISTRATIONURL` | Agent registration endpoint | `https://itmanagement.company.com/api/monitoring/register` |
| `REGISTRATIONTOKEN` | One-time registration token | *(empty)* |
| `POLLINGINTERVAL` | Heartbeat interval (seconds) | `60` |
| `INSTALLFOLDER` | Installation directory | `C:\Program Files\ITMonitoringAgent\` |

---

## Testing the Installation

### 1. Prepare Test Environment

```batch
REM Start your backend server
cd backend
node server.js
```

### 2. Build the MSI

```batch
cd installer\windows-msi
build.bat
```

### 3. Install with Tracking

```batch
install.bat -backend http://localhost:5001
```

### 4. Verify Installation Notification

Check the backend logs for:
```
Installation notification received: DESKTOP-ABC123 by YourUsername - Status: installed
Installation notification processed successfully for DESKTOP-ABC123 (Host ID: ...)
```

### 5. Check Installation Log

```batch
type C:\ProgramData\ITMonitoring\install_log.txt
```

Expected output:
```
[2025-10-08 14:30:00] =========================================
[2025-10-08 14:30:00] IT Monitoring Agent Installer Helper
[2025-10-08 14:30:00] Action: CreateConfig
[2025-10-08 14:30:01] Config file created successfully
[2025-10-08 14:30:02] Service created successfully
[2025-10-08 14:30:03] Sending installation notification to backend...
[2025-10-08 14:30:04] ✅ Installation notification sent successfully!
```

### 6. Verify in Admin Dashboard

1. Open the admin dashboard
2. Navigate to Monitoring → Hosts
3. You should see a new host with:
   - Status: `pending` (until first heartbeat)
   - Installed By: Your Windows username
   - Installed At: Current timestamp

---

## Troubleshooting

### Issue: Installation notification fails

**Symptoms:**
- Installation completes successfully
- But backend doesn't receive notification
- Log shows network errors

**Solution:**
1. Check backend server is running and accessible
2. Verify firewall allows outbound HTTP/HTTPS
3. Check backend URL in registry:
   ```
   reg query HKLM\SOFTWARE\ITMonitoringAgent /v BackendUrl
   ```
4. Check installation log:
   ```
   type C:\ProgramData\ITMonitoring\install_log.txt
   ```

### Issue: Service fails to start

**Symptoms:**
- Installation completes
- Service is created but not running

**Solution:**
1. Check Python is installed:
   ```
   python --version
   ```
2. Manually start service:
   ```
   sc start ITMonitoringAgent
   ```
3. Check Windows Event Viewer:
   ```
   eventvwr.msc → Windows Logs → Application
   ```

### Issue: Backend receives notification but dashboard doesn't update

**Symptoms:**
- Backend logs show successful notification
- Dashboard doesn't show new host

**Solution:**
1. Check WebSocket connection in browser console
2. Refresh the dashboard page
3. Check backend is emitting WebSocket events:
   ```javascript
   req.io.emit('monitoring:agent-installed', {...})
   ```

---

## Logs and Diagnostics

### Installation Log
**Location:** `C:\ProgramData\ITMonitoring\install_log.txt`

Contains:
- Custom action execution
- Configuration creation
- Service creation/start
- Backend notification attempts and results

### MSI Installation Log
**Location:** `%TEMP%\ITMonitoringAgent-Install.log`

Contains:
- Full MSI installation trace
- All custom action output
- Windows Installer diagnostics

### Agent Log
**Location:** `C:\Program Files\ITMonitoringAgent\logs\agent.log`

Contains:
- Agent runtime events
- Registration attempts
- Telemetry transmission

### Service Status
```batch
sc query ITMonitoringAgent
sc qc ITMonitoringAgent
```

### Registry Configuration
```batch
reg query HKLM\SOFTWARE\ITMonitoringAgent
```

---

## Uninstallation

### Option 1: Programs and Features
1. Open Control Panel → Programs → Programs and Features
2. Find "IT Management Monitoring Agent"
3. Click Uninstall

### Option 2: Command Line
```batch
msiexec.exe /x {YOUR-PRODUCT-CODE} /quiet
```

Or using the MSI file:
```batch
msiexec.exe /x ITMonitoringAgent-1.0.0.msi /quiet
```

**Note:** Uninstallation automatically:
- Stops the service
- Removes the service
- Deletes installation files
- Removes registry entries
- Keeps logs in `C:\ProgramData\ITMonitoring\` for troubleshooting

---

## Security Considerations

1. **No Authentication on Install Notification**
   - Installation happens before agent has credentials
   - Endpoint accepts any hostname/username
   - Consider IP whitelisting or VPN-only access in production

2. **Agent Registration**
   - After installation, agent uses registration token
   - One-time use token from admin dashboard
   - After registration, uses API key for authentication

3. **HTTPS Recommended**
   - Use HTTPS for production deployments
   - Self-signed certificates supported with Python SSL context

---

## Next Steps

After successful installation:

1. **Agent will automatically:**
   - Send installation notification (done by MSI)
   - Register with backend on first heartbeat
   - Begin collecting and sending telemetry

2. **Admin can:**
   - View installation notification in dashboard
   - Monitor agent status and metrics
   - Configure monitoring rules and alerts

3. **To customize:**
   - Edit `config.json` in installation directory
   - Restart service: `sc stop ITMonitoringAgent && sc start ITMonitoringAgent`

---

## Support

For issues or questions:

1. Check logs in `C:\ProgramData\ITMonitoring\`
2. Review MSI installation log in `%TEMP%\`
3. Verify backend server connectivity
4. Check Windows Event Viewer for service errors

---

**Last Updated:** October 8, 2025  
**Version:** 1.0.0


