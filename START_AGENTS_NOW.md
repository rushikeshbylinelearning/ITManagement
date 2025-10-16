# 🚀 START YOUR AGENTS NOW

## Current Status

✅ **3 agents REGISTERED** (showing in count)
❌ **0 agents RUNNING** (table empty)

## Why Table is Empty

The table shows systems that are **actively sending data**, not just registered systems.

Your agents are registered but NOT running, so:
- No data being sent
- No logs in database
- Table appears empty

## ✅ Solution: Start the Agent

### On Windows (where you just registered):

```bash
# Start the agent NOW
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

**Leave this terminal window open!** The agent needs to keep running.

You should see:
```
[2025-10-16 18:20:00] Starting IT Network Monitor Agent v1.0.0
[2025-10-16 18:20:00] System: byline23 (sys-92c0c8852431)
[2025-10-16 18:20:10] Data sent successfully: 0.15 MB total
[2025-10-16 18:20:20] Data sent successfully: 0.32 MB total
```

## ⏱️ Wait 10-20 Seconds

The agent sends data every 10 seconds. After starting:

1. **Wait 10-20 seconds**
2. **Refresh dashboard** (press F5)
3. Table should now show:
   ```
   System Name    | Total Upload | Total Download | Status
   byline23       | 0.15 MB      | 0.32 MB       | Active Now ✅
   ```

## 🔍 Verify Agent is Running

### Check Status:
```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" status
```

**Should show:**
```
System ID: sys-92c0c8852431
System Name: byline23
Token Configured: Yes  ← Important!
Version: 1.0.0
```

### Check Logs:
```bash
type %USERPROFILE%\.it_monitor\agent.log
```

**Look for:**
```
[2025-10-16 18:20:10] Data sent successfully: X.XX MB total
```

**If you see errors:**
```
[2025-10-16 18:20:10] No agent token configured. Please register this agent.
[2025-10-16 18:20:10] Failed to send data to backend: 401 Unauthorized
```

## 🐛 Common Issues

### Issue 1: "No agent token configured"

**Solution:**
```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" register YOUR_TOKEN
```

### Issue 2: "Failed to send data: Connection refused"

**Cause:** Backend not running

**Solution:**
- Make sure backend is running: `node server.js`
- Check backend is on port 5001

### Issue 3: Agent crashes immediately

**Check logs:**
```bash
type %USERPROFILE%\.it_monitor\agent.log
```

**Common causes:**
- Missing psutil: `pip install psutil`
- Missing requests: `pip install requests`
- Wrong Python version: Need 3.8+

## 🎯 Expected Backend Console Output

After agent starts sending data, your **backend console** should show:

```
📊 Network Monitoring - Logs received from agent
System: byline23
Upload: 0.15 MB
Download: 0.32 MB
Websites: 5
✅ Data saved to database
```

## 📊 Expected Dashboard After 20 Seconds

### Statistics Cards:
```
Active Systems: 3
Total Upload: 0.45 MB
Total Download: 0.96 MB
Total Data: 1.41 MB
```

### Table:
```
System Name    | Total Upload | Total Download | Total Data | Last Updated | Status
byline23       | 0.15 MB      | 0.32 MB        | 0.47 MB    | Just now     | Active Now ✅
System2        | 0.15 MB      | 0.32 MB        | 0.47 MB    | 2m ago       | Active ✅
System3        | 0.15 MB      | 0.32 MB        | 0.47 MB    | 5m ago       | Warning ⚠️
```

## 🔧 Start All 3 Registered Agents

If you have 3 registered agents on different computers:

### Computer 1 (byline23):
```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

### Computer 2:
```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

### Computer 3:
```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

**Each agent must be RUNNING for data to appear!**

## ⚡ Quick Test

```bash
# Terminal 1 - Start agent
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"

# Wait 10 seconds, you should see:
[2025-10-16 18:20:10] Data sent successfully: 0.15 MB total

# Terminal 2 - Check backend logs
# Should see:
📊 Network Monitoring - Logs received

# Browser - Refresh dashboard
# Should see system in table now!
```

## 🎬 Step-by-Step Video Script

1. **Open Command Prompt**
2. **Run:** `python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"`
3. **See:** "Starting IT Network Monitor Agent v1.0.0"
4. **Wait:** 10 seconds
5. **See:** "Data sent successfully: X.XX MB total"
6. **Open browser:** Go to Network Monitoring dashboard
7. **Press:** F5 to refresh
8. **See:** Your system appears in the table! ✅

---

## TL;DR

```bash
# Just run this on each computer where you registered an agent:
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"

# Wait 10 seconds
# Refresh dashboard
# Done! ✅
```

**The agent needs to be RUNNING, not just registered!**

