const mongoose = require('mongoose');

const MonitoringSettingsSchema = new mongoose.Schema({
  // Singleton document - only one settings record
  singleton: {
    type: Boolean,
    default: true,
    unique: true,
    required: true
  },
  
  // Data Retention Settings (in days)
  retention: {
    networkUsage: {
      type: Number,
      default: 15,  // 15 days
      min: 1,
      max: 365
    },
    domainAccess: {
      type: Number,
      default: 90,  // 90 days
      min: 1,
      max: 365
    },
    fileEvents: {
      type: Number,
      default: 30,  // 30 days
      min: 1,
      max: 365
    },
    processEvents: {
      type: Number,
      default: 30,  // 30 days
      min: 1,
      max: 365
    },
    userSessions: {
      type: Number,
      default: 90,  // 90 days
      min: 1,
      max: 365
    }
  },
  
  // Privacy Settings
  privacy: {
    storeFullUrls: {
      type: Boolean,
      default: false  // Default to domain-only for privacy
    },
    storeFileContents: {
      type: Boolean,
      default: false  // Never store file contents by default
    },
    anonymizeUserData: {
      type: Boolean,
      default: false
    },
    enableScreenshotCapture: {
      type: Boolean,
      default: false  // Disabled by default
    }
  },
  
  // Monitored Directories (for file event tracking)
  watchedDirectories: {
    type: [String],
    default: [
      'Desktop',
      'Documents',
      'Downloads'
    ]
  },
  
  // Domain Whitelist/Blacklist
  domains: {
    whitelist: {
      type: [String],
      default: []  // Approved domains (no alerts)
    },
    blacklist: {
      type: [String],
      default: []  // Blocked domains (always alert)
    }
  },
  
  // Alert Thresholds
  alertThresholds: {
    highUploadMB: {
      type: Number,
      default: 150  // MB per minute
    },
    bulkDeletionCount: {
      type: Number,
      default: 50  // files per minute
    },
    highCpuPercent: {
      type: Number,
      default: 90
    },
    highMemoryPercent: {
      type: Number,
      default: 90
    },
    highDiskPercent: {
      type: Number,
      default: 90
    },
    offlineMinutes: {
      type: Number,
      default: 15  // Alert if host offline for 15 minutes
    }
  },
  
  // Network Settings
  network: {
    corporateIpRanges: {
      type: [String],
      default: []  // e.g., ['192.168.0.0/16', '10.0.0.0/8']
    },
    vpnGateways: {
      type: [String],
      default: []  // VPN gateway IPs
    },
    trustedWifiSSIDs: {
      type: [String],
      default: []  // Corporate Wi-Fi SSIDs
    }
  },
  
  // Integration Settings
  integrations: {
    proxyEnabled: {
      type: Boolean,
      default: false
    },
    proxyUrl: {
      type: String,
      default: null
    },
    dnsEnabled: {
      type: Boolean,
      default: false
    },
    dnsServerUrl: {
      type: String,
      default: null
    },
    netflowEnabled: {
      type: Boolean,
      default: false
    },
    netflowCollectorUrl: {
      type: String,
      default: null
    },
    ssoEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Agent Configuration
  agentConfig: {
    pollingIntervalSeconds: {
      type: Number,
      default: 60,
      min: 10,
      max: 3600
    },
    enableFileMonitoring: {
      type: Boolean,
      default: true
    },
    enableNetworkMonitoring: {
      type: Boolean,
      default: true
    },
    enableProcessMonitoring: {
      type: Boolean,
      default: true
    },
    logLevel: {
      type: String,
      enum: ['DEBUG', 'INFO', 'WARNING', 'ERROR'],
      default: 'INFO'
    }
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { 
  timestamps: true 
});

// Static method to get settings (or create default if doesn't exist)
MonitoringSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ singleton: true });
  if (!settings) {
    settings = await this.create({ singleton: true });
  }
  return settings;
};

module.exports = mongoose.model('MonitoringSettings', MonitoringSettingsSchema);

