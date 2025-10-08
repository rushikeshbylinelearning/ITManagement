# Computer Monitoring Module - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Configure Backend (1 minute)

```bash
# Navigate to backend directory
cd backend

# Add monitoring API key to your .env file
echo "MONITORING_API_KEY=secure-monitoring-key-123" >> .env

# Make sure LOCAL_JWT_SECRET is also set
echo "LOCAL_JWT_SECRET=your-local-jwt-secret-key" >> .env

# Start the backend server
npm start
```

✅ Backend should now be running with monitoring routes at `/api/monitoring/*`

### Step 2: Start Frontend (30 seconds)

```bash
# In a new terminal, navigate to frontend
cd frontend

# Start the development server
npm run dev
```

✅ Frontend should now be running at `http://localhost:5173`

### Step 3: Access Monitoring Dashboard (30 seconds)

1. Open browser to `http://localhost:5173`
2. Login as an **admin** user
3. Click **"Monitoring"** in the sidebar menu
4. You should see the monitoring dashboard (empty initially)

### Step 4: Install and Run Agent (2 minutes)

#### Linux/Mac:

```bash
# Navigate to agent directory
cd agent

# Make install script executable
chmod +x install.sh

# Run installation
./install.sh

# Edit configuration
nano config.json
```

Update `config.json`:
```json
{
  "backend_url": "http://localhost:5001/api/monitoring/events",
  "api_key": "secure-monitoring-key-123",
  "polling_interval": 60
}
```

```bash
# Run the agent
./venv/bin/python3 monitoring_agent.py
```

#### Windows:

```cmd
REM Navigate to agent directory
cd agent

REM Run installation
install.bat

REM Edit configuration
notepad config.json
```

Update `config.json`:
```json
{
  "backend_url": "http://localhost:5001/api/monitoring/events",
  "api_key": "secure-monitoring-key-123",
  "polling_interval": 60
}
```

```cmd
REM Run the agent
venv\Scripts\python.exe monitoring_agent.py
```

### Step 5: Generate Sample Data (Optional - 1 minute)

```bash
# From backend directory
cd backend

# Run sample data generator
node scripts/generateMonitoringSampleData.js
```

✅ Sample data should now appear in the monitoring dashboard!

---

## 🎯 What You Should See

### Monitoring Dashboard
- **Statistics Cards**: Total hosts, online/offline counts, active alerts
- **Host Table**: List of monitored computers with status, metrics, and alerts
- **Search & Filter**: Search by hostname, filter by status

### Host Detail Page
Click on any host to see:
- **Processes Tab**: Running processes with CPU/memory usage
- **File Events Tab**: File creation, modification, deletion events
- **Network Tab**: Network connections and traffic chart
- **Alerts Tab**: System alerts with acknowledge/resolve options

### Admin Dashboard
The main dashboard now includes a **"Computer Monitoring"** section showing:
- Total monitored hosts
- Active alerts count
- Offline hosts count

---

## 🧪 Testing the Setup

### Test 1: Verify Agent Connection
```bash
# Check agent logs
tail -f agent/monitoring_agent.log  # Linux/Mac
type agent\monitoring_agent.log     # Windows
```

Look for:
```
✅ Telemetry sent successfully
```

### Test 2: Verify Backend Receives Data
Check backend console for:
```
POST /api/monitoring/events 200
```

### Test 3: View Monitoring Dashboard
1. Go to `http://localhost:5173/monitoring`
2. You should see at least one host listed
3. Click on the host to view details

### Test 4: Trigger Alerts
Run the sample data generator with alert-triggering data:
```bash
node backend/scripts/generateMonitoringSampleData.js
```

Check the monitoring dashboard for new alerts.

---

## 🐛 Quick Troubleshooting

### Agent won't connect
```bash
# Test backend connectivity
curl http://localhost:5001/api/monitoring/stats

# Verify API key matches in both:
# - backend/.env (MONITORING_API_KEY)
# - agent/config.json (api_key)
```

### No hosts showing in dashboard
1. Verify agent is running (check logs)
2. Verify backend is running
3. Verify you're logged in as **admin** user
4. Check browser console for errors

### Monitoring page shows error
1. Verify backend routes are registered (`backend/server.js`)
2. Check backend logs for errors
3. Ensure MongoDB is running

---

## 📚 Next Steps

1. **Configure Service**: Set up agent as a system service
   - Linux: See `agent/README.md` for systemd setup
   - Windows: See `agent/README.md` for NSSM setup

2. **Configure File Monitoring**: Add directories to monitor
   ```json
   {
     "monitored_directories": [
       "/var/www",
       "C:\\Important\\Files"
     ]
   }
   ```

3. **Adjust Polling**: Change collection frequency
   ```json
   {
     "polling_interval": 300  // 5 minutes
   }
   ```

4. **Review Documentation**:
   - `MONITORING_MODULE_README.md` - Complete documentation
   - `agent/README.md` - Agent-specific guide
   - `MONITORING_IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## 🎉 You're Done!

Your Computer Monitoring Module is now fully operational!

**What you can do now:**
- ✅ Monitor multiple computers in real-time
- ✅ Track system metrics (CPU, RAM, Disk)
- ✅ View running processes
- ✅ Monitor file system changes
- ✅ Track network activity
- ✅ Receive intelligent alerts
- ✅ Manage and resolve alerts

**For more advanced features, see:**
- Alert rule customization: `backend/utils/alertRules.js`
- Agent configuration: `agent/config.json`
- API integration: `MONITORING_MODULE_README.md`

---

*Need help? Check the troubleshooting sections in the documentation!*




