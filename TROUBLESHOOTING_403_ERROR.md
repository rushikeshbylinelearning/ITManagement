# 🔧 Troubleshooting 403 Forbidden Error

## 🐛 Errors You're Seeing

### Admin Side (403 Forbidden):
```
GET http://localhost:5001/api/network-monitoring/stats 403 (Forbidden)
GET http://localhost:5001/api/network-monitoring/usage 403 (Forbidden)
GET http://localhost:5001/api/network-monitoring/agents 403 (Forbidden)
```

### Employee Side (404 Not Found):
```
Cannot GET /downloads/ITNetworkMonitor-Setup.exe
```

## ✅ Fixes Applied

### 1. Added Debug Logging
- Enhanced authorization middleware with detailed logging
- Added logging to all network monitoring endpoints
- Created test endpoint to verify user role

### 2. Fixed Download Issue
- Created placeholder installer file at `backend/downloads/ITNetworkMonitor-Setup.exe`
- Confirmed static route is configured

### 3. Enhanced Error Messages
- Authorization now shows which role is required
- Better error messages for debugging

## 🚀 Steps to Fix

### Step 1: Restart Backend Server ⚠️

**CRITICAL**: You must restart your backend server:

```bash
# In your backend terminal:
# 1. Press Ctrl+C to stop
# 2. Restart:
cd backend
node server.js
```

### Step 2: Test Your User Role

Open your browser console and run this:

```javascript
fetch('http://localhost:5001/api/network-monitoring/test-auth', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('My Role:', data))
```

**Expected Output:**
```javascript
{
  success: true,
  message: 'Authentication successful',
  user: {
    id: '...',
    email: 'your@email.com',
    role: 'admin',  // ← This should be 'admin'
    name: 'Your Name'
  }
}
```

### Step 3: Verify in Backend Console

After restarting and trying to access the network monitoring page, check your **backend console** for these logs:

```
🔒 Authorization Check: {
  requiredRoles: [ 'admin' ],
  userRole: 'admin',    // ← Should show 'admin'
  userEmail: 'your@email.com',
  userId: '...'
}
✅ Authorization successful for your@email.com
```

If you see:
```
❌ Authorization failed: {
  userRole: 'user',     // ← Wrong role!
  requiredRoles: [ 'admin' ]
}
```

Then your user is **NOT an admin**.

## 🎯 Root Cause Analysis

### Why 403 Forbidden?

The 403 error means one of these:

1. **You're not logged in as admin**
   - Your user role is 'user', 'employee', or 'intern' instead of 'admin'
   - Solution: Login with an admin account

2. **Your session expired**
   - The cookie expired or was cleared
   - Solution: Logout and login again

3. **You're logged into the wrong portal**
   - Logged into employee portal instead of admin portal
   - Solution: Logout, go to `/login`, select "Admin Login"

4. **Your user role in database is not 'admin'**
   - Your MongoDB user document has role: 'user' or something else
   - Solution: Update your user in database

## 🔍 How to Check Your User Role in Database

### Option 1: Using MongoDB Compass or Shell

```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: 'your@email.com' })

// Check the 'role' field - it should be 'admin'
```

### Option 2: Update Your Role to Admin

If your user is not admin, update it:

```javascript
// In MongoDB shell
db.users.updateOne(
  { email: 'your@email.com' },
  { $set: { role: 'admin' } }
)

// Verify
db.users.findOne({ email: 'your@email.com' }, { email: 1, role: 1 })
```

## 🔧 Complete Fix Checklist

- [ ] **Backend restarted** after code changes
- [ ] **Logged in with correct admin account**
- [ ] **User role in database is 'admin'**
- [ ] **Logged in through Admin Login portal** (not Employee Login)
- [ ] **Browser cache cleared** (Ctrl+F5)
- [ ] **Cookies are enabled** and not blocked
- [ ] **Check backend console** for authorization logs

## 🧪 Testing Procedure

### Test 1: Verify Authentication

1. Open browser console
2. Run the test-auth fetch (shown above)
3. Confirm role is 'admin'

