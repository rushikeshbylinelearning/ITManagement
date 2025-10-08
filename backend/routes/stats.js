// routes/stats.js

const express = require('express');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate average resolution time
function calculateAvgResolutionTime(resolvedTickets) {
  if (resolvedTickets.length === 0) return '0 hours';
  
  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const resolved = new Date(ticket.resolvedAt);
    return sum + (resolved - created);
  }, 0);
  
  const avgTimeMs = totalTime / resolvedTickets.length;
  const avgTimeHours = Math.round(avgTimeMs / (1000 * 60 * 60) * 10) / 10;
  
  return `${avgTimeHours} hours`;
}

// @route   GET /api/stats/admin
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const [tickets, users] = await Promise.all([
      Ticket.find({}).populate('createdBy', 'name email employeeId'),
      User.find({ role: 'user', isActive: true }) // Simplified query
    ]);

    const totalTickets = tickets.length;
    const totalUsers = users.length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    const closedTickets = tickets.filter(t => t.status === 'Closed').length;
    const criticalTickets = tickets.filter(t => t.priority === 'Critical').length;
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;
    
    // Breakdowns
    const componentStats = tickets.reduce((acc, ticket) => { acc[ticket.component] = (acc[ticket.component] || 0) + 1; return acc; }, {});
    const priorityStats = tickets.reduce((acc, ticket) => { acc[ticket.priority] = (acc[ticket.priority] || 0) + 1; return acc; }, {});
    const statusStats = { 'Open': openTickets, 'In Progress': inProgressTickets, 'Resolved': resolvedTickets, 'Closed': closedTickets };
    
    // Time-based stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTickets = tickets.filter(t => new Date(t.createdAt) >= weekAgo).length;
    const resolvedTicketsWithTime = tickets.filter(t => t.resolvedAt);
    const avgResolutionTime = calculateAvgResolutionTime(resolvedTicketsWithTime);

    // Top users
    const userTicketCounts = tickets.reduce((acc, ticket) => {
        if (ticket.createdBy) {
            const userId = ticket.createdBy._id.toString();
            acc[userId] = acc[userId] || { count: 0, user: ticket.createdBy };
            acc[userId].count++;
        }
        return acc;
    }, {});

    const topUsers = Object.values(userTicketCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ user: { name: item.user.name, email: item.user.email, employeeId: item.user.employeeId }, ticketCount: item.count }));

    // Monthly Trend
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        // Logic remains the same
    }

    res.json({
      totalTickets, totalUsers, openTickets, inProgressTickets, resolvedTickets, closedTickets, criticalTickets,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      componentStats, priorityStats, statusStats, recentTickets, avgResolutionTime, topUsers, monthlyTrend,
      userSatisfaction: 94, // Mock
      avgResponseTime: '2.3 hours' // Mock
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// @route   GET /api/stats/user/:id?
// @desc    Get user dashboard statistics
// @access  Private (Owner or Admin)
router.get('/user/:id?', protect, async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;

    if (req.user.role !== 'admin' && userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tickets = await Ticket.find({ createdBy: userId });
    // ... rest of the logic is fine
    
    res.json({ /* ... stats object ... */ });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

module.exports = router;