; IT Management Monitoring Agent - Windows Installer
; NSIS Script for professional installer with wizard UI
; Requires NSIS 3.0+ with Modern UI 2

!define PRODUCT_NAME "IT Management Monitoring Agent"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Your Company IT"
!define PRODUCT_WEB_SITE "https://itmanagement.company.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\ITMonitorAgent.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; Installation directory
!define INSTALL_DIR "$PROGRAMFILES64\ITMonitoringAgent"
!define SERVICE_NAME "ITMonitoringAgent"
!define SERVICE_DISPLAY_NAME "IT Management Monitoring Agent"

; MUI Settings
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

; MUI Settings / Icons
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Header\nsis3-metro.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\nsis3-metro.bmp"

; Welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCT_NAME} Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${PRODUCT_NAME}.$\r$\n$\r$\nThis agent monitors your system for IT management and security purposes. No personal data, file contents, or keystrokes are collected.$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME

; License page
!insertmacro MUI_PAGE_LICENSE "License.txt"

; Directory page (optional - users can change install location)
!define MUI_PAGE_CUSTOMFUNCTION_PRE DirectoryPre
!insertmacro MUI_PAGE_DIRECTORY

; Installation page with progress
!insertmacro MUI_PAGE_INSTFILES

; Finish page
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} has been successfully installed.$\r$\n$\r$\nThe monitoring agent service has been started and will run automatically on system startup."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Open IT Management Portal"
!define MUI_FINISHPAGE_RUN_FUNCTION LaunchPortal
!define MUI_FINISHPAGE_SHOWREADME
!define MUI_FINISHPAGE_SHOWREADME_TEXT "View installation log"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION ShowLog
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; General
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "ITMonitoringAgent-Setup-${PRODUCT_VERSION}.exe"
InstallDir "${INSTALL_DIR}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel admin
Unicode True

; Version Information
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "FileDescription" "IT Management Monitoring Agent Installer"
VIAddVersionKey "LegalCopyright" "© ${PRODUCT_PUBLISHER}"

;--------------------------------
; Global Variables
Var PythonInstalled
Var PythonPath
Var BackendURL
Var RegistrationURL
Var RegistrationToken
Var APIKEY
Var OpenPortal

;--------------------------------
; Functions

Function .onInit
  ; Check if running as administrator
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONSTOP "Administrator privileges required!$\r$\nPlease right-click the installer and select 'Run as Administrator'."
    Quit
  ${EndIf}
  
  ; Check if 64-bit OS
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    MessageBox MB_ICONSTOP "This installer requires a 64-bit version of Windows.$\r$\nWindows 10 or Windows 11 (64-bit) is required."
    Quit
  ${EndIf}
  
  ; Check Windows version (require Windows 10 or higher)
  ${If} ${AtLeastWin10}
    ; OK
  ${Else}
    MessageBox MB_ICONSTOP "This installer requires Windows 10 or higher.$\r$\nYour version of Windows is not supported."
    Quit
  ${EndIf}
  
  ; Check if already installed
  ReadRegStr $0 HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION "${PRODUCT_NAME} is already installed.$\r$\n$\r$\nDo you want to uninstall the existing version first?" IDYES uninst
    Quit
    
    uninst:
      ExecWait '$0 /S _?=$INSTDIR'
      Delete "$0"
  ${EndIf}
  
  StrCpy $OpenPortal "1"
FunctionEnd

Function DirectoryPre
  ; Most users won't need to change this, but we allow it
  ; Default to Program Files
FunctionEnd

Function LaunchPortal
  ; Open IT Management Portal in default browser
  ${If} $OpenPortal == "1"
    DetailPrint "Opening IT Management Portal..."
    ExecShell "open" "${PRODUCT_WEB_SITE}/login"
  ${EndIf}
FunctionEnd

Function ShowLog
  ExecShell "open" "$INSTDIR\install.log"
FunctionEnd

;--------------------------------
; Installation Sections

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on
  
  DetailPrint "Checking system compatibility..."
  Call CheckSystemRequirements
  
  DetailPrint "Checking for Python installation..."
  Call CheckPython
  
  DetailPrint "Installing dependencies..."
  Call InstallDependencies
  
  DetailPrint "Installing agent files..."
  Call InstallAgentFiles
  
  DetailPrint "Configuring agent..."
  Call ConfigureAgent
  
  DetailPrint "Creating Windows service..."
  Call CreateWindowsService
  
  DetailPrint "Configuring firewall..."
  Call ConfigureFirewall
  
  DetailPrint "Starting agent service..."
  Call StartAgentService
  
  DetailPrint "Creating shortcuts..."
  Call CreateShortcuts
  
  DetailPrint "Registering uninstaller..."
  Call RegisterUninstaller
  
  DetailPrint "Installation completed successfully!"
SectionEnd

;--------------------------------
; Helper Functions

