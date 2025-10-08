# Test Monitoring System - Step by Step

## IMMEDIATE ACTION: Make Dialog Appear

### Option 1: Clear Session Storage (Fastest)

**In your browser (while logged in):**

1. Press `F12` to open Developer Tools
2. Click on **Console** tab
3. Copy and paste this command:
   ```javascript
   sessionStorage.removeItem('agentSetupShown'); window.location.href = '/dashboard';
   ```
4. Press Enter

The dialog should appear now! ✨

### Option 2: Use Browser DevTools Application Tab

1. Press `F12`
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Session Storage** on the left
4. Click on `http://localhost:5173`
5. Find the key `agentSetupShown` and **delete it**
6. Navigate to `/dashboard` or refresh

### Option 3: Logout and Login Again

```javascript
// In console, run:
sessionStorage.clear();
localStorage.clear();
```
Then logout and login again.

---

## Verify System is Working - 5 Minute Test

### Test 1: Backend is Running ✓

Open your browser and visit:
```
http://localhost:5001/api/monitoring/stats
```

**Expected Result**: You should see JSON like:
```json
{
  "success": true,
  "stats": {
    "totalHosts": 0,
    "onlineHosts": 0,
    "offlineHosts": 0,
    ...
  }
}
```

❌ **If you get "Cannot connect"**: Backend is not running. Start it:
```bash
cd backend
npm run dev
```

### Test 2: Frontend is Running ✓

Visit:
```
http://localhost:5173
```

**Expected**: You should see the IT Management login page.

❌ **If not loading**: Start frontend:
```bash
cd frontend
npm run dev
```

### Test 3: Can Login ✓

1. Login with your credentials
2. You should be redirected to `/dashboard`
3. Check browser console (F12) - should see no red errors

### Test 4: Agent Dialog Appears ✓

After logging in and going to dashboard:

1. Open console (F12)
2. Run:
   ```javascript
   sessionStorage.removeItem('agentSetupShown')
   window.location.reload()
   ```
3. **Dialog should appear** with title "System Monitoring Agent Setup"

### Test 5: Dialog Functionality ✓

When dialog appears:

1. **Check OS Detection**: Should show "Detected System: Windows" (or Mac/Linux)
2. **Check Token**: Should show "Registration Token: abc123..."
3. **Download Button**: Should be enabled (not greyed out)
4. **Click Download**: File should download

### Test 6: Backend Token Generation ✓

In your **backend terminal**, after clicking download, you should see:
```
✅ Generated agent token for user yourname@email.com: abc123...
```

❌ **If you don't see this**: Check `.env` has `MONITORING_API_KEY` set

### Test 7: Download Works ✓

After clicking "Download Agent":

1. A file should download to your Downloads folder
2. Filename should be:
   - Windows: `monitoring_agent_installer.ps1`
   - Linux: `monitoring_agent_installer.sh`
   - macOS: `monitoring_agent_installer_macos.sh`

❌ **If download fails**: Check these files exist:
```bash
ls backend/agent-binaries/
# Should see:
# monitoring_agent.py
# monitoring_agent_installer.sh
# monitoring_agent_installer_macos.sh
# monitoring_agent_installer.ps1
```

### Test 8: Simulate Agents (Without Installing) ✓

You can test the whole system without installing agents:

**Terminal 3:**
```bash
cd backend
node scripts/testAgentSimulator.js
```

**Expected Output:**
```
========================================
Monitoring Agent Simulator
========================================
Backend URL: http://localhost:5001/api/monitoring
Number of Agents: 3
...
✓ [test-host-1] Telemetry sent successfully. Alerts: 0
✓ [test-host-2] Telemetry sent successfully. Alerts: 0
✓ [test-host-3] Telemetry sent successfully. Alerts: 0
```

### Test 9: View Monitored Hosts ✓

1. In the web portal, click **Monitoring** in the sidebar
2. You should see the 3 test hosts:
   - test-host-1
   - test-host-2
   - test-host-3
3. All should show status "online"

### Test 10: View Host Details ✓

1. Click on any test host
2. You should see:
   - System metrics (CPU, RAM, Disk)
   - Process list
   - Network activity
   - File events
   - Alerts

---

## Complete Test Script

Run this in your browser console to check everything:

