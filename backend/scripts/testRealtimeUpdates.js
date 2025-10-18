require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');
const NetworkMonitoring = require('../models/NetworkMonitoring');
const User = require('../models/User');
const axios = require('axios');
const io = require('socket.io-client');

async function testRealtimeUpdates() {
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

    console.log(`\n🤖 Testing real-time updates for agent: ${agent.systemName} (${agent.systemId})`);

    if (!agent.agentToken) {
      console.log('❌ Agent has no token, cannot test real-time updates');
      return;
    }

    // Connect to Socket.IO server
    console.log('\n🔌 Connecting to Socket.IO server...');
    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Socket.IO connection error:', error.message);
    });

    // Listen for network updates
    socket.on('network-update', (data) => {
      console.log('\n📊 Real-time network update received:');
      console.log(`   System: ${data.systemName} (${data.systemId})`);
      console.log(`   Upload: ${data.totalUploadMB} MB`);
      console.log(`   Download: ${data.totalDownloadMB} MB`);
      console.log(`   Total: ${data.totalDataMB} MB`);
      console.log(`   Timestamp: ${data.timestamp}`);
      console.log(`   Websites: ${data.websites?.length || 0} entries`);
    });

    // Listen for stats updates
    socket.on('network-stats-update', (data) => {
      console.log('\n📈 Real-time stats update received:');
      console.log(`   Total Agents: ${data.totalAgents}`);
      console.log(`   Total Upload: ${data.usage.totalUpload} MB`);
      console.log(`   Total Download: ${data.usage.totalDownload} MB`);
      console.log(`   Total Data: ${data.usage.totalData} MB`);
      console.log(`   Record Count: ${data.usage.recordCount}`);
      console.log(`   Timestamp: ${data.timestamp}`);
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!socket.connected) {
      console.log('❌ Failed to connect to Socket.IO server');
      return;
    }

    // Send test data to trigger real-time updates
    console.log('\n📤 Sending test data to trigger real-time updates...');
    
    const testPayload = {
      totalUploadMB: 1.2,
      totalDownloadMB: 4.8,
      websites: [
        {
          domain: 'test-realtime.com',
          dataUsedMB: 6.0,
          uploadMB: 1.2,
          downloadMB: 4.8,
          requestCount: 8
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
      console.log('✅ Test data sent successfully:', response.status);
      console.log('⏳ Waiting for real-time updates...');
      
      // Wait for real-time updates
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.log('❌ Failed to send test data:', error.response?.status, error.response?.data || error.message);
    }

    // Check if data was saved
    console.log('\n📋 Checking if data was saved to database...');
    const recentLogs = await NetworkMonitoring.find()
      .sort({ timestamp: -1 })
      .limit(3);

    console.log(`Found ${recentLogs.length} recent logs:`);
    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. System: ${log.systemName}`);
      console.log(`   Upload: ${log.totalUploadMB} MB, Download: ${log.totalDownloadMB} MB, Total: ${log.totalDataMB} MB`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log(`   Websites: ${log.websites.length} entries`);
      console.log('   ---');
    });

    // Disconnect
    socket.disconnect();
    console.log('\n✅ Socket.IO disconnected');

  } catch (error) {
    console.error('❌ Error testing real-time updates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

testRealtimeUpdates();
