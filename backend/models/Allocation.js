// models/Allocation.js

const mongoose = require('mongoose');

// --- CORRECTED SCHEMA ---
// This schema is now "flat" to match your frontend and is much simpler.
const allocationSchema = new mongoose.Schema({
  // Link to the User document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // User information (denormalized for easy display)
  employeeId: { type: String, required: true, unique: true }, // One allocation document per employee
  employeeName: { type: String, required: true },
  role: { type: String },
  seatNo: { type: String },

  // --- Flat Asset Fields ---
  monitorMake: { type: String },
  monitorSerialNo: { type: String },
  // ADDED FOR 2nd MONITOR
  monitorMake2: { type: String },
  monitorSerialNo2: { type: String },
  // END ADD
  keyboardMake: { type: String },
  kbSerialNo: { type: String },
  mouseMake: { type: String },
  mouseSerialNo: { type: String },
  upsMake: { type: String },
  upsSerialNo: { type: String },
  cpuBox: { type: String },
  cpuSerialNo: { type: String },
  processor: { type: String },
  gpu: { type: String },
  ram: { type: String },
  hdd: { type: String },
  penTabMake: { type: String },
  penTabSn: { type: String },
  headphoneMake: { type: String },
  headphoneSn: { type: String }, // Corrected comment: S/N is expected from inventory.
  laptopMake: { type: String },
  laptopSerialNo: { type: String },
  remark: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Allocation', allocationSchema);