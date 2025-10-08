"""
IT Management Monitoring Agent - Windows Service Wrapper v2.0
Robust Windows service implementation with proper error handling and logging
"""

import sys
import os
import time
import traceback

try:
    import servicemanager
    import win32event
    import win32service
    import win32serviceutil
except ImportError:
    print("ERROR: pywin32 not installed. Run: python -m pip install pywin32")
    sys.exit(1)

# Installation directory
INSTALL_DIR = os.path.dirname(os.path.abspath(__file__))
if INSTALL_DIR not in sys.path:
    sys.path.insert(0, INSTALL_DIR)

class ITMonitoringService(win32serviceutil.ServiceFramework):
    """
    Windows Service for IT Monitoring Agent
    Provides robust service management with proper error handling
    """
    
    _svc_name_ = 'ITMonitoringAgent'
    _svc_display_name_ = 'IT Management Monitoring Agent'
    _svc_description_ = 'Monitors system performance and security for IT management. Collects system metrics, process information, and network activity.'
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.is_running = False
        self.agent = None
        
        # Log startup
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTING,
            (self._svc_name_, '')
        )
    
    def SvcStop(self):
        """Handle service stop request"""
        servicemanager.LogInfoMsg(f'{self._svc_name_}: Stop requested')
        
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_running = False
        
        # Stop agent gracefully
        if self.agent:
            try:
                servicemanager.LogInfoMsg(f'{self._svc_name_}: Stopping agent...')
                self.agent.stop()
                servicemanager.LogInfoMsg(f'{self._svc_name_}: Agent stopped successfully')
            except Exception as e:
                servicemanager.LogErrorMsg(f'{self._svc_name_}: Error stopping agent: {str(e)}')
        
        self.ReportServiceStatus(win32service.SERVICE_STOPPED)
        
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STOPPED,
            (self._svc_name_, '')
        )
    
    def SvcDoRun(self):
        """Main service execution"""
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        
        self.is_running = True
        
        try:
            self.main()
        except Exception as e:
            error_msg = f'Service error: {str(e)}\n{traceback.format_exc()}'
            servicemanager.LogErrorMsg(error_msg)
            
            # Report failure
            self.ReportServiceStatus(win32service.SERVICE_STOPPED)
    
    def main(self):
        """Main service logic"""
        # Change to installation directory
        try:
            os.chdir(INSTALL_DIR)
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Working directory: {INSTALL_DIR}')
        except Exception as e:
            servicemanager.LogErrorMsg(f'{self._svc_name_}: Failed to change directory: {str(e)}')
            return
        
        # Check for configuration file
        config_file = os.path.join(INSTALL_DIR, 'config.json')
        
        if not os.path.exists(config_file):
            servicemanager.LogErrorMsg(f'{self._svc_name_}: Configuration file not found: {config_file}')
            return
        
        # Import and initialize agent
        try:
            from monitoring_agent import MonitoringAgent
            
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Initializing monitoring agent...')
            self.agent = MonitoringAgent(config_file)
            
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Agent initialized successfully')
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Hostname: {self.agent.config.get("hostname", "unknown")}')
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Backend URL: {self.agent.config.get("backend_url", "unknown")}')
            
            # Run agent
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Starting agent monitoring loop...')
            self.agent.run()
            
        except ImportError as e:
            error_msg = f'{self._svc_name_}: Failed to import monitoring_agent: {str(e)}'
            servicemanager.LogErrorMsg(error_msg)
            servicemanager.LogErrorMsg(f'{self._svc_name_}: Ensure monitoring_agent.py is in {INSTALL_DIR}')
            
        except Exception as e:
            error_msg = f'{self._svc_name_}: Agent error: {str(e)}\n{traceback.format_exc()}'
            servicemanager.LogErrorMsg(error_msg)
            
            # Wait before exiting to avoid rapid restart loops
            servicemanager.LogInfoMsg(f'{self._svc_name_}: Waiting 30 seconds before exit...')
            time.sleep(30)

def main():
    """Entry point for service management commands"""
    
    if len(sys.argv) == 1:
        # No arguments - run as service
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(ITMonitoringService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        # Handle command-line arguments
        try:
            win32serviceutil.HandleCommandLine(ITMonitoringService)
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)

if __name__ == '__main__':
    main()
