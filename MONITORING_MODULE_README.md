# Computer Monitoring Module

## Overview

The Computer Monitoring Module is a comprehensive system monitoring solution integrated into the IT Management Application. It provides real-time monitoring of computer systems, tracking system metrics, processes, file events, and network usage with intelligent alerting capabilities.

## Features

### 📊 System Monitoring
- **Real-time Metrics**: CPU, RAM, and disk usage monitoring
- **Host Status Tracking**: Online/offline status with last-seen timestamps
- **System Inventory**: OS information, hardware specifications

### 🔍 Event Tracking
- **Process Monitoring**: Track running processes with resource usage
- **File System Events**: Monitor file creation, modification, and deletion
- **Network Activity**: Track network connections and bandwidth usage

### 🚨 Intelligent Alerting
- **Automatic Alert Rules**:
  - High CPU/Memory/Disk usage
  - Bulk file deletions (potential ransomware)
  - High network traffic
  - Host offline detection
- **Severity Levels**: Critical, High, Medium, Low
- **Alert Management**: Acknowledge and resolve alerts with notes

### 📈 Real-time Dashboard
- **Live Statistics**: Host counts, alert status, system health
- **Interactive Tables**: Search, filter, and sort monitoring data
- **Detailed Host Views**: Tabbed interface for processes, files, network, alerts
- **Network Charts**: Visual representation of network traffic

### 🔒 Security
- **API Key Authentication**: Secure agent-to-backend communication
- **Role-based Access**: Admin-only access to monitoring features
- **TLS Support**: Encrypted communication channels

---

## Architecture

### Backend Components

```
backend/
├── models/
│   ├── Host.js                    # Host/computer information
│   ├── ProcessEvent.js            # Process monitoring events
│   ├── FileEvent.js               # File system events
│   ├── NetworkUsage.js            # Network activity tracking
│   └── MonitoringAlert.js         # Alert management
├── routes/
│   └── monitoring.js              # API endpoints
└── utils/
    └── alertRules.js              # Alert rules engine
```

### Frontend Components

```
frontend/src/
├── pages/
│   ├── MonitoringPage.jsx         # Host list and statistics
│   └── HostDetailPage.jsx         # Detailed host view with tabs
├── services/
│   └── monitoringApi.js           # API client functions
└── styles/
    └── MonitoringPage.css         # Monitoring UI styles
```

### Agent

```
agent/
├── monitoring_agent.py            # Cross-platform monitoring agent
├── requirements.txt               # Python dependencies
├── config.json                    # Agent configuration
├── install.sh                     # Linux installation script
├── install.bat                    # Windows installation script
└── monitoring-agent.service       # Linux systemd service
```

---

## Installation & Setup

### Backend Setup

1. **Environment Configuration**

Add to your `backend/.env`:

```env
# Monitoring Configuration
MONITORING_API_KEY=your-secure-monitoring-api-key-here
```

2. **Install Dependencies**

The monitoring module uses existing dependencies. No additional npm packages required.

3. **Start Server**

```bash
cd backend
npm start
```

The monitoring routes are automatically registered at `/api/monitoring/*`

### Frontend Setup

No additional setup required. The monitoring pages are integrated into the application routing.

### Agent Installation

#### Linux

```bash
cd agent
chmod +x install.sh
./install.sh
```

#### Windows

```cmd
cd agent
install.bat
```

#### Configuration

Edit `agent/config.json`:

```json
{
  "backend_url": "https://yourdomain.com/api/monitoring/events",
  "api_key": "your-monitoring-api-key",
  "hostname": "your-hostname",
  "polling_interval": 60,
  "monitored_directories": [
    "/var/www",
    "/home/user/documents"
  ],
  "log_level": "INFO"
}
```

#### Running the Agent

**Manual Start:**
```bash
# Linux
./venv/bin/python3 monitoring_agent.py

# Windows
venv\Scripts\python.exe monitoring_agent.py
```

**As a Service (Linux):**
```bash
sudo cp monitoring-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
```

**As a Service (Windows):**

