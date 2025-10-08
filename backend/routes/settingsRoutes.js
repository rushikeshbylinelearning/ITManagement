// routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get application settings
// @access  Private (All authenticated users)
router.get('/', protect, getSettings);

// @route   PUT /api/settings
// @desc    Update application settings
// @access  Private (Admin only)
router.put('/', protect, authorize('admin'), updateSettings);

module.exports = router;