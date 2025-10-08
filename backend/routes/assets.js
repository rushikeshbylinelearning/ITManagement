// routes/assets.js

const express = require('express');
const Asset = require('../models/Asset');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// ✅ Apply protection to all routes in this file
router.use(protect);

// @route   GET /api/assets
// @desc    Get all assets
// @access  Private (Admin/Technician)
router.get('/', authorize('admin', 'technician'), async (req, res) => {
    try {
        const assets = await Asset.find().populate('assignedTo', 'name email');
        res.json(assets);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/assets
// @desc    Create a new asset
// @access  Private (Admin/Technician)
router.post('/', authorize('admin', 'technician'), async (req, res) => {
    try {
        const newAsset = new Asset({ ...req.body });
        const asset = await newAsset.save();
        res.status(201).json(asset);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/assets/:id
// @desc    Update an asset
// @access  Private (Admin/Technician)
router.put('/:id', authorize('admin', 'technician'), async (req, res) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!asset) return res.status(404).json({ msg: 'Asset not found' });
        res.json(asset);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/assets/:id
// @desc    Delete an asset
// @access  Private (Admin/Technician)
router.delete('/:id', authorize('admin', 'technician'), async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) return res.status(404).json({ msg: 'Asset not found' });
        res.json({ msg: 'Asset removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/assets/my
// @desc    Get assets assigned to the logged-in user
// @access  Private (All authenticated users)
router.get('/my', async (req, res) => {
    try {
        // req.user.id comes from our 'protect' middleware
        const myAssets = await Asset.find({ assignedTo: req.user.id });
        res.json(myAssets);
    } catch (err) {
        console.error('Error fetching my assets:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;