1. Download [NSSM](https://nssm.cc/download)
2. Install the service:
   ```cmd
   nssm install MonitoringAgent
   ```
3. Configure:
   - Application Path: `C:\path\to\agent\venv\Scripts\python.exe`
   - Arguments: `C:\path\to\agent\monitoring_agent.py`
   - Service Name: `MonitoringAgent`
4. Start service:
   ```cmd
   nssm start MonitoringAgent
   ```

---

## API Documentation

### Agent Endpoints (API Key Authentication)

#### POST /api/monitoring/events

Send telemetry data from monitoring agent.

**Headers:**
```
X-API-Key: your-monitoring-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "agent_id": "abc123...",
  "hostname": "server-01",
  "metrics": {
    "os": "Linux",
    "osVersion": "Ubuntu 20.04",
    "cpu": {
      "model": "Intel Core i7",
      "cores": 8,
      "usage": 45.5
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
  "network": [...]
}
```

**Response:**
```json
{
  "success": true,
  "msg": "Telemetry received",
  "hostId": "64abc...",
  "alertsTriggered": 0
}
```

### Admin Endpoints (JWT Authentication)

#### GET /api/monitoring/hosts

List all monitored hosts.

**Query Parameters:**
- `status`: Filter by status (online/offline/warning)
- `search`: Search by hostname or agent ID

**Response:**
```json
{
  "success": true,
  "hosts": [
    {
      "_id": "64abc...",
      "hostname": "server-01",
      "status": "online",
      "lastSeen": "2025-01-08T10:30:00Z",
      "cpu": { "usage": 45.5 },
      "ram": { "usage": 60.2 },
      "disk": { "usage": 75.0 },
      "alertCount": 2
    }
  ]
}
```

#### GET /api/monitoring/hosts/:id

Get detailed host information including recent events.

#### GET /api/monitoring/hosts/:id/processes

Get process events with pagination.

**Query Parameters:**
- `timeRange`: 1h, 6h, 24h, 7d (default: 1h)
- `limit`: Number of records (default: 100)
- `offset`: Pagination offset (default: 0)

#### GET /api/monitoring/hosts/:id/files

Get file events with pagination.

**Query Parameters:**
- `timeRange`: Time range
- `operation`: Filter by operation (create/modify/delete)
- `limit`: Number of records
- `offset`: Pagination offset

#### GET /api/monitoring/hosts/:id/network

Get network usage with pagination.

#### GET /api/monitoring/alerts

List all alerts with filtering.

**Query Parameters:**
- `hostId`: Filter by host
- `type`: Filter by alert type
- `severity`: Filter by severity
- `resolved`: Filter by resolution status
- `limit`: Number of records
- `offset`: Pagination offset

#### PATCH /api/monitoring/alerts/:id/acknowledge

Acknowledge an alert.

#### PATCH /api/monitoring/alerts/:id/resolve

Resolve an alert.

**Request Body:**
```json
{
  "note": "Fixed by restarting service"
}
```

#### GET /api/monitoring/stats

Get monitoring statistics for dashboard.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalHosts": 10,
    "onlineHosts": 8,
    "offlineHosts": 2,
    "totalAlerts": 15,
    "criticalAlerts": 2,
    "unresolvedAlerts": 5
  }
}
```

---

## Alert Rules

### 1. High Network Usage
- **Trigger**: Process uses >100 MB/min
- **Severity**: 
  - Critical: >500 MB/min
  - High: >250 MB/min
  - Medium: >100 MB/min

### 2. Bulk File Deletion
- **Trigger**: >50 file deletions per minute
- **Severity**:
  - Critical: >200 deletions
  - High: >100 deletions
  - Medium: >50 deletions

### 3. High CPU Usage
- **Trigger**: CPU usage >90%
- **Severity**:
  - Critical: >98%
  - High: >90%

### 4. High Memory Usage
- **Trigger**: RAM usage >90%
- **Severity**:
  - Critical: >98%
  - High: >90%

### 5. High Disk Usage
- **Trigger**: Disk usage >85%
- **Severity**:
  - Critical: >95%
  - High: >90%
  - Medium: >85%

### 6. Host Offline
- **Trigger**: No heartbeat for 5 minutes
- **Severity**:
  - High: Offline >60 minutes
  - Medium: Offline 5-60 minutes

---

## Dashboard Usage

### Accessing Monitoring

1. Log in as an **admin** user
2. Navigate to **Monitoring** from the main menu
3. View the monitoring dashboard

### Host List

- **Search**: Filter hosts by hostname or agent ID
- **Status Filter**: Show only online/offline/warning hosts
- **Click Row**: View detailed host information

### Host Detail Page

**Tabs:**

1. **Processes**: View running processes with resource usage
2. **File Events**: Track file system changes
3. **Network**: View network connections and traffic chart
4. **Alerts**: Manage host-specific alerts

**Time Range**: Select data time range (1h, 6h, 24h, 7d)

### Managing Alerts

1. **Acknowledge**: Mark alert as seen
2. **Resolve**: Mark alert as fixed with resolution notes
3. **Filter**: View by severity, type, or resolution status

---

## Real-time Updates

The monitoring module uses Socket.io for real-time updates:

### Server Events

```javascript
// New telemetry received
socket.on('monitoring:update', (data) => {
  // data: { hostId, hostname, status, alerts }
});

