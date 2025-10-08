const mongoose = require('mongoose');

/**
 * AgentToken Model
 * Stores one-time registration tokens generated at user login
 * These tokens allow agents to auto-register securely
 */
const AgentTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  hostname: {
    type: String,
    default: null
  },
  os: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  agentId: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, { 
  timestamps: true 
});

// Index for automatic cleanup of expired tokens
AgentTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AgentToken', AgentTokenSchema);




