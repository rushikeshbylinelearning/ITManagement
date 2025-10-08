# IT Management Monitoring Agent - MSI Installation Helper
# This script is called by MSI custom actions to perform installation tasks

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('CreateConfig', 'CreateService', 'StartService', 'RemoveService')]
    [string]$Action,
    
    [string]$InstallDir = "C:\Program Files\ITMonitoringAgent",
    [string]$BackendUrl = "",
    [string]$RegistrationUrl = "",
    [string]$RegistrationToken = "",
    [string]$PollingInterval = "60"
)

$ErrorActionPreference = "Stop"
$ServiceName = "ITMonitoringAgent"
$LogFile = Join-Path $InstallDir "msi_install.log"
$PythonExe = Join-Path $InstallDir "python\python.exe"

function Write-InstallLog {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

try {
    Write-InstallLog "========== Action: $Action =========="
    
    # Verify Python exists
    if (-not (Test-Path $PythonExe)) {
        Write-InstallLog "ERROR: Python not found at $PythonExe"
        throw "Bundled Python executable not found"
    }
    Write-InstallLog "Using bundled Python: $PythonExe"
    
    switch ($Action) {
        'CreateConfig' {
            Write-InstallLog "Creating configuration file..."
            
            $configPath = Join-Path $InstallDir "config.json"
            
            $config = @{
                backend_url = $BackendUrl
                registration_url = $RegistrationUrl
                registration_token = if($RegistrationToken) { $RegistrationToken } else { $null }
                api_key = $null
                agent_id = $null
                hostname = $env:COMPUTERNAME
                polling_interval = [int]$PollingInterval
                monitored_directories = @()
                log_level = "INFO"
                retry_attempts = 3
                retry_backoff = 5
                local_cache_file = (Join-Path $InstallDir "cache\telemetry_cache.json")
            }
            
            $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8
            
            Write-InstallLog "✓ Config created: $configPath"
            Write-InstallLog "  Backend: $BackendUrl"
            Write-InstallLog "  Registration: $RegistrationUrl"
            Write-InstallLog "  Hostname: $env:COMPUTERNAME"
            
            # Set restrictive ACLs
            try {
                $acl = Get-Acl $configPath
                $acl.SetAccessRuleProtection($true, $false)
                
                $systemRule = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM", "FullControl", "Allow")
                $acl.AddAccessRule($systemRule)
                
                $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "Allow")
                $acl.AddAccessRule($adminRule)
                
                Set-Acl -Path $configPath -AclObject $acl
                Write-InstallLog "✓ Restrictive ACLs set on config file"
            } catch {
                Write-InstallLog "Warning: Failed to set ACLs - $($_.Exception.Message)"
            }
        }
        
        'CreateService' {
            Write-InstallLog "Creating Windows service..."
            
            $nssmPath = Join-Path $InstallDir "nssm.exe"
            $agentPath = Join-Path $InstallDir "monitoring_agent.py"
            
            # Remove existing service if present
            $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
            if ($existingService) {
                Write-InstallLog "Removing existing service..."
                try {
                    Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
                    & sc.exe delete $ServiceName 2>&1 | Out-File -FilePath $LogFile -Append
                    Start-Sleep -Seconds 2
                    Write-InstallLog "✓ Existing service removed"
                } catch {
                    Write-InstallLog "Warning: Failed to remove existing service - $($_.Exception.Message)"
                }
            }
            
            # Check if NSSM exists
            if (Test-Path $nssmPath) {
                Write-InstallLog "Creating service with NSSM..."
                Write-InstallLog "  Python: $PythonExe"
                Write-InstallLog "  Agent: $agentPath"
                
                # Install service
                & $nssmPath install $ServiceName $PythonExe $agentPath 2>&1 | Out-File -FilePath $LogFile -Append
                
                # Configure service
                & $nssmPath set $ServiceName DisplayName "IT Management Monitoring Agent" 2>&1 | Out-Null
                & $nssmPath set $ServiceName Description "Monitors system performance and security for IT management" 2>&1 | Out-Null
                & $nssmPath set $ServiceName Start SERVICE_AUTO_START 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppDirectory $InstallDir 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppStdout (Join-Path $InstallDir "logs\service.log") 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppStderr (Join-Path $InstallDir "logs\service_error.log") 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppStdoutCreationDisposition 4 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppStderrCreationDisposition 4 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppRotateFiles 1 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppRotateOnline 1 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppRotateBytes 10485760 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppExit Default Restart 2>&1 | Out-Null
                & $nssmPath set $ServiceName AppRestartDelay 60000 2>&1 | Out-Null
                
                Write-InstallLog "✓ Service created with NSSM"
            } else {
                # Fallback to pywin32 wrapper
                Write-InstallLog "NSSM not found, using pywin32 wrapper..."
                
                $serviceWrapperPath = Join-Path $InstallDir "service_wrapper.py"
                
                if (Test-Path $serviceWrapperPath) {
                    & $PythonExe $serviceWrapperPath install 2>&1 | Out-File -FilePath $LogFile -Append
                    
                    if ($LASTEXITCODE -eq 0) {
                        # Configure with sc.exe
                        & sc.exe config $ServiceName start= auto 2>&1 | Out-Null
                        & sc.exe description $ServiceName "Monitors system performance and security for IT management" 2>&1 | Out-Null
                        & sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 2>&1 | Out-Null
                        
                        Write-InstallLog "✓ Service created with pywin32"
                    } else {
                        throw "Service creation failed"
                    }
                } else {
                    throw "Service wrapper not found: $serviceWrapperPath"
                }
            }
            
            # Configure firewall
            try {
                Write-InstallLog "Configuring firewall..."
                Remove-NetFirewallRule -DisplayName "IT Monitoring Agent" -ErrorAction SilentlyContinue 2>&1 | Out-Null
                New-NetFirewallRule -DisplayName "IT Monitoring Agent" -Direction Outbound -Program $PythonExe -Action Allow -Description "Allow IT Monitoring Agent outbound HTTPS" -ErrorAction Stop 2>&1 | Out-Null
                Write-InstallLog "✓ Firewall configured"
            } catch {
                Write-InstallLog "Warning: Firewall configuration failed - $($_.Exception.Message)"
            }
        }
        
        'StartService' {
            Write-InstallLog "Starting service..."
            
            try {
                Start-Service -Name $ServiceName -ErrorAction Stop
                Start-Sleep -Seconds 3
                
                $service = Get-Service -Name $ServiceName
                
                if ($service.Status -eq 'Running') {
                    Write-InstallLog "✓ Service started successfully"
                    Write-InstallLog "  Status: $($service.Status)"
                } else {
                    Write-InstallLog "Warning: Service status is $($service.Status)"
                }
            } catch {
                Write-InstallLog "Warning: Failed to start service - $($_.Exception.Message)"
                Write-InstallLog "Service will start on next system boot"
            }
        }
        
        'RemoveService' {
            Write-InstallLog "Removing service..."
            
            try {
                # Stop service
                $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
                if ($service -and $service.Status -eq 'Running') {
                    Write-InstallLog "Stopping service..."
                    Stop-Service $ServiceName -Force -ErrorAction Stop
                }
                
                # Remove with NSSM if available
                $nssmPath = Join-Path $InstallDir "nssm.exe"
                if (Test-Path $nssmPath) {
                    & $nssmPath remove $ServiceName confirm 2>&1 | Out-File -FilePath $LogFile -Append
                } else {
                    # Use sc.exe
                    & sc.exe delete $ServiceName 2>&1 | Out-File -FilePath $LogFile -Append
                }
                
                Write-InstallLog "✓ Service removed"
                
                # Remove firewall rules
                Remove-NetFirewallRule -DisplayName "IT Monitoring Agent" -ErrorAction SilentlyContinue 2>&1 | Out-Null
                Write-InstallLog "✓ Firewall rules removed"
                
            } catch {
                Write-InstallLog "Warning: Service removal failed - $($_.Exception.Message)"
            }
        }
    }
    
    Write-InstallLog "========== Action $Action completed =========="
    exit 0
    
} catch {
    Write-InstallLog "ERROR in action $Action : $($_.Exception.Message)"
    Write-InstallLog $_.ScriptStackTrace
    exit 1
}


