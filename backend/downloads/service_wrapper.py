"""
Windows Service Wrapper for IT Network Monitor Agent
This creates a proper Windows service that auto-starts on boot
"""

import sys
import os
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import time
import logging
from pathlib import Path

# Add the installation directory to path
INSTALL_DIR = os.path.join(os.environ['ProgramFiles'], 'ITNetworkMonitor')
sys.path.insert(0, INSTALL_DIR)

# Set up logging for the service
LOG_FILE = os.path.join(INSTALL_DIR, 'service.log')
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

try:
    from network_monitor_agent import NetworkMonitorAgent
except ImportError as e:
    logging.error(f"Failed to import NetworkMonitorAgent: {e}")
    # Fallback: try to import from current directory
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    try:
        from network_monitor_agent import NetworkMonitorAgent
    except ImportError:
        logging.error("NetworkMonitorAgent not found in any path")
        NetworkMonitorAgent = None

class ITNetworkMonitorService(win32serviceutil.ServiceFramework):
    _svc_name_ = "ITNetworkMonitor"
    _svc_display_name_ = "IT Network Monitor Agent"
    _svc_description_ = "Monitors network traffic and reports to IT Management System"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.agent = None
        self.is_running = True
        socket.setdefaulttimeout(60)
        logging.info("IT Network Monitor Service initialized")
    
    def SvcStop(self):
        """Called when the service is being stopped"""
        logging.info("Service stop requested")
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        self.is_running = False
        win32event.SetEvent(self.stop_event)
        if self.agent:
            self.agent.stop()
        logging.info("Service stopped")
    
    def SvcDoRun(self):
        """Called when the service is starting"""
        logging.info("Service starting")
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()
    
    def main(self):
        """Main service loop"""
        try:
            if NetworkMonitorAgent is None:
                logging.error("NetworkMonitorAgent not available")
                servicemanager.LogErrorMsg("NetworkMonitorAgent not available")
                return
            
            logging.info("Creating NetworkMonitorAgent instance")
            self.agent = NetworkMonitorAgent()
            
            # Override the agent's log method to also log to service log
            original_log = self.agent.log
            def service_log(message):
                original_log(message)
                logging.info(message)
            self.agent.log = service_log
            
            logging.info("Starting agent main loop")
            
            # Run the agent in a loop with error recovery
            while self.is_running:
                try:
                    self.agent.run()
                    break  # If run() completes normally, exit the loop
                except Exception as agent_error:
                    error_msg = f"Agent error: {agent_error}"
                    logging.error(error_msg)
                    servicemanager.LogErrorMsg(error_msg)
                    
                    # Wait before retrying
                    logging.info("Waiting 30 seconds before retrying...")
                    time.sleep(30)
                    
                    # Reset the agent
                    try:
                        self.agent = NetworkMonitorAgent()
                        self.agent.log = service_log
                    except Exception as reset_error:
                        logging.error(f"Failed to reset agent: {reset_error}")
                        break
            
        except Exception as e:
            error_msg = f"Service error: {e}"
            logging.error(error_msg)
            servicemanager.LogErrorMsg(error_msg)
            # Wait a bit before exiting to allow service manager to handle the error
            time.sleep(5)

def install_service():
    """Install the service with auto-start configuration"""
    try:
        # Install the service
        win32serviceutil.InstallService(
            ITNetworkMonitorService,
            ITNetworkMonitorService._svc_name_,
            ITNetworkMonitorService._svc_display_name_,
            description=ITNetworkMonitorService._svc_description_,
            startType=win32service.SERVICE_AUTO_START  # Auto-start on boot
        )
        print("✓ Windows service installed successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to install service: {e}")
        return False

def uninstall_service():
    """Uninstall the service"""
    try:
        win32serviceutil.RemoveService(ITNetworkMonitorService._svc_name_)
        print("✓ Windows service uninstalled successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to uninstall service: {e}")
        return False

def start_service():
    """Start the service"""
    try:
        win32serviceutil.StartService(ITNetworkMonitorService._svc_name_)
        print("✓ Service started successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to start service: {e}")
        return False

def stop_service():
    """Stop the service"""
    try:
        win32serviceutil.StopService(ITNetworkMonitorService._svc_name_)
        print("✓ Service stopped successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to stop service: {e}")
        return False

def service_status():
    """Check service status"""
    try:
        status = win32serviceutil.QueryServiceStatus(ITNetworkMonitorService._svc_name_)
        status_map = {
            win32service.SERVICE_STOPPED: "Stopped",
            win32service.SERVICE_START_PENDING: "Starting",
            win32service.SERVICE_STOP_PENDING: "Stopping",
            win32service.SERVICE_RUNNING: "Running",
            win32service.SERVICE_CONTINUE_PENDING: "Continuing",
            win32service.SERVICE_PAUSE_PENDING: "Pausing",
            win32service.SERVICE_PAUSED: "Paused"
        }
        print(f"Service Status: {status_map.get(status[1], 'Unknown')}")
        return status[1] == win32service.SERVICE_RUNNING
    except Exception as e:
        print(f"✗ Failed to check service status: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) == 1:
        # Running as service
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(ITNetworkMonitorService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        # Command line operations
        command = sys.argv[1].lower()
        
        if command == 'install':
            install_service()
        elif command == 'uninstall':
            uninstall_service()
        elif command == 'start':
            start_service()
        elif command == 'stop':
            stop_service()
        elif command == 'status':
            service_status()
        else:
            # Default: handle as service command
            win32serviceutil.HandleCommandLine(ITNetworkMonitorService)


