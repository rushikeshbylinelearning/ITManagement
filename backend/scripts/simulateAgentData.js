require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');
const User = require('../models/User');
const axios = require('axios');

async function simulateAgentData() {
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

    console.log(`\n🤖 Simulating agent data for: ${agent.systemName} (${agent.systemId})`);
    console.log(`User: ${agent.userId?.name} (${agent.userId?.email})`);

    if (!agent.agentToken) {
      console.log('❌ Agent has no token, cannot simulate data');
      return;
    }

    // Simulate realistic network data
    const websites = [
      { domain: 'google.com', baseUpload: 0.5, baseDownload: 2.0 },
      { domain: 'youtube.com', baseUpload: 1.2, baseDownload: 8.5 },
      { domain: 'facebook.com', baseUpload: 0.3, baseDownload: 1.8 },
      { domain: 'github.com', baseUpload: 0.8, baseDownload: 3.2 },
      { domain: 'stackoverflow.com', baseUpload: 0.2, baseDownload: 1.5 },
      { domain: 'linkedin.com', baseUpload: 0.4, baseDownload: 2.1 },
      { domain: 'netflix.com', baseUpload: 0.1, baseDownload: 12.0 },
      { domain: 'amazon.com', baseUpload: 0.6, baseDownload: 4.3 }
    ];

    let dataCount = 0;
    const maxDataPoints = 20; // Send 20 data points

    console.log(`\n📊 Starting data simulation (${maxDataPoints} data points)...`);
    console.log('Press Ctrl+C to stop\n');

    const sendData = async () => {
      try {
        // Generate random but realistic data
        const selectedWebsites = websites.slice(0, Math.floor(Math.random() * 4) + 2); // 2-5 websites
        
        const websiteData = selectedWebsites.map(site => {
          const uploadVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
          const downloadVariation = (Math.random() - 0.5) * 1.0; // ±50% variation
          
          const uploadMB = Math.max(0.1, site.baseUpload + uploadVariation);
          const downloadMB = Math.max(0.5, site.baseDownload + downloadVariation);
          const dataUsedMB = uploadMB + downloadMB;
          
          return {
            domain: site.domain,
            dataUsedMB: Math.round(dataUsedMB * 100) / 100,
            uploadMB: Math.round(uploadMB * 100) / 100,
            downloadMB: Math.round(downloadMB * 100) / 100,
            requestCount: Math.floor(Math.random() * 20) + 5
          };
        });

        const totalUpload = websiteData.reduce((sum, w) => sum + w.uploadMB, 0);
        const totalDownload = websiteData.reduce((sum, w) => sum + w.downloadMB, 0);

        const payload = {
          totalUploadMB: Math.round(totalUpload * 100) / 100,
          totalDownloadMB: Math.round(totalDownload * 100) / 100,
          websites: websiteData,
          agentVersion: '1.0.0',
          systemInfo: {
            os: 'Windows',
            osVersion: '10.0.26200',
            ipAddress: '192.168.1.100',
            macAddress: '00:11:22:33:44:55'
          }
        };

        // Send data to localhost
        const response = await axios.post(
          'http://localhost:5001/api/network-monitoring/logs',
          payload,
          {
            headers: {
              'Authorization': `Bearer ${agent.agentToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        dataCount++;
        console.log(`📊 Data point ${dataCount}/${maxDataPoints}: ${totalUpload.toFixed(2)} MB up, ${totalDownload.toFixed(2)} MB down (${websiteData.length} websites)`);

        if (dataCount >= maxDataPoints) {
          console.log('\n✅ Simulation completed! Check the dashboard at http://localhost:5174');
          process.exit(0);
        }

      } catch (error) {
        console.log(`❌ Error sending data: ${error.response?.status || error.message}`);
      }
    };

    // Send data every 5 seconds
    const interval = setInterval(sendData, 5000);
    
    // Send first data point immediately
    await sendData();

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Simulation stopped by user');
      clearInterval(interval);
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error in simulation:', error);
  } finally {
    // Don't disconnect immediately as we're running continuously
  }
}

simulateAgentData();
