require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');
const User = require('../models/User');
const axios = require('axios');

async function testAgentConnection() {
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

    console.log(`\n🤖 Testing connection for agent: ${agent.systemName} (${agent.systemId})`);
    console.log(`User: ${agent.userId?.name} (${agent.userId?.email})`);
    console.log(`Token: ${agent.agentToken ? 'Present' : 'Missing'}`);

    if (!agent.agentToken) {
      console.log('❌ Agent has no token, cannot test connection');
      return;
    }

    // Test heartbeat endpoint
    console.log('\n💓 Testing heartbeat endpoint...');
    try {
      const heartbeatResponse = await axios.post(
        'https://itmanagement.bylinelms.com/api/network-monitoring/heartbeat',
        {},
        {
          headers: {
            'Authorization': `Bearer ${agent.agentToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ Heartbeat successful:', heartbeatResponse.status, heartbeatResponse.data);
    } catch (error) {
      console.log('❌ Heartbeat failed:', error.response?.status, error.response?.data || error.message);
    }

    // Test logs endpoint
    console.log('\n📊 Testing logs endpoint...');
    const testPayload = {
      totalUploadMB: 1.5,
      totalDownloadMB: 3.2,
      websites: [
        {
          domain: 'test.com',
          dataUsedMB: 4.7,
          uploadMB: 1.5,
          downloadMB: 3.2,
          requestCount: 5
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
      const logsResponse = await axios.post(
        'https://itmanagement.bylinelms.com/api/network-monitoring/logs',
        testPayload,
        {
          headers: {
            'Authorization': `Bearer ${agent.agentToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ Logs endpoint successful:', logsResponse.status, logsResponse.data);
    } catch (error) {
      console.log('❌ Logs endpoint failed:', error.response?.status, error.response?.data || error.message);
    }

    // Test with localhost (development)
    console.log('\n🏠 Testing with localhost (development)...');
    try {
      const localHeartbeatResponse = await axios.post(
        'http://localhost:5001/api/network-monitoring/heartbeat',
        {},
        {
          headers: {
            'Authorization': `Bearer ${agent.agentToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      console.log('✅ Localhost heartbeat successful:', localHeartbeatResponse.status, localHeartbeatResponse.data);
    } catch (error) {
      console.log('❌ Localhost heartbeat failed:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error testing agent connection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

testAgentConnection();


