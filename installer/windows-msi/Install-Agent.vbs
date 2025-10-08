' IT Monitoring Agent - One-Click Installer Launcher
' AUTO-ELEVATES TO ADMINISTRATOR - Just double-click!
' No PowerShell required - Pure VBScript for maximum compatibility

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

' Launch install.bat with administrator privileges
' This will trigger UAC prompt
objShell.ShellExecute strBatchFile, "", strScriptDir, "runas", 1

' Clean up
Set objShell = Nothing
Set objFSO = Nothing


