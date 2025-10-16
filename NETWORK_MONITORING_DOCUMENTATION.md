# Network Monitoring System Documentation

## 📋 Overview

The IT Management Network Monitoring System provides real-time network usage tracking across all employee computers. This feature enables administrators to monitor bandwidth consumption, track website usage, and analyze network patterns across the organization.

## 🎯 Key Features

### For Administrators
- **Real-Time Dashboard**: Live updates of network usage across all systems
- **System-Wise Tracking**: View data usage per computer/hostname
- **Website Analytics**: See which websites consume the most bandwidth
- **Date Range Filtering**: Analyze data by custom date ranges or quick presets
- **Live Status Indicators**: See which systems are currently active
- **Detailed Reports**: Drill down into per-website usage for any system

### For Employees
- **Easy Installation**: Download and install the monitoring agent with a simple wizard
- **One-Click Registration**: Automatic system registration through the employee portal
- **Privacy-First**: Only network traffic data is monitored (no keylogging, screen capture, or personal data)
- **Transparent Operation**: Runs silently in the background without user interaction

## 🏗️ Architecture

### Components

1. **Local Agent** (Python)
   - Location: `backend/agent/network_monitor_agent.py`
   - Runs on each employee's Windows machine
   - Monitors network traffic using `psutil`
   - Auto-starts on system boot
   - Sends data every 10 seconds to backend

2. **Backend APIs** (Node.js/Express)
   - Location: `backend/routes/networkMonitoring.js`
   - Endpoints:
     - `POST /api/network-monitoring/register` - Register new agent
     - `POST /api/network-monitoring/logs` - Receive network data from agents
     - `GET /api/network-monitoring/usage` - Get system usage overview
     - `GET /api/network-monitoring/websites` - Get website-wise usage
     - `GET /api/network-monitoring/agents` - List all registered agents
     - `GET /api/network-monitoring/stats` - Get dashboard statistics

3. **Database Models** (MongoDB)
   - `NetworkMonitoring`: Stores network usage logs
   - `SystemAgent`: Stores registered agent information

4. **Admin Dashboard** (React)
   - Location: `frontend/src/pages/NetworkMonitoringPage.jsx`
   - Real-time updates via Socket.IO
   - Filterable data tables
   - Statistical cards and visualizations

5. **Employee Portal** (React)
   - Location: `frontend/src/components/AgentDownloadModal.jsx`
   - Download and installation wizard
   - Automatic token generation and registration

## 🚀 Installation & Setup

### Backend Setup

1. **Start the Backend Server**
   ```bash
   cd backend
   npm install
   # Configure your .env file with MONGO_URI and LOCAL_JWT_SECRET
   node server.js
   ```

2. **Verify Routes**
   - The network monitoring routes are automatically registered
   - Check console for: `🚀 IT Management Server running on port 5001`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Access Features**
   - Admin: Navigate to `/admin/network-monitoring`
   - Employee: See "Network Monitoring Agent" section in dashboard

### Agent Deployment

#### Option 1: Installer Package (Recommended)

1. **Build the Installer** (One-time setup)
   ```bash
   cd backend/agent
   pip install pyinstaller
   pyinstaller --onefile --icon=icon.ico --name="ITNetworkMonitor-Setup" install_agent.py
   ```

2. **Host the Installer**
   - Place `dist/ITNetworkMonitor-Setup.exe` in `backend/downloads/`
   - Make it accessible at: `https://your-domain.com/downloads/ITNetworkMonitor-Setup.exe`

3. **Employee Installation**
   - Employee logs into portal
   - Clicks "Download Agent" button
   - Downloads `ITNetworkMonitor-Setup.exe`
   - Runs as Administrator
   - Agent installs and registers automatically

#### Option 2: Manual Installation

1. **Copy Files to Employee System**
   ```
   backend/agent/
   ├── network_monitor_agent.py
   ├── install_agent.py
   ├── service_wrapper.py
   └── requirements.txt
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Installer**
   ```bash
   python install_agent.py
   ```

4. **Register Agent**
   - Employee gets token from portal
   - Run: `python network_monitor_agent.py register YOUR_TOKEN_HERE`

## 📊 How It Works

### Data Flow

```
Employee Computer (Agent)
    ↓ (Every 10 seconds)
    ↓ HTTPS POST with JWT Token
    ↓
Backend API (/api/network-monitoring/logs)
    ↓ Store in MongoDB
    ↓ Emit Socket.IO event
    ↓
Admin Dashboard (Real-time update)
```

### Data Collection

The agent collects:
- **System Information**: Hostname, IP address, MAC address
- **Total Upload/Download**: Bandwidth usage in MB
- **Active Connections**: Currently established network connections
- **Website Domains**: Resolved from IP addresses via reverse DNS
- **Per-Website Usage**: Estimated data usage per domain

### Security

- **JWT Authentication**: Each agent has a unique, long-lived JWT token
- **HTTPS Only**: All communication is encrypted
- **No Personal Data**: Only network statistics are collected
- **Admin-Only Access**: Dashboard restricted to admin role
- **Token Revocation**: Admins can deactivate agents remotely

## 🎨 User Interface

### Admin Dashboard Components

1. **Statistics Cards**
   - Active Systems count
   - Total Upload bandwidth
   - Total Download bandwidth
   - Total Data usage

2. **Filters Section**
   - Search by system name
   - Date range picker (start/end)
   - Quick date presets (today, last 7 days, last 30 days, etc.)

3. **Systems Table**
   - System Name (hostname)
   - Total Upload
   - Total Download
   - Total Data
   - Last Updated timestamp
   - Status indicator (active/inactive)
   - Action buttons (View Details)

4. **Details Dialog**
   - Website-wise breakdown
   - Data used per website
   - Upload/Download split
   - Request counts

### Employee Dashboard Components

1. **Download Banner**
   - Prominent gradient banner
   - "Download Agent" button
   - Brief description

2. **Installation Modal**
   - Step-by-step wizard
   - Download instructions
   - Automatic token generation
   - Installation verification
   - Copy-paste commands

## 🔧 Configuration

### Agent Configuration

Edit `backend/agent/network_monitor_agent.py`:

```python
# Backend URL
BACKEND_URL = "https://itmanagement.bylinelms.com/api"
BACKUP_BACKEND_URL = "http://localhost:5001/api"

