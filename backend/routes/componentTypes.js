// routes/componentTypes.js
const express = require('express');
const router = express.Router();
const ComponentType = require('../models/ComponentType');
const { protect, authorize } = require('../middleware/auth');

// ✅ All routes are now protected.
// GET is available to all logged-in users to populate dropdowns.
// POST, PUT, DELETE are restricted to admins and technicians.

// @route   GET /api/component-types
// @desc    Get all component types
// @access  Private (All authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    const types = await ComponentType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ msg: 'Server error while fetching component types' });
  }
});

// @route   POST /api/component-types
// @desc    Create new component type
// @access  Private (Admin/Technician)
router.post('/', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ msg: 'Name is required' });

    const existing = await ComponentType.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) return res.status(400).json({ msg: 'Component type already exists' });

    const newType = new ComponentType({ name: name.trim(), description });
    await newType.save();
    res.status(201).json(newType);
  } catch (err) {
    res.status(500).json({ msg: 'Server error while creating component type' });
  }
});

// @route   PUT /api/component-types/:id
// @desc    Update a component type
// @access  Private (Admin/Technician)
router.put('/:id', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const updated = await ComponentType.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Component type not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Server error while updating component type' });
  }
});

// @route   DELETE /api/component-types/:id
// @desc    Delete a component type
// @access  Private (Admin/Technician)
router.delete('/:id', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const deleted = await ComponentType.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Component type not found' });

    res.json({ msg: 'Component type deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error while deleting component type' });
  }
});

module.exports = router;