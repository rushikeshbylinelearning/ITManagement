const mongoose = require('mongoose');

const MonitoringAlertSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: [
      'high_network_usage',
      'high_upload',
      'bulk_file_deletion',
      'suspicious_upload',
      'off_network',
      'high_cpu_usage',
      'high_memory_usage',
      'high_disk_usage',
      'suspicious_process',
      'host_offline',
      'agent_error',
      'custom'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedNote: {
    type: String,
    default: null
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
MonitoringAlertSchema.index({ hostId: 1, createdAt: -1 });
MonitoringAlertSchema.index({ type: 1 });
MonitoringAlertSchema.index({ severity: 1 });
MonitoringAlertSchema.index({ resolved: 1 });

module.exports = mongoose.model('MonitoringAlert', MonitoringAlertSchema);