# Update intervals
UPDATE_INTERVAL = 10  # seconds (how often to send data)
HEARTBEAT_INTERVAL = 60  # seconds (keep-alive signal)
```

### Backend Configuration

Environment variables in `.env`:

```env
MONGO_URI=mongodb://localhost:27017/it-management
LOCAL_JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=5001
```

## 📝 API Reference

### Register Agent
```http
POST /api/network-monitoring/register
Authorization: Bearer <user-session-token>
Content-Type: application/json

{
  "systemId": "sys-abc123",
  "systemName": "DESKTOP-1234",
  "systemInfo": {
    "os": "Windows",
    "osVersion": "10.0.19044",
    "ipAddress": "192.168.1.100",
    "macAddress": "00:1A:2B:3C:4D:5E"
  }
}

Response:
{
  "success": true,
  "systemId": "sys-abc123",
  "systemName": "DESKTOP-1234",
  "agentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "System agent registered successfully"
}
```

### Submit Network Logs
```http
POST /api/network-monitoring/logs
Authorization: Bearer <agent-token>
Content-Type: application/json

{
  "totalUploadMB": 125.5,
  "totalDownloadMB": 456.2,
  "websites": [
    {
      "domain": "youtube.com",
      "dataUsedMB": 125.3,
      "uploadMB": 5.2,
      "downloadMB": 120.1,
      "requestCount": 45
    }
  ],
  "agentVersion": "1.0.0",
  "systemInfo": { ... }
}

Response:
{
  "success": true,
  "message": "Network data logged successfully"
}
```

### Get Network Usage
```http
GET /api/network-monitoring/usage?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <admin-session-token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "sys-abc123",
      "systemName": "DESKTOP-1234",
      "totalUpload": 5234.5,
      "totalDownload": 12456.8,
      "totalData": 17691.3,
      "lastUpdate": "2025-01-16T10:00:00Z"
    }
  ],
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  }
}
```

### Get Website Usage
```http
GET /api/network-monitoring/websites?systemId=sys-abc123&startDate=2025-01-01
Authorization: Bearer <admin-session-token>

Response:
{
  "success": true,
  "systemId": "sys-abc123",
  "data": [
    {
      "_id": "youtube.com",
      "totalDataUsed": 2456.3,
      "totalUpload": 45.2,
      "totalDownload": 2411.1,
      "requestCount": 1234
    }
  ]
}
```

## 🔒 Privacy & Compliance

### What is Monitored
✅ Network bandwidth (upload/download)
✅ Website domains visited
✅ Estimated data usage per website
✅ System information (hostname, IP, OS)

### What is NOT Monitored
❌ Screen captures
❌ Keystrokes
❌ File access
❌ Personal documents
❌ Passwords or credentials
❌ Specific URLs (only domains)
❌ Content of network traffic

### Employee Transparency
- Clear privacy notice during installation
- Visible in employee dashboard
- Can be uninstalled by employee
- Only works during work hours (configurable)

## 🐛 Troubleshooting

### Agent Not Sending Data

1. **Check if agent is running**
   ```bash
   tasklist | findstr python
   ```

2. **View agent logs**
   ```
   C:\Users\<username>\.it_monitor\agent.log
   ```

3. **Verify token**
   ```bash
   python network_monitor_agent.py status
   ```

4. **Restart agent**
   ```bash
   schtasks /Run /TN ITNetworkMonitor
   ```

### Dashboard Not Updating

1. Check Socket.IO connection in browser console
2. Verify backend is running
3. Check MongoDB connection
4. Verify admin role permissions

### Installation Failures

1. Run as Administrator
2. Check antivirus isn't blocking
3. Verify Python is installed (3.8+)
4. Check internet connectivity

## 📈 Future Enhancements

- [ ] Data usage alerts and notifications
- [ ] Bandwidth quotas per user/department
- [ ] Export reports to PDF/Excel
- [ ] Charts and visualizations (line/bar charts)
- [ ] Blacklist/whitelist websites
- [ ] Schedule-based monitoring (work hours only)
- [ ] Multi-platform support (Mac, Linux)
- [ ] Mobile app for monitoring
- [ ] AI-powered anomaly detection

## 🤝 Support

For issues, questions, or feature requests:
- Check the logs: `backend/.it_monitor/agent.log`
- Review the API responses in Network tab
- Contact IT Support through the portal

## 📄 License

This network monitoring system is part of the IT Management Application.
Proprietary software - All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: January 16, 2025  
**Author**: IT Management Team

