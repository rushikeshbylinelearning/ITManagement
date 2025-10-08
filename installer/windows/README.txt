IT MANAGEMENT MONITORING AGENT
================================

Thank you for installing the IT Management Monitoring Agent!

WHAT IS THIS SOFTWARE?
----------------------
This monitoring agent helps IT staff manage and secure company systems by collecting system performance metrics and security-related information. The agent runs as a Windows service and automatically sends telemetry data to the IT Management backend server.

WHAT DOES IT MONITOR?
----------------------
The agent collects:
- System performance (CPU, RAM, Disk usage)
- Running processes and resource consumption
- Network activity and bandwidth usage
- File system events (file operations metadata)

WHAT IT DOES NOT COLLECT:
- File contents or personal documents
- Keystrokes or screenshots  
- Passwords or credentials
- Web browsing content

All data is transmitted securely via HTTPS encryption.

INSTALLATION LOCATION
---------------------
Program Files: C:\Program Files\ITMonitoringAgent
Configuration: C:\Program Files\ITMonitoringAgent\config.json
Logs: C:\Program Files\ITMonitoringAgent\logs
Cache: C:\Program Files\ITMonitoringAgent\cache

SERVICE INFORMATION
-------------------
Service Name: ITMonitoringAgent
Display Name: IT Management Monitoring Agent
Startup Type: Automatic
Runs as: Local System

The service starts automatically when Windows starts and runs in the background.

MANAGING THE SERVICE
--------------------
To manage the service:
1. Press Win+R, type "services.msc", press Enter
2. Find "IT Management Monitoring Agent" in the list
3. Right-click and select Start, Stop, or Restart

To view logs:
1. Open File Explorer
2. Navigate to C:\Program Files\ITMonitoringAgent\logs
3. Open the latest log file

CHECKING AGENT STATUS
---------------------
After installation:
1. Open your web browser
2. Navigate to the IT Management Portal
3. Login with your credentials
4. Go to the "Monitoring" section
5. Your computer should appear in the list of monitored hosts

CONFIGURATION
-------------
The agent configuration is stored in:
C:\Program Files\ITMonitoringAgent\config.json

Key settings:
- backend_url: Where to send telemetry data
- polling_interval: How often to collect data (default: 60 seconds)
- monitored_directories: Directories to watch for file events
- log_level: Logging detail (INFO, DEBUG, WARNING, ERROR)

TROUBLESHOOTING
---------------
If the agent is not working:

1. Check if the service is running:
   - Open Services (services.msc)
   - Find "IT Management Monitoring Agent"
   - Status should be "Running"

2. Check the logs:
   - Navigate to C:\Program Files\ITMonitoringAgent\logs
   - Open the latest log file
   - Look for error messages

3. Verify network connectivity:
   - Ensure the computer can reach the backend server
   - Check firewall settings (should allow outbound HTTPS)

4. Restart the service:
   - Open Services (services.msc)
   - Right-click "IT Management Monitoring Agent"
   - Click "Restart"

UNINSTALLING
------------
To uninstall the agent:
1. Go to Control Panel > Programs and Features
2. Find "IT Management Monitoring Agent"
3. Click "Uninstall"
4. Follow the prompts

Or use the Start Menu:
1. Start Menu > IT Management Monitoring Agent > Uninstall

SYSTEM REQUIREMENTS
-------------------
- Windows 10 or Windows 11 (64-bit)
- Python 3.7 or higher (installed automatically if needed)
- At least 100 MB of free disk space
- Internet connection to communicate with backend server

PRIVACY & COMPLIANCE
--------------------
This monitoring software is deployed in accordance with company IT policies and applicable privacy laws. All employees have been notified of system monitoring.

Data collected is used solely for:
- IT system management
- Security monitoring
- Performance optimization
- Compliance and auditing

For privacy questions or concerns, contact:
IT Support: support@company.com

SUPPORT
-------
For technical support:
- Email: support@company.com
- Portal: https://itmanagement.company.com
- Internal IT Help Desk: Extension 5555

For questions about what is being monitored:
- Review the End User License Agreement (EULA)
- Contact your IT department
- Visit the IT Management Portal for details

VERSION INFORMATION
-------------------
Agent Version: 1.0.0
Python Requirements: 3.7+
Platform: Windows 10/11 (64-bit)

Copyright © 2024 [Your Company Name]
All rights reserved.




