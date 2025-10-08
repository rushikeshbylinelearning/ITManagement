const mongoose = require('mongoose');

const ProcessEventSchema = new mongoose.Schema({
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
    required: true
  },
  processName: {
    type: String,
    required: true
  },
  executablePath: {
    type: String,
    default: null
  },
  commandLine: {
    type: String,
    default: null
  },
  user: {
    type: String,
    default: null
  },
  cpuUsage: {
    type: Number,
    default: 0
  },
  memoryUsage: {
    type: Number, // Memory in MB
    default: 0
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['running', 'stopped', 'terminated'],
    default: 'running'
  }
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
ProcessEventSchema.index({ hostId: 1, startTime: -1 });
ProcessEventSchema.index({ processName: 1 });
ProcessEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model('ProcessEvent', ProcessEventSchema);



