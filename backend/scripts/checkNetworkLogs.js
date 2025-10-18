require('dotenv').config();
const mongoose = require('mongoose');
const NetworkMonitoring = require('../models/NetworkMonitoring');
const SystemAgent = require('../models/SystemAgent');
const User = require('../models/User');

async function checkNetworkLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    // Check recent network monitoring logs
    console.log('\n📊 Checking recent network monitoring logs...');
    const recentLogs = await NetworkMonitoring.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email');

    console.log(`Found ${recentLogs.length} recent logs:`);
    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. System: ${log.systemName} (${log.systemId})`);
      console.log(`   User: ${log.userId?.name || 'Unknown'} (${log.userId?.email || 'Unknown'})`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log(`   Upload: ${log.totalUploadMB} MB, Download: ${log.totalDownloadMB} MB, Total: ${log.totalDataMB} MB`);
      console.log(`   Websites: ${log.websites.length} entries`);
      console.log(`   Agent Version: ${log.agentVersion}`);
      console.log('   ---');
    });

    // Check active agents
    console.log('\n🤖 Checking active agents...');
    const activeAgents = await SystemAgent.find({ isActive: true })
      .select('+agentToken') // Include the agentToken field
      .populate('userId', 'name email')
      .sort({ lastHeartbeat: -1 });

    console.log(`Found ${activeAgents.length} active agents:`);
    activeAgents.forEach((agent, index) => {
      const lastHeartbeat = new Date(agent.lastHeartbeat);
      const timeAgo = Math.round((Date.now() - agent.lastHeartbeat) / (1000 * 60));
      console.log(`${index + 1}. System: ${agent.systemName} (${agent.systemId})`);
      console.log(`   User: ${agent.userId?.name || 'Unknown'} (${agent.userId?.email || 'Unknown'})`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Last Heartbeat: ${lastHeartbeat.toISOString()} (${timeAgo} minutes ago)`);
      console.log(`   Agent Token: ${agent.agentToken ? 'Present' : 'Missing'}`);
      console.log('   ---');
    });

    // Check for logs in the last 24 hours
    console.log('\n📈 Checking logs in the last 24 hours...');
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs24h = await NetworkMonitoring.find({
      timestamp: { $gte: last24Hours }
    }).sort({ timestamp: -1 });

    console.log(`Found ${logs24h.length} logs in the last 24 hours`);

    if (logs24h.length > 0) {
      const totalUpload = logs24h.reduce((sum, log) => sum + log.totalUploadMB, 0);
      const totalDownload = logs24h.reduce((sum, log) => sum + log.totalDownloadMB, 0);
      const totalData = logs24h.reduce((sum, log) => sum + log.totalDataMB, 0);
      
      console.log(`Total Upload: ${totalUpload.toFixed(2)} MB`);
      console.log(`Total Download: ${totalDownload.toFixed(2)} MB`);
      console.log(`Total Data: ${totalData.toFixed(2)} MB`);
    }

    // Check for any errors in the logs
    console.log('\n🔍 Checking for potential issues...');
    
    // Check agents with recent heartbeats but no logs
    const agentsWithHeartbeats = await SystemAgent.find({
      isActive: true,
      lastHeartbeat: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    for (const agent of agentsWithHeartbeats) {
      const recentLogs = await NetworkMonitoring.find({
        systemId: agent.systemId,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      });

      if (recentLogs.length === 0) {
        console.log(`⚠️  Agent ${agent.systemName} (${agent.systemId}) has recent heartbeat but no network logs in the last hour`);
      } else {
        console.log(`✅ Agent ${agent.systemName} (${agent.systemId}) has ${recentLogs.length} logs in the last hour`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking network logs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

checkNetworkLogs();
