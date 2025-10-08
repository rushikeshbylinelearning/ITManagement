const mongoose = require('mongoose');

const HostSchema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  agentId: {
    type: String,
    required: false,  // May not have agentId immediately after installation
    unique: true,
    sparse: true,  // Allow multiple null values
    trim: true
  },
  os: {
    type: String,
    required: true
  },
  osVersion: {
    type: String,
    default: null
  },
  cpu: {
    model: String,
    cores: Number,
    usage: Number // Current CPU usage percentage
  },
  ram: {
    total: Number, // Total RAM in MB
    used: Number,  // Used RAM in MB
    usage: Number  // Usage percentage
  },
  disk: {
    total: Number, // Total disk in GB
    used: Number,  // Used disk in GB
    usage: Number  // Usage percentage
  },
  agentVersion: {
    type: String,
    default: '1.0.0'
  },
  ipAddress: {
    type: String,
    default: null
  },
  publicIp: {
    type: String,
    default: null  // Public IP for off-network detection
  },
  macAddress: {
    type: String,
    default: null
  },
  vpnActive: {
    type: Boolean,
    default: false  // VPN connection status
  },
  ssid: {
    type: String,
    default: null  // Wi-Fi network SSID
  },
  uptime: {
    type: Number,  // Uptime in seconds
    default: 0
  },
  batteryPercent: {
    type: Number,  // Battery percentage for laptops
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'warning', 'pending'],
    default: 'pending'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  installedBy: {
    type: String,
    default: null,
    trim: true
  },
  installedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if host is online (seen in last 5 minutes)
HostSchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen > fiveMinutesAgo;
});

// Index for faster queries
HostSchema.index({ hostname: 1 });
HostSchema.index({ status: 1 });
HostSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('Host', HostSchema);



