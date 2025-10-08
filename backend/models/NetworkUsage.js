const mongoose = require('mongoose');

const NetworkUsageSchema = new mongoose.Schema({
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
  pid: {
    type: Number,
    default: null
  },
  processName: {
    type: String,
    default: null
  },
  protocol: {
    type: String,
    enum: ['tcp', 'udp', 'icmp', 'other'],
    default: 'tcp'
  },
  localAddress: {
    type: String,
    default: null
  },
  localPort: {
    type: Number,
    default: null
  },
  remoteAddress: {
    type: String,
    default: null
  },
  remotePort: {
    type: Number,
    default: null
  },
  bytesIn: {
    type: Number,
    default: 0
  },
  bytesOut: {
    type: Number,
    default: 0
  },
  packetsIn: {
    type: Number,
    default: 0
  },
  packetsOut: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
NetworkUsageSchema.index({ hostId: 1, timestamp: -1 });
NetworkUsageSchema.index({ processName: 1 });
NetworkUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1296000 }); // Auto-delete after 15 days

module.exports = mongoose.model('NetworkUsage', NetworkUsageSchema);



