# IT Management Monitoring Agent - Installation Instructions

## For End Users

### What is This?

The IT Management Monitoring Agent is software that helps IT staff manage and monitor company computers. It collects system performance information to help identify and fix problems.

### What Information Does It Collect?

✅ **Does Collect:**
- How much CPU, memory, and disk space your computer is using
- What programs are running
- Network connection information
- Basic system information

❌ **Does NOT Collect:**
- Your files or documents
- What you type (no keylogging)
- Screenshots of your screen
- Your passwords
- Your personal browsing history

All information is sent securely to IT and is used only for managing company systems.

---

## Installation Steps

### Step 1: Download the Installer

1. Open your web browser
2. Go to the IT Management Portal
3. Login with your company credentials
4. Download the monitoring agent installer

### Step 2: Run the Installer

1. **Find the downloaded file** (usually in your Downloads folder)
   - Filename: `ITMonitoringAgent-Setup-1.0.0.exe`

2. **Right-click** on the installer
   ![Right-click menu](https://via.placeholder.com/400x200?text=Right-click+Installer)

3. **Select "Run as Administrator"**
   - If asked "Do you want to allow this app to make changes?", click **Yes**

### Step 3: Follow the Wizard

The installer will guide you through several screens:

#### Screen 1: Welcome
- Read the introduction
- Click **Next**

#### Screen 2: License Agreement
- Read the license agreement
- Check "I accept the agreement"
- Click **Next**

#### Screen 3: Installation Location
- Default location is recommended: `C:\Program Files\ITMonitoringAgent`
- Click **Next**

#### Screen 4: Installation Progress
- Wait while the installer:
  - Checks your system
  - Installs Python (if needed)
  - Installs the monitoring agent
  - Creates the Windows service
  - Configures everything
- This takes 2-3 minutes

#### Screen 5: Completion
- Installation is complete!
- Leave "Open IT Management Portal" checked
- Click **Finish**

### Step 4: Verify Installation

After clicking Finish:

1. **Your web browser opens** automatically to the IT Management Portal
2. **Login** if you're not already logged in
3. **Click "Monitoring"** in the left sidebar
4. **Look for your computer** in the list of monitored devices
5. Your computer should appear within 2-3 minutes

If you see your computer listed with a green "Online" status, everything is working correctly! ✅

---

## Frequently Asked Questions

### Q: Why do I need to install this?

**A:** This software helps IT keep company computers running smoothly, secure, and up-to-date. It's a standard part of company IT security policy.

### Q: Will this slow down my computer?

**A:** No. The monitoring agent uses very few resources (less than 1% of CPU and less than 50 MB of RAM). You won't notice any performance difference.

### Q: Can I see what information is being collected?

**A:** Yes! Login to the IT Management Portal, go to Monitoring, and click on your computer name to see exactly what information is being collected.

### Q: Does this monitor what websites I visit?

**A:** The agent only collects connection information (like which servers you're connected to), not your full browsing history or the content of websites.

### Q: Will IT know what I'm doing on my computer?

**A:** IT can see what programs are running and how much resources they're using, but they cannot see:
- What you're typing
- Your screen
- File contents
- Personal information

### Q: Can I uninstall this?

**A:** As this is company-required software, it should not be uninstalled. If you have concerns, please contact IT Support.

### Q: What if installation fails?

**A:** Try these steps:
1. Make sure you're running as Administrator
2. Check your internet connection
3. Contact IT Support if the problem continues

### Q: Do I need to restart my computer?

**A:** No, the monitoring agent starts automatically after installation. No restart required!

### Q: Will this work from home?

**A:** Yes, as long as you have an internet connection. The agent works on the company network, from home, or anywhere else.

---

## Checking if It's Working

### Method 1: Check Windows Services

1. Press `Windows Key + R`
2. Type: `services.msc`
3. Press Enter
4. Look for "IT Management Monitoring Agent"
5. Status should say "Running"

![Services window](https://via.placeholder.com/500x300?text=Services+Window)

### Method 2: Check IT Portal

1. Login to IT Management Portal
2. Click "Monitoring" in sidebar
3. Find your computer in the list
4. Status should be "Online" with a green checkmark

### Method 3: Look in Programs

1. Open Settings
2. Click "Apps"
3. Search for "IT Management"
4. You should see "IT Management Monitoring Agent" listed

---

## What Happens After Installation

### Immediately
- Windows service starts
- Agent registers with IT backend
- First telemetry data is sent

### Within 2-3 Minutes
- Your computer appears in IT Portal
- System information starts collecting
- Everything runs in the background

### Ongoing
- Agent collects data every 60 seconds
- Data is sent to IT securely
- Service runs quietly in the background
- Starts automatically when Windows starts

---

## If You Have Problems

### The installer won't run

**Try this:**
1. Right-click the installer
2. Select "Properties"
3. Click "Unblock" at the bottom
4. Click "OK"
5. Try running as Administrator again

### Installation fails with an error

**Contact IT Support with this information:**
- The error message (take a screenshot)
- Your computer name
- Windows version (Settings → System → About)
- When the error occurred

### My computer doesn't appear in the portal

**Wait 2-3 minutes** after installation, then:
1. Refresh the monitoring page
2. Check that the service is running (see "Checking if It's Working" above)
3. If still not showing after 5 minutes, contact IT Support

### I see a Windows Defender warning

This is normal. The software is safe and approved by IT. Click "More info" then "Run anyway".

---

## Uninstalling (Not Recommended)

⚠️ **Note:** This software is required by company IT policy. Please contact IT Support before uninstalling.

If IT Support approves uninstallation:

1. Open "Settings" → "Apps"
2. Find "IT Management Monitoring Agent"
3. Click and select "Uninstall"
4. Follow the prompts
5. Service will be stopped and removed

Or:

1. Press `Windows Key`
2. Find "IT Management Monitoring Agent" folder
3. Click "Uninstall"

---

## Privacy Notice

This monitoring software:
- Complies with company IT policy
- Follows data protection regulations
- Only collects business-necessary information
- Protects your privacy (no keylogging, no screenshots)
- Uses encrypted connections

For privacy questions, contact:
- IT Support: support@company.com
- Privacy Office: privacy@company.com

---

## Getting Help

### IT Support

**Email:** support@company.com  
**Phone:** Extension 5555  
**Portal:** https://itmanagement.company.com

**When contacting support, provide:**
- Your computer name
- The issue you're experiencing
- Any error messages
- When the issue started

### Self-Help Resources

- **IT Portal:** https://itmanagement.company.com
- **Company IT Policies:** [Internal link]
- **FAQ:** [Internal link]

---

## Quick Reference

| Action | How To |
|--------|--------|
| Install | Right-click installer → Run as Administrator |
| Check status | Services.msc → Look for IT Management Monitoring Agent |
| View in portal | IT Portal → Monitoring → Find your computer |
| Get help | Email support@company.com |
| Uninstall | Settings → Apps → Uninstall (requires IT approval) |

---

## Thank You!

Thank you for installing the IT Management Monitoring Agent. This helps IT keep our company's technology running smoothly and securely for everyone.

If you have any questions or concerns, please don't hesitate to contact IT Support.

**Happy computing!**

---

*Last Updated: 2024*  
*Version: 1.0.0*  
*IT Department - [Your Company Name]*