Function CheckSystemRequirements
  ; Check available disk space (require at least 100 MB)
  ${GetRoot} "$INSTDIR" $0
  ${DriveSpace} "$0\" "/D=F /S=M" $1
  ${If} $1 < 100
    MessageBox MB_ICONSTOP "Insufficient disk space.$\r$\nAt least 100 MB of free space is required."
    Quit
  ${EndIf}
  
  ; Check if .NET Framework 4.5+ is installed (for potential future C# components)
  ClearErrors
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" "Release"
  ${If} ${Errors}
    DetailPrint ".NET Framework 4.5+ not found (optional - may be needed for some features)"
  ${Else}
    DetailPrint ".NET Framework detected: OK"
  ${EndIf}
FunctionEnd

Function CheckPython
  StrCpy $PythonInstalled "0"
  
  ; Check if Python 3 is installed
  ClearErrors
  nsExec::ExecToStack 'python --version'
  Pop $0
  Pop $1
  
  ${If} $0 == 0
    ; Python is in PATH
    DetailPrint "Python found in PATH"
    StrCpy $PythonPath "python"
    StrCpy $PythonInstalled "1"
  ${Else}
    ; Try common installation locations
    ${If} ${FileExists} "C:\Python310\python.exe"
      StrCpy $PythonPath "C:\Python310\python.exe"
      StrCpy $PythonInstalled "1"
    ${ElseIf} ${FileExists} "C:\Python39\python.exe"
      StrCpy $PythonPath "C:\Python39\python.exe"
      StrCpy $PythonInstalled "1"
    ${ElseIf} ${FileExists} "$LOCALAPPDATA\Programs\Python\Python310\python.exe"
      StrCpy $PythonPath "$LOCALAPPDATA\Programs\Python\Python310\python.exe"
      StrCpy $PythonInstalled "1"
    ${Else}
      ; Python not found - download and install
      DetailPrint "Python not found. Installing Python 3.10..."
      Call DownloadAndInstallPython
    ${EndIf}
  ${EndIf}
  
  ${If} $PythonInstalled == "1"
    DetailPrint "Python installation verified: $PythonPath"
  ${EndIf}
FunctionEnd

Function DownloadAndInstallPython
  ; Download Python 3.10 installer
  DetailPrint "Downloading Python 3.10.11..."
  
  NSISdl::download "https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe" "$TEMP\python-installer.exe"
  Pop $0
  
  ${If} $0 == "success"
    DetailPrint "Installing Python silently..."
    ExecWait '"$TEMP\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0' $0
    
    ${If} $0 == 0
      DetailPrint "Python installed successfully"
      StrCpy $PythonPath "python"
      StrCpy $PythonInstalled "1"
      Delete "$TEMP\python-installer.exe"
    ${Else}
      MessageBox MB_ICONSTOP "Failed to install Python.$\r$\nPlease install Python 3.7+ manually and run this installer again."
      Quit
    ${EndIf}
  ${Else}
    MessageBox MB_ICONSTOP "Failed to download Python installer.$\r$\nPlease check your internet connection or install Python 3.7+ manually."
    Quit
  ${EndIf}
FunctionEnd

Function InstallDependencies
  ; Install Python dependencies
  DetailPrint "Installing Python dependencies..."
  
  nsExec::ExecToLog '"$PythonPath" -m pip install --upgrade pip'
  nsExec::ExecToLog '"$PythonPath" -m pip install psutil>=5.9.0 requests>=2.28.0 watchdog>=2.1.9 pywin32>=304'
  
  ; Verify installations
  DetailPrint "Verifying Python packages..."
  nsExec::ExecToLog '"$PythonPath" -c "import psutil, requests, watchdog, win32service"'
  Pop $0
  
  ${If} $0 != 0
    MessageBox MB_ICONEXCLAMATION "Warning: Some Python dependencies may not have installed correctly.$\r$\nThe agent may not function properly."
  ${Else}
    DetailPrint "All Python dependencies installed successfully"
  ${EndIf}
FunctionEnd

Function InstallAgentFiles
  ; Create directory structure
  CreateDirectory "$INSTDIR"
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\cache"
  
  ; Copy agent files
  File "monitoring_agent.py"
  File "requirements.txt"
  File "service_wrapper.py"
  File "LICENSE.txt"
  File "README.txt"
  
  ; Set permissions (read-only for config, full control for logs/cache)
  AccessControl::GrantOnFile "$INSTDIR\logs" "(S-1-5-18)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\cache" "(S-1-5-18)" "FullAccess"
  
  DetailPrint "Agent files installed to $INSTDIR"
FunctionEnd

Function ConfigureAgent
  ; Prompt for backend URL if not pre-configured
  ${If} $BackendURL == ""
    ; Try to read from installer parameter
    ${GetParameters} $0
    ${GetOptions} $0 "/BackendURL=" $BackendURL
  ${EndIf}
  
  ${If} $BackendURL == ""
    StrCpy $BackendURL "${PRODUCT_WEB_SITE}/api/monitoring/events"
  ${EndIf}
  
  ${If} $RegistrationURL == ""
    StrCpy $RegistrationURL "${PRODUCT_WEB_SITE}/api/monitoring/register"
  ${EndIf}
  
  ; Get registration token from command line or prompt
  ${GetParameters} $0
  ${GetOptions} $0 "/Token=" $RegistrationToken
  
  ; Generate config.json
  DetailPrint "Creating configuration file..."
  
  FileOpen $0 "$INSTDIR\config.json" w
  FileWrite $0 '{$\r$\n'
  FileWrite $0 '  "backend_url": "$BackendURL",$\r$\n'
  FileWrite $0 '  "registration_url": "$RegistrationURL",$\r$\n'
  ${If} $RegistrationToken != ""
    FileWrite $0 '  "registration_token": "$RegistrationToken",$\r$\n'
  ${Else}
    FileWrite $0 '  "registration_token": null,$\r$\n'
  ${EndIf}
  FileWrite $0 '  "api_key": null,$\r$\n'
  FileWrite $0 '  "agent_id": null,$\r$\n'
  FileWrite $0 '  "hostname": "$COMPUTERNAME",$\r$\n'
  FileWrite $0 '  "polling_interval": 60,$\r$\n'
  FileWrite $0 '  "monitored_directories": [],$\r$\n'
  FileWrite $0 '  "log_level": "INFO",$\r$\n'
  FileWrite $0 '  "retry_attempts": 3,$\r$\n'
  FileWrite $0 '  "retry_backoff": 5,$\r$\n'
  FileWrite $0 '  "local_cache_file": "$INSTDIR\cache\telemetry_cache.json"$\r$\n'
  FileWrite $0 '}$\r$\n'
  FileClose $0
  
  DetailPrint "Configuration file created"
FunctionEnd

Function CreateWindowsService
  ; Install the service using service_wrapper.py
  DetailPrint "Installing Windows service..."
  
  nsExec::ExecToLog '"$PythonPath" "$INSTDIR\service_wrapper.py" --startup auto install'
  Pop $0
  
  ${If} $0 == 0
    DetailPrint "Windows service created successfully"
  ${Else}
    DetailPrint "Warning: Service creation returned code $0"
  ${EndIf}
  
  ; Set service description
  nsExec::ExecToLog 'sc description "${SERVICE_NAME}" "Monitors system performance and security for IT management. Collects system metrics, process information, and network activity."'
  
  ; Set service to restart on failure
  nsExec::ExecToLog 'sc failure "${SERVICE_NAME}" reset= 86400 actions= restart/60000/restart/60000/restart/60000'
FunctionEnd

Function ConfigureFirewall
  ; Add firewall rule to allow outbound HTTPS
  DetailPrint "Configuring Windows Firewall..."
  
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="IT Monitoring Agent"'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="IT Monitoring Agent" dir=out action=allow program="$PythonPath" enable=yes description="Allow IT Monitoring Agent to communicate with backend server"'
  
  DetailPrint "Firewall rules configured"
FunctionEnd

Function StartAgentService
  ; Start the service
  DetailPrint "Starting monitoring agent service..."
  
  nsExec::ExecToLog 'net start "${SERVICE_NAME}"'
  Pop $0
  
  ${If} $0 == 0
    DetailPrint "Agent service started successfully"
  ${Else}
    DetailPrint "Warning: Service start returned code $0"
    DetailPrint "Service will start automatically on next system boot"
  ${EndIf}
FunctionEnd

Function CreateShortcuts
  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\View Logs.lnk" "$INSTDIR\logs"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\IT Management Portal.lnk" "${PRODUCT_WEB_SITE}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Service Manager.lnk" "services.msc" "" "" 0 SW_SHOWNORMAL "" "Manage IT Monitoring Agent service"
FunctionEnd

Function RegisterUninstaller
  ; Write uninstall information to registry
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\ITMonitorAgent.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\ITMonitorAgent.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  DetailPrint "Uninstaller registered"
FunctionEnd

;--------------------------------
; Uninstaller Section

Section Uninstall
  ; Stop and remove service
  DetailPrint "Stopping agent service..."
  nsExec::ExecToLog 'net stop "${SERVICE_NAME}"'
  
  DetailPrint "Removing service..."
  nsExec::ExecToLog '"$PythonPath" "$INSTDIR\service_wrapper.py" remove'
  
  ; Remove firewall rules
  DetailPrint "Removing firewall rules..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="IT Monitoring Agent"'
  
  ; Delete files
  Delete "$INSTDIR\monitoring_agent.py"
  Delete "$INSTDIR\service_wrapper.py"
  Delete "$INSTDIR\config.json"
  Delete "$INSTDIR\requirements.txt"
  Delete "$INSTDIR\LICENSE.txt"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\uninstall.exe"
  
  ; Delete directories
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\cache"
  RMDir "$INSTDIR"
  
  ; Delete shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\*.*"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Delete registry keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  
  SetAutoClose true
SectionEnd




