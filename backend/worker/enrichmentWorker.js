// Enrichment Worker for Computer Monitoring
// Processes telemetry data, enriches it, and applies advanced rules

const mongoose = require('mongoose');
const dns = require('dns').promises;
require('dotenv').config();

// Models
const DomainAccess = require('../models/DomainAccess');
const NetworkUsage = require('../models/NetworkUsage');
const MonitoringSettings = require('../models/MonitoringSettings');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Enrichment Worker connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/**
 * Reverse DNS lookup for IP addresses
 */
async function enrichNetworkWithReverseDNS() {
  try {
    // Find network records from last hour without enriched domain
    const oneHourAgo = new Date(Date.now() - 3600000);
    const records = await NetworkUsage.find({
      timestamp: { $gte: oneHourAgo },
      remoteAddress: { $ne: null, $exists: true }
    }).limit(100);
    
    let enriched = 0;
    
    for (const record of records) {
      if (!record.remoteAddress || record.remoteAddress === '0.0.0.0') continue;
      
      try {
        const hostnames = await dns.reverse(record.remoteAddress);
        
        if (hostnames && hostnames.length > 0) {
          const domain = extractDomain(hostnames[0]);
          
          // Create or update domain access record
          await DomainAccess.findOneAndUpdate(
            {
              hostId: record.hostId,
              domain: domain,
              timestamp: { 
                $gte: new Date(record.timestamp.getTime() - 60000),
                $lte: new Date(record.timestamp.getTime() + 60000)
              }
            },
            {
              $inc: { 
                frequency: 1,
                bytesTransferred: (record.bytesIn || 0) + (record.bytesOut || 0)
              },
              $setOnInsert: {
                hostId: record.hostId,
                hostname: record.hostname,
                domain: domain,
                source: 'netflow',
                timestamp: record.timestamp
              }
            },
            { upsert: true }
          );
          
          enriched++;
        }
      } catch (error) {
        // DNS lookup failed - skip this record
        continue;
      }
    }
    
    if (enriched > 0) {
      console.log(`✅ Enriched ${enriched} network records with reverse DNS`);
    }
    
  } catch (error) {
    console.error('Error enriching network data:', error.message);
  }
}

/**
 * Extract domain from hostname (remove subdomain)
 */
function extractDomain(hostname) {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * Normalize domain names (remove tracking parameters, normalize case)
 */
async function normalizeDomains() {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const domains = await DomainAccess.find({
      timestamp: { $gte: oneHourAgo }
    }).limit(100);
    
    let normalized = 0;
    
    for (const domain of domains) {
      const original = domain.domain;
      let normalizedDomain = original.toLowerCase().trim();
      
      // Remove www. prefix
      normalizedDomain = normalizedDomain.replace(/^www\./, '');
      
      // Remove common tracking subdomains
      normalizedDomain = normalizedDomain.replace(/^(analytics|tracking|stats|metrics)\./, '');
      
      if (normalizedDomain !== original) {
        domain.domain = normalizedDomain;
        await domain.save();
        normalized++;
      }
    }
    
    if (normalized > 0) {
      console.log(`✅ Normalized ${normalized} domain names`);
    }
    
  } catch (error) {
    console.error('Error normalizing domains:', error.message);
  }
}

/**
 * Correlate agent users with database users
 * Maps OS usernames to User IDs
 */
async function correlateUsers() {
  try {
    const User = require('../models/User');
    
    // Find domain access without userId
    const oneHourAgo = new Date(Date.now() - 3600000);
    const records = await DomainAccess.find({
      userId: null,
      timestamp: { $gte: oneHourAgo }
    }).limit(100);
    
    let correlated = 0;
    
    for (const record of records) {
      // Try to find user by hostname or other metadata
      // This is a placeholder - actual correlation logic depends on your user mapping
      // You might need to check Host.installedBy or other fields
      
      // Example: Match by hostname (if hostname contains username)
      const users = await User.find({});
      
      for (const user of users) {
        if (record.hostname && record.hostname.toLowerCase().includes(user.name.toLowerCase())) {
          record.userId = user._id;
          await record.save();
          correlated++;
          break;
        }
      }
    }
    
    if (correlated > 0) {
      console.log(`✅ Correlated ${correlated} records with users`);
    }
    
  } catch (error) {
    console.error('Error correlating users:', error.message);
  }
}

/**
 * Aggregate bandwidth statistics
 * Creates summary records for reporting
 */
