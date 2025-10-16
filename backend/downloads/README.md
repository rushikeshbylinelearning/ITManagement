# Network Monitoring Agent Downloads

This folder contains the network monitoring agent installer that employees can download from the portal.

## Setup Instructions

1. **Build the Agent Installer** (First time only)

   Navigate to the agent directory and build the installer:
   ```bash
   cd backend/agent
   pip install pyinstaller
   pyinstaller --onefile --icon=icon.ico --name="ITNetworkMonitor-Setup" install_agent.py
   ```

2. **Copy the Installer**

   Copy the built installer to this downloads folder:
   ```bash
   copy dist\ITNetworkMonitor-Setup.exe ..\downloads\
   ```

3. **Configure Backend**

   Add this route to `server.js` (already configured):
   ```javascript
   app.use('/downloads', express.static('downloads'));
   ```

4. **Test Download**

   The installer will be available at:
   - Development: `http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe`
   - Production: `https://itmanagement.bylinelms.com/downloads/ITNetworkMonitor-Setup.exe`

## Files in This Folder

- `ITNetworkMonitor-Setup.exe` - The agent installer (build and place here)
- `README.md` - This file

## Security Notes

- This folder is publicly accessible through the `/downloads` route
- Only place the installer executable here
- Do not store sensitive files or configuration in this folder
- The installer itself does not contain any credentials
- Each system generates a unique token during registration

## Updating the Agent

When you update the agent code:

1. Update the version number in `network_monitor_agent.py`
2. Rebuild the installer using the commands above
3. Replace the old `ITNetworkMonitor-Setup.exe` with the new one
4. Employees will need to re-download and re-install

## Alternative Hosting

Instead of hosting from the backend, you can also:

1. Upload to a cloud storage (AWS S3, Azure Blob, etc.)
2. Use a dedicated download server
3. Package as part of an MSI installer
4. Distribute via Group Policy in Active Directory

Update the download URL in `AgentDownloadModal.jsx` accordingly.

