// Test if backend can receive network monitoring data
// Run with: node scripts/testDataReception.js

require('dotenv').config();
const mongoose = require('mongoose');

async function testReception() {
  try {
    console.log('🔍 Testing Network Monitoring Data Reception...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const NetworkMonitoring = require('../models/NetworkMonitoring');
    
    // Check recent logs in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentLogs = await NetworkMonitoring.find({
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 }).limit(5);
    
    console.log('📊 Recent Network Logs (Last 5 minutes):');
    console.log('=========================================');
    
    if (recentLogs.length === 0) {
      console.log('❌ NO DATA RECEIVED in last 5 minutes!\n');
      console.log('Possible causes:');
      console.log('  1. Agent not running');
      console.log('  2. Agent sending data but backend rejecting it');
      console.log('  3. Backend not restarted after code changes\n');
      
      // Check if there's any data at all
      const totalLogs = await NetworkMonitoring.countDocuments();
      console.log(`Total logs in database: ${totalLogs}`);
      
      if (totalLogs > 0) {
        const lastLog = await NetworkMonitoring.findOne().sort({ timestamp: -1 });
        console.log(`\nLast log received at: ${lastLog.timestamp}`);
        console.log(`From system: ${lastLog.systemName} (${lastLog.systemId})`);
      }
    } else {
      console.log(`✅ Found ${recentLogs.length} recent log(s):\n`);
      
      recentLogs.forEach((log, i) => {
        console.log(`${i + 1}. ${log.systemName} (${log.systemId})`);
        console.log(`   Time: ${log.timestamp}`);
        console.log(`   Upload: ${log.totalUploadMB} MB`);
        console.log(`   Download: ${log.totalDownloadMB} MB`);
        console.log(`   Total: ${log.totalDataMB} MB`);
        console.log(`   Websites: ${log.websites.length}`);
        
        if (log.websites.length > 0) {
          console.log(`   Top domains:`);
          log.websites.slice(0, 3).forEach(site => {
            console.log(`     - ${site.domain}: ${site.dataUsedMB} MB`);
          });
        }
        console.log('');
      });
      
      console.log('✅ Backend IS receiving data correctly!');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testReception();








