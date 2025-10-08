const mongoose = require('mongoose');

const websiteVisitSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String },
  domain: { type: String },
  duration: { type: Number, default: 0 }, // seconds
  visitTime: { type: Date, required: true }
}, { _id: false });

const fileTransferSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String },
  fileSize: { type: Number }, // bytes
  target: { type: String }, // destination (USB, Network, Email, etc.)
  method: { type: String, enum: ['USB', 'Network', 'Email', 'Cloud', 'Unknown'] },
  action: { type: String, enum: ['Copy', 'Move', 'Delete', 'Upload', 'Download'] },
  timestamp: { type: Date, required: true }
}, { _id: false });

const loggedAccountSchema = new mongoose.Schema({
  browser: { type: String },
  platform: { type: String },
  email: { type: String },
  accountType: { type: String },
  loginTime: { type: Date }
}, { _id: false });

const externalConnectionSchema = new mongoose.Schema({
  remoteIP: { type: String, required: true },
  remotePort: { type: Number },
  localPort: { type: Number },
  protocol: { type: String },
  location: {
    country: { type: String },
    city: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  connectionTime: { type: Date, required: true },
  status: { type: String, enum: ['ESTABLISHED', 'LISTENING', 'TIME_WAIT', 'CLOSE_WAIT'] }
}, { _id: false });

const applicationUsageSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  windowTitle: { type: String },
  processName: { type: String },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number }, // seconds
  isActive: { type: Boolean, default: false }
}, { _id: false });

const userActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: { type: String, required: true },
  systemName: { type: String, required: true, index: true },
  agentId: { type: String, index: true },
  
  // Timestamp for this activity log entry
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  
  // Network activity
  network: {
    uploadBytes: { type: Number, default: 0 },
    downloadBytes: { type: Number, default: 0 },
    uploadMB: { type: Number, default: 0 },
    downloadMB: { type: Number, default: 0 },
    totalMB: { type: Number, default: 0 },
    activeConnections: { type: Number, default: 0 }
  },
  
  // Website activity
  websites: [websiteVisitSchema],
  
  // System status
  systemStatus: {
    cpuUsage: { type: Number, min: 0, max: 100 },
    memoryUsage: { type: Number, min: 0, max: 100 },
    memoryUsedMB: { type: Number },
    memoryTotalMB: { type: Number },
    diskUsage: { type: Number, min: 0, max: 100 },
    uptime: { type: Number }, // seconds
    activeApps: { type: Number, default: 0 },
    idleTime: { type: Number, default: 0 }, // seconds
    temperature: { type: Number },
    batteryLevel: { type: Number }
  },
  
  // Application usage
  applications: [applicationUsageSchema],
  
  // File transfers
  fileTransfers: [fileTransferSchema],
  
  // Logged accounts (browser, email clients, etc.)
  loggedAccounts: [loggedAccountSchema],
  
  // External/out-of-network connections
  externalConnections: [externalConnectionSchema],
  
  // Metadata
  reportInterval: { type: Number, default: 300 }, // seconds (5 minutes)
  agentVersion: { type: String },
  osVersion: { type: String },
  
  // Flags and analysis
  flags: {
    highBandwidth: { type: Boolean, default: false },
    suspiciousActivity: { type: Boolean, default: false },
    multipleLogins: { type: Boolean, default: false },
    largeFileTransfer: { type: Boolean, default: false },
    unusualConnection: { type: Boolean, default: false },
    policyViolation: { type: Boolean, default: false }
  },
  
  // Risk score (0-100)
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  
  // Analysis notes from backend
  analysisNotes: [String]
}, {
  timestamps: true,
  collection: 'user_activity_logs'
});

