# ⚡ QUICK FIX: Agent Registration 500 Error

## 🎯 **Do These 3 Steps RIGHT NOW:**

### ✅ **Step 1: Check Your .env File**

Open `backend/.env` and make sure you have this line:

```env
JWT_SECRET=your-super-secret-jwt-key-here
```

**Don't have a `.env` file?**
- Copy `backend/env.template` to `backend/.env`
- Edit it and set a JWT_SECRET value (any random string will work for testing)

Example:
```env
JWT_SECRET=mySecretKey12345
LOCAL_JWT_SECRET=myLocalSecretKey12345
MONGO_URI=mongodb://localhost:27017/it-management
PORT=5001
NODE_ENV=development
```

### ✅ **Step 2: Restart Backend Server**

**CRITICAL:** You MUST restart the backend server:

1. Press `Ctrl+C` to stop the current server
2. Run: `cd backend`
3. Run: `node server.js`

**OR** if using nodemon:
1. Press `Ctrl+C` to stop
2. Run: `npm run dev` or `nodemon server.js`

### ✅ **Step 3: Try Agent Registration Again**

1. Log in to the portal (as **employee**, not admin)
2. Go to Network Monitoring page
3. Click "Download Agent" or "Generate Token"
4. Should work now ✅

---

## 🔍 **Still Getting Error?**

### Check Backend Console Logs

You should see detailed logs like:
```
📝 Register agent request received
User: user@example.com Role: user
🔑 Generating agent token...
Environment check: { hasJwtSecret: true, ... }
✅ Token generated successfully
✅ Agent saved successfully
```

### If you see: "JWT_SECRET not configured"

Your `.env` file is not being loaded. Make sure:
- File is named exactly `.env` (not `.env.txt`)
- File is in the `backend` folder
- You restarted the server after creating it

### If you see: "Not authorized"

You're not logged in or using admin login:
- Make sure you're logged in as **employee** (not admin)
- Try logging out and back in

---

## 📞 **Need More Help?**

Read the detailed explanation: `AGENT_REGISTRATION_500_ERROR_FIX.md`

Run the test script:
```bash
cd backend
node scripts/testAgentRegistration.js
```

---

**Key Point:** The code fix is already applied. You just need to **restart the server** with a valid JWT_SECRET in your .env file!

