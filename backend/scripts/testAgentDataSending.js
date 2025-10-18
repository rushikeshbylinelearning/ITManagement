require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');
const NetworkMonitoring = require('../models/NetworkMonitoring');
const User = require('../models/User');
const axios = require('axios');

async function testAgentDataSending() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    // Get the first active agent
    const agent = await SystemAgent.findOne({ isActive: true })
      .select('+agentToken')
      .populate('userId', 'name email');

    if (!agent) {
      console.log('❌ No active agents found');
      return;
    }

    console.log(`\n🤖 Testing data sending for agent: ${agent.systemName} (${agent.systemId})`);
    console.log(`User: ${agent.userId?.name} (${agent.userId?.email})`);
    console.log(`Token: ${agent.agentToken ? 'Present' : 'Missing'}`);

    if (!agent.agentToken) {
      console.log('❌ Agent has no token, cannot test data sending');
      return;
    }

    // Test data payload (simulating what an agent would send)
    const testPayload = {
      totalUploadMB: 2.5,
      totalDownloadMB: 8.3,
      websites: [
        {
          domain: 'google.com',
          dataUsedMB: 5.2,
          uploadMB: 0.8,
          downloadMB: 4.4,
          requestCount: 12
        },
        {
          domain: 'youtube.com',
          dataUsedMB: 5.6,
          uploadMB: 1.7,
          downloadMB: 3.9,
          requestCount: 6
        }
      ],
      agentVersion: '1.0.0',
      systemInfo: {
        os: 'Windows',
        osVersion: '10.0.26200',
        ipAddress: '192.168.1.100',
        macAddress: '00:11:22:33:44:55'
      }
    };

    console.log('\n📊 Test payload:', JSON.stringify(testPayload, null, 2));

    // Test sending to localhost (development)
    console.log('\n🏠 Testing data sending to localhost (development)...');
    try {
      const response = await axios.post(
        'http://localhost:5001/api/network-monitoring/logs',
        testPayload,
        {
          headers: {
            'Authorization': `Bearer ${agent.agentToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ Data sent successfully to localhost:', response.status, response.data);
    } catch (error) {
      console.log('❌ Failed to send data to localhost:', error.response?.status, error.response?.data || error.message);
    }

    // Check if the data was saved to database
    console.log('\n📋 Checking if data was saved to database...');
    const recentLogs = await NetworkMonitoring.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('userId', 'name email');

    console.log(`Found ${recentLogs.length} recent logs:`);
    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. System: ${log.systemName} (${log.systemId})`);
      console.log(`   Upload: ${log.totalUploadMB} MB, Download: ${log.totalDownloadMB} MB, Total: ${log.totalDataMB} MB`);
      console.log(`   Websites: ${log.websites.length} entries`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log('   ---');
    });

    // Test the aggregation queries
    console.log('\n📈 Testing aggregation queries...');
    
    // Test getAllSystemsOverview
    const overview = await NetworkMonitoring.getAllSystemsOverview(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );
    console.log(`All systems overview: ${overview.length} systems found`);
    overview.forEach(system => {
      console.log(`  - ${system.systemName}: ${system.totalData} MB total`);
    });

  } catch (error) {
    console.error('❌ Error testing agent data sending:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

testAgentDataSending();