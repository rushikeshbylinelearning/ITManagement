"""
Windows Service Installer for Activity Monitor Agent
"""

import sys
import os
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import logging


class ActivityMonitorService(win32serviceutil.ServiceFramework):
    """Windows Service wrapper for Activity Monitor Agent"""
    
    _svc_name_ = "ActivityMonitorAgent"
    _svc_display_name_ = "IT Activity Monitor Agent"
    _svc_description_ = "Monitors user activity and reports to IT Management system"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.running = True
        socket.setdefaulttimeout(60)
        
        # Setup logging
        log_path = os.path.join(os.path.dirname(__file__), 'service.log')
        logging.basicConfig(
            filename=log_path,
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def SvcStop(self):
        """Stop the service"""
        self.logger.info('Service stop requested')
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.stop_event)
        self.running = False
    
    def SvcDoRun(self):
        """Run the service"""
        self.logger.info('Service starting')
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()
    
    def main(self):
        """Main service loop"""
        try:
            # Import and run the agent
            from activity_monitor_agent import ActivityMonitorAgent
            
            agent = ActivityMonitorAgent()
            
            # Run agent in a way that can be stopped
            import threading
            agent_thread = threading.Thread(target=agent.run)
            agent_thread.daemon = True
            agent_thread.start()
            
            # Wait for stop event
            while self.running:
                # Check every second if we should stop
                rc = win32event.WaitForSingleObject(self.stop_event, 1000)
                if rc == win32event.WAIT_OBJECT_0:
                    # Stop requested
                    agent.stop()
                    break
            
            self.logger.info('Service stopped')
            
        except Exception as e:
            self.logger.error(f'Service error: {e}')
            servicemanager.LogErrorMsg(f'Service error: {e}')


if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(ActivityMonitorService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(ActivityMonitorService)

