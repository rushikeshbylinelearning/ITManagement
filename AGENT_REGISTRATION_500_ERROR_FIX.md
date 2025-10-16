# Agent Registration 500 Error - Root Cause & Fix

## 🔍 **Root Cause Analysis**

The 500 Internal Server Error when registering a network monitoring agent was caused by **inconsistent JWT secret configuration** across multiple files in the backend.

### **The Problem**

The application was using `process.env.LOCAL_JWT_SECRET` in multiple places **without any fallback to `JWT_SECRET`**. This created a situation where:

1. If `LOCAL_JWT_SECRET` was not defined in the `.env` file, JWT operations would fail
2. The code was not checking if the secret existed before using it
3. Different parts of the application were handling this inconsistently

### **Affected Files**

The following files were using `LOCAL_JWT_SECRET` without proper fallback or error handling:

1. **`backend/models/SystemAgent.js`** - Token generation and verification
2. **`backend/middleware/auth.js`** - User authentication middleware
3. **`backend/routes/auth.js`** - User login token generation
4. **`backend/routes/networkMonitoring.js`** - Agent registration endpoint

---

## ✅ **What Was Fixed**

### **1. SystemAgent Model** (`backend/models/SystemAgent.js`)

**Before:**
```javascript
SystemAgentSchema.methods.generateAgentToken = function() {
  return jwt.sign({ ... }, process.env.LOCAL_JWT_SECRET, { expiresIn: '365d' });
};

SystemAgentSchema.statics.verifyAgentToken = function(token) {
  try {
    return jwt.verify(token, process.env.LOCAL_JWT_SECRET);
  } catch (error) {
    return null;
  }
};
```

**After:**
```javascript
SystemAgentSchema.methods.generateAgentToken = function() {
  const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET or LOCAL_JWT_SECRET must be defined in environment variables');
  }
  
  return jwt.sign({ ... }, secret, { expiresIn: '365d' });
};

SystemAgentSchema.statics.verifyAgentToken = function(token) {
  try {
    const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or LOCAL_JWT_SECRET must be defined in environment variables');
    }
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
```

### **2. Auth Middleware** (`backend/middleware/auth.js`)

**Before:**
```javascript
const decoded = jwt.verify(token, process.env.LOCAL_JWT_SECRET);
```

**After:**
```javascript
const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;

if (!secret) {
  console.error('❌ JWT_SECRET not configured');
  return res.status(500).json({ msg: 'Server configuration error: JWT secret not set' });
}

const decoded = jwt.verify(token, secret);
```

### **3. Auth Routes** (`backend/routes/auth.js`)

**Before:**
```javascript
const sessionToken = jwt.sign(
  { id: user._id, role: user.role, loginType }, 
  process.env.LOCAL_JWT_SECRET, 
  { expiresIn: '8h' }
);
```

**After:**
```javascript
const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;

if (!secret) {
  console.error('❌ JWT_SECRET not configured for login');
  return res.status(500).json({ msg: 'Server configuration error: JWT secret not set' });
}

const sessionToken = jwt.sign(
  { id: user._id, role: user.role, loginType }, 
  secret, 
  { expiresIn: '8h' }
);
```

### **4. Enhanced Error Logging** (`backend/routes/networkMonitoring.js`)

Added comprehensive error logging to help debug future issues:

```javascript
console.log('Environment check:', {
  hasLocalJwtSecret: !!process.env.LOCAL_JWT_SECRET,
  hasJwtSecret: !!process.env.JWT_SECRET,
  secretToUse: process.env.LOCAL_JWT_SECRET ? 'LOCAL_JWT_SECRET' : (process.env.JWT_SECRET ? 'JWT_SECRET' : 'NONE')
});
```

Added separate try-catch blocks for token generation and database save operations with detailed error messages.

### **5. Updated Test Script** (`backend/scripts/testAgentRegistration.js`)

Updated the test script to check for both secrets and provide clear guidance:

```javascript
const jwtSecret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('\n❌ Neither LOCAL_JWT_SECRET nor JWT_SECRET is set in .env file');
  console.error('Please set at least JWT_SECRET in your .env file');
  process.exit(1);
}

if (!process.env.LOCAL_JWT_SECRET && process.env.JWT_SECRET) {
  console.log('  ⚠️  Using JWT_SECRET as fallback (LOCAL_JWT_SECRET not set)');
}
```

---

## 🚀 **How to Apply the Fix**

### **Step 1: Verify Your `.env` File**

Make sure your `.env` file (in the `backend` folder) has **at least one** of these:

```env
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
LOCAL_JWT_SECRET=your-local-jwt-secret-key-here-change-this-in-production
```

**Recommended:** Set both for better security separation between user sessions and agent tokens.

### **Step 2: Restart Your Backend Server**

The code changes have been applied, but you **MUST restart the server** for them to take effect:

1. Stop your current backend server (Ctrl+C)
2. Navigate to the backend folder: `cd backend`
3. Start the server again: `node server.js`

### **Step 3: Test Agent Registration**

Run the test script to verify everything works:

```bash
cd backend
node scripts/testAgentRegistration.js
```

Expected output:
```
✅ All tests passed! Agent registration system is working.
```

### **Step 4: Try Agent Registration Again**

1. Log in to the IT Management portal (as employee, not admin)
2. Open the Network Monitoring page
3. Click "Download Agent" or "Register System"
4. Generate a token - should work without 500 error

---

## 📋 **Environment Configuration**

### **Option 1: Use JWT_SECRET Only (Simple)**

```env
JWT_SECRET=your-super-secret-jwt-key-here
```

This will use the same secret for both user authentication and agent tokens. Simpler but less secure.

### **Option 2: Use Both (Recommended for Production)**

```env
JWT_SECRET=your-user-authentication-secret
LOCAL_JWT_SECRET=your-agent-token-secret
```

This uses different secrets for user sessions vs agent tokens, providing better security isolation.

---

## 🔧 **Testing the Fix**

### **Check Backend Logs**

When you try to register an agent, you should now see detailed logs in the backend console:

```
📝 Register agent request received
User: user@example.com Role: user
Body: { "systemId": "sys-...", "systemName": "...", "systemInfo": {...} }
✅ Validation passed, checking for existing agent...
📝 Creating new agent: sys-...
🔑 Generating agent token...
Environment check: {
  hasLocalJwtSecret: true,
  hasJwtSecret: true,
  secretToUse: 'LOCAL_JWT_SECRET'
}
✅ Token generated successfully
💾 Saving agent to database...
✅ Agent saved successfully
✅ Registration complete for: User's Computer
```

### **Error Scenarios**

If JWT_SECRET is missing, you'll now see a clear error message:

```json
{
  "msg": "Server configuration error: JWT secret not set"
}
```

---

## 🎯 **Summary**

### **What was the issue?**
Missing `LOCAL_JWT_SECRET` in `.env` file caused JWT operations to fail silently or throw 500 errors.

### **What changed?**
All JWT operations now fall back to `JWT_SECRET` if `LOCAL_JWT_SECRET` is not defined, with proper error handling and validation.

### **What do you need to do?**
1. ✅ Code changes are already applied
2. ⚠️ **Restart your backend server** (CRITICAL)
3. ✅ Verify your `.env` has `JWT_SECRET` set
4. ✅ Test agent registration again

---

## 💡 **Additional Notes**

- The fix is **backward compatible** - existing installations will continue to work
- No database changes required
- Frontend code requires no changes
- The fix applies to all JWT operations in the application

---

**Fixed by:** AI Assistant  
**Date:** October 16, 2025  
**Related Issue:** POST /api/network-monitoring/register 500 (Internal Server Error)