```javascript
// Monitoring System Health Check
console.clear();
console.log('🔍 IT Monitoring System Health Check\n');

// Check 1: User logged in
const user = sessionStorage.getItem('user');
console.log('1. User logged in:', user ? '✅ YES' : '❌ NO');
if (user) console.log('   User:', JSON.parse(user).name);

// Check 2: Current route
console.log('2. Current route:', window.location.pathname);
console.log('   On dashboard:', window.location.pathname === '/dashboard' ? '✅ YES' : '❌ NO');

// Check 3: AgentSetup flag
const shown = sessionStorage.getItem('agentSetupShown');
console.log('3. Dialog shown before:', shown ? '✅ YES (won\'t show again)' : '❌ NO (will show)');

// Check 4: Backend reachable
fetch('http://localhost:5001/api/monitoring/stats')
  .then(r => r.json())
  .then(d => console.log('4. Backend status: ✅ ONLINE\n   Stats:', d))
  .catch(e => console.log('4. Backend status: ❌ OFFLINE\n   Error:', e.message));

// Check 5: AgentSetup component loaded
setTimeout(() => {
  console.log('\n5. To show dialog, run:\n   sessionStorage.removeItem("agentSetupShown"); location.reload()');
}, 100);
```

---

## Troubleshooting

### Problem: "Nothing happens when I click Download"

**Check browser console for errors:**
```javascript
// Look for error messages in console
// Common issues:
// - OS detection failed (shows "unknown")
// - Token generation failed (401 error)
// - Download URL malformed
```

**Debug the download:**
```javascript
// Check what's being generated
console.log('OS detected:', navigator.platform);
console.log('User agent:', navigator.userAgent);
```

### Problem: "Download returns 404"

**Check files exist:**
```bash
# In terminal
ls -la backend/agent-binaries/
# Should show installer files
```

**If files missing:**
```bash
# Copy agent files
cp agent/monitoring_agent.py backend/agent-binaries/
cp agent/requirements.txt backend/agent-binaries/
```

### Problem: "Token generation fails"

**Check backend console for errors:**
- Look for "Error generating agent token"
- Check `.env` has `LOCAL_JWT_SECRET`

**Test token generation manually:**
```javascript
// In browser console (must be logged in)
fetch('http://localhost:5001/api/auth/agent-token', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hostname: 'test-host', os: 'windows' })
})
  .then(r => r.json())
  .then(d => console.log('Token response:', d))
  .catch(e => console.error('Token error:', e));
```

### Problem: "Dialog never appears"

**Force reset:**
```javascript
// Clear everything and try again
sessionStorage.clear();
localStorage.clear();
location.href = '/login';
```

Then login again and navigate to dashboard.

### Problem: "Simulator doesn't work"

**Check API key:**
```bash
# In backend/.env, ensure you have:
MONITORING_API_KEY=your-key-here
```

**Run with debug:**
```bash
cd backend
MONITORING_API_KEY=your-key-here node scripts/testAgentSimulator.js
```

---

## Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login successfully
- [ ] Navigate to `/dashboard`
- [ ] Clear sessionStorage
- [ ] Refresh page
- [ ] AgentSetup dialog appears
- [ ] OS is detected correctly
- [ ] Token is generated (check backend console)
- [ ] Download button is enabled
- [ ] Click download - file downloads
- [ ] Run simulator script
- [ ] Visit `/monitoring` page
- [ ] See simulated hosts
- [ ] Click on a host
- [ ] See telemetry data
- [ ] See alerts generated
- [ ] Can acknowledge alerts
- [ ] Can resolve alerts

---

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Run agent simulator
cd backend && node scripts/testAgentSimulator.js

# Check files exist
ls backend/agent-binaries/

# Copy agent files if missing
cp agent/monitoring_agent.py backend/agent-binaries/
cp agent/requirements.txt backend/agent-binaries/
```

```javascript
// Browser console commands

// Show dialog
sessionStorage.removeItem('agentSetupShown'); location.reload();

// Check login status
console.log(JSON.parse(sessionStorage.getItem('user')));

// Test backend
fetch('http://localhost:5001/api/monitoring/stats').then(r=>r.json()).then(console.log);

// Health check (paste the script above)
```

---

## Success Criteria

✅ **System is working if:**
1. Dialog appears when you clear sessionStorage
2. OS is detected (not "unknown")
3. Download button is enabled
4. Clicking download saves a file
5. Simulator creates virtual hosts
6. Hosts appear in `/monitoring` page
7. Clicking a host shows telemetry
8. Alerts are generated and visible

🎉 **If all above work - your system is fully operational!**