// Indexes for efficient querying
userActivityLogSchema.index({ timestamp: -1 });
userActivityLogSchema.index({ userId: 1, timestamp: -1 });
userActivityLogSchema.index({ systemName: 1, timestamp: -1 });
userActivityLogSchema.index({ 'flags.suspiciousActivity': 1 });
userActivityLogSchema.index({ riskScore: -1 });
userActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Virtual for total bandwidth
userActivityLogSchema.virtual('network.totalBytes').get(function() {
  return (this.network.uploadBytes || 0) + (this.network.downloadBytes || 0);
});

// Methods
userActivityLogSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // High bandwidth usage (>500 MB)
  if (this.network.totalMB > 500) score += 20;
  
  // Multiple logged accounts
  if (this.loggedAccounts && this.loggedAccounts.length > 3) score += 15;
  
  // Large file transfers
  const largeTransfers = this.fileTransfers.filter(t => t.fileSize > 100 * 1024 * 1024); // 100 MB
  score += Math.min(largeTransfers.length * 10, 30);
  
  // Unusual external connections
  if (this.externalConnections && this.externalConnections.length > 10) score += 20;
  
  // High system resource usage
  if (this.systemStatus.cpuUsage > 90 || this.systemStatus.memoryUsage > 90) score += 10;
  
  // Visiting suspicious sites (this would require a blacklist - simplified here)
  const suspiciousKeywords = ['proxy', 'vpn', 'torrent', 'crack'];
  const suspiciousSites = this.websites.filter(w => 
    suspiciousKeywords.some(kw => w.url.toLowerCase().includes(kw))
  );
  score += Math.min(suspiciousSites.length * 5, 15);
  
  this.riskScore = Math.min(score, 100);
  return this.riskScore;
};

userActivityLogSchema.methods.analyzeAndFlag = function() {
  // High bandwidth flag
  this.flags.highBandwidth = this.network.totalMB > 500;
  
  // Multiple logins flag
  this.flags.multipleLogins = this.loggedAccounts && this.loggedAccounts.length > 3;
  
  // Large file transfer flag
  this.flags.largeFileTransfer = this.fileTransfers.some(t => t.fileSize > 100 * 1024 * 1024);
  
  // Unusual connection flag
  this.flags.unusualConnection = this.externalConnections && this.externalConnections.length > 10;
  
  // Calculate risk score
  this.calculateRiskScore();
  
  // Suspicious activity flag (risk score > 50)
  this.flags.suspiciousActivity = this.riskScore > 50;
};

// Statics
userActivityLogSchema.statics.getActivitySummary = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalLogs: { $sum: 1 },
        totalUploadMB: { $sum: '$network.uploadMB' },
        totalDownloadMB: { $sum: '$network.downloadMB' },
        avgCpuUsage: { $avg: '$systemStatus.cpuUsage' },
        avgMemoryUsage: { $avg: '$systemStatus.memoryUsage' },
        totalWebsites: { $sum: { $size: '$websites' } },
        totalFileTransfers: { $sum: { $size: '$fileTransfers' } },
        totalExternalConnections: { $sum: { $size: '$externalConnections' } },
        avgRiskScore: { $avg: '$riskScore' },
        suspiciousActivities: {
          $sum: { $cond: ['$flags.suspiciousActivity', 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

userActivityLogSchema.statics.getTopWebsites = async function(userId, startDate, endDate, limit = 10) {
  const logs = await this.find({
    userId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).select('websites');
  
  const websiteMap = new Map();
  
  logs.forEach(log => {
    log.websites.forEach(site => {
      const domain = site.domain || new URL(site.url).hostname;
      if (websiteMap.has(domain)) {
        const existing = websiteMap.get(domain);
        existing.visits += 1;
        existing.totalDuration += site.duration || 0;
      } else {
        websiteMap.set(domain, {
          domain,
          visits: 1,
          totalDuration: site.duration || 0,
          lastVisit: site.visitTime
        });
      }
    });
  });
  
  return Array.from(websiteMap.values())
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
};

const UserActivityLog = mongoose.model('UserActivityLog', userActivityLogSchema);

module.exports = UserActivityLog;

