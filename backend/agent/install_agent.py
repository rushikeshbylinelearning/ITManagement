#!/usr/bin/env python3
"""
IT Management Network Monitor Agent Installer
This script installs the agent as a Windows service that auto-starts on boot.
"""

import os
import sys
import subprocess
import json
import winreg
import ctypes
import shutil
from pathlib import Path

AGENT_NAME = "ITNetworkMonitor"
AGENT_DISPLAY_NAME = "IT Network Monitor Agent"
AGENT_DESCRIPTION = "Monitors network traffic for IT Management System"
INSTALL_DIR = os.path.join(os.environ['ProgramFiles'], 'ITNetworkMonitor')
SERVICE_SCRIPT = os.path.join(INSTALL_DIR, 'network_monitor_agent.py')

def is_admin():
    """Check if running with admin privileges"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def install_dependencies():
    """Install required Python packages"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', 
            os.path.join(os.path.dirname(__file__), 'requirements.txt'),
            '--quiet'
        ])
        print("✓ Dependencies installed successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to install dependencies: {e}")
        return False

def create_install_directory():
    """Create installation directory"""
    try:
        os.makedirs(INSTALL_DIR, exist_ok=True)
        print(f"✓ Installation directory created: {INSTALL_DIR}")
        return True
    except Exception as e:
        print(f"✗ Failed to create installation directory: {e}")
        return False

def copy_agent_files():
    """Copy agent files to installation directory"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Copy main agent script
        shutil.copy(
            os.path.join(script_dir, 'network_monitor_agent.py'),
            SERVICE_SCRIPT
        )
        
        # Copy requirements
        shutil.copy(
            os.path.join(script_dir, 'requirements.txt'),
            os.path.join(INSTALL_DIR, 'requirements.txt')
        )
        
        # Copy service wrapper
        shutil.copy(
            os.path.join(script_dir, 'service_wrapper.py'),
            os.path.join(INSTALL_DIR, 'service_wrapper.py')
        )
        
        print("✓ Agent files copied successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to copy agent files: {e}")
        return False

def create_scheduled_task():
    """Create Windows scheduled task to run agent on startup"""
    try:
        task_name = AGENT_NAME
        python_exe = sys.executable
        script_path = SERVICE_SCRIPT
        
        # Create XML for scheduled task
        xml_content = f"""<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>{AGENT_DESCRIPTION}</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
    <BootTrigger>
      <Enabled>true</Enabled>
    </BootTrigger>
  </Triggers>
  <Principals>
    <Principal>
      <LogonType>S4U</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <Hidden>true</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions>
    <Exec>
      <Command>"{python_exe}"</Command>
      <Arguments>"{script_path}"</Arguments>
      <WorkingDirectory>{INSTALL_DIR}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""
        
        # Save XML to temp file
        xml_file = os.path.join(INSTALL_DIR, 'task.xml')
        with open(xml_file, 'w', encoding='utf-16') as f:
            f.write(xml_content)
        
        # Create scheduled task
        subprocess.check_call([
            'schtasks', '/Create', '/TN', task_name, '/XML', xml_file, '/F'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Clean up XML file
        os.remove(xml_file)
        
        print("✓ Scheduled task created successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to create scheduled task: {e}")
        return False

def add_to_registry():
    """Add agent to Windows registry for auto-start"""
    try:
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        
        value_data = f'"{sys.executable}" "{SERVICE_SCRIPT}"'
        winreg.SetValueEx(key, AGENT_NAME, 0, winreg.REG_SZ, value_data)
        winreg.CloseKey(key)
        
        print("✓ Registry entry created for auto-start")
        return True
    except Exception as e:
        print(f"✗ Failed to add registry entry: {e}")
        return False

def start_agent():
    """Start the agent"""
    try:
        # Start the scheduled task
        subprocess.Popen([
            'schtasks', '/Run', '/TN', AGENT_NAME
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print("✓ Agent started successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to start agent: {e}")
        return False

def uninstall():
    """Uninstall the agent"""
    if not is_admin():
        print("✗ Administrator privileges required for uninstallation")
        return False
    
    print("Uninstalling IT Network Monitor Agent...")
    
    try:
        # Stop and delete scheduled task
        try:
            subprocess.call([
                'schtasks', '/End', '/TN', AGENT_NAME
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            subprocess.call([
                'schtasks', '/Delete', '/TN', AGENT_NAME, '/F'
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("✓ Scheduled task removed")
        except:
            pass
        
        # Remove registry entry
        try:
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
            winreg.DeleteValue(key, AGENT_NAME)
            winreg.CloseKey(key)
            print("✓ Registry entry removed")
        except:
            pass
        
        # Remove installation directory
        try:
            if os.path.exists(INSTALL_DIR):
                shutil.rmtree(INSTALL_DIR)
                print("✓ Installation directory removed")
        except Exception as e:
            print(f"⚠ Could not remove installation directory: {e}")
        
        print("\n✓ Agent uninstalled successfully")
        return True
        
    except Exception as e:
        print(f"✗ Uninstallation failed: {e}")
        return False

def main():
    """Main installer function"""
    print("=" * 60)
    print("IT Network Monitor Agent Installer")
    print("=" * 60)
    
    # Check for uninstall flag
    if len(sys.argv) > 1 and sys.argv[1].lower() == 'uninstall':
        return uninstall()
    
    # Check admin privileges
    if not is_admin():
        print("\n✗ This installer requires administrator privileges")
        print("Please run as administrator")
        return False
    
    print("\nInstalling agent...")
    
    # Step 1: Install dependencies
    if not install_dependencies():
        return False
    
    # Step 2: Create installation directory
    if not create_install_directory():
        return False
    
    # Step 3: Copy agent files
    if not copy_agent_files():
        return False
    
    # Step 4: Create scheduled task
    if not create_scheduled_task():
        return False
    
    # Step 5: Add to registry
    if not add_to_registry():
        print("⚠ Warning: Could not add registry entry (non-critical)")
    
    print("\n" + "=" * 60)
    print("✓ Installation completed successfully!")
    print("=" * 60)
    print(f"\nInstallation directory: {INSTALL_DIR}")
    print("\nNext steps:")
    print("1. Open the IT Management Portal (Employee section)")
    print("2. Download your agent token")
    print("3. Run this command to register:")
    print(f'   python "{SERVICE_SCRIPT}" register YOUR_TOKEN_HERE')
    print("\nThe agent will start automatically on system boot.")
    print("To start it now, run:")
    print(f'   schtasks /Run /TN {AGENT_NAME}')
    print("\nTo uninstall, run:")
    print(f'   python "{os.path.join(INSTALL_DIR, "install_agent.py")}" uninstall')
    print("=" * 60)
    
    # Ask if user wants to start now
    try:
        response = input("\nDo you want to start the agent now? (y/n): ")
        if response.lower() == 'y':
            start_agent()
    except:
        pass
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        input("\nPress Enter to exit...")
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nInstallation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Installation failed: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)

