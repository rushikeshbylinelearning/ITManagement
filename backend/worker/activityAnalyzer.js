const mongoose = require('mongoose');
const UserActivityLog = require('../models/UserActivityLog');
const ActivityAlert = require('../models/ActivityAlert');

class ActivityAnalyzer {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.analysisInterval = 10 * 60 * 1000; // 10 minutes
  }
  
  start() {
    if (this.isRunning) {
      console.log('Activity Analyzer is already running');
      return;
    }
    
    console.log('Starting Activity Analyzer Worker...');
    this.isRunning = true;
    
    // Run immediately
    this.runAnalysis();
    
    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.runAnalysis();
    }, this.analysisInterval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Activity Analyzer Worker stopped');
  }
  
  async runAnalysis() {
    console.log(`[${new Date().toISOString()}] Running activity analysis...`);
    
    try {
      // Run multiple analysis tasks in parallel
      await Promise.all([
        this.analyzeRecentActivity(),
        this.detectAnomalies(),
        this.aggregateDailyStats(),
        this.cleanupOldData()
      ]);
      
      console.log('Activity analysis completed successfully');
    } catch (error) {
      console.error('Error during activity analysis:', error);
    }
  }
  
  /**
   * Analyze recent activity logs (last 30 minutes)
   */
  async analyzeRecentActivity() {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentLogs = await UserActivityLog.find({
      timestamp: { $gte: since },
      riskScore: 0 // Not yet analyzed
    });
    
    console.log(`Analyzing ${recentLogs.length} recent activity logs...`);
    
    for (const log of recentLogs) {
      log.analyzeAndFlag();
      await log.save();
      
      // Generate alerts if needed
      if (log.flags.suspiciousActivity || log.riskScore > 50) {
        await this.generateAlerts(log);
      }
    }
  }
  
  /**
   * Detect anomalies based on user behavior patterns
   */
  async detectAnomalies() {
    console.log('Detecting behavioral anomalies...');
    
    // Get active users from last hour
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    
    const userActivity = await UserActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: lastHour }
        }
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          systemName: { $first: '$systemName' },
          totalBandwidth: { $sum: '$network.totalMB' },
          avgCpu: { $avg: '$systemStatus.cpuUsage' },
          totalFileTransfers: { $sum: { $size: '$fileTransfers' } },
          totalExternalConnections: { $sum: { $size: '$externalConnections' } },
          recentLogs: { $push: '$_id' }
        }
      }
    ]);
    
    for (const user of userActivity) {
      // Detect unusual bandwidth (> 2GB in an hour)
      if (user.totalBandwidth > 2000) {
        await this.createAnomalyAlert({
          userId: user._id,
          userName: user.userName,
          systemName: user.systemName,
          alertType: 'HIGH_BANDWIDTH',
          severity: 'HIGH',
          title: 'Unusual Bandwidth Usage',
          description: `${user.userName} used ${user.totalBandwidth.toFixed(2)} MB in the last hour`,
          metadata: { bandwidthMB: user.totalBandwidth }
        });
      }
      
      // Detect excessive file transfers (> 20 in an hour)
      if (user.totalFileTransfers > 20) {
        await this.createAnomalyAlert({
          userId: user._id,
          userName: user.userName,
          systemName: user.systemName,
          alertType: 'DATA_EXFILTRATION',
          severity: 'CRITICAL',
          title: 'Excessive File Transfer Activity',
          description: `${user.userName} transferred ${user.totalFileTransfers} files in the last hour`,
          metadata: { fileTransferCount: user.totalFileTransfers }
        });
      }
      
      // Detect unusual external connections (> 50 in an hour)
      if (user.totalExternalConnections > 50) {
        await this.createAnomalyAlert({
          userId: user._id,
          userName: user.userName,
          systemName: user.systemName,
          alertType: 'UNUSUAL_CONNECTION',
          severity: 'HIGH',
          title: 'Unusual External Connection Activity',
          description: `${user.userName} established ${user.totalExternalConnections} external connections in the last hour`,
          metadata: { connectionCount: user.totalExternalConnections }
        });
      }
    }
  }
  
  /**
   * Aggregate daily statistics
   */
  async aggregateDailyStats() {
    console.log('Aggregating daily statistics...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if we've already aggregated today's stats
    const DailyStats = mongoose.model('DailyActivityStats', dailyStatsSchema);
    const existing = await DailyStats.findOne({ date: today });
    
    if (existing) {
      console.log('Daily stats already aggregated for today');
      return;
    }
    
    // Aggregate stats for today
    const stats = await UserActivityLog.aggregate([
      {
        $match: {
          timestamp: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          totalUploadMB: { $sum: '$network.uploadMB' },
          totalDownloadMB: { $sum: '$network.downloadMB' },
          avgCpuUsage: { $avg: '$systemStatus.cpuUsage' },
          avgMemoryUsage: { $avg: '$systemStatus.memoryUsage' },
          totalWebsiteVisits: { $sum: { $size: '$websites' } },
          totalFileTransfers: { $sum: { $size: '$fileTransfers' } },
          totalExternalConnections: { $sum: { $size: '$externalConnections' } },
          suspiciousActivities: {
            $sum: { $cond: ['$flags.suspiciousActivity', 1, 0] }
          },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const dailyStat = new DailyStats({
        date: today,
        ...stats[0],
        activeUserCount: stats[0].uniqueUsers.length
      });
      
      await dailyStat.save();
      console.log('Daily stats aggregated successfully');
    }
  }
  
  /**
   * Cleanup old data (older than 30 days)
   */
  async cleanupOldData() {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Archive or delete old logs
    const deleteResult = await UserActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`Cleaned up ${deleteResult.deletedCount} old activity logs`);
    }
    
    // Cleanup resolved alerts older than 60 days
    const alertCutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const alertDeleteResult = await ActivityAlert.deleteMany({
      status: 'RESOLVED',
      resolvedAt: { $lt: alertCutoff }
    });
    
    if (alertDeleteResult.deletedCount > 0) {
      console.log(`Cleaned up ${alertDeleteResult.deletedCount} old resolved alerts`);
    }
  }
  
  /**
   * Generate alerts for a given activity log
   */
  async generateAlerts(activityLog) {
    const alerts = [];
    
    // High bandwidth alert
    if (activityLog.flags.highBandwidth) {
      alerts.push({
        userId: activityLog.userId,
        userName: activityLog.userName,
        systemName: activityLog.systemName,
        alertType: 'HIGH_BANDWIDTH',
        severity: activityLog.network.totalMB > 1000 ? 'HIGH' : 'MEDIUM',
        title: 'High Bandwidth Usage Detected',
        description: `${activityLog.userName} has used ${activityLog.network.totalMB.toFixed(2)} MB of bandwidth`,
        relatedLogId: activityLog._id,
        metadata: { bandwidthMB: activityLog.network.totalMB },
        triggeredAt: activityLog.timestamp
      });
    }
    
    // Large file transfer alert
    if (activityLog.flags.largeFileTransfer) {
      const largeFiles = activityLog.fileTransfers.filter(
        f => f.fileSize > 100 * 1024 * 1024
      );
      
      for (const file of largeFiles) {
        alerts.push({
          userId: activityLog.userId,
          userName: activityLog.userName,
          systemName: activityLog.systemName,
          alertType: 'LARGE_FILE_TRANSFER',
          severity: file.fileSize > 500 * 1024 * 1024 ? 'HIGH' : 'MEDIUM',
          title: 'Large File Transfer Detected',
          description: `${activityLog.userName} transferred ${file.fileName} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB) via ${file.method}`,
          relatedLogId: activityLog._id,
          metadata: {
            fileName: file.fileName,
            fileSize: file.fileSize
          },
          triggeredAt: file.timestamp
        });
      }
    }
    
    // Suspicious activity
    if (activityLog.flags.suspiciousActivity) {
      alerts.push({
        userId: activityLog.userId,
        userName: activityLog.userName,
        systemName: activityLog.systemName,
        alertType: 'SUSPICIOUS_ACTIVITY',
        severity: activityLog.riskScore > 75 ? 'CRITICAL' : 'HIGH',
        title: 'Suspicious Activity Detected',
        description: `${activityLog.userName}'s activity has a risk score of ${activityLog.riskScore}`,
        relatedLogId: activityLog._id,
        metadata: { riskScore: activityLog.riskScore },
        triggeredAt: activityLog.timestamp
      });
    }
    
    // Check for duplicate alerts in last hour
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const alertData of alerts) {
      const duplicate = await ActivityAlert.findOne({
        userId: alertData.userId,
        alertType: alertData.alertType,
        triggeredAt: { $gte: lastHour }
      });
      
      if (!duplicate) {
        await ActivityAlert.create(alertData);
      }
    }
  }
  
  /**
   * Create anomaly alert (check for duplicates)
   */
  async createAnomalyAlert(alertData) {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    
    const duplicate = await ActivityAlert.findOne({
      userId: alertData.userId,
      alertType: alertData.alertType,
      triggeredAt: { $gte: lastHour }
    });
    
    if (!duplicate) {
      alertData.triggeredAt = new Date();
      await ActivityAlert.create(alertData);
      console.log(`Created anomaly alert: ${alertData.title}`);
    }
  }
}

// Schema for daily aggregated stats
const dailyStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalLogs: { type: Number, default: 0 },
  activeUserCount: { type: Number, default: 0 },
  totalUploadMB: { type: Number, default: 0 },
  totalDownloadMB: { type: Number, default: 0 },
  avgCpuUsage: { type: Number, default: 0 },
  avgMemoryUsage: { type: Number, default: 0 },
  totalWebsiteVisits: { type: Number, default: 0 },
  totalFileTransfers: { type: Number, default: 0 },
  totalExternalConnections: { type: Number, default: 0 },
  suspiciousActivities: { type: Number, default: 0 },
  avgRiskScore: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'daily_activity_stats'
});

// Create singleton instance
const analyzer = new ActivityAnalyzer();

module.exports = analyzer;

