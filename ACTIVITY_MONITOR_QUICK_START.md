# Activity Monitor - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend (If Not Running)

```bash
cd backend
# Backend should already be running
# If not, restart it:
# node server.js
```

The Activity Monitor routes and background worker are automatically loaded when the server starts [[memory:7177744]].

### Step 2: Access the Admin Dashboard

1. Open your browser and navigate to your frontend URL (e.g., `http://localhost:5173`)
2. Log in as an **admin** user
3. Navigate to **Activity Monitor** from the sidebar menu

You should see the Activity Monitor dashboard with sections for:
- Overview Statistics
- Network Usage
- Website Activity
- System Health
- File Transfers
- External Connections
- Live View
- Alerts

### Step 3: Install the Agent on a Test Machine

#### Windows Installation:

1. Copy the `agent` folder to the target Windows machine

2. Open Command Prompt as **Administrator**

3. Navigate to the agent folder:
   ```cmd
   cd path\to\agent
   ```

4. Run the installer:
   ```cmd
   install_activity_agent.bat
   ```

5. Enter the required information:
   - **Server URL**: `http://your-server-ip:5001/api/activity-monitor`
   - **Agent Token**: (You'll need to generate this - see below)
   - **User ID**: The MongoDB user ID for the employee

6. The installer will automatically:
   - Install Python dependencies
   - Create configuration file
   - Install as Windows service
   - Start the monitoring agent

### Step 4: Generate an Agent Token

Currently, you'll need to create an agent token manually. Here's how:

#### Option A: MongoDB Direct

```javascript
// Connect to MongoDB and run:
db.agenttokens.insertOne({
  token: "test-token-" + Date.now(),
  userId: ObjectId("your-user-id"),
  isActive: true,
  createdAt: new Date()
});
```

#### Option B: Create Admin Endpoint (Recommended)

Add this temporary route to test:

```javascript
// In backend/routes/admin.js or create a test script
router.post('/create-agent-token', authenticateToken, isAdmin, async (req, res) => {
  const { userId } = req.body;
  const crypto = require('crypto');
  
  const AgentToken = require('../models/AgentToken');
  const token = new AgentToken({
    token: crypto.randomBytes(32).toString('hex'),
    userId,
    isActive: true
  });
  
  await token.save();
  res.json({ token: token.token });
});
```

### Step 5: Verify Agent is Working

1. **Check Windows Service**:
   ```cmd
   sc query ActivityMonitorAgent
   ```
   Should show "RUNNING"

2. **Check Agent Logs**:
   ```
   agent\activity_agent.log
   ```
   Should show successful data collection and uploads

3. **Check Backend Logs**:
   Look for messages like:
   ```
   POST /api/activity-monitor/upload 201
   Data sent successfully
   ```

4. **Check Dashboard**:
   - Refresh the Activity Monitor dashboard
   - You should see the user appear in "Active Users"
   - Data should populate in various tabs

---

## 🧪 Testing with Sample Data

### Generate Test Activity Logs

Create a test script: `backend/scripts/generateActivityTestData.js`

```javascript
const mongoose = require('mongoose');
const UserActivityLog = require('../models/UserActivityLog');
const User = require('../models/User');

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

async function generateTestData() {
  // Get a test user
  const user = await User.findOne({ role: 'employee' });
  
  if (!user) {
    console.log('No employee user found. Create one first.');
    return;
  }
  
  console.log(`Generating test data for user: ${user.username}`);
  
  // Generate 10 test logs
  for (let i = 0; i < 10; i++) {
    const log = new UserActivityLog({
      userId: user._id,
      userName: user.username,
      systemName: 'TEST-PC-' + i,
      timestamp: new Date(Date.now() - i * 5 * 60 * 1000), // 5 min intervals
      network: {
        uploadMB: Math.random() * 100,
        downloadMB: Math.random() * 200,
        totalMB: Math.random() * 300,
        activeConnections: Math.floor(Math.random() * 20)
      },
      websites: [
        {
          url: 'https://github.com',
          title: 'GitHub',
          domain: 'github.com',
          duration: Math.floor(Math.random() * 600),
          visitTime: new Date()
        },
        {
          url: 'https://stackoverflow.com',
          title: 'Stack Overflow',
          domain: 'stackoverflow.com',
          duration: Math.floor(Math.random() * 300),
          visitTime: new Date()
        }
      ],
      systemStatus: {
        cpuUsage: 30 + Math.random() * 40,
        memoryUsage: 40 + Math.random() * 30,
        memoryUsedMB: 4000 + Math.random() * 4000,
        memoryTotalMB: 16000,
        diskUsage: 50 + Math.random() * 30,
        uptime: Math.floor(Math.random() * 86400),
        activeApps: Math.floor(Math.random() * 30),
        idleTime: Math.floor(Math.random() * 300)
      },
      fileTransfers: [
        {
          fileName: 'document.pdf',
          fileSize: Math.floor(Math.random() * 10000000),
          method: 'Email',
          action: 'Upload',
          timestamp: new Date()
        }
      ],
      loggedAccounts: [
        {
          browser: 'Chrome',
          email: user.email,
          accountType: 'Browser Profile',
          loginTime: new Date()
        }
      ],
      externalConnections: [
        {
          remoteIP: '8.8.8.8',
          remotePort: 443,
          protocol: 'TCP',
          location: {
            country: 'United States',
            city: 'Mountain View'
          },
          connectionTime: new Date(),
          status: 'ESTABLISHED'
        }
      ],
      agentVersion: '1.0.0',
      osVersion: 'Windows 10'
    });
    
    log.analyzeAndFlag();
    await log.save();
    console.log(`Created test log ${i + 1}/10`);
  }
  
  console.log('Test data generation complete!');
  mongoose.connection.close();
}

generateTestData().catch(console.error);
```

Run the script:
```bash
cd backend
node scripts/generateActivityTestData.js
```

---

## 🎯 What You Should See

### Dashboard Overview

After installing agents and collecting data, you should see:

- **Active Users**: Count of users with recent activity
- **Average Bandwidth**: MB per user
- **External Connections**: Total outbound connections
- **Top Websites**: Most visited domains
- **Suspicious Files**: Large file transfers
- **Alerts**: Any triggered security alerts

### Network Usage Tab

- Bar chart showing upload/download by user
- Table of bandwidth consumption
- Filter by date range

### Website Activity Tab

- List of all visited websites
- Visit counts and durations
- User counts per site

### Live View Tab

- Real-time activity stream
- Updates every 30 seconds
- Shows risk scores

### Alerts Tab

- Security alerts with severity levels
- Actions: Acknowledge, Resolve, Dismiss
- Alert history and notes

---

## 🔧 Common First-Time Issues

### Agent Can't Connect to Server

**Fix**: Update `agent_config.json` with correct server URL
```json
{
  "server_url": "http://192.168.1.100:5001/api/activity-monitor"
}
```

### No Data Appearing

**Causes**:
1. Agent not running
2. Invalid token
3. Wrong user ID
4. Network issues

**Check**:
```cmd
net start ActivityMonitorAgent
type activity_agent.log
```

### Dashboard Shows "No Data"

**Fix**: 
1. Wait 5-10 minutes for first data collection
2. Generate test data (see above)
3. Check backend is running
4. Verify date range filter

---

## 📱 Next Steps

1. **Deploy to Production**:
   - Update server URLs to production
   - Generate unique tokens for each agent
   - Deploy agents to employee machines

2. **Customize Alerts**:
   - Edit `backend/worker/activityAnalyzer.js`
   - Adjust thresholds based on your needs

3. **Configure Policies**:
   - Set bandwidth limits
   - Define allowed/blocked websites
   - Customize risk scoring

4. **User Training**:
   - Inform employees about monitoring
   - Provide privacy policy
   - Explain acceptable use

5. **Regular Monitoring**:
   - Check dashboard daily
   - Review alerts
   - Investigate anomalies

---

## 📞 Support

If you encounter issues:

1. Check logs: `activity_agent.log`, `service.log`, backend console
2. Review `ACTIVITY_MONITOR_IMPLEMENTATION.md` for detailed docs
3. Test with sample data script
4. Verify all services are running
5. Check network connectivity

---

## ✅ Checklist

- [ ] Backend server running
- [ ] Activity Monitor page accessible
- [ ] Agent installed on test machine
- [ ] Agent token created and configured
- [ ] Agent service running
- [ ] Test data generated (if needed)
- [ ] Dashboard showing activity
- [ ] Alerts working
- [ ] All tabs functional

---

**Quick Reference**:
- Backend API: `http://localhost:5001/api/activity-monitor`
- Frontend Page: `http://localhost:5173/activity-monitor`
- Agent Config: `agent/agent_config.json`
- Agent Logs: `agent/activity_agent.log`

**You're all set! Start monitoring user activity now.** 🎉