### Test 2: Verify Backend Logs

1. Watch backend console
2. Try to access network monitoring page
3. Look for authorization logs
4. Should see ✅ not ❌

### Test 3: Verify Download

1. Login as employee
2. Click "Download Agent" button
3. Should download a file (even if placeholder)
4. Check: `http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe`

## 🚨 Common Issues & Solutions

### Issue 1: "My role shows 'user' not 'admin'"

**Solution:**

```javascript
// In MongoDB
db.users.updateOne(
  { email: 'YOUR_EMAIL_HERE' },
  { $set: { role: 'admin' } }
)
```

Then **logout and login again**.

### Issue 2: "Backend logs show no user"

**Solution:**
- Cookie not being sent
- Clear cookies and login again
- Check CORS settings
- Verify `withCredentials: true` in frontend

### Issue 3: "Download still shows 404"

**Solution:**
- Verify file exists: `backend/downloads/ITNetworkMonitor-Setup.exe`
- Check backend route: `app.use('/downloads', express.static('downloads'));`
- Restart backend server
- Try direct URL: `http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe`

### Issue 4: "Still 403 after everything"

**Solution:**
1. Completely logout
2. Clear all browser data (Ctrl+Shift+Delete)
3. Close and reopen browser
4. Login again with admin credentials
5. Select "Admin Login" (not Employee Login)

## 📊 What the Backend Logs Should Show

### Successful Request:
```
🔒 Authorization Check: {
  requiredRoles: [ 'admin' ],
  userRole: 'admin',
  userEmail: 'admin@example.com',
  userId: '507f1f77bcf86cd799439011'
}
✅ Authorization successful for admin@example.com
📊 Network Monitoring - Stats request from user: admin@example.com Role: admin
```

### Failed Request:
```
🔒 Authorization Check: {
  requiredRoles: [ 'admin' ],
  userRole: 'user',              // ← Wrong role!
  userEmail: 'employee@example.com',
  userId: '507f1f77bcf86cd799439011'
}
❌ Authorization failed: {
  userRole: 'user',
  requiredRoles: [ 'admin' ]
}
```

## 🎯 Quick Fix (Most Likely Solution)

**90% of the time, this is the issue:**

Your user account in the database has `role: 'user'` instead of `role: 'admin'`.

**Quick fix:**

1. Open MongoDB Compass or shell
2. Find your user: `db.users.findOne({ email: 'YOUR_EMAIL' })`
3. Update role: `db.users.updateOne({ email: 'YOUR_EMAIL' }, { $set: { role: 'admin' } })`
4. **Logout from the app**
5. **Login again** (select Admin Login)
6. Try network monitoring page again

## 📝 Test Endpoints

### Check Your Role:
```
GET http://localhost:5001/api/network-monitoring/test-auth
```

### Test Admin Access:
```
GET http://localhost:5001/api/network-monitoring/stats
```

### Test Download:
```
GET http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe
```

## 🔐 Valid Roles

According to your User model, valid roles are:
- `admin` ✅ (Has network monitoring access)
- `user` ❌ (No network monitoring access)
- `employee` ❌ (No network monitoring access)
- `intern` ❌ (No network monitoring access)

## 💡 Pro Tip

Add this to your browser bookmarks for quick role checking:

```javascript
javascript:(function(){fetch('http://localhost:5001/api/network-monitoring/test-auth',{credentials:'include'}).then(r=>r.json()).then(data=>alert('Role: '+data.user.role))})()
```

Click this bookmark anytime to see your current role!

---

## ✅ After Fixing

Once everything works, you should see:

### Admin Dashboard:
- ✅ Statistics cards with data
- ✅ Systems table (may be empty if no agents installed)
- ✅ No 403 errors in console
- ✅ Backend logs show successful authorization

### Employee Portal:
- ✅ Download button works
- ✅ File downloads (placeholder for now)
- ✅ Modal opens with installation steps

---

**Need more help?** Check backend console logs and compare with examples above.