// New alerts triggered
socket.on('monitoring:alerts', (alerts) => {
  // alerts: array of new alert objects
});

// Alert acknowledged
socket.on('monitoring:alert-acknowledged', (data) => {
  // data: { alertId, acknowledgedBy }
});

// Alert resolved
socket.on('monitoring:alert-resolved', (data) => {
  // data: { alertId, resolvedBy }
});
```

---

## Database Schema

### Host Collection

```javascript
{
  hostname: String,
  agentId: String (unique),
  os: String,
  osVersion: String,
  cpu: {
    model: String,
    cores: Number,
    usage: Number
  },
  ram: {
    total: Number, // MB
    used: Number,
    usage: Number  // percentage
  },
  disk: {
    total: Number, // GB
    used: Number,
    usage: Number  // percentage
  },
  status: String (online/offline/warning),
  lastSeen: Date,
  firstSeen: Date,
  timestamps: true
}
```

### ProcessEvent Collection

```javascript
{
  hostId: ObjectId (ref: Host),
  pid: Number,
  processName: String,
  user: String,
  cpuUsage: Number,
  memoryUsage: Number,
  startTime: Date,
  status: String,
  timestamps: true
}
```

### FileEvent Collection

```javascript
{
  hostId: ObjectId (ref: Host),
  path: String,
  operation: String (create/modify/delete),
  size: Number,
  user: String,
  timestamp: Date,
  timestamps: true
}
```

### NetworkUsage Collection

```javascript
{
  hostId: ObjectId (ref: Host),
  pid: Number,
  processName: String,
  protocol: String,
  remoteAddress: String,
  bytesIn: Number,
  bytesOut: Number,
  timestamp: Date,
  timestamps: true
}
```

### MonitoringAlert Collection

```javascript
{
  hostId: ObjectId (ref: Host),
  type: String,
  severity: String (low/medium/high/critical),
  title: String,
  description: String,
  resolved: Boolean,
  resolvedAt: Date,
  resolvedBy: ObjectId (ref: User),
  acknowledgedAt: Date,
  timestamps: true
}
```

---

## Troubleshooting

### Agent Issues

**Agent won't start:**
- Check Python version (3.7+ required)
- Verify virtual environment activation
- Check config.json syntax

**Can't connect to backend:**
- Verify backend URL in config.json
- Check API key matches backend .env
- Ensure backend is running
- Check firewall/network settings

**High CPU usage:**
- Increase polling_interval in config.json
- Reduce monitored_directories
- Check for permission errors in logs

### Backend Issues

**Alerts not triggering:**
- Check alert rules in `backend/utils/alertRules.js`
- Verify telemetry data format
- Check backend logs

**Data not appearing:**
- Verify MongoDB connection
- Check API authentication
- Review backend logs for errors

### Frontend Issues

**Monitoring page not loading:**
- Check user role (admin required)
- Verify API routes are registered
- Check browser console for errors

**Real-time updates not working:**
- Verify Socket.io connection
- Check CORS configuration
- Review network tab in browser devtools

---

## Security Best Practices

1. **Change Default API Key**: Always set a strong, unique API key
2. **Use HTTPS**: Enable TLS for production deployments
3. **Restrict Access**: Only admins can access monitoring features
4. **Monitor Logs**: Review agent and backend logs regularly
5. **Update Regularly**: Keep agent and dependencies up to date
6. **Limit Monitoring Scope**: Only monitor necessary directories
7. **Secure Agent Config**: Restrict file permissions on config.json

---

## Performance Considerations

### Agent
- Default polling interval: 60 seconds
- Process limit: All processes collected
- Network connections: Limited to 50 per collection
- File monitoring: Real-time with watchdog

### Backend
- Process events: Auto-delete after 30 days
- File events: Auto-delete after 30 days
- Network usage: Auto-delete after 15 days
- Indexes: Optimized for common queries

### Database
- Expected data growth: ~10-50 MB per host per day
- Recommended: Regular MongoDB maintenance
- Consider: Data archival strategy for large deployments

---

## License

This monitoring module is part of the IT Management Application.

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend/frontend logs
3. Check agent logs in `monitoring_agent.log`

---

## Changelog

### Version 1.0.0 (2025-01-08)
- Initial release
- Cross-platform agent support
- Real-time monitoring dashboard
- Intelligent alert rules
- Process, file, and network monitoring
- Admin-only access control




