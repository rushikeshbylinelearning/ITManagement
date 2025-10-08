// routes/tickets.js

const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ✅ Apply 'protect' middleware to all routes in this file
router.use(protect);

// @route   GET /api/tickets
// @desc    Get tickets with dynamic filtering
// @access  Private (Role-based logic inside)
router.get('/', async (req, res) => {
    try {
        const query = (req.user.role === 'admin' || req.user.role === 'technician') 
            ? {} 
            : { createdBy: req.user.id };

        const { status, search, user, date } = req.query;

        if (status && status !== 'all') {
            query.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [{ component: searchRegex }, { issue: searchRegex }];
        }
        if (user && (req.user.role === 'admin' || req.user.role === 'technician')) {
            const users = await User.find({ name: { $regex: user, $options: 'i' } }).select('_id');
            const userIds = users.map(u => u._id);
            if (userIds.length > 0) {
                query.createdBy = { $in: userIds };
            } else {
                return res.json([]);
            }
        }
        if (date) {
            const startDate = new Date(date);
            startDate.setUTCHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setUTCHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lt: endDate };
        }

        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(tickets);
    } catch (err) {
        console.error("Error fetching tickets:", err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tickets
// @desc    Create a ticket
// @access  Private (All authenticated users)
router.post('/', async (req, res) => {
  try {
    const ticketData = { ...req.body, createdBy: req.user.id };
    const newTicket = new Ticket(ticketData);
    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (err) {
    console.error("Ticket creation error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/tickets/:id
// @desc    Update a ticket
// @access  Private (Role-based logic inside)
router.put('/:id', async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket || ticket.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to edit this ticket' });
        }
        // Prevent non-admins from changing status or assignment
        delete req.body.status;
        delete req.body.assignedTo;
    }

    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete a ticket
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
        res.json({ msg: 'Ticket removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tickets/user-stats/:userId
// @desc    Get ticket stats for a specific user
// @access  Private (Admin/Technician)
router.get('/user-stats/:userId', authorize('admin', 'technician'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const [total, open, closed] = await Promise.all([
      Ticket.countDocuments({ createdBy: userId }),
      Ticket.countDocuments({ createdBy: userId, status: 'Open' }),
      Ticket.countDocuments({ createdBy: userId, status: 'Closed' })
    ]);
    res.json({ total, open, closed });
  } catch (err) {
    console.error("Error fetching user ticket stats:", err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/tickets/batch-delete
// @desc    Delete multiple tickets
// @access  Private (Admin only)
router.post('/batch-delete', authorize('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Ticket IDs must be provided as a non-empty array.' });
    }
    const result = await Ticket.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'No matching tickets found to delete.' });
    }
    res.status(200).json({
      message: `${result.deletedCount} ticket(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error during batch deletion:', error);
    res.status(500).json({ message: 'Server error during batch deletion.' });
  }
});

module.exports = router;