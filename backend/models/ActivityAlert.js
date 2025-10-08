const mongoose = require('mongoose');

const activityAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: { type: String, required: true },
  systemName: { type: String },
  
  // Alert details
  alertType: {
    type: String,
    required: true,
    enum: [
      'HIGH_BANDWIDTH',
      'SUSPICIOUS_ACTIVITY',
      'MULTIPLE_LOGINS',
      'LARGE_FILE_TRANSFER',
      'UNUSUAL_CONNECTION',
      'POLICY_VIOLATION',
      'HIGH_RESOURCE_USAGE',
      'UNAUTHORIZED_SOFTWARE',
      'DATA_EXFILTRATION',
      'SECURITY_THREAT'
    ],
    index: true
  },
  
  severity: {
    type: String,
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true
  },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Related data
  relatedLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserActivityLog'
  },
  
  metadata: {
    bandwidthMB: { type: Number },
    fileSize: { type: Number },
    fileName: { type: String },
    connectionIP: { type: String },
    applicationName: { type: String },
    websiteUrl: { type: String },
    riskScore: { type: Number }
  },
  
  // Alert status
  status: {
    type: String,
    enum: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
    default: 'NEW',
    index: true
  },
  
  // Admin actions
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: { type: Date },
  
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: { type: Date },
  resolution: { type: String },
  
  // Notes
  notes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Alert triggered time
  triggeredAt: { type: Date, required: true, default: Date.now, index: true },
  
  // Auto-resolve after 7 days if dismissed
  expiresAt: { type: Date }
}, {
  timestamps: true,
  collection: 'activity_alerts'
});

// Indexes
activityAlertSchema.index({ status: 1, severity: -1, triggeredAt: -1 });
activityAlertSchema.index({ userId: 1, triggeredAt: -1 });
activityAlertSchema.index({ triggeredAt: -1 });

// TTL index for auto-cleanup
activityAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
activityAlertSchema.methods.acknowledge = function(adminId) {
  this.status = 'ACKNOWLEDGED';
  this.acknowledgedBy = adminId;
  this.acknowledgedAt = new Date();
};

activityAlertSchema.methods.resolve = function(adminId, resolutionText) {
  this.status = 'RESOLVED';
  this.resolvedBy = adminId;
  this.resolvedAt = new Date();
  this.resolution = resolutionText;
};

activityAlertSchema.methods.dismiss = function() {
  this.status = 'DISMISSED';
  // Set expiration for 7 days from now
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

activityAlertSchema.methods.addNote = function(adminId, content) {
  this.notes.push({
    addedBy: adminId,
    content,
    timestamp: new Date()
  });
};

// Statics
activityAlertSchema.statics.getAlertStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        triggeredAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'NEW'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    new: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    resolved: 0
  };
};

activityAlertSchema.statics.getAlertsByType = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        triggeredAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$alertType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

const ActivityAlert = mongoose.model('ActivityAlert', activityAlertSchema);

module.exports = ActivityAlert;

