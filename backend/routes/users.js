// routes/users.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const InventoryItem = require('../models/InventoryItem');
const { protect, authorize } = require('../middleware/auth');

// ✅ Apply 'protect' middleware globally. Specific routes will add 'authorize'.
router.use(protect);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/', authorize('admin'), async (req, res) => {
  const { name, email, password, role, employeeId, seatNumber, domain } = req.body;

  if (!name || !email || !password || !role || !employeeId) {
    return res.status(400).json({ msg: 'Please provide name, email, password, role, and employee ID.' });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ msg: 'User with this email already exists.' });

    const existingEmpId = await User.findOne({ employeeId });
    if (existingEmpId) return res.status(400).json({ msg: 'User with this Employee ID already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword, role, employeeId, seatNumber, domain });
    await user.save();

    const newUser = user.toObject();
    delete newUser.password;

    req.io?.emit('userAdded', newUser);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('POST /api/users error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user and their allocations
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    if (user._id.toString() === req.user.id) return res.status(400).json({ msg: 'You cannot delete your own account.' });

    const allocation = await Allocation.findOne({ user: user._id });
    if (allocation) {
      const serialFields = ['monitorSerialNo', 'monitorSerialNo2', 'kbSerialNo', 'mouseSerialNo', 'upsSerialNo', 'cpuSerialNo', 'penTabSn', 'headphoneSn', 'laptopSerialNo'];
      const serialsToUnassign = serialFields.map(field => allocation[field]).filter(sn => sn && typeof sn === 'string' && sn.trim());
      if (serialsToUnassign.length > 0) {
        await InventoryItem.updateMany(
          { serialNumber: { $in: serialsToUnassign } },
          { $set: { status: 'Unassigned' }, $unset: { assignedTo: "" } }
        );
      }
      await Allocation.findByIdAndDelete(allocation._id);
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    req.io?.emit('userDeleted', req.params.id);
    res.json({ msg: 'User and their allocations removed successfully.' });

  } catch (err) {
    console.error('DELETE /api/users/:id error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update a user's role
// @access  Private (Admin only)
router.put('/:id/role', authorize('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['user', 'technician', 'admin', 'employee', 'intern'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role specified.' });
  }
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ msg: 'User not found.' });
    if (userToUpdate._id.toString() === req.user.id && role !== 'admin') {
      return res.status(400).json({ msg: 'You cannot demote your own account.' });
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    req.io?.emit('userUpdated', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error('PUT /api/users/:id/role error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/users/:id
// @desc    Update full user info
// @access  Private (Admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  const { name, email, seatNumber, employeeId, role, password, domain } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ msg: 'User with this email already exists.' });
    }
    if (employeeId && employeeId !== user.employeeId) {
      const existingEmpId = await User.findOne({ employeeId });
      if (existingEmpId) return res.status(400).json({ msg: 'User with this Employee ID already exists.' });
    }

    const updatedFields = { name, email, seatNumber, employeeId, role, domain };
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true }).select('-password');
    req.io?.emit('userUpdated', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error('PUT /api/users/:id error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/allocations
// @desc    Get all allocations (for user management context)
// @access  Private (Admin only)
router.get('/allocations', authorize('admin'), async (req, res) => {
  try {
    const allocations = await Allocation.find();
    res.json(allocations);
  } catch (err) {
    console.error('GET /api/users/allocations error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/my-assets
// @desc    Get assets assigned to the logged-in user
// @access  Private (All authenticated users)
router.get('/my-assets', async (req, res) => {
  try {
    const userAllocation = await Allocation.findOne({ user: req.user.id });
    res.json({
      profile: req.user,
      assets: userAllocation || {}
    });
  } catch (err) {
    console.error('GET /api/users/my-assets error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;