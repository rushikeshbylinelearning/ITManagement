# Zero-Touch Endpoint Monitoring Module

## Overview

This document describes the **Zero-Touch Endpoint Monitoring Module** implemented in the IT Management Web Application. This system automatically deploys monitoring agents to user endpoints with minimal user interaction, enabling comprehensive system monitoring for security and IT management.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Installation Flow](#installation-flow)
- [Components](#components)
- [Security](#security)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  User Browser   │
│  (Any System)   │
└────────┬────────┘
         │ 1. Login
         ▼
┌─────────────────────────────────────────────┐
│         IT Management Web Portal            │
│  ┌──────────────────────────────────────┐  │
│  │  Frontend (React + MUI)              │  │
│  │  - Agent Detection Component         │  │
│  │  - Auto-Download Dialog              │  │
│  │  - Monitoring Dashboard              │  │
│  └──────────────┬───────────────────────┘  │
│                 │ 2. Check Agent Status     │
│  ┌──────────────▼───────────────────────┐  │
│  │  Backend (Node.js + Express)         │  │
│  │  - Token Generation (/auth/agent)    │  │
│  │  - Agent Registration (/register)    │  │
│  │  - Telemetry Ingestion (/events)     │  │
│  │  - Agent Download (/download/:os)    │  │
│  └──────────────┬───────────────────────┘  │
│                 │ 3. Store Data             │
│  ┌──────────────▼───────────────────────┐  │
│  │  Database (MongoDB)                  │  │
│  │  - Hosts, Alerts, Telemetry          │  │
│  │  - Agent Tokens, Users               │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │ 4. Download Agent
         ▼
┌─────────────────────────────────────────────┐
│         Endpoint System                     │
│  ┌──────────────────────────────────────┐  │
│  │  Monitoring Agent (Python)           │  │
│  │  - System Metrics Collector          │  │
│  │  - Process Monitor                   │  │
│  │  - Network Activity Tracker          │  │
│  │  - File Event Watcher                │  │
│  └──────────────┬───────────────────────┘  │
│                 │ 5. Send Telemetry         │
│  ┌──────────────▼───────────────────────┐  │
│  │  System Service (Auto-Start)         │  │
│  │  - Windows: Windows Service          │  │
│  │  - Linux: systemd                    │  │
│  │  - macOS: LaunchAgent                │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **User Login** → Frontend detects OS and checks for installed agent
2. **Token Generation** → Backend generates one-time registration token (5-min expiry)
3. **Agent Download** → User downloads OS-specific installer with embedded token
4. **Installation** → Installer sets up agent as system service with configuration
5. **Registration** → Agent contacts backend with token, receives agent ID and API key
6. **Telemetry** → Agent sends periodic system metrics, process info, network data
7. **Alert Processing** → Backend analyzes telemetry and generates alerts
8. **Dashboard Updates** → Real-time updates via Socket.IO to admin dashboard

## Features

### Implemented Features ✅

#### 1. Automatic Agent Deployment
- **OS Detection**: Automatically detects Windows, Linux, or macOS
- **Silent Download**: Triggers agent download based on detected OS
- **Progress Tracking**: Shows installation progress and status
- **Auto-Registration**: Agent self-registers using one-time token

#### 2. Secure Authentication
- **One-Time Tokens**: Registration tokens expire after 5 minutes
- **Token Validation**: Backend validates tokens before agent registration
- **API Key Authentication**: Agents use API keys for telemetry transmission
- **HTTPS/TLS**: All communication encrypted (production ready)

#### 3. Comprehensive Telemetry
- **System Metrics**: CPU, RAM, Disk usage, OS info
- **Process Monitoring**: Running processes with CPU/memory usage
- **Network Activity**: Bandwidth usage, connections, protocols
- **File Events**: File operations in monitored directories

#### 4. Intelligent Alerting
- **High CPU/RAM/Disk Usage**: Triggers when thresholds exceeded
- **High Network Usage**: Alerts on unusual bandwidth consumption
- **Bulk File Deletion**: Detects potential ransomware activity
- **Host Offline Detection**: Alerts when agent stops reporting

#### 5. Admin Dashboard
- **Host Management**: View all monitored hosts with status
- **Real-Time Updates**: Socket.IO for live status changes
- **Alert Management**: Acknowledge and resolve alerts
- **Detailed Metrics**: Per-host drill-down with charts

#### 6. Privacy Compliance
- **No Sensitive Data**: No file contents, keystrokes, or screenshots
- **Metadata Only**: Only system metrics and event metadata collected
- **Transparent**: Users notified about monitoring on first login
- **Audit Trail**: All agent activity logged

### Backend Components

#### Database Models

1. **Host** (`models/Host.js`)
   - Stores registered agent information
   - Tracks system metrics and status
   - Relations: one-to-many with telemetry collections

2. **AgentToken** (`models/AgentToken.js`)
   - One-time registration tokens
   - Expires automatically after 5 minutes
   - Linked to user who generated it

3. **NetworkUsage** (`models/NetworkUsage.js`)
   - Network connection data per host
   - Auto-expires after 15 days

4. **FileEvent** (`models/FileEvent.js`)
   - File operation events
   - Auto-expires after 30 days

5. **ProcessEvent** (`models/ProcessEvent.js`)
   - Running process snapshots
   - Auto-expires after 30 days

6. **MonitoringAlert** (`models/MonitoringAlert.js`)
   - System-generated alerts
   - Tracking for acknowledgment and resolution

#### API Routes

**Public Routes** (No Authentication)
```
GET  /api/monitoring/agent/download/:os  - Download agent installer
POST /api/monitoring/register            - Agent registration with token
```

**Agent Routes** (API Key Authentication)
```
POST /api/monitoring/events              - Submit telemetry data
```

**Admin Routes** (JWT Authentication + Admin Role)
```
GET    /api/monitoring/hosts              - List all monitored hosts
GET    /api/monitoring/hosts/:id          - Get host details
GET    /api/monitoring/hosts/:id/processes - Get host processes
GET    /api/monitoring/hosts/:id/files    - Get host file events
GET    /api/monitoring/hosts/:id/network  - Get host network usage
GET    /api/monitoring/alerts             - List all alerts
PATCH  /api/monitoring/alerts/:id/acknowledge - Acknowledge alert
PATCH  /api/monitoring/alerts/:id/resolve - Resolve alert with note
GET    /api/monitoring/stats              - Get monitoring statistics
POST   /api/monitoring/agent/check        - Check agent status for hostname
```

**Authentication Routes** (JWT Authentication)
```
POST /api/auth/agent-token               - Generate one-time registration token
```

#### Alert Rules Engine (`utils/alertRules.js`)

Automated alert generation based on:
- CPU usage > 90% (sustained)
- RAM usage > 90%
- Disk usage > 85%
- Network usage > 100 MB/min per process
- Bulk file deletion > 50 files/min
- Host offline > 5 minutes

### Frontend Components

#### 1. AgentSetup Component (`components/AgentSetup.jsx`)

**Purpose**: Handles agent detection and installation flow

**Features**:
- Automatic OS detection
- Token generation with backend
- Download link generation
- Installation progress tracking
- Post-installation verification
- Privacy notice display

**States**:
- Checking installation
- Download agent
- Installing & registering
- Complete

#### 2. MonitoringPage Component (`pages/MonitoringPage.jsx`)

**Purpose**: Admin dashboard for monitoring all hosts

**Features**:
- Real-time host list with status
- Statistics cards (total, online, offline, alerts)
- Search and filter by status
- Auto-refresh every 30 seconds
- Navigation to host details

#### 3. Layout Integration

The `AgentSetup` component is integrated into the main `Layout` component and:
- Triggers automatically on first dashboard visit
- Shows only once per session (using sessionStorage)
- Non-blocking (can be skipped)
- Remembers if agent is already installed

### Monitoring Agent

#### Agent Architecture

**Language**: Python 3.7+

**Key Libraries**:
- `psutil` - System and process monitoring
- `requests` - HTTP communication
- `watchdog` - File system monitoring
- `pywin32` - Windows service support (Windows only)

**Configuration** (`config.json`):
```json
{
  "backend_url": "https://backend/api/monitoring/events",
  "registration_url": "https://backend/api/monitoring/register",
  "registration_token": "one-time-token-here",
  "api_key": null,
  "agent_id": null,
  "hostname": "auto-detected",
  "polling_interval": 60,
  "monitored_directories": [],
  "log_level": "INFO",
  "retry_attempts": 3,
  "retry_backoff": 5,
  "local_cache_file": "telemetry_cache.json"
}
```

#### Agent Features

1. **Auto-Registration**
   - Uses one-time token on first run
   - Receives agent ID and API key from backend
   - Saves configuration for future runs

2. **Telemetry Collection**
   - System metrics (CPU, RAM, disk)
   - Running processes with resource usage
   - Network connections and bandwidth
   - File system events (optional)

3. **Resilience**
   - Automatic retry on network failures
   - Local caching of failed transmissions
   - Graceful handling of errors

4. **Service Integration**
   - **Windows**: Runs as Windows Service
   - **Linux**: Runs as systemd service
   - **macOS**: Runs as LaunchAgent
   - Auto-starts on system boot

## Installation Flow

### Zero-Touch Installation Steps

```
1. User logs into IT Management Portal
   ↓
2. Frontend checks if agent installed on this machine
   ↓
3. If not installed:
   a. Show AgentSetup dialog with privacy notice
   b. Detect user's OS (Windows/Linux/macOS)
   c. Generate one-time registration token (expires in 5 min)
   d. Offer to download OS-specific installer
   ↓
4. User downloads installer
   ↓
5. User runs installer (requires admin/sudo)
   a. Installer prompts for URLs and token (pre-filled if embedded)
   b. Installs Python dependencies
   c. Creates agent configuration file
   d. Sets up system service
   e. Starts agent service
   ↓
6. Agent starts and attempts registration
   a. Sends token to /api/monitoring/register
   b. Backend validates token
   c. Backend returns agent_id and api_key
   d. Agent saves credentials
   ↓
7. Agent begins telemetry reporting
   a. Collects system metrics every 60 seconds
   b. Sends to /api/monitoring/events
   c. Backend processes and stores data
   d. Alert rules evaluated
   ↓
8. Admin dashboard shows new host as "online"
   ↓
9. Continuous monitoring begins
```

## Security

### Security Features

1. **One-Time Registration Tokens**
   - Tokens expire after 5 minutes
   - Single use only (marked as used after registration)
   - Linked to user account for audit trail

2. **Secure Communication**
   - All API communication over HTTPS (production)
   - TLS/SSL certificate validation
   - API key authentication for telemetry

3. **Data Privacy**
   - No file contents collected
   - No keystroke logging
   - No screenshots or screen content
   - Process command lines sanitized
   - Network traffic metadata only

4. **Access Control**
   - JWT authentication for web portal
   - RBAC: Only admins can access monitoring features
   - API keys unique per agent
   - Rate limiting on all endpoints

5. **Data Retention**
   - Process events: 30 days (auto-delete)
   - File events: 30 days (auto-delete)
   - Network usage: 15 days (auto-delete)
   - Host records: Retained until manually deleted
   - Alerts: Retained until manually deleted

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/it-management

# JWT Secrets
LOCAL_JWT_SECRET=your-secret-key-here

# Monitoring
MONITORING_API_KEY=your-monitoring-api-key-change-me

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001

# Optional: SSO
SSO_PORTAL_URL=https://sso.company.com
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:5001/api
```

### Agent Configuration

Agents are configured automatically after registration, but can be customized:

**Location**:
- Windows: `C:\Program Files\ITMonitoringAgent\config.json`
- Linux: `/opt/it-monitoring-agent/config.json`
- macOS: `/usr/local/it-monitoring-agent/config.json`

**Customizable Settings**:
- `polling_interval`: Seconds between telemetry transmissions (default: 60)
- `monitored_directories`: Array of paths to monitor for file events
- `log_level`: Logging verbosity (DEBUG, INFO, WARNING, ERROR)

## API Reference

### Agent Registration

**Endpoint**: `POST /api/monitoring/register`

**Request**:
```json
{
  "token": "one-time-registration-token",
  "hostname": "user-laptop-001",
  "os": "Windows",
  "os_version": "10.0.19045",
  "user": "john.doe",
  "login_time": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "msg": "Agent registered successfully",
  "agent_id": "abc123def456",
  "config": {
    "agent_id": "abc123def456",
    "backend_url": "https://backend/api/monitoring/events",
    "api_key": "secret-api-key",
    "polling_interval": 60,
    "monitored_directories": [],
    "log_level": "INFO"
  }
}
```

### Telemetry Submission

**Endpoint**: `POST /api/monitoring/events`

**Headers**:
```
X-API-Key: your-monitoring-api-key
Content-Type: application/json
```

**Request**:
```json
{
  "agent_id": "abc123def456",
  "hostname": "user-laptop-001",
  "metrics": {
    "os": "Windows",
    "osVersion": "10.0.19045",
    "agentVersion": "1.0.0",
    "cpu": {
      "model": "Intel Core i7",
      "cores": 8,
      "usage": 45.2
    },
    "ram": {
      "total": 16384,
      "used": 8192,
      "usage": 50.0
    },
    "disk": {
      "total": 500,
      "used": 250,
      "usage": 50.0
    }
  },
  "processes": [...],
  "file_events": [...],
  "network": [...],
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "msg": "Telemetry received",
  "hostId": "507f1f77bcf86cd799439011",
  "alertsTriggered": 2
}
```

## Testing

### Manual Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Login** to the portal at `http://localhost:5173`

4. **Agent Setup Dialog** should appear on dashboard

5. **Download and Install** agent for your OS

6. **Verify** host appears in `/monitoring` page

### Automated Testing with Simulator

Use the agent simulator to test without installing real agents:

```bash
cd backend
node scripts/testAgentSimulator.js
```

**Environment Variables for Simulator**:
```bash
BACKEND_URL=http://localhost:5001/api/monitoring
MONITORING_API_KEY=your-api-key
NUM_AGENTS=5
SEND_INTERVAL=10
```

The simulator creates multiple virtual agents and sends realistic telemetry data, including occasional alerts.

### Test Scenarios

1. **High CPU Alert**: Simulator randomly generates 90%+ CPU usage
2. **Bulk Deletion Alert**: Simulator randomly generates 60+ file deletions
3. **High Network Alert**: Simulator randomly generates 150+ MB network usage
4. **Host Offline**: Stop simulator and wait 5 minutes for offline alert

## Troubleshooting

### Common Issues

#### Agent Won't Install

**Symptoms**: Installer fails or exits with error

**Solutions**:
1. Ensure Python 3.7+ is installed: `python3 --version`
2. Ensure pip is installed: `pip3 --version`
3. Run installer with administrator/sudo privileges
4. Check installer logs for specific errors

#### Agent Won't Register

**Symptoms**: Agent installed but not appearing in dashboard

**Solutions**:
1. Check token hasn't expired (5-minute limit)
2. Verify backend URL is reachable from agent system
3. Check agent logs: Look for registration error messages
4. Verify firewall allows outbound HTTPS connections
5. Generate new token and update config.json manually

#### No Telemetry Data

**Symptoms**: Host shows as "registered" but no metrics displayed

**Solutions**:
1. Verify agent service is running:
   - Linux: `sudo systemctl status it-monitoring-agent`
   - macOS: `launchctl list | grep com.company.it-monitoring-agent`
   - Windows: `Get-Service ITMonitoringAgent`
2. Check agent logs for errors
3. Verify API key in config.json
4. Check network connectivity to backend
5. Restart agent service

#### Frontend Agent Dialog Not Showing

**Symptoms**: No agent setup prompt appears after login

**Solutions**:
1. Clear browser sessionStorage
2. Ensure you're on `/dashboard` page
3. Check browser console for JavaScript errors
4. Verify user is logged in (check sessionStorage for 'user' key)

#### Alerts Not Triggering

**Symptoms**: High CPU/network but no alerts generated

**Solutions**:
1. Check alert thresholds in `backend/utils/alertRules.js`
2. Verify telemetry data contains required fields
3. Check backend logs for alert processing errors
4. Ensure MongoDB connection is stable

### Log Locations

**Backend Logs**:
- Console output (when running with `npm run dev`)
- Production: Use PM2 or systemd journal

**Agent Logs**:
- Linux: `/opt/it-monitoring-agent/monitoring_agent.log`
- macOS: `/usr/local/it-monitoring-agent/agent.log`
- Windows: `C:\Program Files\ITMonitoringAgent\monitoring_agent.log`
- Also check systemd journal (Linux) or Windows Event Viewer

**Frontend Logs**:
- Browser Developer Console (F12)

### Support Commands

**Check Agent Status**:
```bash
# Linux
sudo systemctl status it-monitoring-agent
sudo journalctl -u it-monitoring-agent -n 100

# macOS
launchctl list | grep com.company.it-monitoring-agent
tail -f /usr/local/it-monitoring-agent/agent.log

# Windows (PowerShell as Admin)
Get-Service ITMonitoringAgent
Get-Content "C:\Program Files\ITMonitoringAgent\monitoring_agent.log" -Tail 50
```

**Restart Agent**:
```bash
# Linux
sudo systemctl restart it-monitoring-agent

# macOS
launchctl unload ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist
launchctl load ~/Library/LaunchAgents/com.company.it-monitoring-agent.plist

# Windows (PowerShell as Admin)
Restart-Service ITMonitoringAgent
```

**Test Backend Connectivity**:
```bash
# From agent machine, test if backend is reachable
curl -X POST https://your-backend.com/api/monitoring/events \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"test","hostname":"test"}'
```

## Future Enhancements

### Planned Features

1. **Advanced Alerting**
   - Suspicious domain access detection
   - Out-of-network detection (VPN, public WiFi)
   - Browser session tracking (multiple accounts)
   - Custom alert rules per host group

2. **Agent Management**
   - Remote agent updates
   - Remote configuration changes
   - Agent health monitoring
   - Bulk agent operations

3. **Enhanced Dashboard**
   - Historical charts and trends
   - Comparative analytics
   - Export reports (PDF/CSV)
   - Alert escalation workflows

4. **Integrations**
   - Email notifications for critical alerts
   - Slack/Teams integration
   - SIEM integration (Splunk, ELK)
   - Ticketing system integration

5. **Compliance & Auditing**
   - Compliance reporting (SOC 2, ISO 27001)
   - Audit log exports
   - Data retention policies per regulation
   - GDPR compliance tools

## License

Copyright © 2024. All rights reserved.

This monitoring system is designed for internal corporate use only. Ensure compliance with local privacy laws and employee monitoring regulations before deployment.




