' IT Monitoring Agent - One-Click Installer with GUI
' AUTO-ELEVATES TO ADMINISTRATOR - Just double-click!
' Prompts for backend URL before installation

Set objShell = CreateObject("Shell.Application")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Path to the install.bat file
strBatchFile = strScriptDir & "\install.bat"

' Check if install.bat exists
If Not objFSO.FileExists(strBatchFile) Then
    MsgBox "Error: install.bat not found in:" & vbCrLf & strScriptDir, vbCritical, "IT Monitoring Agent Installer"
    WScript.Quit 1
End If

' Prompt for backend URL
strBackendURL = InputBox( _
    "Enter the backend server URL:" & vbCrLf & vbCrLf & _
    "Examples:" & vbCrLf & _
    "  http://localhost:5001" & vbCrLf & _
    "  http://192.168.1.100:5001" & vbCrLf & _
    "  http://itmanagement.company.com:5001" & vbCrLf & vbCrLf & _
    "Leave empty to use default (http://localhost:5001)", _
    "IT Monitoring Agent Installer", _
    "http://localhost:5001" _
)

' If user cancelled, exit
If strBackendURL = "" Then
    strBackendURL = "http://localhost:5001"
End If

' Build command arguments
strArguments = "-backend " & Chr(34) & strBackendURL & Chr(34)

' Show confirmation
intResult = MsgBox( _
    "Ready to install IT Monitoring Agent" & vbCrLf & vbCrLf & _
    "Backend URL: " & strBackendURL & vbCrLf & vbCrLf & _
    "Click OK to continue with installation." & vbCrLf & _
    "You will be prompted for Administrator privileges.", _
    vbOKCancel + vbInformation, _
    "IT Monitoring Agent Installer" _
)

If intResult = vbCancel Then
    WScript.Quit 0
End If

' Launch install.bat with administrator privileges
' This will trigger UAC prompt
objShell.ShellExecute strBatchFile, strArguments, strScriptDir, "runas", 1

' Clean up
Set objShell = Nothing
Set objFSO = Nothing


