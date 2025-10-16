// Diagnose why table is empty when Active Systems count shows 3
// Run with: node scripts/checkWhyTableEmpty.js

require('dotenv').config();
const mongoose = require('mongoose');

async function diagnose() {
  try {
    console.log('🔍 Diagnosing Empty Table Issue...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = require('../models/User');
    const SystemAgent = require('../models/SystemAgent');
    const NetworkMonitoring = require('../models/NetworkMonitoring');
    
    // Check 1: Registered Agents
    console.log('📋 CHECK 1: Registered Agents (Count)');
    console.log('======================================');
    const totalAgents = await SystemAgent.countDocuments({ isActive: true });
    console.log(`Active agents in database: ${totalAgents}`);
    
    const allAgents = await SystemAgent.find().populate('userId', 'name email').sort({ createdAt: -1 });
    console.log(`\nAll registered agents:`);
    allAgents.forEach((agent, i) => {
      console.log(`\n${i + 1}. ${agent.systemName}`);
      console.log(`   System ID: ${agent.systemId}`);
      console.log(`   User: ${agent.userId?.name} (${agent.userId?.email})`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Active: ${agent.isActive}`);
      console.log(`   Installed: ${agent.installDate}`);
      console.log(`   Last Heartbeat: ${agent.lastHeartbeat}`);
    });
    console.log('');
    
    // Check 2: Network Data Logs
    console.log('📊 CHECK 2: Network Monitoring Logs (Table Data)');
    console.log('================================================');
    const totalLogs = await NetworkMonitoring.countDocuments();
    console.log(`Total network logs in database: ${totalLogs}`);
    
    if (totalLogs === 0) {
      console.log('\n❌ NO NETWORK LOGS FOUND!');
      console.log('   This is why the table is empty.\n');
    } else {
      const recentLogs = await NetworkMonitoring.find().sort({ timestamp: -1 }).limit(5);
      console.log(`\nRecent logs:`);
      recentLogs.forEach((log, i) => {
        console.log(`\n${i + 1}. ${log.systemName} (${log.systemId})`);
        console.log(`   Time: ${log.timestamp}`);
        console.log(`   Upload: ${log.totalUploadMB} MB`);
        console.log(`   Download: ${log.totalDownloadMB} MB`);
        console.log(`   Websites: ${log.websites.length}`);
      });
      console.log('');
    }
    
    // Check 3: Date Range Query
    console.log('📅 CHECK 3: Query Date Range (Last 7 Days)');
    console.log('==========================================');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    console.log(`Start Date: ${sevenDaysAgo}`);
    console.log(`End Date: ${now}`);
    
    const logsInRange = await NetworkMonitoring.countDocuments({
      timestamp: { $gte: sevenDaysAgo, $lte: now }
    });
    console.log(`Logs in this date range: ${logsInRange}\n`);
    
    // Check 4: What would the query return?
    console.log('🔍 CHECK 4: Simulating Dashboard Query');
    console.log('======================================');
    const result = await NetworkMonitoring.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: '$systemId',
          systemName: { $first: '$systemName' },
          userId: { $first: '$userId' },
          totalUpload: { $sum: '$totalUploadMB' },
          totalDownload: { $sum: '$totalDownloadMB' },
          totalData: { $sum: '$totalDataMB' },
          lastUpdate: { $max: '$timestamp' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalData: -1 } }
    ]);
    
    console.log(`Query would return ${result.length} system(s):`);
    if (result.length === 0) {
      console.log('   ❌ EMPTY (This is what dashboard sees!)\n');
    } else {
      result.forEach((sys, i) => {
        console.log(`\n${i + 1}. ${sys.systemName}`);
        console.log(`   Upload: ${sys.totalUpload} MB`);
        console.log(`   Download: ${sys.totalDownload} MB`);
        console.log(`   Total: ${sys.totalData} MB`);
        console.log(`   Last Update: ${sys.lastUpdate}`);
      });
      console.log('');
    }
    
    // Diagnosis
    console.log('🎯 DIAGNOSIS:');
    console.log('=============');
    
    if (totalAgents > 0 && totalLogs === 0) {
      console.log('❌ PROBLEM: Agents registered but NOT sending data\n');
      console.log('WHY:');
      console.log('  - Agents are installed and registered');
      console.log('  - BUT agents are NOT running');
      console.log('  - Dashboard count shows registered agents');
      console.log('  - Dashboard table shows only systems with data logs');
      console.log('  - Since no data logs exist, table is empty!\n');
      console.log('SOLUTION:');
      console.log('  1. Start the agent on each computer:');
      console.log('     python "C:\\Program Files\\ITNetworkMonitor\\network_monitor_agent.py"');
      console.log('  2. Wait 10-20 seconds for data to be sent');
      console.log('  3. Refresh dashboard');
      console.log('  4. Table will now show systems with data!\n');
    } else if (totalAgents === 0) {
      console.log('❌ PROBLEM: No agents registered at all\n');
      console.log('SOLUTION: Register agents first!\n');
    } else if (totalAgents > 0 && totalLogs > 0 && result.length === 0) {
      console.log('❌ PROBLEM: Data exists but outside date range\n');
      console.log('SOLUTION: Adjust date range filter or start agents again\n');
    } else if (totalAgents > 0 && totalLogs > 0 && result.length > 0) {
      console.log('✅ Everything is working correctly!\n');
      console.log('If dashboard still shows empty:');
      console.log('  1. Hard refresh browser (Ctrl+F5)');
      console.log('  2. Check browser console for errors');
      console.log('  3. Verify you\'re logged in as admin\n');
    }
    
    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`Registered Agents: ${totalAgents}`);
    console.log(`Data Logs: ${totalLogs}`);
    console.log(`Systems in Table: ${result.length}`);
    console.log(`Status: ${result.length > 0 ? '✅ Working' : '❌ Not Working'}`);
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

diagnose();

