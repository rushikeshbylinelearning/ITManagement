# 🚀 Quick Start: Network Monitoring System

This guide will get you up and running with the Network Monitoring system in 10 minutes.

## Prerequisites

- ✅ Backend server running (Node.js + MongoDB)
- ✅ Frontend running (React + Vite)
- ✅ Python 3.8+ installed on Windows machines
- ✅ Admin account in the IT portal

## Step 1: Start the Backend (If not already running)

```bash
cd backend
npm install
node server.js
```

You should see:
```
✅ MongoDB connected successfully for IT Management App.
🚀 IT Management Server running on port 5001
```

## Step 2: Build the Agent Installer (One-time setup)

```bash
cd backend/agent
pip install -r requirements.txt
pip install pyinstaller

# Build the installer
pyinstaller --onefile --name="ITNetworkMonitor-Setup" install_agent.py
```

This creates `dist/ITNetworkMonitor-Setup.exe`

## Step 3: Host the Installer

Copy the installer to the downloads folder:

```bash
# Windows
copy dist\ITNetworkMonitor-Setup.exe ..\downloads\

# Linux/Mac
cp dist/ITNetworkMonitor-Setup.exe ../downloads/
```

The installer is now available at:
`http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe`

## Step 4: Test as Employee

1. **Login as Employee**
   - Go to `http://localhost:5173/login`
   - Login with employee credentials
   - Select "Employee Login"

2. **Download Agent**
   - You'll see a purple banner: "Network Monitoring Agent"
   - Click "Download Agent"
   - Follow the installation wizard

3. **Install Agent**
   - Download the installer
   - Run as Administrator
   - Click "I Have Installed It"
   - Token is automatically generated
   - Copy the registration command (if needed)

4. **Verify Installation**
   - Check Task Manager for "python.exe"
   - Or check: `C:\Program Files\ITNetworkMonitor\`

## Step 5: Monitor as Admin

1. **Login as Admin**
   - Go to `http://localhost:5173/login`
   - Login with admin credentials
   - Select "Admin Login"

2. **Access Dashboard**
   - Click "Network Monitoring" in sidebar (with heartbeat icon)
   - Or navigate to `/admin/network-monitoring`

3. **View Data**
   - See statistics cards (systems, upload, download, total)
   - View systems table with live updates
   - Click "View Details" on any system
   - Filter by date range or search by system name

## Step 6: Watch Real-Time Updates

1. Keep the admin dashboard open
2. The agent sends data every 10 seconds
3. Dashboard updates automatically (Socket.IO)
4. Green "🟢 Live" indicator shows real-time mode
5. Status chips show system activity (Active Now, 5m ago, etc.)

## 🎯 Testing Tips

### Generate Test Traffic

On the employee machine with agent installed:

```bash
# Generate some traffic
curl https://www.youtube.com
curl https://www.google.com
curl https://www.github.com
```

Within 10 seconds, this should appear in the admin dashboard!

### Check Agent Logs

```bash
# Windows
type C:\Users\%USERNAME%\.it_monitor\agent.log

# View last 20 lines
powershell Get-Content C:\Users\%USERNAME%\.it_monitor\agent.log -Tail 20
```

### Verify API Calls

Open browser console on admin dashboard:
- Look for: `✅ Connected to socket for real-time network monitoring`
- Look for: `📊 Real-time network update: {...}`

## 🔧 Common Issues

### "Agent token not configured"

**Solution**: Complete the registration through the employee portal
```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" register YOUR_TOKEN
```

### "Failed to send data to backend"

**Solution**: Check backend is running and agent config has correct URL
```python
# Edit network_monitor_agent.py
BACKEND_URL = "http://localhost:5001/api"  # For dev
```

### Dashboard shows "No systems found"

**Reasons**:
1. No agents installed yet
2. Agent not registered
3. Agent not running
4. Date range filter doesn't include recent data

**Solution**: Install at least one agent and verify it's running

### Socket.IO not connecting

**Solution**: 
1. Check backend Socket.IO is enabled (it is by default)
2. Verify CORS settings in `server.js`
3. Check browser console for connection errors

## 📋 Verification Checklist

After setup, verify:

- [ ] Backend running on port 5001
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Agent installer built and hosted
- [ ] At least one employee can download installer
- [ ] Agent installed and running on test machine
- [ ] Admin can see the system in dashboard
- [ ] Real-time updates working
- [ ] Website breakdown showing data
- [ ] Filters working (date range, search)

## 🎨 What You Should See

### Employee Dashboard
- Purple banner with "Network Monitoring Agent"
- "Download Agent" button
- Modal with 3-step wizard
- Auto-generated token

### Admin Dashboard
- 4 colorful statistics cards
- Filters section (search, date pickers, quick presets)
- Systems table with live data
- Green status indicators
- Details dialog with website breakdown
- Live updates indicator (🟢 Live)

## 🚀 Next Steps

1. **Install on more systems**: Distribute installer to all employees
2. **Set date ranges**: Analyze last 7 days, 30 days, or custom ranges
3. **Monitor patterns**: Identify bandwidth-heavy systems
4. **Optimize network**: Use data to make informed decisions
5. **Set policies**: Create guidelines based on usage patterns

## 📚 Learn More

- Full documentation: `NETWORK_MONITORING_DOCUMENTATION.md`
- Agent code: `backend/agent/network_monitor_agent.py`
- API routes: `backend/routes/networkMonitoring.js`
- Frontend page: `frontend/src/pages/NetworkMonitoringPage.jsx`

## 🆘 Need Help?

If something isn't working:

1. Check the logs (backend console, agent log, browser console)
2. Verify all services are running
3. Review the troubleshooting section in the main documentation
4. Check that MongoDB has data: `db.networkmonitorings.find()`

---

**Ready?** Let's monitor some networks! 🎉

