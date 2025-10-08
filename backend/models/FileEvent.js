const mongoose = require('mongoose');

const FileEventSchema = new mongoose.Schema({
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
  path: {
    type: String,
    required: true
  },
  operation: {
    type: String,
    enum: ['create', 'modify', 'delete', 'rename', 'access'],
    required: true
  },
  fileType: {
    type: String,
    default: 'unknown'
  },
  size: {
    type: Number, // Size in bytes
    default: 0
  },
  user: {
    type: String,
    default: null
  },
  processName: {
    type: String,
    default: null
  },
  hash: {
    type: String,
    default: null
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
FileEventSchema.index({ hostId: 1, timestamp: -1 });
FileEventSchema.index({ operation: 1 });
FileEventSchema.index({ path: 1 });
FileEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model('FileEvent', FileEventSchema);



