const mongoose = require('mongoose');

const WebsiteUsageSchema = new mongoose.Schema({
  domain: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  dataUsedMB: { 
    type: Number, 
    required: true,
    default: 0
  },
  uploadMB: {
    type: Number,
    default: 0
  },
  downloadMB: {
    type: Number,
    default: 0
  },
  requestCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const NetworkMonitoringSchema = new mongoose.Schema({
  systemName: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  systemId: { 
    type: String, 
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  timestamp: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true
  },
  totalUploadMB: { 
    type: Number, 
    required: true,
    default: 0
  },
  totalDownloadMB: { 
    type: Number, 
    required: true,
    default: 0
  },
  totalDataMB: {
    type: Number,
    required: true,
    default: 0
  },
  websites: [WebsiteUsageSchema],
  agentVersion: {
    type: String,
    default: '1.0.0'
  },
  systemInfo: {
    os: String,
    osVersion: String,
    ipAddress: String,
    macAddress: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Compound index for efficient querying
NetworkMonitoringSchema.index({ systemId: 1, timestamp: -1 });
NetworkMonitoringSchema.index({ userId: 1, timestamp: -1 });
NetworkMonitoringSchema.index({ 'websites.domain': 1 });

// Pre-save middleware to calculate total data
NetworkMonitoringSchema.pre('save', function(next) {
  this.totalDataMB = this.totalUploadMB + this.totalDownloadMB;
  next();
});

// Static method to get aggregated usage by system
NetworkMonitoringSchema.statics.getSystemUsage = async function(systemId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        systemId: systemId,
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$systemId',
        systemName: { $first: '$systemName' },
        totalUpload: { $sum: '$totalUploadMB' },
        totalDownload: { $sum: '$totalDownloadMB' },
        totalData: { $sum: '$totalDataMB' },
        recordCount: { $sum: 1 },
        lastUpdate: { $max: '$timestamp' }
      }
    }
  ]);
};

// Static method to get website-wise usage
NetworkMonitoringSchema.statics.getWebsiteUsage = async function(systemId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        systemId: systemId,
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    { $unwind: '$websites' },
    {
      $group: {
        _id: '$websites.domain',
        totalDataUsed: { $sum: '$websites.dataUsedMB' },
        totalUpload: { $sum: '$websites.uploadMB' },
        totalDownload: { $sum: '$websites.downloadMB' },
        requestCount: { $sum: '$websites.requestCount' }
      }
    },
    { $sort: { totalDataUsed: -1 } }
  ]);
};

// Static method to get all systems overview
NetworkMonitoringSchema.statics.getAllSystemsOverview = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$systemId',
        systemName: { $first: '$systemName' },
        userId: { $first: '$userId' },
        totalUpload: { $sum: '$totalUploadMB' },
        totalDownload: { $sum: '$totalDownloadMB' },
        totalData: { $sum: '$totalDataMB' },
        lastUpdate: { $max: '$timestamp' },
        recordCount: { $sum: 1 }
      }
    },
    { $sort: { totalData: -1 } }
  ]);
};

module.exports = mongoose.model('NetworkMonitoring', NetworkMonitoringSchema);

