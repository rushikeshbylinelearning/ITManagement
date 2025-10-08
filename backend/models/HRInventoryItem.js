// models/HRInventoryItem.js

const mongoose = require('mongoose');

const HRInventoryItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'in-repair', 'decommissioned'],
    default: 'available',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  purchaseDate: {
    type: Date
  },
  assignedDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// ✅ ADDED: Indexes for common query patterns
// Index for finding items assigned to a specific user
HRInventoryItemSchema.index({ assignedTo: 1, createdAt: -1 });
// Index for general filtering and sorting
HRInventoryItemSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('HRInventoryItem', HRInventoryItemSchema);