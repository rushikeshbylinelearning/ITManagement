# Activity Monitor Implementation Guide

## 🎯 Overview

A comprehensive Teramind-style user activity monitoring module integrated into the IT Management Application. This system tracks, records, and analyzes employee PC activity including bandwidth usage, web history, system status, file sharing, logged accounts, and external connections.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Components](#components)
3. [Installation & Setup](#installation--setup)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Security](#security)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

The Activity Monitor consists of three main layers:

### 1. Agent Layer (Client PC)
- **Location**: `agent/activity_monitor_agent.py`
- **Purpose**: Lightweight Windows service running on employee systems
- **Function**: Collects activity data and syncs to backend every 5-10 minutes

### 2. Backend Layer (Node.js + MongoDB)
- **Location**: `backend/`
- **Components**:
  - Models: `UserActivityLog.js`, `ActivityAlert.js`
  - Routes: `activityMonitor.js`
  - Worker: `activityAnalyzer.js`
- **Purpose**: Receives, stores, analyzes, and serves activity data

### 3. Frontend Layer (React)
- **Location**: `frontend/src/pages/ActivityMonitor.jsx`
- **Purpose**: Admin dashboard for viewing and analyzing activity data
- **Features**: Real-time monitoring, alerts, analytics, and reporting

---

## 🧩 Components

### Backend Components

#### 1. MongoDB Models

**UserActivityLog Model** (`backend/models/UserActivityLog.js`)
```javascript
{
  userId: ObjectId,
  userName: String,
  systemName: String,
  timestamp: Date,
  network: {
    uploadMB: Number,
    downloadMB: Number,
    totalMB: Number,
    activeConnections: Number
  },
  websites: [{
    url: String,
    title: String,
    domain: String,
    duration: Number,
    visitTime: Date
  }],
  systemStatus: {
    cpuUsage: Number,
    memoryUsage: Number,
    diskUsage: Number,
    uptime: Number,
    idleTime: Number
  },
  applications: [{
    appName: String,
    windowTitle: String,
    processName: String,
    isActive: Boolean
  }],
  fileTransfers: [{
    fileName: String,
    fileSize: Number,
    method: String, // USB, Network, Email, Cloud
    action: String, // Copy, Move, Delete, Upload, Download
    timestamp: Date
  }],
  loggedAccounts: [{
    browser: String,
    email: String,
    accountType: String,
    loginTime: Date
  }],
  externalConnections: [{
    remoteIP: String,
    remotePort: Number,
    protocol: String,
    location: Object,
    connectionTime: Date
  }],
  flags: {
    highBandwidth: Boolean,
    suspiciousActivity: Boolean,
    multipleLogins: Boolean,
    largeFileTransfer: Boolean
  },
  riskScore: Number // 0-100
}
```

**ActivityAlert Model** (`backend/models/ActivityAlert.js`)
```javascript
{
  userId: ObjectId,
  userName: String,
  alertType: String, // HIGH_BANDWIDTH, SUSPICIOUS_ACTIVITY, etc.
  severity: String, // LOW, MEDIUM, HIGH, CRITICAL
  title: String,
  description: String,
  status: String, // NEW, ACKNOWLEDGED, RESOLVED, DISMISSED
  triggeredAt: Date,
  metadata: Object
}
```

#### 2. API Routes

**Base URL**: `/api/activity-monitor`

**Agent Endpoints**:
- `POST /upload` - Agent uploads activity data
- `POST /heartbeat` - Agent heartbeat

**Admin Endpoints**:
- `GET /summary` - Activity summary statistics
- `GET /logs` - Detailed activity logs
- `GET /user/:userId/activity` - User-specific activity
- `GET /network-usage` - Network usage statistics
- `GET /websites` - Website activity
- `GET /file-transfers` - File transfer logs
- `GET /external-connections` - External connections
- `GET /alerts` - Activity alerts
- `PUT /alerts/:alertId/acknowledge` - Acknowledge alert
- `PUT /alerts/:alertId/resolve` - Resolve alert
- `PUT /alerts/:alertId/dismiss` - Dismiss alert
- `GET /live` - Live activity stream

#### 3. Background Worker

**ActivityAnalyzer** (`backend/worker/activityAnalyzer.js`)

Runs every 10 minutes to:
- Analyze recent activity logs
- Detect behavioral anomalies
- Generate alerts for suspicious activity
- Aggregate daily statistics
- Cleanup old data (30+ days)

**Anomaly Detection Rules**:
- High bandwidth: >500 MB per reporting interval
- Multiple logins: >3 active accounts
- Large file transfers: >100 MB
- Unusual connections: >10 external IPs
- Suspicious websites: Proxy/VPN/Torrent keywords

### Agent Components

#### Windows Agent (`agent/activity_monitor_agent.py`)

**Data Collectors**:

1. **Network Usage**
   - Source: psutil.net_io_counters()
   - Tracks bytes sent/received per interval

2. **Browser History**
   - Chrome: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\History`
   - Edge: `%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\History`
   - Extracts URLs, titles, visit times from SQLite database

3. **System Status**
   - CPU/Memory/Disk usage via psutil
   - System uptime
   - User idle time (Win32 API)

4. **Application Usage**
   - Active windows via win32gui
   - Process information via psutil
   - Window titles and foreground app

5. **Logged Accounts**
   - Browser profiles (Chrome/Edge Local State)
   - Outlook accounts (Windows Registry)

6. **External Connections**
   - Active TCP/UDP connections via psutil
   - Filters local networks
   - GeoIP location lookup

**Configuration** (`agent_config.json`):
```json
{
  "server_url": "https://your-server.com/api/activity-monitor",
  "agent_token": "your-agent-token",
  "user_id": "user-id-from-system",
  "system_name": "COMPUTER-NAME",
  "report_interval": 300,
  "enable_browser_history": true,
  "enable_file_monitoring": true,
  "enable_network_monitoring": true,
  "max_cache_size": 100
}
```

### Frontend Components

#### Activity Monitor Dashboard (`frontend/src/pages/ActivityMonitor.jsx`)

**Sections**:

1. **Overview**
   - Active users count
   - Average bandwidth per user
   - Total external connections
   - Top 5 visited websites
   - Suspicious file transfers
   - Alert count

2. **Network Usage Tab**
   - Bar chart of upload/download by user
   - Table of top bandwidth users

3. **Website Activity Tab**
   - Table of most visited domains
   - Visit counts and durations
   - Unique user counts

4. **System Health Tab**
   - CPU and memory usage trends
   - System status details per user

5. **File Transfers Tab**
   - Recent file transfers
   - Size, method, and action tracking

6. **External Connections Tab**
   - List of external IPs
   - Geographic locations
   - Connection counts

7. **Live View Tab**
   - Real-time activity stream (last 5 minutes)
   - Auto-refreshes every 30 seconds
   - Risk scores and flags

8. **Alerts Tab**
   - Active alerts with severity levels
   - Acknowledge/Resolve/Dismiss actions
   - Alert notes

---

## 🚀 Installation & Setup

### Backend Setup

1. **Install Dependencies** (already done):
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables** (`.env`):
   ```
   MONGO_URI=mongodb://localhost:27017/it-management
   PORT=5001
   ```

3. **Start Server**:
   ```bash
   node server.js
   ```

   The server will automatically:
   - Load Activity Monitor routes
   - Start the ActivityAnalyzer worker
   - Create necessary MongoDB indexes

### Frontend Setup

1. **Install Dependencies** (already done):
   ```bash
   cd frontend
   npm install
   ```

2. **Development**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

### Agent Deployment

#### Option 1: Automated Installer (Recommended)

1. Navigate to agent directory:
   ```cmd
   cd agent
   ```

2. Run installer as Administrator:
   ```cmd
   install_activity_agent.bat
   ```

3. Enter configuration details when prompted:
   - Server URL
   - Agent Token (generate from admin panel)
   - User ID

4. The installer will:
   - Install Python dependencies
   - Create configuration file
   - Install as Windows service
   - Start the service

#### Option 2: Manual Installation

1. **Install Python Dependencies**:
   ```cmd
   pip install -r activity_agent_requirements.txt
   ```

2. **Create Configuration**:
   Edit `agent_config.json` with your settings.

3. **Install as Service**:
   ```cmd
   python install_service.py install
   ```

4. **Start Service**:
   ```cmd
   net start ActivityMonitorAgent
   ```

#### Option 3: Manual Run (Testing)

```cmd
python activity_monitor_agent.py
```

### Creating Agent Tokens

Agents authenticate using tokens. To create an agent token:

1. Use the existing AgentToken model or create a new endpoint
2. Generate a secure token for each agent
3. Provide the token during agent installation

**Example**:
```javascript
const AgentToken = require('./models/AgentToken');

const token = await AgentToken.create({
  token: 'secure-random-token',
  userId: 'user-id',
  isActive: true
});
```

---

## ✨ Features

### 🔍 Comprehensive Data Collection

- **Network Monitoring**: Upload/download bandwidth tracking
- **Web Browsing**: Chrome and Edge history collection
- **System Performance**: CPU, memory, disk, uptime monitoring
- **Application Tracking**: Active windows and processes
- **File Activity**: File transfers via USB, network, email, cloud
- **Account Detection**: Browser profiles and email accounts
- **Connection Tracking**: External IP connections with geolocation

### 🚨 Intelligent Alerting

**Alert Types**:
- High Bandwidth Usage
- Suspicious Activity (high risk score)
- Multiple Login Accounts
- Large File Transfers
- Unusual External Connections
- Policy Violations
- Data Exfiltration Attempts

**Severity Levels**:
- 🟢 **LOW**: Informational
- 🟡 **MEDIUM**: Requires attention
- 🟠 **HIGH**: Urgent review needed
- 🔴 **CRITICAL**: Immediate action required

### 📊 Advanced Analytics

- **Risk Scoring**: 0-100 scale based on multiple factors
- **Behavioral Analysis**: Pattern detection and anomalies
- **Trend Analysis**: Historical data visualization
- **User Comparison**: Cross-user activity comparison
- **Time-based Reporting**: Daily, weekly, monthly summaries

### 🔄 Real-time Monitoring

- **Live Activity Stream**: Last 5 minutes of activity
- **Auto-refresh**: Updates every 30 seconds
- **Instant Alerts**: Notifications for critical events
- **Dashboard Updates**: Real-time statistics

### 📈 Rich Visualizations

- **Charts**: Line charts, bar charts, pie charts (Recharts)
- **Tables**: Sortable, filterable data tables
- **Badges**: Color-coded status indicators
- **Timeline**: Activity timeline view
- **Heatmaps**: Activity intensity visualization

---

## 🔐 Security

### Data Protection

1. **Encryption in Transit**:
   - All agent-to-server communication via HTTPS
   - TLS 1.2+ required

2. **Authentication**:
   - Agent token authentication
   - JWT for admin dashboard
   - Role-based access control (Admin only)

3. **Data Privacy**:
   - No passwords collected
   - No keystroke logging
   - No screenshot capture
   - Browser history read-only access

4. **Data Retention**:
   - Activity logs: 30 days (auto-delete)
   - Resolved alerts: 60 days
   - Configurable retention policies

5. **Access Control**:
   - Admin-only access to Activity Monitor
   - User-level data isolation
   - Audit logging

### Compliance

- **Privacy Notice**: Display to users during agent installation
- **Data Minimization**: Collect only necessary data
- **User Consent**: Required before monitoring
- **Policy Alignment**: Configure according to company policies

---

## 🧪 Testing

### Backend Testing

1. **Test Agent Upload**:
   ```javascript
   const axios = require('axios');
   
   const data = {
     userId: 'test-user-id',
     userName: 'Test User',
     systemName: 'TEST-PC',
     network: { uploadMB: 50, downloadMB: 100 },
     systemStatus: { cpuUsage: 45, memoryUsage: 60 }
   };
   
   axios.post('http://localhost:5001/api/activity-monitor/upload', data, {
     headers: { 'X-Agent-Token': 'your-token' }
   });
   ```

2. **Test Summary API**:
   ```bash
   curl http://localhost:5001/api/activity-monitor/summary \
     -H "Authorization: Bearer your-jwt-token"
   ```

### Agent Testing

1. **Test Data Collection**:
   ```python
   python activity_monitor_agent.py
   ```
   
   Check `activity_agent.log` for output.

2. **Verify Network Connectivity**:
   - Check agent can reach server URL
   - Verify token authentication works
   - Monitor cache file for offline operation

3. **Test Service Installation**:
   ```cmd
   sc query ActivityMonitorAgent
   net start ActivityMonitorAgent
   ```

### Frontend Testing

1. **Access Dashboard**:
   Navigate to `http://localhost:5173/activity-monitor`

2. **Test Filters**:
   - Change date ranges
   - Switch between tabs
   - Test alert actions

3. **Verify Real-time Updates**:
   - Check live view auto-refresh
   - Verify alert notifications

### Load Testing

Simulate multiple agents:
```javascript
// Generate test data
for (let i = 0; i < 100; i++) {
  // Send activity logs
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### Agent Won't Start

**Problem**: Service fails to start
**Solutions**:
1. Check Python is installed and in PATH
2. Verify all dependencies installed
3. Check `service.log` for errors
4. Ensure `agent_config.json` is valid
5. Run as Administrator

#### No Data in Dashboard

**Problem**: Dashboard shows no activity
**Solutions**:
1. Verify agent is running: `sc query ActivityMonitorAgent`
2. Check agent token is correct
3. Verify server URL is accessible
4. Check backend logs for errors
5. Ensure user_id matches database

#### Browser History Not Collected

**Problem**: Website data missing
**Solutions**:
1. Close browser before collection runs
2. Check file permissions on browser profile folder
3. Verify `enable_browser_history` is true in config
4. Chrome/Edge must be installed

#### High Resource Usage

**Problem**: Agent consuming too much CPU/Memory
**Solutions**:
1. Increase `report_interval` (e.g., 600 seconds)
2. Disable unnecessary features
3. Check for multiple agent instances
4. Review `activity_agent.log` for errors

#### Alerts Not Generating

**Problem**: No alerts appearing
**Solutions**:
1. Check ActivityAnalyzer worker is running
2. Verify backend logs for worker errors
3. Check alert thresholds in `activityAnalyzer.js`
4. Ensure activity logs have sufficient data

### Debug Mode

Enable verbose logging in agent:
```python
logging.basicConfig(level=logging.DEBUG)
```

Enable backend debug:
```javascript
console.log('Debug:', data);
```

---

## 📖 API Reference

### Agent API

#### Upload Activity Data

```http
POST /api/activity-monitor/upload
Headers: X-Agent-Token: <token>
Body: {
  userId: string,
  userName: string,
  systemName: string,
  timestamp: datetime,
  network: { ... },
  websites: [ ... ],
  systemStatus: { ... },
  applications: [ ... ],
  fileTransfers: [ ... ],
  loggedAccounts: [ ... ],
  externalConnections: [ ... ]
}

Response: {
  success: true,
  logId: string,
  riskScore: number,
  flags: { ... }
}
```

#### Send Heartbeat

```http
POST /api/activity-monitor/heartbeat
Headers: X-Agent-Token: <token>
Body: {
  systemName: string,
  agentVersion: string,
  status: string
}

Response: {
  success: true,
  serverTime: datetime,
  reportInterval: number
}
```

### Admin API

#### Get Summary

```http
GET /api/activity-monitor/summary?startDate=<date>&endDate=<date>
Headers: Authorization: Bearer <jwt>

Response: {
  summary: {
    activeUserCount: number,
    totalBandwidthMB: number,
    avgBandwidthPerUser: number,
    totalWebsiteVisits: number,
    totalFileTransfers: number,
    suspiciousActivities: number,
    ...
  },
  alerts: { ... },
  topWebsites: [ ... ],
  suspiciousFiles: [ ... ]
}
```

#### Get Activity Logs

```http
GET /api/activity-monitor/logs?userId=<id>&startDate=<date>&page=1&limit=50
Headers: Authorization: Bearer <jwt>

Response: {
  logs: [ ... ],
  pagination: {
    total: number,
    page: number,
    limit: number,
    pages: number
  }
}
```

#### Get Alerts

```http
GET /api/activity-monitor/alerts?status=NEW&severity=HIGH
Headers: Authorization: Bearer <jwt>

Response: {
  alerts: [
    {
      _id: string,
      userId: string,
      userName: string,
      alertType: string,
      severity: string,
      title: string,
      description: string,
      status: string,
      triggeredAt: datetime,
      metadata: { ... }
    }
  ],
  pagination: { ... }
}
```

#### Acknowledge Alert

```http
PUT /api/activity-monitor/alerts/:alertId/acknowledge
Headers: Authorization: Bearer <jwt>

Response: {
  success: true,
  alert: { ... }
}
```

---

## 📚 Additional Resources

### Configuration Examples

**High-Frequency Monitoring** (1-minute intervals):
```json
{
  "report_interval": 60
}
```

**Privacy-Focused** (minimal data collection):
```json
{
  "enable_browser_history": false,
  "enable_file_monitoring": false,
  "enable_network_monitoring": true
}
```

**High-Security** (aggressive alerting):
Modify `activityAnalyzer.js`:
```javascript
if (user.totalBandwidth > 1000) {  // 1GB threshold
  // Create alert
}
```

### Customization

**Add New Alert Types**:
1. Update `ActivityAlert.js` schema
2. Add detection logic in `activityAnalyzer.js`
3. Update frontend alert display

**Custom Risk Scoring**:
Modify `UserActivityLog.js`:
```javascript
userActivityLogSchema.methods.calculateRiskScore = function() {
  // Custom logic
};
```

**Additional Data Collectors**:
Add to `activity_monitor_agent.py`:
```python
def collect_custom_data(self):
    # Your custom collection logic
    pass
```

---

## 📝 License

Proprietary - For use only with authorized IT Management systems.

---

## 🤝 Support

For technical support:
- Check this documentation
- Review logs: `activity_agent.log`, `service.log`, backend console
- Contact IT administrator
- Refer to troubleshooting section

---

## 🎯 Best Practices

1. **Regular Monitoring**: Check alerts daily
2. **User Communication**: Inform employees about monitoring
3. **Policy Compliance**: Align with company privacy policies
4. **Data Review**: Regularly review collected data types
5. **Performance Tuning**: Adjust intervals based on needs
6. **Security Updates**: Keep agent and server updated
7. **Backup**: Regular backups of activity data
8. **Testing**: Test in controlled environment first
9. **Documentation**: Document customizations
10. **User Privacy**: Respect employee privacy

---

## 📊 Metrics & KPIs

Track these metrics for effective monitoring:

- Average risk score per user
- Alert resolution time
- Bandwidth trends
- Top productivity applications
- Security incident count
- Agent uptime percentage
- Data collection completeness

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-08  
**Author**: IT Management System Development Team

