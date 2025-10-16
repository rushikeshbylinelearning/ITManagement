# ⚡ SIMPLE FIX - START YOUR AGENT NOW

## What's Happening

```
✅ Registered Agents: 3  ← This is why count shows "3 Active Systems"
❌ Data Logs: 0          ← This is why table is EMPTY!
```

**The agents are registered but NOT RUNNING!**

## The Problem Explained Simply

Think of it like this:

1. **Registration** = Giving someone a phone number
2. **Running the agent** = Actually calling that number

You've given 3 systems "phone numbers" (registration tokens), but none of them are actually "calling" (sending data) yet!

## ✅ Fix in 3 Steps

### Step 1: Open Command Prompt (Run as Administrator)

Press `Windows Key` + `X`, then click "Command Prompt (Admin)" or "PowerShell (Admin)"

### Step 2: Start the Agent

```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

### Step 3: Watch for Success

You should see:
```
[2025-10-16 18:30:00] Starting IT Network Monitor Agent v1.0.0
[2025-10-16 18:30:00] System: byline23
[2025-10-16 18:30:10] ✅ Data sent successfully: 0.15 MB total
[2025-10-16 18:30:20] ✅ Data sent successfully: 0.32 MB total
```

**Leave this window open!** The agent needs to keep running.

---

## 🎬 What Happens Next

After starting the agent:

**10 seconds:** Agent sends first batch of data to backend

**15 seconds:** Backend receives and saves data to database

**20 seconds:** Refresh your dashboard → **Table now shows your system!** ✅

## 📊 Expected Result

### Before (Current):
```
Active Systems: 3
Table: [Empty - No systems found]
```

### After (20 seconds):
```
Active Systems: 3
Table:
  System Name              | Total Upload | Total Download | Status
  ------------------------ | ------------ | -------------- | ----------
  Rushikesh 's Computer    | 0.15 MB      | 0.32 MB        | Active Now ✅
```

---

## 🐛 Troubleshooting

### If you see: "No agent token configured"

**You're running the wrong agent!** Each registration created a NEW system ID.

**Solution:** Use the LATEST registration (the one from your last "I Have Installed It" click):

```bash
# This is your LATEST system
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

Check your config:
```bash
type "%USERPROFILE%\.it_monitor\config.json"
```

Should show:
```json
{
  "systemId": "sys-1760618858733-3x0gc5dbs",  ← LATEST one
  "systemName": "Rushikesh 's Computer",
  "apiUrl": "http://localhost:5001",
  "agentToken": "eyJ..."  ← Must have token!
}
```

### If you see: "Connection refused"

**Backend not running!**

**Solution:**
```bash
# Terminal 1 - Start backend
cd backend
node server.js

# Terminal 2 - Start agent
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
```

### If you see: "401 Unauthorized"

**Token is invalid or expired.**

**Solution:** Re-register in the employee portal:
1. Click "Download Agent"
2. Click "I Have Installed It"
3. Copy the new token shown
4. Run:
   ```bash
   python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" register NEW_TOKEN_HERE
   ```
5. Then start it:
   ```bash
   python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
   ```

---

## 🎯 Why You Have 3 Registered Agents

Based on the logs, you clicked "I Have Installed It" **3 times**:

1. **17:12:00** - First registration → `sys-1760614920676-fam4ab4xs`
2. **18:07:46** - Second registration → `sys-1760618266484-hhlyl3ak9`
3. **18:17:38** - Third registration → `sys-1760618858733-3x0gc5dbs`

Each time creates a NEW system ID. Only the **LATEST** one has a valid token configured in your agent.

**This is fine!** Just start the agent and it will use the latest registration automatically.

---

## ⚡ TL;DR - Just Do This

```bash
# Open Command Prompt as Admin

# Start the agent
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"

# Wait 20 seconds

# Refresh dashboard (F5)

# Done! ✅
```

**The agent needs to be RUNNING to send data!**

---

## 📝 Next Steps After This Works

Once your system appears in the table:

### Make Agent Start Automatically on Boot

The batch installer already created a scheduled task, but to activate it:

```bash
# Verify scheduled task exists
schtasks /query /tn "ITNetworkMonitor"

# Test the scheduled task
schtasks /run /tn "ITNetworkMonitor"
```

### Run Agent as Windows Service (Advanced)

For production, run as a service so it restarts automatically:

1. Install NSSM (Non-Sucking Service Manager)
2. Create service:
   ```bash
   nssm install ITNetworkMonitor python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py"
   nssm start ITNetworkMonitor
   ```

### View Real-Time Logs

```bash
# Watch agent logs
type %USERPROFILE%\.it_monitor\agent.log
```

### Check Agent Status

```bash
python "C:\Program Files\ITNetworkMonitor\network_monitor_agent.py" status
```

---

**START THE AGENT NOW TO FIX THE TABLE!** ⚡

