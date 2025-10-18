const express = require('express');
const router = express.Router();
const NetworkMonitoring = require('../models/NetworkMonitoring');
const SystemAgent = require('../models/SystemAgent');
const { protect, authorize } = require('../middleware/auth');

/**
 * @desc    Test endpoint to verify user authentication and role
 * @route   GET /api/network-monitoring/test-auth
 * @access  Protected (any authenticated user)
 */
router.get('/test-auth', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      }
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Middleware to verify agent token
const verifyAgent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'No agent token provided' });
    }

    const decoded = SystemAgent.verifyAgentToken(token);
    
    if (!decoded || decoded.type !== 'agent') {
      return res.status(401).json({ msg: 'Invalid agent token' });
    }

    // Verify system exists and is active
    const agent = await SystemAgent.findOne({ 
      systemId: decoded.systemId,
      isActive: true 
    });

    if (!agent) {
      return res.status(401).json({ msg: 'System agent not found or inactive' });
    }

    // Update heartbeat
    await agent.updateHeartbeat();

    req.agent = agent;
    req.systemId = decoded.systemId;
    req.systemName = decoded.systemName;
    next();
  } catch (error) {
    console.error('Agent verification error:', error);
    res.status(401).json({ msg: 'Agent authentication failed' });
  }
};

/**
 * @desc    Register a new system agent
 * @route   POST /api/network-monitoring/register
 * @access  Protected (Employee/User)
 */
