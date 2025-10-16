# ⚡ FIX: MongoDB Duplicate Key Error on macAddress

## 🔍 **The Error**

```
MongoServerError: E11000 duplicate key error collection: it-management-app.systemagents 
index: macAddress_1 dup key: { macAddress: null }
```

## 🎯 **What This Means**

- Your MongoDB database has an **old unique index** on the `macAddress` field
- This index is no longer needed (the current schema doesn't define it)
- MongoDB rejects creating multiple agents with `macAddress: null` because of this index

## ✅ **QUICK FIX (Run This Now):**

### **Step 1: Run the Fix Script**

Open a terminal in the `backend` folder and run:

```bash
node scripts/fixMacAddressIndex.js
```

This will:
- ✅ Drop the problematic `macAddress_1` index
- ✅ Remove any root-level `macAddress` fields from documents
- ✅ Show you all current indexes

### **Step 2: Restart Backend Server**

After running the script:
1. Stop your backend server (Ctrl+C)
2. Start it again: `node server.js`

### **Step 3: Try Agent Registration Again**

Should work now! ✅

---

## 🔧 **Alternative Fix: Manual MongoDB Command**

If the script doesn't work, you can fix it manually using MongoDB shell:

```bash
# Connect to your MongoDB
mongosh

# Switch to your database
use it-management-app

# List indexes
db.systemagents.getIndexes()

# Drop the problematic index
db.systemagents.dropIndex("macAddress_1")

# Verify it's gone
db.systemagents.getIndexes()

# Exit
exit
```

---

## 📋 **What Happened?**

### **Why This Error Occurred:**

1. An older version of your code had a unique index on `macAddress`
2. The schema was updated, but the index remained in MongoDB
3. When creating new agents without `macAddress`, MongoDB stores `null`
4. MongoDB's unique index rejects duplicate `null` values
5. Result: Second agent registration fails with duplicate key error

### **Current Schema:**

The `macAddress` field is now inside `systemInfo` object (not unique):
```javascript
systemInfo: {
  os: String,
  osVersion: String,
  ipAddress: String,
  macAddress: String,  // ← Not unique, nested field
  cpu: String,
  ram: String
}
```

### **The Fix:**

Remove the old unique index that no longer matches the schema.

---

## 🧪 **Verify the Fix**

After running the fix script, you should see:

```
✅ Fix complete! The macAddress duplicate key error is resolved.
```

Then test agent registration:
1. Log in as employee
2. Go to Network Monitoring
3. Click "Generate Token"
4. Should work without errors ✅

---

## 🎯 **Summary**

**Problem:** Old unique index on `macAddress` causing duplicate key errors  
**Solution:** Drop the old index using the fix script  
**Status:** ✅ Fix script ready  
**Action Required:** Run `node scripts/fixMacAddressIndex.js`

---

**Run the fix script now and your agent registration will work!** 🚀

