const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const SystemAgentSchema = new mongoose.Schema({
  systemId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  systemName: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  agentToken: {
    type: String,
    required: true,
    select: false // Don't return token by default
  },
  agentVersion: {
    type: String,
    default: '1.0.0'
  },
  systemInfo: {
    os: String,
    osVersion: String,
    ipAddress: String,
    macAddress: String,
    cpu: String,
    ram: String
  },
  installDate: {
    type: Date,
    default: Date.now
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'uninstalled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
SystemAgentSchema.index({ userId: 1, isActive: 1 });
SystemAgentSchema.index({ systemId: 1, isActive: 1 });

// Method to generate agent JWT token
SystemAgentSchema.methods.generateAgentToken = function() {
  const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET or LOCAL_JWT_SECRET must be defined in environment variables');
  }
  
  return jwt.sign(
    { 
      systemId: this.systemId,
      systemName: this.systemName,
      userId: this.userId,
      type: 'agent'
    },
    secret,
    { expiresIn: '365d' } // Long-lived token for agent
  );
};

// Static method to verify agent token
SystemAgentSchema.statics.verifyAgentToken = function(token) {
  try {
    const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or LOCAL_JWT_SECRET must be defined in environment variables');
    }
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Update heartbeat
SystemAgentSchema.methods.updateHeartbeat = async function() {
  this.lastHeartbeat = Date.now();
  this.status = 'active';
  this.isActive = true;
  await this.save();
};

module.exports = mongoose.model('SystemAgent', SystemAgentSchema);