router.post('/register', protect, async (req, res) => {
  try {
    console.log('📝 Register agent request received');
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { systemId, systemName, systemInfo } = req.body;

    if (!systemId || !systemName) {
      console.error('❌ Missing systemId or systemName');
      return res.status(400).json({ msg: 'System ID and name are required' });
    }

    console.log('✅ Validation passed, checking for existing agent...');

    // Check if system already exists
    let agent = await SystemAgent.findOne({ systemId });

    if (agent) {
      console.log('📝 Updating existing agent:', systemId);
      // Update existing agent
      agent.systemName = systemName;
      agent.systemInfo = systemInfo || agent.systemInfo;
      agent.userId = req.user._id;
      agent.isActive = true;
      agent.status = 'active';
      agent.lastHeartbeat = Date.now();
    } else {
      console.log('📝 Creating new agent:', systemId);
      // Create new agent
      agent = new SystemAgent({
        systemId,
        systemName,
        userId: req.user._id,
        systemInfo: systemInfo || {}
      });
    }

    console.log('🔑 Generating agent token...');
    console.log('Environment check:', {
      hasLocalJwtSecret: !!process.env.LOCAL_JWT_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
      secretToUse: process.env.LOCAL_JWT_SECRET ? 'LOCAL_JWT_SECRET' : (process.env.JWT_SECRET ? 'JWT_SECRET' : 'NONE')
    });
    
    // Generate token
    try {
      const agentToken = agent.generateAgentToken();
      agent.agentToken = agentToken;
      console.log('✅ Token generated successfully');
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError);
      console.error('Token error stack:', tokenError.stack);
      return res.status(500).json({ 
        msg: 'Token generation failed',
        error: tokenError.message,
        details: process.env.NODE_ENV === 'development' ? tokenError.stack : undefined
      });
    }

    console.log('💾 Saving agent to database...');
    try {
      await agent.save();
      console.log('✅ Agent saved successfully');
    } catch (saveError) {
      console.error('❌ Database save failed:', saveError);
      console.error('Save error details:', saveError.message);
      return res.status(500).json({ 
        msg: 'Database save failed',
        error: saveError.message,
        details: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
      });
    }

    res.status(201).json({
      success: true,
      systemId: agent.systemId,
      systemName: agent.systemName,
      agentToken: agent.agentToken,
      message: 'System agent registered successfully'
    });
    
    console.log('✅ Registration complete for:', systemName);
  } catch (error) {
    console.error('❌ Agent registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      msg: 'Server error during registration',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @desc    Receive real-time network monitoring data from agent
 * @route   POST /api/network-monitoring/logs
 * @access  Agent (verified with agent token)
 */
router.post('/logs', verifyAgent, async (req, res) => {
  try {
    const { 
      totalUploadMB, 
      totalDownloadMB, 
      websites, 
      agentVersion,
      systemInfo 
    } = req.body;

    // Validate required fields
    if (totalUploadMB === undefined || totalDownloadMB === undefined) {
      return res.status(400).json({ msg: 'Upload and download data are required' });
    }

    // Filter out websites with empty or invalid domains
    const validWebsites = (websites || []).filter(site => {
      return site && site.domain && site.domain.trim() !== '';
    });

    // Create monitoring log
    const log = new NetworkMonitoring({
      systemName: req.systemName,
      systemId: req.systemId,
      userId: req.agent.userId,
      timestamp: new Date(),
      totalUploadMB: parseFloat(totalUploadMB) || 0,
      totalDownloadMB: parseFloat(totalDownloadMB) || 0,
      websites: validWebsites,
      agentVersion: agentVersion || '1.0.0',
      systemInfo: systemInfo || req.agent.systemInfo
    });

    await log.save();

    // Emit real-time update via Socket.IO
    if (req.io) {
      req.io.emit('network-update', {
        systemId: log.systemId,
        systemName: log.systemName,
        totalUploadMB: log.totalUploadMB,
        totalDownloadMB: log.totalDownloadMB,
        totalDataMB: log.totalDataMB,
        timestamp: log.timestamp,
        websites: log.websites
      });
      
      // Also emit aggregated stats update
      try {
        const stats = await NetworkMonitoring.aggregate([
          {
            $match: {
              timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            }
          },
          {
            $group: {
              _id: null,
              totalUpload: { $sum: '$totalUploadMB' },
              totalDownload: { $sum: '$totalDownloadMB' },
              totalData: { $sum: '$totalDataMB' },
              recordCount: { $sum: 1 }
            }
          }
        ]);
        
        const totalAgents = await SystemAgent.countDocuments({ isActive: true });
        
        req.io.emit('network-stats-update', {
          totalAgents,
          usage: stats[0] || { totalUpload: 0, totalDownload: 0, totalData: 0, recordCount: 0 },
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error emitting stats update:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Network data logged successfully'
    });
  } catch (error) {
    console.error('Network logging error:', error);
    res.status(500).json({ msg: 'Server error during logging' });
  }
});

/**
 * @desc    Get network usage overview for all systems
 * @route   GET /api/network-monitoring/usage
 * @access  Admin only
 */
router.get('/usage', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📊 Network Monitoring - Usage request from user:', req.user?.email, 'Role:', req.user?.role);
    console.log('📊 Query params:', req.query);
    const { startDate, endDate, systemId } = req.query;

    // Default to last 30 days if no date range provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let result;

    if (systemId) {
      // Get usage for specific system
      console.log('📊 Getting usage for specific system:', systemId);
      result = await NetworkMonitoring.getSystemUsage(systemId, start, end);
    } else {
      // Get usage for all systems
      console.log('📊 Getting usage for all systems between:', start, 'and', end);
      result = await NetworkMonitoring.getAllSystemsOverview(start, end);
    }

    console.log('📊 Query result:', JSON.stringify(result, null, 2));
    console.log('📊 Number of systems found:', result.length);

    res.status(200).json({
      success: true,
      data: result,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('❌ Usage retrieval error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ msg: 'Server error retrieving usage data' });
  }
});

/**
 * @desc    Get website-wise usage for a specific system
 * @route   GET /api/network-monitoring/websites
 * @access  Admin only
 */
router.get('/websites', protect, authorize('admin'), async (req, res) => {
  try {
    const { systemId, startDate, endDate, limit = 100 } = req.query;

    if (!systemId) {
      return res.status(400).json({ msg: 'System ID is required' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let websites = await NetworkMonitoring.getWebsiteUsage(systemId, start, end);

    // Limit results
    websites = websites.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      systemId,
      data: websites,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Website usage retrieval error:', error);
    res.status(500).json({ msg: 'Server error retrieving website data' });
  }
});

/**
 * @desc    Get detailed logs for a specific system
 * @route   GET /api/network-monitoring/logs/:systemId
 * @access  Admin only
 */
router.get('/logs/:systemId', protect, authorize('admin'), async (req, res) => {
  try {
    const { systemId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await NetworkMonitoring.find({
      systemId,
      timestamp: { $gte: start, $lte: end }
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email employeeId');

    const total = await NetworkMonitoring.countDocuments({
      systemId,
      timestamp: { $gte: start, $lte: end }
    });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Logs retrieval error:', error);
    res.status(500).json({ msg: 'Server error retrieving logs' });
  }
});

/**
 * @desc    Get all registered agents/systems
 * @route   GET /api/network-monitoring/agents
 * @access  Admin only
 */
router.get('/agents', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📊 Network Monitoring - Agents request from user:', req.user?.email, 'Role:', req.user?.role);
    const { status, userId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const agents = await SystemAgent.find(filter)
      .populate('userId', 'name email employeeId seatNumber')
      .sort({ lastHeartbeat: -1 });

    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    console.error('Agents retrieval error:', error);
    res.status(500).json({ msg: 'Server error retrieving agents' });
  }
});

/**
 * @desc    Update agent status (activate/deactivate/suspend)
 * @route   PATCH /api/network-monitoring/agents/:systemId
 * @access  Admin only
 */
router.patch('/agents/:systemId', protect, authorize('admin'), async (req, res) => {
  try {
    const { systemId } = req.params;
    const { status, isActive } = req.body;

    const agent = await SystemAgent.findOne({ systemId });

    if (!agent) {
      return res.status(404).json({ msg: 'Agent not found' });
    }

    if (status) agent.status = status;
    if (isActive !== undefined) agent.isActive = isActive;

    await agent.save();

    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Agent update error:', error);
    res.status(500).json({ msg: 'Server error updating agent' });
  }
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/network-monitoring/stats
 * @access  Admin only
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📊 Network Monitoring - Stats request from user:', req.user?.email, 'Role:', req.user?.role);
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get total active agents
    const totalAgents = await SystemAgent.countDocuments({ isActive: true });
    console.log('📊 Total active agents:', totalAgents);

    // Get total data usage
    const totalUsage = await NetworkMonitoring.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalUpload: { $sum: '$totalUploadMB' },
          totalDownload: { $sum: '$totalDownloadMB' },
          totalData: { $sum: '$totalDataMB' },
          recordCount: { $sum: 1 }
        }
      }
    ]);
    console.log('📊 Total usage result:', JSON.stringify(totalUsage, null, 2));

    // Get top websites across all systems
    const topWebsites = await NetworkMonitoring.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$websites' },
      {
        $group: {
          _id: '$websites.domain',
          totalDataUsed: { $sum: '$websites.dataUsedMB' },
          systemCount: { $addToSet: '$systemId' }
        }
      },
      {
        $project: {
          _id: 1,
          totalDataUsed: 1,
          systemCount: { $size: '$systemCount' }
        }
      },
      { $sort: { totalDataUsed: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalAgents,
        usage: totalUsage[0] || { totalUpload: 0, totalDownload: 0, totalData: 0, recordCount: 0 },
        topWebsites
      },
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({ msg: 'Server error retrieving statistics' });
  }
});

/**
 * @desc    Agent heartbeat check
 * @route   POST /api/network-monitoring/heartbeat
 * @access  Agent (verified with agent token)
 */
router.post('/heartbeat', verifyAgent, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Heartbeat received',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/network-monitoring/agents/:systemId
// @desc    Delete a registered agent/system
// @access  Admin
router.delete('/agents/:systemId', protect, authorize('admin'), async (req, res) => {
  try {
    const { systemId } = req.params;

    console.log('🗑️ Network Monitoring - Delete agent request:', {
      systemId,
      requestedBy: req.user.email,
      role: req.user.role
    });

    // Find the agent
    const agent = await SystemAgent.findOne({ systemId });

    if (!agent) {
      console.log('❌ Agent not found:', systemId);
      return res.status(404).json({ msg: 'Agent not found' });
    }

    // Delete all network monitoring data for this system
    const deletedLogs = await NetworkMonitoring.deleteMany({ systemId });
    console.log(`🗑️ Deleted ${deletedLogs.deletedCount} network logs for system ${systemId}`);

    // Delete the agent
    await SystemAgent.deleteOne({ systemId });
    console.log(`✅ Agent deleted: ${agent.systemName} (${systemId})`);

    res.json({
      success: true,
      message: 'Agent and associated data deleted successfully',
      deletedLogs: deletedLogs.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting agent:', error);
    res.status(500).json({ msg: 'Server error during agent deletion' });
  }
});

module.exports = router;

