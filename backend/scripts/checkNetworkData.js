// Check what data exists in the database
// Run with: node scripts/checkNetworkData.js

require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    console.log('🔍 Checking Network Monitoring Data...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const SystemAgent = require('../models/SystemAgent');
    const NetworkMonitoring = require('../models/NetworkMonitoring');
    
    // Check SystemAgents
    console.log('📋 System Agents (Registered Systems):');
    console.log('=====================================');
    const agents = await SystemAgent.find().populate('userId', 'name email');
    
    if (agents.length === 0) {
      console.log('❌ No agents registered\n');
    } else {
      console.log(`Found ${agents.length} agent(s):\n`);
      agents.forEach((agent, i) => {
        console.log(`${i + 1}. System: ${agent.systemName}`);
        console.log(`   ID: ${agent.systemId}`);
        console.log(`   User: ${agent.userId?.name} (${agent.userId?.email})`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Active: ${agent.isActive}`);
        console.log(`   Last Heartbeat: ${agent.lastHeartbeat}`);
        console.log(`   Installed: ${agent.installDate}`);
        console.log(`   Token Exists: ${agent.agentToken ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
    // Check NetworkMonitoring logs
    console.log('📊 Network Monitoring Logs (Data Received):');
    console.log('==========================================');
    const logs = await NetworkMonitoring.find().sort({ timestamp: -1 }).limit(10);
    
    if (logs.length === 0) {
      console.log('❌ No monitoring data received yet!\n');
      console.log('This means the agent is registered but NOT sending data.\n');
    } else {
      console.log(`Found ${logs.length} recent log(s):\n`);
      logs.forEach((log, i) => {
        console.log(`${i + 1}. System: ${log.systemName} (${log.systemId})`);
        console.log(`   Time: ${log.timestamp}`);
        console.log(`   Upload: ${log.totalUploadMB} MB`);
        console.log(`   Download: ${log.totalDownloadMB} MB`);
        console.log(`   Total: ${log.totalDataMB} MB`);
        console.log(`   Websites: ${log.websites.length}`);
        console.log('');
      });
    }
    
    // Check total documents
    const totalAgents = await SystemAgent.countDocuments();
    const totalLogs = await NetworkMonitoring.countDocuments();
    
    console.log('📈 Summary:');
    console.log('===========');
    console.log(`Total Agents Registered: ${totalAgents}`);
    console.log(`Total Monitoring Logs: ${totalLogs}`);
    console.log('');
    
    if (totalAgents > 0 && totalLogs === 0) {
      console.log('⚠️  PROBLEM IDENTIFIED:');
      console.log('   Agents are registered but NOT sending data!\n');
      console.log('Possible causes:');
      console.log('1. Agent is not running on the system');
      console.log('2. Agent has wrong token or backend URL');
      console.log('3. Agent cannot connect to backend (firewall/network)');
      console.log('4. Backend is not receiving agent requests\n');
      console.log('Next steps:');
      console.log('1. Check if agent is running: python "C:\\Program Files\\ITNetworkMonitor\\network_monitor_agent.py" status');
      console.log('2. Check agent logs: type %USERPROFILE%\\.it_monitor\\agent.log');
      console.log('3. Start the agent: python "C:\\Program Files\\ITNetworkMonitor\\network_monitor_agent.py"');
      console.log('');
    }
    
    if (totalAgents === 0) {
      console.log('⚠️  PROBLEM: No agents registered');
      console.log('   Complete the registration first!');
      console.log('');
    }
    
    if (totalAgents > 0 && totalLogs > 0) {
      console.log('✅ Everything looks good!');
      console.log('   Agents are registered and sending data.');
      console.log('');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkData();

