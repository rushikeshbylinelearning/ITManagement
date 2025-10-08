const mongoose = require('mongoose');

const DomainAccessSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
    required: true,
    index: true
  },
  hostname: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    default: null  // Optional - only if privacy settings allow
  },
  source: {
    type: String,
    enum: ['dns', 'proxy', 'agent', 'netflow'],
    default: 'agent'
  },
  frequency: {
    type: Number,
    default: 1  // Number of times accessed in this batch
  },
  bytesTransferred: {
    type: Number,
    default: 0  // Bytes uploaded/downloaded to this domain
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
DomainAccessSchema.index({ hostId: 1, timestamp: -1 });
DomainAccessSchema.index({ userId: 1, timestamp: -1 });
DomainAccessSchema.index({ domain: 1, timestamp: -1 });
DomainAccessSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

module.exports = mongoose.model('DomainAccess', DomainAccessSchema);

