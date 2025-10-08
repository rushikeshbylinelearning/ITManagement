// routes/dashboard.js

const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const { protect } = require('../middleware/auth');

// ✅ Apply 'protect' middleware to all routes in this file
router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics based on user role
// @access  Private (All authenticated users)
router.get('/stats', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'technician';

    const [openTickets, totalAssets, usersByRole, totalAllocations] = await Promise.all([
      Ticket.countDocuments({ status: { $regex: /^Open$/i } }),
      Asset.countDocuments(),
      User.aggregate([
        { $group: { _id: { $ifNull: ["$role", "unknown"] }, count: { $sum: 1 } } }
      ]),
      Allocation.countDocuments()
    ]);

    let additionalStats = {};
    if (isAdmin) {
      const [ closedTickets, pendingTickets, totalTickets, assetCategories, recentActivity ] = await Promise.all([
        Ticket.countDocuments({ status: { $regex: /^Closed$/i } }),
        Ticket.countDocuments({ status: { $regex: /^In Progress$/i } }),
        Ticket.countDocuments(),
        Asset.aggregate([ { $group: { _id: '$category', count: { $sum: 1 } } } ]),
        Ticket.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name')
      ]);

      additionalStats = {
        closedTickets,
        pendingTickets,
        totalTickets,
        assetCategories: assetCategories.reduce((acc, cat) => {
          if (cat._id) acc[cat._id] = cat.count;
          return acc;
        }, {}),
        recentActivity,
        systemHealth: { uptime: process.uptime(), memory: process.memoryUsage(), timestamp: new Date() }
      };
    }

    let userStats = {};
    if (!isAdmin) {
      const [myAllocations, myTickets, myCompletedTickets] = await Promise.all([
        Allocation.countDocuments({ user: req.user.id }),
        Ticket.countDocuments({ createdBy: req.user.id }),
        Ticket.countDocuments({ createdBy: req.user.id, status: { $regex: /^Closed$/i } })
      ]);

      userStats = {
        myAssets: myAllocations,
        myTickets: myTickets,
        myCompletedTickets,
        myOpenTickets: myTickets - myCompletedTickets
      };
    }

    const rolesCount = usersByRole.reduce((acc, role) => {
      acc[role._id] = role.count;
      return acc;
    }, {});

    res.json({
      openTickets,
      totalAssets,
      usersByRole: rolesCount,
      totalAllocations,
      totalUsers: Object.values(rolesCount).reduce((a, b) => a + b, 0),
      ...additionalStats,
      ...userStats,
      lastUpdated: new Date(),
      userRole: req.user.role
    });
  } catch (err) {
    console.error('❌ Dashboard stats error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   GET /api/dashboard/live-updates
// @desc    Get live update stats
// @access  Private (All authenticated users)
router.get('/live-updates', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'technician';

    const [openTickets, closedTickets, pendingTickets, totalAssets, totalAllocations] = await Promise.all([
      Ticket.countDocuments({ status: { $regex: /^Open$/i } }),
      Ticket.countDocuments({ status: { $regex: /^Closed$/i } }),
      Ticket.countDocuments({ status: { $regex: /^In Progress$/i } }),
      Asset.countDocuments(),
      Allocation.countDocuments()
    ]);

    const totalTickets = openTickets + closedTickets + pendingTickets;

    let userSpecificData = {};
    if (!isAdmin) {
      const [myAllocations, myTickets] = await Promise.all([
        Allocation.countDocuments({ user: req.user.id }),
        Ticket.countDocuments({ createdBy: req.user.id })
      ]);
      userSpecificData = { myAssets: myAllocations, myTickets: myTickets };
    }

    res.json({
      openTickets, closedTickets, pendingTickets, totalTickets,
      totalAssets, totalAllocations, ...userSpecificData,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('❌ Live updates error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   GET /api/dashboard/my-dashboard
// @desc    Get dashboard data for the logged-in user
// @access  Private (All authenticated users)
router.get('/my-dashboard', async (req, res) => {
  try {
    const [myAllocations, myTickets, myCompletedTickets, myOpenTickets] = await Promise.all([
      Allocation.countDocuments({ user: req.user.id }),
      Ticket.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).limit(10),
      Ticket.countDocuments({ createdBy: req.user.id, status: { $regex: /^Closed$/i } }),
      Ticket.countDocuments({ createdBy: req.user.id, status: { $regex: /^Open$/i } })
    ]);

    res.json({
      myAssets: myAllocations,
      myTickets: myTickets.length,
      myCompletedTickets,
      myOpenTickets,
      recentTickets: myTickets,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('❌ My dashboard error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   GET /api/dashboard/summary
// @desc    Get total asset count and counts for each component type
// @access  Private (All authenticated users)
router.get('/summary', async (req, res) => {
    try {
      const totalAssets = await Asset.countDocuments();
  
      const componentCountsResult = await Asset.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { _id: 0, component: '$_id', count: 1 } }
      ]);
  
      const componentCounts = componentCountsResult.reduce((acc, item) => {
        if (item.component) acc[item.component] = item.count;
        return acc;
      }, {});
  
      res.json({ totalAssets, componentCounts });
  
    } catch (err) {
      console.error('❌ Dashboard summary error:', err.message);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;