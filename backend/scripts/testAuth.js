require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');

async function testAuth() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    // Test the auth endpoint first
    console.log('\n🔐 Testing authentication endpoint...');
    try {
      const response = await axios.get('http://localhost:5001/api/auth/me', {
        withCredentials: true,
        timeout: 10000
      });
      console.log('✅ Auth endpoint accessible:', response.status);
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Auth endpoint error:', error.response?.status, error.response?.data || error.message);
    }

    // Test network monitoring test-auth endpoint
    console.log('\n🔐 Testing network monitoring test-auth endpoint...');
    try {
      const response = await axios.get('http://localhost:5001/api/network-monitoring/test-auth', {
        withCredentials: true,
        timeout: 10000
      });
      console.log('✅ Network monitoring test-auth accessible:', response.status);
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Network monitoring test-auth error:', error.response?.status, error.response?.data || error.message);
    }

    // Test network monitoring stats endpoint (should require auth)
    console.log('\n📊 Testing network monitoring stats endpoint...');
    try {
      const response = await axios.get('http://localhost:5001/api/network-monitoring/stats', {
        withCredentials: true,
        timeout: 10000
      });
      console.log('✅ Network monitoring stats accessible:', response.status);
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Network monitoring stats error:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error testing auth:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

testAuth();
