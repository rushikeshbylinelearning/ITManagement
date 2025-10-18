require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function testAllServices() {
  console.log('🔍 Testing All Services...\n');

  let allTestsPassed = true;

  // Test 1: Backend API connectivity
  console.log('1️⃣ Testing Backend API (localhost:5001)...');
  try {
    const response = await axios.get('http://localhost:5001/api/auth/me', { timeout: 5000 });
    console.log(`✅ Backend API responding: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Backend API responding (401 = auth required, which is correct)');
    } else {
      console.log(`❌ Backend API error: ${error.response?.status || error.message}`);
      allTestsPassed = false;
    }
  }

  // Test 2: Frontend connectivity
  console.log('\n2️⃣ Testing Frontend (localhost:5174)...');
  try {
    const response = await axios.get('http://localhost:5174', { timeout: 5000 });
    console.log(`✅ Frontend responding: ${response.status}`);
  } catch (error) {
    console.log(`❌ Frontend error: ${error.response?.status || error.message}`);
    allTestsPassed = false;
  }

  // Test 3: Database connectivity
  console.log('\n3️⃣ Testing Database Connection...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected successfully');
    
    // Test network monitoring collection
    const NetworkMonitoring = require('../models/NetworkMonitoring');
    const SystemAgent = require('../models/SystemAgent');
    
    const logCount = await NetworkMonitoring.countDocuments();
    const agentCount = await SystemAgent.countDocuments({ isActive: true });
    
    console.log(`✅ Network logs in database: ${logCount}`);
    console.log(`✅ Active agents in database: ${agentCount}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 4: Network monitoring endpoints
  console.log('\n4️⃣ Testing Network Monitoring Endpoints...');
  try {
    const response = await axios.get('http://localhost:5001/api/network-monitoring/test-auth', { timeout: 5000 });
    console.log(`✅ Network monitoring endpoints accessible: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Network monitoring endpoints accessible (401 = auth required)');
    } else {
      console.log(`❌ Network monitoring endpoints error: ${error.response?.status || error.message}`);
      allTestsPassed = false;
    }
  }

  // Test 5: Check recent network logs
  console.log('\n5️⃣ Checking Recent Network Logs...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const NetworkMonitoring = require('../models/NetworkMonitoring');
    
    const recentLogs = await NetworkMonitoring.find()
      .sort({ timestamp: -1 })
      .limit(5);
    
    if (recentLogs.length > 0) {
      console.log(`✅ Found ${recentLogs.length} recent network logs`);
      const latestLog = recentLogs[0];
      console.log(`   Latest: ${latestLog.totalUploadMB} MB up, ${latestLog.totalDownloadMB} MB down`);
      console.log(`   Timestamp: ${latestLog.timestamp}`);
    } else {
      console.log('⚠️  No recent network logs found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`❌ Network logs check error: ${error.message}`);
    allTestsPassed = false;
  }

  // Summary
  console.log('\n📋 SERVICE TEST SUMMARY:');
  console.log('========================');
  
  if (allTestsPassed) {
    console.log('✅ ALL SERVICES WORKING CORRECTLY!');
    console.log('🎉 Your development environment is fully functional');
    console.log('\n🚀 Next steps:');
    console.log('1. Open http://localhost:5174 in your browser');
    console.log('2. Login with your admin credentials');
    console.log('3. Navigate to Network Monitoring section');
    console.log('4. Enjoy the working system!');
  } else {
    console.log('❌ SOME SERVICES HAVE ISSUES');
    console.log('🔧 Check the errors above and fix them');
    console.log('\n🛠️  Common fixes:');
    console.log('1. Start backend: cd backend && node server.js');
    console.log('2. Start frontend: cd frontend && npm run dev');
    console.log('3. Check MongoDB is running');
    console.log('4. Verify .env file configuration');
  }

  console.log('\n📊 Service URLs:');
  console.log('- Frontend: http://localhost:5174');
  console.log('- Backend API: http://localhost:5001/api');
  console.log('- Network Monitoring: http://localhost:5174/network-monitoring');
}

testAllServices();
