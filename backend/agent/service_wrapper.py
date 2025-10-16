"""
Windows Service Wrapper for IT Network Monitor Agent
This is an alternative to scheduled tasks for running as a proper Windows service
"""

import sys
import os
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket

# Add the installation directory to path
INSTALL_DIR = os.path.join(os.environ['ProgramFiles'], 'ITNetworkMonitor')
sys.path.insert(0, INSTALL_DIR)

from network_monitor_agent import NetworkMonitorAgent

class ITNetworkMonitorService(win32serviceutil.ServiceFramework):
    _svc_name_ = "ITNetworkMonitor"
    _svc_display_name_ = "IT Network Monitor Agent"
    _svc_description_ = "Monitors network traffic and reports to IT Management System"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.agent = None
        socket.setdefaulttimeout(60)
    
    def SvcStop(self):
        """Called when the service is being stopped"""
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.stop_event)
        if self.agent:
            self.agent.stop()
    
    def SvcDoRun(self):
        """Called when the service is starting"""
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()
    
    def main(self):
        """Main service loop"""
        try:
            self.agent = NetworkMonitorAgent()
            self.agent.run()
        except Exception as e:
            servicemanager.LogErrorMsg(f"Service error: {e}")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(ITNetworkMonitorService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(ITNetworkMonitorService)

