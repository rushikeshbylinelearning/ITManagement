# 🚨 FIX 403 ERRORS - ACTION REQUIRED

## ⚡ Quick Fix (Do This Now)

### Step 1: Restart Backend Server ⚠️

```bash
# In your backend terminal:
# Press Ctrl+C to stop the server
# Then run:
cd backend
node server.js
```

**Why?** The new debugging code needs to load.

---

### Step 2: Check Your User Role

Run this command to see all users:

```bash
cd backend
node scripts/listAllUsers.js
```

This will show something like:

```
📋 Found 3 user(s):

ID                        Name                      Email                          Role            Employee ID
------------------------------------------------------------------------------------------------------------------------
507f1f77bcf86cd799439011  John Admin               admin@example.com              👑 admin         EMP001
507f1f77bcf86cd799439012  Jane Employee            jane@example.com               👤 user          EMP002
507f1f77bcf86cd799439013  Bob Intern               bob@example.com                👤 intern        EMP003
```

**Find YOUR email** in the list and check the "Role" column.

---

### Step 3: Fix Your Role (If Not Admin)

If your role shows `👤 user`, `👤 employee`, or `👤 intern`, run this:

```bash
node scripts/fixAdminRole.js YOUR_EMAIL@example.com
```

Example:
```bash
node scripts/fixAdminRole.js admin@example.com
```

You'll see:
```
✅ Connected to MongoDB

📋 Current User Details:
  Name: John Smith
  Email: admin@example.com
  Current Role: user
  Employee ID: EMP001

🔧 Updating role to admin...
✅ Role updated to admin successfully!

📋 Updated User Details:
  Name: John Smith
  Email: admin@example.com
  Role: admin

✅ Done! Please logout and login again to apply changes.
```

---

### Step 4: Logout and Login Again

1. **In your browser**: Click Logout button
2. Go to `/login`
3. **Select "Admin Login"** (very important!)
4. Enter your credentials
5. Login

---

### Step 5: Try Network Monitoring Again

1. Click "Network Monitoring" in the sidebar
2. Check browser console - should be **no 403 errors**
3. Check backend console - should see:
   ```
   🔒 Authorization Check: { requiredRoles: ['admin'], userRole: 'admin', ... }
   ✅ Authorization successful for admin@example.com
   ```

---

## 🎯 For Download Issue (Employee Side)

The download should now work because I created a placeholder file.

**Test it:**
1. Login as **employee** (not admin)
2. See the purple "Network Monitoring Agent" banner
3. Click "Download Agent"
4. File should download

**Note:** The downloaded file is just a placeholder. To create the real installer:
```bash
cd backend/agent
pip install pyinstaller
pyinstaller --onefile --name="ITNetworkMonitor-Setup" install_agent.py
copy dist\ITNetworkMonitor-Setup.exe ..\downloads\
```

---

## 🔍 Troubleshooting

### Still getting 403?

Check backend console. You should see logs like:

**Good:**
```
🔒 Authorization Check: {
  requiredRoles: [ 'admin' ],
  userRole: 'admin',          ← Good!
  userEmail: 'admin@example.com'
}
✅ Authorization successful
```

**Bad:**
```
🔒 Authorization Check: {
  requiredRoles: [ 'admin' ],
  userRole: 'user',           ← Problem!
  userEmail: 'admin@example.com'
}
❌ Authorization failed
```

If you see "Bad" logs:
1. Your role wasn't updated correctly
2. You didn't logout and login again
3. You selected "Employee Login" instead of "Admin Login"

### Download still 404?

Try direct URL in browser:
```
http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe
```

If this works but button doesn't:
1. Hard refresh: Ctrl+F5
2. Clear browser cache
3. Try incognito mode

---

## 📋 Checklist

- [ ] Backend server restarted
- [ ] Ran `listAllUsers.js` to check role
- [ ] Ran `fixAdminRole.js` if needed
- [ ] Logged out completely
- [ ] Logged in with **Admin Login**
- [ ] Tested network monitoring page
- [ ] No 403 errors in console
- [ ] Backend shows ✅ authorization successful

---

## 🎬 What Changed

I added:
1. ✅ **Debug logging** to authorization middleware
2. ✅ **Test endpoint** to verify role: `/api/network-monitoring/test-auth`
3. ✅ **Placeholder installer file** for downloads
4. ✅ **Helper scripts** to check and fix user roles
5. ✅ **Better error messages** showing which role is required

---

## 🆘 Still Stuck?

Run this in browser console while on the admin page:

```javascript
fetch('http://localhost:5001/api/network-monitoring/test-auth', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('=== YOUR ROLE ===');
  console.log('Email:', data.user.email);
  console.log('Role:', data.user.role);
  console.log('Expected: admin');
  console.log('Match:', data.user.role === 'admin' ? '✅ YES' : '❌ NO');
})
```

Send me the output!

---

## ⚡ TL;DR

```bash
# 1. Restart backend
cd backend
node server.js

# 2. Check your role (in a new terminal)
node scripts/listAllUsers.js

# 3. Fix your role if needed
node scripts/fixAdminRole.js YOUR_EMAIL

# 4. Logout, login again as ADMIN
# 5. Try network monitoring page
```

**That's it!** The 403 errors should be gone. 🎉

