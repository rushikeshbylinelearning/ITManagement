// routes/inquiries.js

const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ✅ SECURED: Apply protection to all inquiry routes.
router.use(protect);

// @route   POST /api/inquiries
// @desc    Create a new inquiry
// @access  Private (Any authenticated user)
router.post('/', async (req, res) => {
  try {
    const { type, description, urgency } = req.body;
    if (!type || !description || !urgency) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }
    const inquiry = new Inquiry({
      user: req.user.id, // Use ID from protect middleware
      type,
      description,
      urgency,
    });
    await inquiry.save();
    console.log(`Admin Notification: New inquiry from user ${req.user.name}`);
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries
// @access  Private (Admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const inquiries = await Inquiry.find().populate('user', 'name email');
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/inquiries/user/:userId
// @desc    Get inquiries for a specific user
// @access  Private (Owner or Admin)
router.get('/user/:userId', async (req, res) => {
  // ✅ The internal authorization logic here is still valid and works well with 'protect'.
  if (req.user.id.toString() !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const inquiries = await Inquiry.find({ user: req.params.userId });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PATCH /api/inquiries/:id
// @desc    Update inquiry status
// @access  Private (Admin only)
router.patch('/:id', authorize('admin'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (req.body.status) inquiry.status = req.body.status;
    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete an inquiry
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;