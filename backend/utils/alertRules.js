// Alert Rules Engine for Computer Monitoring

const MonitoringAlert = require('../models/MonitoringAlert');

/**
 * Check for high network usage alert
 * Threshold: >100 MB/min for any process
 */
async function checkHighNetworkUsage(hostId, hostname, networkData) {
  const alerts = [];
  
  // Group by process and calculate total bytes per minute
  const processNetworkUsage = {};
  
  networkData.forEach(record => {
    const processKey = record.processName || 'unknown';
    if (!processNetworkUsage[processKey]) {
      processNetworkUsage[processKey] = {
        bytesIn: 0,
        bytesOut: 0,
        pid: record.pid
      };
    }
    processNetworkUsage[processKey].bytesIn += record.bytesIn || 0;
    processNetworkUsage[processKey].bytesOut += record.bytesOut || 0;
  });
  
  // Check each process
  for (const [processName, usage] of Object.entries(processNetworkUsage)) {
    const totalBytes = usage.bytesIn + usage.bytesOut;
    const totalMB = totalBytes / (1024 * 1024);
    
    if (totalMB > 100) {
      // Check if alert already exists and is not resolved
      const existingAlert = await MonitoringAlert.findOne({
        hostId,
        type: 'high_network_usage',
        resolved: false,
        'metadata.processName': processName
      });
      
      if (!existingAlert) {
        const alert = new MonitoringAlert({
          hostId,
          hostname,
          type: 'high_network_usage',
          severity: totalMB > 500 ? 'critical' : totalMB > 250 ? 'high' : 'medium',
          title: `High Network Usage Detected: ${processName}`,
          description: `Process "${processName}" (PID: ${usage.pid}) has used ${totalMB.toFixed(2)} MB of network bandwidth in the last minute.`,
          metadata: {
            processName,
            pid: usage.pid,
            bytesIn: usage.bytesIn,
            bytesOut: usage.bytesOut,
            totalMB: totalMB.toFixed(2)
          }
        });
        
        await alert.save();
        alerts.push(alert);
      }
    }
  }
  
  return alerts;
}

/**
 * Check for bulk file deletion alert
 * Threshold: >50 file deletions per minute
 */
