const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
    required: true,
    index: true
  },
  sessionType: {
    type: String,
    enum: ['sso', 'browser', 'local_login', 'rdp', 'vpn'],
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: String,  // Browser name or application (e.g., "Chrome", "Edge", "Firefox")
    default: null
  },
  clientVersion: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
UserSessionSchema.index({ userId: 1, createdAt: -1 });
UserSessionSchema.index({ hostId: 1, createdAt: -1 });
UserSessionSchema.index({ sessionId: 1 });
UserSessionSchema.index({ isActive: 1 });
UserSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

module.exports = mongoose.model('UserSession', UserSessionSchema);

