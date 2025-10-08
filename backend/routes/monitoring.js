// routes/monitoring.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Logger
const logger = console;

// Models
const Host = require('../models/Host');
const ProcessEvent = require('../models/ProcessEvent');
const FileEvent = require('../models/FileEvent');
const NetworkUsage = require('../models/NetworkUsage');
const MonitoringAlert = require('../models/MonitoringAlert');
const AgentToken = require('../models/AgentToken');
const User = require('../models/User');
const DomainAccess = require('../models/DomainAccess');
const UserSession = require('../models/UserSession');
const MonitoringSettings = require('../models/MonitoringSettings');

// Alert Rules Engine
const { processAlertRules } = require('../utils/alertRules');

// Middleware
const { protect, authorize } = require('../middleware/auth');

// Simple API key authentication for agents
const MONITORING_API_KEY = process.env.MONITORING_API_KEY || 'default-monitoring-key-change-me';

const authenticateAgent = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      msg: 'API key required' 
    });
  }
  
  // Verify API key
  if (apiKey !== MONITORING_API_KEY) {
    return res.status(403).json({ 
      success: false, 
      msg: 'Invalid API key' 
    });
  }
  
  next();
};

// ============================================================================
// AGENT REGISTRATION & DOWNLOAD ENDPOINTS
// ============================================================================

/**
 * POST /api/monitoring/register
 * Agent registration endpoint - validates one-time token and returns agent configuration
 */