async function checkBulkFileDeletion(hostId, hostname, fileEvents) {
  const deletions = fileEvents.filter(event => event.operation === 'delete');
  
  if (deletions.length > 50) {
    // Check if alert already exists and is not resolved
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'bulk_file_deletion',
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 60000) } // In last minute
    });
    
    if (!existingAlert) {
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'bulk_file_deletion',
        severity: deletions.length > 200 ? 'critical' : deletions.length > 100 ? 'high' : 'medium',
        title: `Bulk File Deletion Detected`,
        description: `${deletions.length} files were deleted on host "${hostname}" in the last minute. This may indicate ransomware or malicious activity.`,
        metadata: {
          deletionCount: deletions.length,
          affectedPaths: deletions.slice(0, 10).map(e => e.path),
          users: [...new Set(deletions.map(e => e.user).filter(Boolean))]
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Check for high CPU usage alert
 * Threshold: >90% for sustained period
 */
async function checkHighCPUUsage(hostId, hostname, cpuUsage) {
  if (cpuUsage > 90) {
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'high_cpu_usage',
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 300000) } // In last 5 minutes
    });
    
    if (!existingAlert) {
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'high_cpu_usage',
        severity: cpuUsage > 98 ? 'critical' : 'high',
        title: `High CPU Usage: ${cpuUsage.toFixed(1)}%`,
        description: `Host "${hostname}" is experiencing high CPU usage at ${cpuUsage.toFixed(1)}%. This may impact system performance.`,
        metadata: {
          cpuUsage: cpuUsage.toFixed(1)
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Check for high memory usage alert
 * Threshold: >90%
 */
async function checkHighMemoryUsage(hostId, hostname, memoryUsage) {
  if (memoryUsage > 90) {
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'high_memory_usage',
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 300000) } // In last 5 minutes
    });
    
    if (!existingAlert) {
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'high_memory_usage',
        severity: memoryUsage > 98 ? 'critical' : 'high',
        title: `High Memory Usage: ${memoryUsage.toFixed(1)}%`,
        description: `Host "${hostname}" is experiencing high memory usage at ${memoryUsage.toFixed(1)}%. This may cause system instability.`,
        metadata: {
          memoryUsage: memoryUsage.toFixed(1)
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Check for high disk usage alert
 * Threshold: >85%
 */
async function checkHighDiskUsage(hostId, hostname, diskUsage) {
  if (diskUsage > 85) {
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'high_disk_usage',
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 3600000) } // In last hour
    });
    
    if (!existingAlert) {
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'high_disk_usage',
        severity: diskUsage > 95 ? 'critical' : diskUsage > 90 ? 'high' : 'medium',
        title: `High Disk Usage: ${diskUsage.toFixed(1)}%`,
        description: `Host "${hostname}" disk usage is at ${diskUsage.toFixed(1)}%. Consider freeing up disk space.`,
        metadata: {
          diskUsage: diskUsage.toFixed(1)
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Check for host offline alert
 */
async function checkHostOffline(hostId, hostname, lastSeen) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  if (lastSeen < fiveMinutesAgo) {
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'host_offline',
      resolved: false
    });
    
    if (!existingAlert) {
      const minutesOffline = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
      
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'host_offline',
        severity: minutesOffline > 60 ? 'high' : 'medium',
        title: `Host Offline: ${hostname}`,
        description: `Host "${hostname}" has not reported in for ${minutesOffline} minutes. The agent may be stopped or the host may be powered off.`,
        metadata: {
          lastSeen: lastSeen.toISOString(),
          minutesOffline
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Check for high upload alert
 * Threshold: >150 MB upload in 1 minute
 */
async function checkHighUpload(hostId, hostname, networkData) {
  const totalBytesOut = networkData.reduce((sum, record) => sum + (record.bytesOut || 0), 0);
  const totalMBOut = totalBytesOut / (1024 * 1024);
  
  if (totalMBOut > 150) {
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'high_upload',
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 60000) }
    });
    
    if (!existingAlert) {
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'high_upload',
        severity: totalMBOut > 500 ? 'critical' : 'high',
        title: `High Upload Detected: ${totalMBOut.toFixed(2)} MB`,
        description: `Host "${hostname}" has uploaded ${totalMBOut.toFixed(2)} MB of data in the last minute. This may indicate data exfiltration.`,
        metadata: {
          totalMBOut: totalMBOut.toFixed(2),
          topProcesses: networkData
            .sort((a, b) => (b.bytesOut || 0) - (a.bytesOut || 0))
            .slice(0, 5)
            .map(r => ({ process: r.processName, bytesOut: r.bytesOut }))
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Check for suspicious domain upload
 * Detects large uploads to non-whitelisted external domains
 */
async function checkSuspiciousDomainUpload(hostId, hostname, domains) {
  const MonitoringSettings = require('../models/MonitoringSettings');
  const settings = await MonitoringSettings.getSettings();
  const alerts = [];
  
  for (const domainRecord of domains) {
    // Skip whitelisted domains
    if (settings.domains.whitelist.includes(domainRecord.domain)) {
      continue;
    }
    
    // Check if domain is blacklisted
    const isBlacklisted = settings.domains.blacklist.includes(domainRecord.domain);
    
    // Alert on blacklisted domains or large uploads (>10 MB) to external domains
    const uploadMB = (domainRecord.bytesTransferred || 0) / (1024 * 1024);
    
    if (isBlacklisted || uploadMB > 10) {
      const existingAlert = await MonitoringAlert.findOne({
        hostId,
        type: 'suspicious_upload',
        resolved: false,
        'metadata.domain': domainRecord.domain,
        createdAt: { $gte: new Date(Date.now() - 300000) } // Last 5 minutes
      });
      
      if (!existingAlert) {
        const alert = new MonitoringAlert({
          hostId,
          hostname,
          type: 'suspicious_upload',
          severity: isBlacklisted ? 'critical' : 'high',
          title: `Suspicious Upload to ${domainRecord.domain}`,
          description: `Host "${hostname}" uploaded ${uploadMB.toFixed(2)} MB to ${domainRecord.domain}. ${isBlacklisted ? 'This domain is blacklisted.' : 'This is an unusually large upload to an external domain.'}`,
          metadata: {
            domain: domainRecord.domain,
            uploadMB: uploadMB.toFixed(2),
            isBlacklisted
          }
        });
        
        await alert.save();
        alerts.push(alert);
      }
    }
  }
  
  return alerts;
}

/**
 * Check for off-network access
 * Detects hosts connecting from outside corporate network without VPN
 */
async function checkOffNetwork(hostId, hostname, networkContext) {
  if (!networkContext) return [];
  
  const MonitoringSettings = require('../models/MonitoringSettings');
  const settings = await MonitoringSettings.getSettings();
  
  // If no corporate IP ranges configured, skip check
  if (!settings.network.corporateIpRanges || settings.network.corporateIpRanges.length === 0) {
    return [];
  }
  
  const { publicIp, vpnActive, ssid } = networkContext;
  
  // Skip if VPN is active (user is securely connected)
  if (vpnActive) return [];
  
  // Check if SSID is trusted
  const isTrustedWifi = settings.network.trustedWifiSSIDs.includes(ssid);
  if (isTrustedWifi) return [];
  
  // Check if public IP is in corporate range
  const isInCorporateRange = settings.network.corporateIpRanges.some(range => {
    // Simple IP range check (can be enhanced with proper CIDR checking)
    return publicIp && publicIp.startsWith(range.split('/')[0].slice(0, -2));
  });
  
  if (!isInCorporateRange) {
    const existingAlert = await MonitoringAlert.findOne({
      hostId,
      type: 'off_network',
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 3600000) } // Last hour
    });
    
    if (!existingAlert) {
      const alert = new MonitoringAlert({
        hostId,
        hostname,
        type: 'off_network',
        severity: 'medium',
        title: `Off-Network Access Detected`,
        description: `Host "${hostname}" is accessing from outside the corporate network (IP: ${publicIp || 'unknown'}) without VPN. SSID: ${ssid || 'unknown'}`,
        metadata: {
          publicIp,
          ssid,
          vpnActive
        }
      });
      
      await alert.save();
      return [alert];
    }
  }
  
  return [];
}

/**
 * Run all alert rules for incoming telemetry
 */
async function processAlertRules(hostId, hostname, telemetryData) {
  const alerts = [];
  
  try {
    // Check network usage
    if (telemetryData.network && telemetryData.network.length > 0) {
      const networkAlerts = await checkHighNetworkUsage(hostId, hostname, telemetryData.network);
      alerts.push(...networkAlerts);
      
      // Check high upload
      const uploadAlerts = await checkHighUpload(hostId, hostname, telemetryData.network);
      alerts.push(...uploadAlerts);
    }
    
    // Check file events
    if (telemetryData.file_events && telemetryData.file_events.length > 0) {
      const fileAlerts = await checkBulkFileDeletion(hostId, hostname, telemetryData.file_events);
      alerts.push(...fileAlerts);
    }
    
    // Check domain uploads
    if (telemetryData.domains && telemetryData.domains.length > 0) {
      const domainAlerts = await checkSuspiciousDomainUpload(hostId, hostname, telemetryData.domains);
      alerts.push(...domainAlerts);
    }
    
    // Check off-network access
    if (telemetryData.networkContext) {
      const offNetworkAlerts = await checkOffNetwork(hostId, hostname, telemetryData.networkContext);
      alerts.push(...offNetworkAlerts);
    }
    
    // Check CPU usage
    if (telemetryData.metrics && telemetryData.metrics.cpu) {
      const cpuAlerts = await checkHighCPUUsage(hostId, hostname, telemetryData.metrics.cpu.usage);
      alerts.push(...cpuAlerts);
    }
    
    // Check memory usage
    if (telemetryData.metrics && telemetryData.metrics.ram) {
      const memoryAlerts = await checkHighMemoryUsage(hostId, hostname, telemetryData.metrics.ram.usage);
      alerts.push(...memoryAlerts);
    }
    
    // Check disk usage
    if (telemetryData.metrics && telemetryData.metrics.disk) {
      const diskAlerts = await checkHighDiskUsage(hostId, hostname, telemetryData.metrics.disk.usage);
      alerts.push(...diskAlerts);
    }
    
  } catch (error) {
    console.error('Error processing alert rules:', error);
  }
  
  return alerts;
}

/**
 * Check all hosts for offline status (scheduled task)
 */
async function checkAllHostsStatus() {
  const Host = require('../models/Host');
  const hosts = await Host.find({});
  const alerts = [];
  
  for (const host of hosts) {
    const offlineAlerts = await checkHostOffline(host._id, host.hostname, host.lastSeen);
    alerts.push(...offlineAlerts);
    
    // Update host status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (host.lastSeen < fiveMinutesAgo && host.status !== 'offline') {
      host.status = 'offline';
      await host.save();
    }
  }
  
  return alerts;
}

module.exports = {
  processAlertRules,
  checkAllHostsStatus,
  checkHighNetworkUsage,
  checkHighUpload,
  checkBulkFileDeletion,
  checkSuspiciousDomainUpload,
  checkOffNetwork,
  checkHighCPUUsage,
  checkHighMemoryUsage,
  checkHighDiskUsage,
  checkHostOffline
};



