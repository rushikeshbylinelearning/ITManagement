const express = require('express');
const router = express.Router();
const UserActivityLog = require('../models/UserActivityLog');
const ActivityAlert = require('../models/ActivityAlert');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Agent authentication middleware
const authenticateAgent = async (req, res, next) => {
  const agentToken = req.headers['x-agent-token'];
  
  if (!agentToken) {
    return res.status(401).json({ error: 'Agent token required' });
  }
  
  // Verify agent token (you can use AgentToken model or a simpler mechanism)
  const AgentToken = require('../models/AgentToken');
  const token = await AgentToken.findOne({ token: agentToken, isActive: true });
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid or inactive agent token' });
  }
  
  req.agentId = token._id;
  next();
};

// ==========================================
// AGENT ENDPOINTS (Data Collection)
// ==========================================

/**
 * POST /api/activity-monitor/upload
 * Agent uploads activity data
 */
router.post('/upload', authenticateAgent, async (req, res) => {
  try {
    const {
      userId,
      userName,
      systemName,
      timestamp,
      network,
      websites,
      systemStatus,
      applications,
      fileTransfers,
      loggedAccounts,
      externalConnections,
      agentVersion,
      osVersion,
      reportInterval
    } = req.body;
    
    // Validate required fields
    if (!userId || !userName || !systemName) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userName, systemName' 
      });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create activity log
    const activityLog = new UserActivityLog({
      userId,
      userName,
      systemName,
      agentId: req.agentId,
      timestamp: timestamp || new Date(),
      network: network || {},
      websites: websites || [],
      systemStatus: systemStatus || {},
      applications: applications || [],
      fileTransfers: fileTransfers || [],
      loggedAccounts: loggedAccounts || [],
      externalConnections: externalConnections || [],
      agentVersion,
      osVersion,
      reportInterval
    });
    
    // Analyze and flag potential issues
    activityLog.analyzeAndFlag();
    
    // Save the log
    await activityLog.save();
    
    // Generate alerts if needed
    await generateAlerts(activityLog);
    
    res.status(201).json({
      success: true,
      message: 'Activity log recorded',
      logId: activityLog._id,
      riskScore: activityLog.riskScore,
      flags: activityLog.flags
    });
  } catch (error) {
    console.error('Error uploading activity log:', error);
    res.status(500).json({ error: 'Failed to record activity log' });
  }
});

/**
 * POST /api/activity-monitor/heartbeat
 * Agent sends heartbeat to confirm it's running
 */