router.post('/register', async (req, res) => {
  try {
    const { token, hostname, os, os_version, user, login_time } = req.body;
    
    if (!token || !hostname) {
      return res.status(400).json({
        success: false,
        msg: 'Token and hostname are required'
      });
    }
    
    // Find and validate token
    const agentToken = await AgentToken.findOne({ token, used: false });
    
    if (!agentToken) {
      return res.status(401).json({
        success: false,
        msg: 'Invalid or expired registration token'
      });
    }
    
    // Check if token is expired
    if (new Date() > agentToken.expiresAt) {
      return res.status(401).json({
        success: false,
        msg: 'Registration token has expired'
      });
    }
    
    // Generate agent ID
    const agentId = crypto.randomBytes(16).toString('hex');
    
    // Mark token as used
    agentToken.used = true;
    agentToken.usedAt = new Date();
    agentToken.agentId = agentId;
    agentToken.hostname = hostname;
    agentToken.os = os;
    await agentToken.save();
    
    // Create or update host
    let host = await Host.findOne({ hostname });
    
    if (host) {
      // Update existing host
      host.agentId = agentId;
      host.os = os || host.os;
      host.osVersion = os_version || host.osVersion;
      host.status = 'online';
      host.lastSeen = new Date();
      host.ipAddress = req.ip || req.headers['x-forwarded-for'];
    } else {
      // Create new host
      host = new Host({
        agentId,
        hostname,
        os: os || 'Unknown',
        osVersion: os_version,
        status: 'online',
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }
    
    await host.save();
    
    // Return agent configuration
    const config = {
      agent_id: agentId,
      backend_url: `${req.protocol}://${req.get('host')}/api/monitoring/events`,
      api_key: MONITORING_API_KEY,
      polling_interval: 60, // seconds
      monitored_directories: [], // Can be customized per user/role
      log_level: 'INFO'
    };
    
    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit('monitoring:new-host', {
        hostId: host._id,
        hostname: host.hostname,
        agentId: agentId
      });
    }
    
    logger.info(`Agent registered successfully: ${agentId} for host ${hostname}`);
    
    res.json({
      success: true,
      msg: 'Agent registered successfully',
      agent_id: agentId,
      config
    });
    
  } catch (error) {
    console.error('Error registering agent:', error);
    res.status(500).json({
      success: false,
      msg: 'Error registering agent',
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/agent/download/:os
 * Download monitoring agent binary for specified OS
 * Supports: windows, linux, macos
 */
router.get('/agent/download/:os', async (req, res) => {
  try {
    const { os } = req.params;
    const { token } = req.query;
    
    // Validate token if provided
    if (token) {
      const agentToken = await AgentToken.findOne({ token });
      if (!agentToken || agentToken.used || new Date() > agentToken.expiresAt) {
        return res.status(401).json({
          success: false,
          msg: 'Invalid or expired token'
        });
      }
    }
    
    // Determine file path based on OS
    let fileName, filePath;
    
    switch (os.toLowerCase()) {
      case 'windows':
        // Try MSI first (production-ready installer)
        fileName = 'ITMonitoringAgent-1.0.0.msi';
        filePath = path.join(__dirname, '..', '..', 'installer', 'windows-msi', 'output', fileName);
        
        // If MSI doesn't exist, try .exe
        if (!fs.existsSync(filePath)) {
          fileName = 'monitoring_agent_installer.exe';
          filePath = path.join(__dirname, '..', 'agent-binaries', fileName);
        }
        
        // If .exe doesn't exist, use .bat file (double-clickable)
        if (!fs.existsSync(filePath)) {
          fileName = 'monitoring_agent_installer.bat';
          filePath = path.join(__dirname, '..', 'agent-binaries', fileName);
        }
        
        // If .bat doesn't exist, fallback to PowerShell script (requires manual execution)
        if (!fs.existsSync(filePath)) {
          fileName = 'monitoring_agent_installer.ps1';
          filePath = path.join(__dirname, '..', 'agent-binaries', fileName);
        }
        break;
      case 'linux':
        fileName = 'monitoring_agent_installer.sh';
        filePath = path.join(__dirname, '..', 'agent-binaries', fileName);
        break;
      case 'macos':
      case 'darwin':
        fileName = 'monitoring_agent_installer_macos.sh';
        filePath = path.join(__dirname, '..', 'agent-binaries', fileName);
        break;
      default:
        return res.status(400).json({
          success: false,
          msg: 'Unsupported operating system. Supported: windows, linux, macos'
        });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Agent binary not found: ${filePath}`);
      return res.status(404).json({
        success: false,
        msg: 'Agent binary not found. Please contact administrator.'
      });
    }
    
    // Set appropriate content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.msi': 'application/x-msi',
      '.exe': 'application/x-msdownload',
      '.bat': 'application/bat',
      '.ps1': 'application/octet-stream',
      '.sh': 'application/x-sh'
    };
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
    
    // For .bat files, we need to inject the registration token
    if (ext === '.bat' && token) {
      try {
        // Read the batch file template
        let batchContent = fs.readFileSync(filePath, 'utf8');
        
        // Replace the placeholder token with the actual token
        batchContent = batchContent.replace(
          'set "REGISTRATION_TOKEN=%1"',
          `set "REGISTRATION_TOKEN=${token}"`
        );
        
        // Send the modified content
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(batchContent);
        return;
      } catch (error) {
        console.error('Error processing batch file with token:', error);
        // Fall back to regular file download
      }
    }
    
    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending agent binary:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            msg: 'Error downloading agent'
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Error downloading agent:', error);
    res.status(500).json({
      success: false,
      msg: 'Error downloading agent',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/agent/check
 * Check agent installation status from frontend
 */
router.post('/agent/check', protect, async (req, res) => {
  try {
    const { hostname } = req.body;
    
    if (!hostname) {
      return res.status(400).json({
        success: false,
        msg: 'Hostname is required'
      });
    }
    
    const host = await Host.findOne({ hostname });
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isOnline = host && host.lastSeen > fiveMinutesAgo;
    
    res.json({
      success: true,
      installed: !!host,
      online: isOnline,
      host: host || null
    });
    
  } catch (error) {
    console.error('Error checking agent status:', error);
    res.status(500).json({
      success: false,
      msg: 'Error checking agent status',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/agent/install-notify
 * MSI installer notification endpoint - NO authentication required
 * Called immediately after agent installation to track who installed what and when
 */
router.post('/agent/install-notify', async (req, res) => {
  try {
    const { hostname, username, status, timestamp, os, os_version, installer_version } = req.body;
    
    // Validate required fields
    if (!hostname || !username) {
      return res.status(400).json({
        success: false,
        msg: 'hostname and username are required'
      });
    }
    
    logger.info(`Installation notification received: ${hostname} by ${username} - Status: ${status}`);
    
    // Find or create host record
    let host = await Host.findOne({ hostname });
    
    if (!host) {
      // Create new host with installation info
      host = new Host({
        hostname,
        os: os || 'Windows',
        osVersion: os_version || 'Unknown',
        status: status === 'installed' ? 'pending' : 'offline', // pending until agent connects
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        firstSeen: timestamp ? new Date(timestamp) : new Date(),
        lastSeen: timestamp ? new Date(timestamp) : new Date(),
        installedBy: username,
        installedAt: timestamp ? new Date(timestamp) : new Date()
      });
    } else {
      // Update existing host with installation info
      host.installedBy = username;
      host.installedAt = timestamp ? new Date(timestamp) : new Date();
      host.lastSeen = new Date();
      
      if (os) host.os = os;
      if (os_version) host.osVersion = os_version;
      if (req.ip || req.headers['x-forwarded-for']) {
        host.ipAddress = req.ip || req.headers['x-forwarded-for'];
      }
    }
    
    await host.save();
    
    // Emit real-time notification to dashboard
    if (req.io) {
      req.io.emit('monitoring:agent-installed', {
        hostId: host._id,
        hostname: host.hostname,
        username: username,
        timestamp: timestamp || new Date().toISOString(),
        status: status
      });
    }
    
    logger.info(`Installation notification processed successfully for ${hostname} (Host ID: ${host._id})`);
    
    res.json({
      success: true,
      msg: 'Installation notification received',
      hostId: host._id,
      hostname: host.hostname,
      next_step: 'Agent will register on first heartbeat'
    });
    
  } catch (error) {
    console.error('Error processing installation notification:', error);
    res.status(500).json({
      success: false,
      msg: 'Error processing installation notification',
      error: error.message
    });
  }
});

// ============================================================================
// PUBLIC AGENT ENDPOINTS (API Key Authentication)
// ============================================================================

/**
 * POST /api/monitoring/events
 * Endpoint for agents to send telemetry data
 */
router.post('/events', authenticateAgent, async (req, res) => {
  try {
    const { 
      agent_id, 
      hostname, 
      metrics, 
      processes, 
      file_events, 
      network,
      domains,
      sessions,
      host_ip,
      public_ip,
      vpn,
      ssid,
      timestamp 
    } = req.body;
    
    // Validate required fields
    if (!agent_id || !hostname) {
      return res.status(400).json({ 
        success: false, 
        msg: 'agent_id and hostname are required' 
      });
    }
    
    // Find or create host
    let host = await Host.findOne({ agentId: agent_id });
    
    if (!host) {
      // Create new host
      host = new Host({
        agentId: agent_id,
        hostname: hostname,
        os: metrics?.os || 'Unknown',
        osVersion: metrics?.osVersion,
        agentVersion: metrics?.agentVersion || '1.0.0',
        ipAddress: host_ip || req.ip || req.headers['x-forwarded-for'],
        publicIp: public_ip,
        vpnActive: vpn || false,
        ssid: ssid,
        status: 'online',
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    } else {
      // Update existing host
      host.hostname = hostname;
      host.lastSeen = new Date();
      host.status = 'online';
      
      if (metrics?.agentVersion) {
        host.agentVersion = metrics.agentVersion;
      }
      
      if (host_ip || req.ip || req.headers['x-forwarded-for']) {
        host.ipAddress = host_ip || req.ip || req.headers['x-forwarded-for'];
      }
      
      if (public_ip !== undefined) {
        host.publicIp = public_ip;
      }
      
      if (vpn !== undefined) {
        host.vpnActive = vpn;
      }
      
      if (ssid !== undefined) {
        host.ssid = ssid;
      }
    }
    
    // Update host metrics
    if (metrics) {
      if (metrics.cpu) {
        host.cpu = {
          model: metrics.cpu.model || host.cpu?.model,
          cores: metrics.cpu.cores || host.cpu?.cores,
          usage: metrics.cpu.usage
        };
      }
      
      if (metrics.ram) {
        host.ram = {
          total: metrics.ram.total || host.ram?.total,
          used: metrics.ram.used,
          usage: metrics.ram.usage
        };
      }
      
      if (metrics.disk) {
        host.disk = {
          total: metrics.disk.total || host.disk?.total,
          used: metrics.disk.used,
          usage: metrics.disk.usage
        };
      }
      
      if (metrics.os) {
        host.os = metrics.os;
      }
      
      if (metrics.osVersion) {
        host.osVersion = metrics.osVersion;
      }
      
      if (metrics.macAddress) {
        host.macAddress = metrics.macAddress;
      }
      
      if (metrics.uptime_s !== undefined) {
        host.uptime = metrics.uptime_s;
      }
      
      if (metrics.battery_pct !== undefined) {
        host.batteryPercent = metrics.battery_pct;
      }
    }
    
    await host.save();
    
    // Save process events
    if (processes && Array.isArray(processes)) {
      const processRecords = processes.map(proc => ({
        hostId: host._id,
        hostname: hostname,
        pid: proc.pid,
        processName: proc.name,
        executablePath: proc.exe,
        commandLine: proc.cmdline,
        user: proc.user,
        cpuUsage: proc.cpu_percent,
        memoryUsage: proc.memory_mb,
        startTime: proc.create_time ? new Date(proc.create_time * 1000) : new Date(),
        status: proc.status || 'running'
      }));
      
      if (processRecords.length > 0) {
        await ProcessEvent.insertMany(processRecords, { ordered: false }).catch(err => {
          console.error('Error inserting process events:', err.message);
        });
      }
    }
    
    // Save file events
    if (file_events && Array.isArray(file_events)) {
      const fileRecords = file_events.map(event => ({
        hostId: host._id,
        hostname: hostname,
        path: event.path,
        operation: event.operation,
        fileType: event.file_type,
        size: event.size,
        user: event.user,
        processName: event.process,
        hash: event.hash,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
      }));
      
      if (fileRecords.length > 0) {
        await FileEvent.insertMany(fileRecords, { ordered: false }).catch(err => {
          console.error('Error inserting file events:', err.message);
        });
      }
    }
    
    // Save network usage
    if (network && Array.isArray(network)) {
      const networkRecords = network.map(net => ({
        hostId: host._id,
        hostname: hostname,
        pid: net.pid,
        processName: net.process,
        protocol: net.protocol,
        localAddress: net.local_address,
        localPort: net.local_port,
        remoteAddress: net.remote_address,
        remotePort: net.remote_port,
        bytesIn: net.bytes_recv,
        bytesOut: net.bytes_sent,
        packetsIn: net.packets_recv,
        packetsOut: net.packets_sent,
        timestamp: net.timestamp ? new Date(net.timestamp) : new Date()
      }));
      
      if (networkRecords.length > 0) {
        await NetworkUsage.insertMany(networkRecords, { ordered: false }).catch(err => {
          console.error('Error inserting network usage:', err.message);
        });
      }
    }
    
    // Save domain access records
    if (domains && Array.isArray(domains)) {
      const settings = await MonitoringSettings.getSettings();
      const domainRecords = domains.map(domain => ({
        hostId: host._id,
        hostname: hostname,
        userId: domain.user_id || null,
        domain: domain.domain,
        url: settings.privacy.storeFullUrls ? domain.url : null,  // Respect privacy settings
        source: domain.source || 'agent',
        frequency: domain.frequency || 1,
        bytesTransferred: domain.bytes || 0,
        timestamp: domain.timestamp ? new Date(domain.timestamp) : new Date()
      }));
      
      if (domainRecords.length > 0) {
        await DomainAccess.insertMany(domainRecords, { ordered: false }).catch(err => {
          console.error('Error inserting domain access:', err.message);
        });
      }
    }
    
    // Save or update user sessions
    if (sessions && Array.isArray(sessions)) {
      for (const session of sessions) {
        await UserSession.findOneAndUpdate(
          { sessionId: session.session_id },
          {
            userId: session.user_id,
            hostId: host._id,
            sessionType: session.session_type || 'browser',
            sessionId: session.session_id,
            client: session.client,
            clientVersion: session.client_version,
            ipAddress: session.ip_address || host.ipAddress,
            userAgent: session.user_agent,
            isActive: session.is_active !== undefined ? session.is_active : true,
            lastSeen: new Date()
          },
          { upsert: true, new: true }
        ).catch(err => {
          console.error('Error upserting user session:', err.message);
        });
      }
    }
    
    // Process alert rules
    const alerts = await processAlertRules(host._id, hostname, {
      metrics,
      processes,
      file_events,
      network,
      domains: domains || [],
      networkContext: {
        publicIp: public_ip,
        vpnActive: vpn,
        ssid: ssid
      }
    });
    
    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('monitoring:update', {
        hostId: host._id,
        hostname: hostname,
        status: 'online',
        alerts: alerts.length
      });
      
      if (alerts.length > 0) {
        req.io.emit('monitoring:alerts', alerts);
      }
    }
    
    res.json({ 
      success: true, 
      msg: 'Telemetry received',
      hostId: host._id,
      alertsTriggered: alerts.length
    });
    
  } catch (error) {
    console.error('Error processing telemetry:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error processing telemetry',
      error: error.message 
    });
  }
});

// ============================================================================
// PROTECTED ADMIN ENDPOINTS (JWT Authentication)
// ============================================================================

/**
 * GET /api/monitoring/hosts
 * List all monitored hosts
 */
router.get('/hosts', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { hostname: { $regex: search, $options: 'i' } },
        { agentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const hosts = await Host.find(query)
      .sort({ lastSeen: -1 })
      .lean();
    
    // Count alerts for each host
    const hostsWithAlerts = await Promise.all(
      hosts.map(async (host) => {
        const alertCount = await MonitoringAlert.countDocuments({
          hostId: host._id,
          resolved: false
        });
        
        return {
          ...host,
          alertCount
        };
      })
    );
    
    res.json({
      success: true,
      hosts: hostsWithAlerts
    });
    
  } catch (error) {
    console.error('Error fetching hosts:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching hosts',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/hosts/:id
 * Get detailed information about a specific host
 */
router.get('/hosts/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);
    
    if (!host) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Host not found' 
      });
    }
    
    // Get recent events (last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    const [processes, fileEvents, networkUsage, alerts] = await Promise.all([
      ProcessEvent.find({ 
        hostId: host._id,
        createdAt: { $gte: oneHourAgo }
      }).sort({ createdAt: -1 }).limit(100),
      
      FileEvent.find({ 
        hostId: host._id,
        timestamp: { $gte: oneHourAgo }
      }).sort({ timestamp: -1 }).limit(100),
      
      NetworkUsage.find({ 
        hostId: host._id,
        timestamp: { $gte: oneHourAgo }
      }).sort({ timestamp: -1 }).limit(100),
      
      MonitoringAlert.find({ 
        hostId: host._id
      }).sort({ createdAt: -1 }).limit(50)
    ]);
    
    res.json({
      success: true,
      host,
      recentEvents: {
        processes,
        fileEvents,
        networkUsage,
        alerts
      }
    });
    
  } catch (error) {
    console.error('Error fetching host details:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching host details',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/hosts/:id/processes
 * Get process events for a host with pagination
 */
router.get('/hosts/:id/processes', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, timeRange = '1h' } = req.query;
    
    // Calculate time range
    const timeRanges = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeAgo = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['1h']));
    
    const processes = await ProcessEvent.find({
      hostId: req.params.id,
      createdAt: { $gte: timeAgo }
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));
    
    const total = await ProcessEvent.countDocuments({
      hostId: req.params.id,
      createdAt: { $gte: timeAgo }
    });
    
    res.json({
      success: true,
      processes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching processes',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/hosts/:id/files
 * Get file events for a host with pagination
 */
router.get('/hosts/:id/files', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, timeRange = '1h', operation } = req.query;
    
    const timeRanges = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeAgo = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['1h']));
    
    const query = {
      hostId: req.params.id,
      timestamp: { $gte: timeAgo }
    };
    
    if (operation) {
      query.operation = operation;
    }
    
    const fileEvents = await FileEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    const total = await FileEvent.countDocuments(query);
    
    res.json({
      success: true,
      fileEvents,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching file events:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching file events',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/hosts/:id/network
 * Get network usage for a host with pagination
 */
router.get('/hosts/:id/network', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, timeRange = '1h' } = req.query;
    
    const timeRanges = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeAgo = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['1h']));
    
    const networkUsage = await NetworkUsage.find({
      hostId: req.params.id,
      timestamp: { $gte: timeAgo }
    })
    .sort({ timestamp: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));
    
    const total = await NetworkUsage.countDocuments({
      hostId: req.params.id,
      timestamp: { $gte: timeAgo }
    });
    
    res.json({
      success: true,
      networkUsage,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching network usage:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching network usage',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * List all alerts with filtering
 */
router.get('/alerts', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      hostId, 
      type, 
      severity, 
      resolved, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = {};
    
    if (hostId) {
      query.hostId = hostId;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (resolved !== undefined) {
      query.resolved = resolved === 'true';
    }
    
    const alerts = await MonitoringAlert.find(query)
      .populate('hostId', 'hostname agentId status')
      .populate('resolvedBy', 'name email')
      .populate('acknowledgedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    const total = await MonitoringAlert.countDocuments(query);
    
    res.json({
      success: true,
      alerts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching alerts',
      error: error.message 
    });
  }
});

/**
 * PATCH /api/monitoring/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.patch('/alerts/:id/acknowledge', protect, authorize('admin'), async (req, res) => {
  try {
    const alert = await MonitoringAlert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Alert not found' 
      });
    }
    
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user._id;
    await alert.save();
    
    // Emit socket event
    if (req.io) {
      req.io.emit('monitoring:alert-acknowledged', {
        alertId: alert._id,
        acknowledgedBy: req.user.name
      });
    }
    
    res.json({
      success: true,
      msg: 'Alert acknowledged',
      alert
    });
    
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error acknowledging alert',
      error: error.message 
    });
  }
});

/**
 * PATCH /api/monitoring/alerts/:id/resolve
 * Resolve an alert
 */
router.patch('/alerts/:id/resolve', protect, authorize('admin'), async (req, res) => {
  try {
    const { note } = req.body;
    
    const alert = await MonitoringAlert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Alert not found' 
      });
    }
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    alert.resolvedNote = note;
    await alert.save();
    
    // Emit socket event
    if (req.io) {
      req.io.emit('monitoring:alert-resolved', {
        alertId: alert._id,
        resolvedBy: req.user.name
      });
    }
    
    res.json({
      success: true,
      msg: 'Alert resolved',
      alert
    });
    
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error resolving alert',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/stats
 * Get monitoring statistics for dashboard
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [
      totalHosts,
      onlineHosts,
      offlineHosts,
      totalAlerts,
      criticalAlerts,
      unresolvedAlerts,
      bandwidthLastHour
    ] = await Promise.all([
      Host.countDocuments({}),
      Host.countDocuments({ lastSeen: { $gte: fiveMinutesAgo } }),
      Host.countDocuments({ status: 'offline' }),
      MonitoringAlert.countDocuments({}),
      MonitoringAlert.countDocuments({ severity: 'critical', resolved: false }),
      MonitoringAlert.countDocuments({ resolved: false }),
      NetworkUsage.aggregate([
        { $match: { timestamp: { $gte: oneHourAgo } } },
        { $group: { _id: null, totalBytes: { $sum: { $add: ['$bytesIn', '$bytesOut'] } } } }
      ])
    ]);
    
    const totalBandwidthMB = bandwidthLastHour.length > 0 
      ? (bandwidthLastHour[0].totalBytes / (1024 * 1024)).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      stats: {
        totalHosts,
        onlineHosts,
        offlineHosts,
        totalAlerts,
        criticalAlerts,
        unresolvedAlerts,
        bandwidthLastHourMB: totalBandwidthMB
      }
    });
    
  } catch (error) {
    console.error('Error fetching monitoring stats:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching stats',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/hosts/:id/domains
 * Get domain access history for a host
 */
router.get('/hosts/:id/domains', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, timeRange = '24h' } = req.query;
    
    const timeRanges = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000
    };
    
    const timeAgo = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['24h']));
    
    const domains = await DomainAccess.find({
      hostId: req.params.id,
      timestamp: { $gte: timeAgo }
    })
    .sort({ timestamp: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));
    
    const total = await DomainAccess.countDocuments({
      hostId: req.params.id,
      timestamp: { $gte: timeAgo }
    });
    
    // Get top domains
    const topDomains = await DomainAccess.aggregate([
      { 
        $match: { 
          hostId: require('mongoose').Types.ObjectId(req.params.id),
          timestamp: { $gte: timeAgo }
        }
      },
      {
        $group: {
          _id: '$domain',
          count: { $sum: '$frequency' },
          totalBytes: { $sum: '$bytesTransferred' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      domains,
      topDomains,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error fetching domain access:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching domain access',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/hosts/:id/sessions
 * Get user sessions for a host
 */
router.get('/hosts/:id/sessions', protect, authorize('admin'), async (req, res) => {
  try {
    const { active } = req.query;
    
    const query = { hostId: req.params.id };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    const sessions = await UserSession.find(query)
      .populate('userId', 'name email')
      .sort({ lastSeen: -1 })
      .limit(100);
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching sessions',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/users/:id/sessions
 * Get all sessions for a specific user
 */
router.get('/users/:id/sessions', protect, authorize('admin'), async (req, res) => {
  try {
    const { active } = req.query;
    
    const query = { userId: req.params.id };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    const sessions = await UserSession.find(query)
      .populate('hostId', 'hostname ipAddress')
      .sort({ lastSeen: -1 })
      .limit(100);
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching user sessions',
      error: error.message 
    });
  }
});

// ============================================================================
// MONITORING SETTINGS ENDPOINTS
// ============================================================================

/**
 * GET /api/monitoring/settings
 * Get monitoring settings
 */
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await MonitoringSettings.getSettings();
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching settings',
      error: error.message 
    });
  }
});

/**
 * PATCH /api/monitoring/settings
 * Update monitoring settings
 */
router.patch('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await MonitoringSettings.getSettings();
    
    // Update fields that are provided
    const allowedUpdates = [
      'retention',
      'privacy',
      'watchedDirectories',
      'domains',
      'alertThresholds',
      'network',
      'integrations',
      'agentConfig'
    ];
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        settings[field] = { ...settings[field], ...req.body[field] };
      }
    }
    
    settings.lastModifiedBy = req.user._id;
    await settings.save();
    
    // Emit socket event for settings update
    if (req.io) {
      req.io.emit('monitoring:settings-updated', {
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      msg: 'Settings updated successfully',
      settings
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error updating settings',
      error: error.message 
    });
  }
});

/**
 * GET /api/monitoring/settings/agent-config
 * Get agent configuration (for download by agents)
 */
router.get('/settings/agent-config', authenticateAgent, async (req, res) => {
  try {
    const settings = await MonitoringSettings.getSettings();
    
    const agentConfig = {
      polling_interval: settings.agentConfig.pollingIntervalSeconds,
      watched_directories: settings.watchedDirectories,
      enable_file_monitoring: settings.agentConfig.enableFileMonitoring,
      enable_network_monitoring: settings.agentConfig.enableNetworkMonitoring,
      enable_process_monitoring: settings.agentConfig.enableProcessMonitoring,
      log_level: settings.agentConfig.logLevel,
      store_full_urls: settings.privacy.storeFullUrls
    };
    
    res.json({
      success: true,
      config: agentConfig
    });
    
  } catch (error) {
    console.error('Error fetching agent config:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error fetching agent config',
      error: error.message 
    });
  }
});

// ============================================================================
// INTEGRATION TEST ENDPOINTS
// ============================================================================

/**
 * POST /api/monitoring/integrations/proxy/test
 * Test proxy integration connection
 */
router.post('/integrations/proxy/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { proxyUrl } = req.body;
    
    if (!proxyUrl) {
      return res.status(400).json({
        success: false,
        msg: 'Proxy URL is required'
      });
    }
    
    const { testProxyConnection } = require('../integrations/proxyAdapter');
    const result = await testProxyConnection(proxyUrl);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error testing proxy connection:', error);
    res.status(500).json({
      success: false,
      msg: 'Error testing proxy connection',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/integrations/dns/test
 * Test DNS integration connection
 */
router.post('/integrations/dns/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { dnsServerUrl } = req.body;
    
    if (!dnsServerUrl) {
      return res.status(400).json({
        success: false,
        msg: 'DNS server URL is required'
      });
    }
    
    const { testDnsConnection } = require('../integrations/dnsAdapter');
    const result = await testDnsConnection(dnsServerUrl);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error testing DNS connection:', error);
    res.status(500).json({
      success: false,
      msg: 'Error testing DNS connection',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/integrations/netflow/test
 * Test NetFlow collector (simulate data)
 */
router.post('/integrations/netflow/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { simulateNetFlowData } = require('../integrations/netflowAdapter');
    await simulateNetFlowData();
    
    res.json({
      success: true,
      message: 'NetFlow simulation completed. Check network usage records.'
    });
    
  } catch (error) {
    console.error('Error testing NetFlow:', error);
    res.status(500).json({
      success: false,
      msg: 'Error testing NetFlow',
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/integrations/sso/test
 * Test SSO session sync
 */
router.post('/integrations/sso/test', protect, authorize('admin'), async (req, res) => {
  try {
    // This would integrate with your existing SSO implementation
    // For now, just return a success placeholder
    
    res.json({
      success: true,
      message: 'SSO integration test - placeholder. Integrate with your existing SSO service.',
      activeSessions: 0
    });
    
  } catch (error) {
    console.error('Error testing SSO:', error);
    res.status(500).json({
      success: false,
      msg: 'Error testing SSO',
      error: error.message
    });
  }
});

module.exports = router;

