# 🗑️ How to Delete Registered Systems - Quick Guide

## ⚡ 3 Simple Steps

### Step 1: Go to Network Monitoring Page

1. Login as **Admin**
2. Click **Network Monitoring** in the sidebar
3. Scroll down to **"Registered Systems"** section

---

### Step 2: Find the System to Delete

The table shows all registered agents with:
- System Name (e.g., "byline23")
- System ID (e.g., "sys-abc123...")
- User (who registered it)
- Install Date
- Last Heartbeat
- Status (Active/Inactive)

---

### Step 3: Delete the System

1. Click the **🗑️ Delete** icon button
2. A confirmation dialog appears:
   ```
   ⚠️ Confirm Delete
   
   This action cannot be undone!
   
   System Name: byline23
   System ID: sys-abc123...
   User: Rushikesh
   
   This will delete the agent and ALL data.
   ```

3. Click **"Delete"** to confirm (or "Cancel" to abort)
4. System is deleted immediately
5. Dashboard refreshes automatically

---

## ⚠️ What Gets Deleted?

When you delete a system:

✅ Agent registration
✅ All network monitoring logs
✅ All website usage data
✅ Heartbeat history

**This is PERMANENT and cannot be undone!**

---

## 🔧 Common Scenarios

### Scenario 1: Remove Test Agent

**Problem:** You have multiple test registrations

**Solution:**
1. Go to Registered Systems table
2. Find test agents (look for test names or duplicate IDs)
3. Delete each test agent
4. Keep only production agents

---

### Scenario 2: Replace Old Computer

**Problem:** Employee got new computer, old agent still registered

**Solution:**
1. Delete old computer's agent
2. Employee installs agent on new computer
3. Register new agent
4. Clean data with only active computer

---

### Scenario 3: Duplicate Registrations

**Problem:** Same computer registered 3 times (like in your case!)

**Solution:**
1. Check "Last Heartbeat" column
2. Keep the most recent/active one
3. Delete older duplicate registrations
4. Clean dashboard showing only 1 agent

**Example:**
```
Before:
- byline23 (sys-abc123) - Last heartbeat: 2m ago ← KEEP THIS
- byline23 (sys-def456) - Last heartbeat: 1h ago ← DELETE
- byline23 (sys-ghi789) - Last heartbeat: 2h ago ← DELETE

After:
- byline23 (sys-abc123) - Last heartbeat: 2m ago ✅
```

---

### Scenario 4: Employee Left Company

**Problem:** Ex-employee's computers still monitored

**Solution:**
1. Filter by user email
2. Delete all their registered agents
3. Maintain privacy & clean data

---

## 🎯 Quick Reference

| Action | Location | Button |
|--------|----------|--------|
| View all agents | Network Monitoring → Registered Systems | - |
| Delete agent | Click 🗑️ in Actions column | Red delete icon |
| Confirm delete | In dialog, click "Delete" | Red button |
| Cancel delete | In dialog, click "Cancel" | Gray button |

---

## 💡 Pro Tips

### Tip 1: Check Last Heartbeat First
Before deleting, check "Last Heartbeat" column:
- **"Active Now"** or **"2m ago"** = Agent is running, DON'T delete
- **"2d ago"** or **"Never"** = Agent not running, safe to delete

### Tip 2: Confirm System ID
If deleting duplicates:
1. Note the System ID of the ACTIVE agent
2. Compare with other entries
3. Delete the ones with different IDs

### Tip 3: Export Data First (Optional)
If you need historical data:
1. Use date range filters to view data
2. Export/screenshot important info
3. Then delete agent

### Tip 4: User Notification
Before deleting an active agent:
1. Notify the user
2. Explain why agent is being removed
3. Provide re-installation instructions if needed

---

## 🐛 Troubleshooting

### "Failed to delete agent"

**Possible causes:**
1. Not logged in as admin
2. Backend not running
3. Network connection issue

**Solution:**
1. Verify you're logged in as admin
2. Check backend is running
3. Try again

### Agent reappears after deletion

**Cause:** Agent is still running on user's computer

**Solution:**
1. User must stop the agent:
   ```
   Ctrl+C in agent terminal
   ```
2. Or uninstall agent completely
3. Then you can delete registration

### Can't find agent to delete

**Cause:** Agent might be in different list

**Check:**
1. Scroll to "Registered Systems" section (NOT "System Network Usage")
2. "Registered Systems" shows ALL agents
3. "System Network Usage" shows only agents with data

---

## ✅ Success Indicators

**You'll know deletion worked when:**

1. ✅ Success message appears
2. ✅ Agent disappears from table
3. ✅ Total count decreases (e.g., "3 Total" → "2 Total")
4. ✅ Dashboard refreshes automatically
5. ✅ Agent no longer in "Active Systems" count

---

## 📞 Need Help?

**Can't delete an agent?**
- Check you're logged in as admin
- Verify backend is running
- Check browser console for errors

**Deleted wrong agent?**
- Deletion is permanent
- User must reinstall agent
- Data cannot be recovered

**Multiple duplicates to clean?**
- Delete one at a time
- Confirm each deletion
- Keep most recent/active one

---

## 🎬 Step-by-Step Video Script

1. **Login** as admin
2. **Click** "Network Monitoring" in sidebar
3. **Scroll down** to "Registered Systems"
4. **Find** the agent to delete
5. **Click** 🗑️ delete icon
6. **Review** system details in dialog
7. **Click** "Delete" button (red)
8. **Wait** for confirmation
9. **See** agent removed from list
10. **Done!** ✅

---

## 🚨 Final Warning

**Before clicking "Delete":**

✋ **STOP** - Is this the right system?
✋ **THINK** - Is the agent still needed?
✋ **CONFIRM** - Do you have the data you need?

**After clicking "Delete":**

⚠️ **CANNOT** be undone
⚠️ **ALL DATA** is deleted
⚠️ **USER MUST** reinstall if needed

---

## TL;DR

```
1. Admin → Network Monitoring → Scroll to "Registered Systems"
2. Click 🗑️ next to agent
3. Click "Delete" to confirm
4. Done! ✅
```

**Remember:** Deletion is permanent! ⚠️

