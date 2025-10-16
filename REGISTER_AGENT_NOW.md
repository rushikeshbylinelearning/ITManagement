# 🚨 REGISTER YOUR AGENT NOW

## Current Status

✅ Agent is **installed** and **running**
❌ Agent is **NOT registered** - can't send data yet
❌ No token configured

## Why Dashboard Shows "No systems found"

The agent needs a **registration token** to authenticate with the backend. Without it:
- Agent can't send data
- Backend rejects requests
- Dashboard shows empty

## 🚀 Quick Fix (2 Minutes)

### Step 1: Generate Token

In your backend terminal, run:

```bash
cd backend
node scripts/generateAgentToken.js YOUR_EMAIL@example.com byline23
```

Replace `YOUR_EMAIL@example.com` with the email you use to login as employee.

Example:
```bash
node scripts/generateAgentToken.js employee@company.com byline23
```

You'll see:
```
✅ Agent registered successfully!

📋 Agent Details:
  System ID: sys-1234567890-abc123
  System Name: byline23
  User: Your Name

🔑 Agent Token:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzeXN0ZW1JZCI6InN5cy0xMjM0NTY3ODkwLWFiYzEyMyIsInN5c3RlbU5hbWUiOiJieWxpbmUyMyIsInVzZXJJZCI6IjVmNTNmODNiMmY4NjQxMDAxNzg2NTQzMiIsInR5cGUiOiJhZ2VudCIsImlhdCI6MTYzNDI0MjM0NSwiZXhwIjoxNjY1Nzc4MzQ1fQ.abc123def456...

📝 Registration Command:
  python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" register eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Register Agent

**Copy the entire registration command** from Step 1 output.

Open **Command Prompt as Administrator** and paste:

```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" register YOUR_TOKEN_HERE
```

You'll see:
```
Agent registered successfully!
System ID: sys-1234567890-abc123
System Name: byline23
```

### Step 3: Restart Agent

Stop the currently running agent (Ctrl+C in the terminal where it's running).

Then start it again:

```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

Or let it start automatically on next login (already configured by installer).

### Step 4: Verify

1. Wait 10 seconds (agent sends data every 10 seconds)
2. Refresh the admin dashboard
3. You should see:
   - ✅ System "byline23" in the table
   - ✅ Upload/Download data
   - ✅ Status showing "Active Now"

## 🎯 Alternative: Register via Employee Portal

1. **Login as employee** at `http://localhost:5173/login`
2. Click purple **"Download Agent"** button
3. Click **"I Have Installed It"**
4. Modal generates token automatically
5. Copy the registration command
6. Run in Command Prompt as Admin

## 🔍 Verify Registration Status

Check if token is configured:

```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" status
```

**Before registration:**
```
System ID: sys-b5dfeeaee657
System Name: byline23
Token Configured: No        ← Problem!
Version: 1.0.0
```

**After registration:**
```
System ID: sys-b5dfeeaee657
System Name: byline23
Token Configured: Yes       ← Fixed!
Version: 1.0.0
```

## 📊 Expected Result

After registration, the dashboard will show:

```
Active Systems: 1
Total Upload: 0.15 MB
Total Download: 2.34 MB
Total Data: 2.49 MB

System Name    | Total Upload | Total Download | Total Data | Last Updated | Status
byline23       | 0.15 MB      | 2.34 MB        | 2.49 MB    | Just now     | Active Now
```

And clicking "View Details" will show website breakdown.

## 🐛 Troubleshooting

### Agent shows "No token configured"

**Solution:** Run the registration command from Step 2

### "Failed to send data to backend"

**Causes:**
1. Backend not running
2. Wrong backend URL in agent config
3. Token expired or invalid

**Solution:**
- Check backend is running on port 5001
- Verify token was registered correctly
- Re-register if needed

### Dashboard still shows "No systems found"

**Solution:**
1. Check agent logs: `%USERPROFILE%\.it_monitor\agent.log`
2. Look for "Data sent successfully" messages
3. Verify backend received data (check backend console)
4. Hard refresh dashboard (Ctrl+F5)

### Backend shows 401 or 403 errors

**Solution:**
- Token is invalid
- Re-generate and re-register
- Check backend console for error details

## 📝 Quick Commands

```bash
# Generate token
cd backend
node scripts/generateAgentToken.js YOUR_EMAIL byline23

# Check status
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" status

# Register agent
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" register YOUR_TOKEN

# Start agent
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"

# View logs
type %USERPROFILE%\.it_monitor\agent.log
```

## ✅ Success Checklist

- [ ] Token generated using script
- [ ] Registration command executed
- [ ] Agent shows "Token Configured: Yes"
- [ ] Agent restarted
- [ ] Backend console shows data received
- [ ] Dashboard shows system in table
- [ ] Upload/Download stats visible
- [ ] Status shows "Active Now"

---

**TL;DR:** Run `node scripts/generateAgentToken.js YOUR_EMAIL byline23` in backend, copy the registration command, run it in Command Prompt as Admin, restart agent.