router.post('/heartbeat', authenticateAgent, async (req, res) => {
  try {
    const { systemName, agentVersion, status } = req.body;
    
    // Update agent status (you could maintain an AgentStatus collection)
    res.json({
      success: true,
      serverTime: new Date(),
      reportInterval: 300 // seconds
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

// ==========================================
// ADMIN ENDPOINTS (Dashboard & Analytics)
// ==========================================

/**
 * GET /api/activity-monitor/summary
 * Get summary statistics for activity monitoring
 */
router.get('/summary', protect, async (req, res) => {
  try {
    const { date, startDate, endDate, userId } = req.query;
    
    // Determine date range
    let start, end;
    if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to today
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    
    const matchQuery = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (userId) {
      matchQuery.userId = userId;
    }
    
    // Aggregate statistics
    const stats = await UserActivityLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          activeUsers: { $addToSet: '$userId' },
          totalUploadMB: { $sum: '$network.uploadMB' },
          totalDownloadMB: { $sum: '$network.downloadMB' },
          avgCpuUsage: { $avg: '$systemStatus.cpuUsage' },
          avgMemoryUsage: { $avg: '$systemStatus.memoryUsage' },
          totalWebsiteVisits: { $sum: { $size: '$websites' } },
          totalFileTransfers: { $sum: { $size: '$fileTransfers' } },
          totalExternalConnections: { $sum: { $size: '$externalConnections' } },
          avgRiskScore: { $avg: '$riskScore' },
          highRiskLogs: {
            $sum: { $cond: [{ $gt: ['$riskScore', 50] }, 1, 0] }
          },
          suspiciousActivities: {
            $sum: { $cond: ['$flags.suspiciousActivity', 1, 0] }
          }
        }
      }
    ]);
    
    const summary = stats[0] || {
      totalLogs: 0,
      activeUsers: [],
      totalUploadMB: 0,
      totalDownloadMB: 0,
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      totalWebsiteVisits: 0,
      totalFileTransfers: 0,
      totalExternalConnections: 0,
      avgRiskScore: 0,
      highRiskLogs: 0,
      suspiciousActivities: 0
    };
    
    summary.activeUserCount = summary.activeUsers ? summary.activeUsers.length : 0;
    summary.totalBandwidthMB = summary.totalUploadMB + summary.totalDownloadMB;
    summary.avgBandwidthPerUser = summary.activeUserCount > 0 
      ? summary.totalBandwidthMB / summary.activeUserCount 
      : 0;
    
    // Get alert statistics
    const alertStats = await ActivityAlert.getAlertStats(start, end);
    
    // Get top websites
    const topWebsites = await getTopWebsitesGlobal(start, end, 5);
    
    // Get recent suspicious file transfers
    const suspiciousFiles = await UserActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          'flags.largeFileTransfer': true
        }
      },
      { $unwind: '$fileTransfers' },
      { $match: { 'fileTransfers.fileSize': { $gt: 100 * 1024 * 1024 } } },
      { $limit: 10 },
      {
        $project: {
          userName: 1,
          systemName: 1,
          fileName: '$fileTransfers.fileName',
          fileSize: '$fileTransfers.fileSize',
          method: '$fileTransfers.method',
          timestamp: '$fileTransfers.timestamp'
        }
      },
      { $sort: { 'timestamp': -1 } }
    ]);
    
    res.json({
      summary,
      alerts: alertStats,
      topWebsites,
      suspiciousFiles,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * GET /api/activity-monitor/logs
 * Get detailed activity logs with filters
 */
router.get('/logs', protect, async (req, res) => {
  try {
    const {
      userId,
      systemName,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      flagged = false,
      minRiskScore
    } = req.query;
    
    // Build query
    const query = {};
    
    if (userId) query.userId = userId;
    if (systemName) query.systemName = systemName;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (flagged === 'true') {
      query['flags.suspiciousActivity'] = true;
    }
    
    if (minRiskScore) {
      query.riskScore = { $gte: parseInt(minRiskScore) };
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [logs, total] = await Promise.all([
      UserActivityLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username email department')
        .lean(),
      UserActivityLog.countDocuments(query)
    ]);
    
    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/activity-monitor/user/:userId/activity
 * Get comprehensive activity for a specific user
 */
router.get('/user/:userId/activity', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, days = 7 } = req.query;
    
    // Determine date range
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - parseInt(days));
    }
    
    // Get activity summary
    const summary = await UserActivityLog.getActivitySummary(userId, start, end);
    
    // Get top websites
    const topWebsites = await UserActivityLog.getTopWebsites(userId, start, end, 10);
    
    // Get network usage trend
    const networkTrend = await UserActivityLog.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          uploadMB: { $sum: '$network.uploadMB' },
          downloadMB: { $sum: '$network.downloadMB' },
          totalMB: { $sum: '$network.totalMB' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get system status trend
    const systemTrend = await UserActivityLog.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          avgCpu: { $avg: '$systemStatus.cpuUsage' },
          avgMemory: { $avg: '$systemStatus.memoryUsage' },
          avgIdleTime: { $avg: '$systemStatus.idleTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get recent alerts
    const alerts = await ActivityAlert.find({
      userId,
      triggeredAt: { $gte: start, $lte: end }
    })
      .sort({ triggeredAt: -1 })
      .limit(20)
      .lean();
    
    res.json({
      userId,
      summary,
      topWebsites,
      networkTrend,
      systemTrend,
      alerts,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

/**
 * GET /api/activity-monitor/network-usage
 * Get network usage statistics
 */
router.get('/network-usage', protect, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'user' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    let groupField;
    if (groupBy === 'user') {
      groupField = '$userId';
    } else if (groupBy === 'system') {
      groupField = '$systemName';
    } else if (groupBy === 'date') {
      groupField = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
    }
    
    const usage = await UserActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupField,
          uploadMB: { $sum: '$network.uploadMB' },
          downloadMB: { $sum: '$network.downloadMB' },
          totalMB: { $sum: '$network.totalMB' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalMB: -1 } },
      { $limit: 50 }
    ]);
    
    // Populate user details if grouping by user
    if (groupBy === 'user') {
      const userIds = usage.map(u => u._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('username email department')
        .lean();
      
      const userMap = new Map(users.map(u => [u._id.toString(), u]));
      
      usage.forEach(item => {
        const user = userMap.get(item._id.toString());
        if (user) {
          item.user = user;
        }
      });
    }
    
    res.json({ usage, dateRange: { start, end } });
  } catch (error) {
    console.error('Error fetching network usage:', error);
    res.status(500).json({ error: 'Failed to fetch network usage' });
  }
});

/**
 * GET /api/activity-monitor/websites
 * Get website activity statistics
 */
router.get('/websites', protect, async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 50 } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const matchQuery = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (userId) {
      matchQuery.userId = require('mongoose').Types.ObjectId(userId);
    }
    
    const websites = await UserActivityLog.aggregate([
      { $match: matchQuery },
      { $unwind: '$websites' },
      {
        $group: {
          _id: '$websites.domain',
          totalVisits: { $sum: 1 },
          totalDuration: { $sum: '$websites.duration' },
          uniqueUsers: { $addToSet: '$userId' },
          lastVisit: { $max: '$websites.visitTime' },
          sampleUrl: { $first: '$websites.url' }
        }
      },
      {
        $project: {
          domain: '$_id',
          totalVisits: 1,
          totalDuration: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          lastVisit: 1,
          sampleUrl: 1,
          avgDuration: { $divide: ['$totalDuration', '$totalVisits'] }
        }
      },
      { $sort: { totalVisits: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({ websites, dateRange: { start, end } });
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).json({ error: 'Failed to fetch website statistics' });
  }
});

/**
 * GET /api/activity-monitor/file-transfers
 * Get file transfer logs
 */
router.get('/file-transfers', protect, async (req, res) => {
  try {
    const { startDate, endDate, userId, minSize, page = 1, limit = 50 } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const matchQuery = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (userId) {
      matchQuery.userId = require('mongoose').Types.ObjectId(userId);
    }
    
    const pipeline = [
      { $match: matchQuery },
      { $unwind: '$fileTransfers' },
      {
        $project: {
          userId: 1,
          userName: 1,
          systemName: 1,
          timestamp: 1,
          fileName: '$fileTransfers.fileName',
          filePath: '$fileTransfers.filePath',
          fileSize: '$fileTransfers.fileSize',
          target: '$fileTransfers.target',
          method: '$fileTransfers.method',
          action: '$fileTransfers.action',
          transferTime: '$fileTransfers.timestamp'
        }
      }
    ];
    
    if (minSize) {
      pipeline.push({
        $match: { fileSize: { $gte: parseInt(minSize) } }
      });
    }
    
    pipeline.push({ $sort: { transferTime: -1 } });
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });
    
    const transfers = await UserActivityLog.aggregate(pipeline);
    
    res.json({ transfers, dateRange: { start, end } });
  } catch (error) {
    console.error('Error fetching file transfers:', error);
    res.status(500).json({ error: 'Failed to fetch file transfers' });
  }
});

/**
 * GET /api/activity-monitor/external-connections
 * Get external connection logs
 */
router.get('/external-connections', protect, async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 100 } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const matchQuery = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (userId) {
      matchQuery.userId = require('mongoose').Types.ObjectId(userId);
    }
    
    const connections = await UserActivityLog.aggregate([
      { $match: matchQuery },
      { $unwind: '$externalConnections' },
      {
        $group: {
          _id: '$externalConnections.remoteIP',
          totalConnections: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          lastSeen: { $max: '$externalConnections.connectionTime' },
          location: { $first: '$externalConnections.location' },
          ports: { $addToSet: '$externalConnections.remotePort' },
          protocols: { $addToSet: '$externalConnections.protocol' }
        }
      },
      {
        $project: {
          remoteIP: '$_id',
          totalConnections: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          lastSeen: 1,
          location: 1,
          ports: 1,
          protocols: 1
        }
      },
      { $sort: { totalConnections: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({ connections, dateRange: { start, end } });
  } catch (error) {
    console.error('Error fetching external connections:', error);
    res.status(500).json({ error: 'Failed to fetch external connections' });
  }
});

// ==========================================
// ALERTS MANAGEMENT
// ==========================================

/**
 * GET /api/activity-monitor/alerts
 * Get activity alerts
 */
router.get('/alerts', protect, async (req, res) => {
  try {
    const {
      status,
      severity,
      alertType,
      userId,
      page = 1,
      limit = 50
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (alertType) query.alertType = alertType;
    if (userId) query.userId = userId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [alerts, total] = await Promise.all([
      ActivityAlert.find(query)
        .sort({ triggeredAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username email department')
        .populate('acknowledgedBy', 'username')
        .populate('resolvedBy', 'username')
        .lean(),
      ActivityAlert.countDocuments(query)
    ]);
    
    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * PUT /api/activity-monitor/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.put('/alerts/:alertId/acknowledge', protect, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await ActivityAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.acknowledge(req.user.userId);
    await alert.save();
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * PUT /api/activity-monitor/alerts/:alertId/resolve
 * Resolve an alert
 */
router.put('/alerts/:alertId/resolve', protect, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;
    
    const alert = await ActivityAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.resolve(req.user.userId, resolution);
    await alert.save();
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * PUT /api/activity-monitor/alerts/:alertId/dismiss
 * Dismiss an alert
 */
router.put('/alerts/:alertId/dismiss', protect, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await ActivityAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.dismiss();
    await alert.save();
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

/**
 * POST /api/activity-monitor/alerts/:alertId/notes
 * Add note to alert
 */
router.post('/alerts/:alertId/notes', protect, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Note content required' });
    }
    
    const alert = await ActivityAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.addNote(req.user.userId, content);
    await alert.save();
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error adding note to alert:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// ==========================================
// LIVE VIEW
// ==========================================

/**
 * GET /api/activity-monitor/live
 * Get recent activity (for live view)
 */
router.get('/live', protect, async (req, res) => {
  try {
    const { minutes = 5 } = req.query;
    
    const since = new Date(Date.now() - parseInt(minutes) * 60 * 1000);
    
    const recentActivity = await UserActivityLog.find({
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'username email department')
      .select('userId userName systemName timestamp network.totalMB systemStatus.cpuUsage websites fileTransfers flags riskScore')
      .lean();
    
    res.json({ activity: recentActivity, since });
  } catch (error) {
    console.error('Error fetching live activity:', error);
    res.status(500).json({ error: 'Failed to fetch live activity' });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function generateAlerts(activityLog) {
  const alerts = [];
  
  // High bandwidth alert
  if (activityLog.flags.highBandwidth) {
    alerts.push({
      userId: activityLog.userId,
      userName: activityLog.userName,
      systemName: activityLog.systemName,
      alertType: 'HIGH_BANDWIDTH',
      severity: activityLog.network.totalMB > 1000 ? 'HIGH' : 'MEDIUM',
      title: `High Bandwidth Usage Detected`,
      description: `${activityLog.userName} has used ${activityLog.network.totalMB.toFixed(2)} MB of bandwidth`,
      relatedLogId: activityLog._id,
      metadata: {
        bandwidthMB: activityLog.network.totalMB
      },
      triggeredAt: activityLog.timestamp
    });
  }
  
  // Large file transfer alert
  if (activityLog.flags.largeFileTransfer) {
    const largeFiles = activityLog.fileTransfers.filter(
      f => f.fileSize > 100 * 1024 * 1024
    );
    
    largeFiles.forEach(file => {
      alerts.push({
        userId: activityLog.userId,
        userName: activityLog.userName,
        systemName: activityLog.systemName,
        alertType: 'LARGE_FILE_TRANSFER',
        severity: file.fileSize > 500 * 1024 * 1024 ? 'HIGH' : 'MEDIUM',
        title: `Large File Transfer Detected`,
        description: `${activityLog.userName} transferred ${file.fileName} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB) via ${file.method}`,
        relatedLogId: activityLog._id,
        metadata: {
          fileName: file.fileName,
          fileSize: file.fileSize
        },
        triggeredAt: file.timestamp
      });
    });
  }
  
  // Multiple logins alert
  if (activityLog.flags.multipleLogins) {
    alerts.push({
      userId: activityLog.userId,
      userName: activityLog.userName,
      systemName: activityLog.systemName,
      alertType: 'MULTIPLE_LOGINS',
      severity: 'MEDIUM',
      title: `Multiple Account Logins Detected`,
      description: `${activityLog.userName} has ${activityLog.loggedAccounts.length} active account sessions`,
      relatedLogId: activityLog._id,
      triggeredAt: activityLog.timestamp
    });
  }
  
  // Suspicious activity (high risk score)
  if (activityLog.flags.suspiciousActivity) {
    alerts.push({
      userId: activityLog.userId,
      userName: activityLog.userName,
      systemName: activityLog.systemName,
      alertType: 'SUSPICIOUS_ACTIVITY',
      severity: activityLog.riskScore > 75 ? 'CRITICAL' : 'HIGH',
      title: `Suspicious Activity Detected`,
      description: `${activityLog.userName}'s activity has a high risk score of ${activityLog.riskScore}`,
      relatedLogId: activityLog._id,
      metadata: {
        riskScore: activityLog.riskScore
      },
      triggeredAt: activityLog.timestamp
    });
  }
  
  // Save all alerts
  if (alerts.length > 0) {
    await ActivityAlert.insertMany(alerts);
  }
  
  return alerts;
}

async function getTopWebsitesGlobal(startDate, endDate, limit = 10) {
  const logs = await UserActivityLog.find({
    timestamp: { $gte: startDate, $lte: endDate }
  }).select('websites');
  
  const websiteMap = new Map();
  
  logs.forEach(log => {
    log.websites.forEach(site => {
      const domain = site.domain || (site.url ? new URL(site.url).hostname : 'unknown');
      if (websiteMap.has(domain)) {
        const existing = websiteMap.get(domain);
        existing.visits += 1;
        existing.totalDuration += site.duration || 0;
      } else {
        websiteMap.set(domain, {
          domain,
          visits: 1,
          totalDuration: site.duration || 0,
          lastVisit: site.visitTime
        });
      }
    });
  });
  
  return Array.from(websiteMap.values())
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

module.exports = router;