async function aggregateBandwidthStats() {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    // Aggregate by host
    const hostStats = await NetworkUsage.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      {
        $group: {
          _id: '$hostId',
          totalBytesIn: { $sum: '$bytesIn' },
          totalBytesOut: { $sum: '$bytesOut' },
          totalPackets: { $sum: { $add: ['$packetsIn', '$packetsOut'] } }
        }
      }
    ]);
    
    console.log(`📊 Bandwidth stats: ${hostStats.length} hosts processed`);
    
    // Aggregate by process
    const processStats = await NetworkUsage.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo }, processName: { $ne: null } } },
      {
        $group: {
          _id: '$processName',
          totalBytesOut: { $sum: '$bytesOut' },
          hostCount: { $addToSet: '$hostId' }
        }
      },
      { $sort: { totalBytesOut: -1 } },
      { $limit: 10 }
    ]);
    
    if (processStats.length > 0) {
      console.log('📊 Top uploading processes:');
      processStats.forEach(stat => {
        const mb = (stat.totalBytesOut / (1024 * 1024)).toFixed(2);
        console.log(`   - ${stat._id}: ${mb} MB uploaded`);
      });
    }
    
  } catch (error) {
    console.error('Error aggregating bandwidth stats:', error.message);
  }
}

/**
 * Clean up expired data based on retention settings
 */
async function cleanupExpiredData() {
  try {
    const settings = await MonitoringSettings.getSettings();
    
    const now = new Date();
    const NetworkUsage = require('../models/NetworkUsage');
    const FileEvent = require('../models/FileEvent');
    const ProcessEvent = require('../models/ProcessEvent');
    
    // Calculate expiry dates
    const networkExpiry = new Date(now - settings.retention.networkUsage * 24 * 60 * 60 * 1000);
    const domainExpiry = new Date(now - settings.retention.domainAccess * 24 * 60 * 60 * 1000);
    const fileExpiry = new Date(now - settings.retention.fileEvents * 24 * 60 * 60 * 1000);
    const processExpiry = new Date(now - settings.retention.processEvents * 24 * 60 * 60 * 1000);
    const sessionExpiry = new Date(now - settings.retention.userSessions * 24 * 60 * 60 * 1000);
    
    // Delete expired records
    const [netDeleted, domainDeleted, fileDeleted, processDeleted, sessionDeleted] = await Promise.all([
      NetworkUsage.deleteMany({ timestamp: { $lt: networkExpiry } }),
      DomainAccess.deleteMany({ timestamp: { $lt: domainExpiry } }),
      FileEvent.deleteMany({ timestamp: { $lt: fileExpiry } }),
      ProcessEvent.deleteMany({ createdAt: { $lt: processExpiry } }),
      require('../models/UserSession').deleteMany({ createdAt: { $lt: sessionExpiry }, isActive: false })
    ]);
    
    if (netDeleted.deletedCount > 0 || domainDeleted.deletedCount > 0 || 
        fileDeleted.deletedCount > 0 || processDeleted.deletedCount > 0 || 
        sessionDeleted.deletedCount > 0) {
      console.log(`🗑️  Cleaned up expired data:
        - Network: ${netDeleted.deletedCount}
        - Domains: ${domainDeleted.deletedCount}
        - Files: ${fileDeleted.deletedCount}
        - Processes: ${processDeleted.deletedCount}
        - Sessions: ${sessionDeleted.deletedCount}`);
    }
    
  } catch (error) {
    console.error('Error cleaning up expired data:', error.message);
  }
}

/**
 * Main worker loop
 */
async function runWorker() {
  console.log('🔧 Starting Enrichment Worker...');
  
  // Run initial tasks
  await enrichNetworkWithReverseDNS();
  await normalizeDomains();
  await correlateUsers();
  await aggregateBandwidthStats();
  
  // Schedule periodic tasks
  setInterval(async () => {
    console.log('⚙️  Running enrichment tasks...');
    await enrichNetworkWithReverseDNS();
    await normalizeDomains();
    await correlateUsers();
  }, 5 * 60 * 1000); // Every 5 minutes
  
  setInterval(async () => {
    console.log('📊 Running aggregation tasks...');
    await aggregateBandwidthStats();
  }, 15 * 60 * 1000); // Every 15 minutes
  
  setInterval(async () => {
    console.log('🗑️  Running cleanup tasks...');
    await cleanupExpiredData();
  }, 60 * 60 * 1000); // Every hour
  
  console.log('✅ Enrichment Worker is running');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Enrichment Worker...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Enrichment Worker...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start worker
runWorker().catch(error => {
  console.error('Fatal error in worker:', error);
  process.exit(1);
});

module.exports = { runWorker };

