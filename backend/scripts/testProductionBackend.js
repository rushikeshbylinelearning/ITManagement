const axios = require('axios');

async function testProductionBackend() {
  console.log('🌐 Testing production backend endpoints...\n');

  const baseURL = 'https://itmanagement.bylinelms.com/api';

  // Test basic endpoints
  const endpoints = [
    '/auth/test',
    '/network-monitoring/test-auth',
    '/dashboard/stats',
    '/admin/stats'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${baseURL}${endpoint}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'IT-Management-Test-Script'
        }
      });
      console.log(`✅ ${endpoint}: ${response.status} - ${response.data?.message || 'OK'}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.data?.msg || error.response.data?.message || 'Error'}`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  // Test network monitoring endpoints specifically
  console.log('\n🔍 Testing network monitoring endpoints specifically...');
  
  const networkEndpoints = [
    '/network-monitoring/test-auth',
    '/network-monitoring/stats',
    '/network-monitoring/agents'
  ];

  for (const endpoint of networkEndpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${baseURL}${endpoint}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'IT-Management-Test-Script'
        }
      });
      console.log(`✅ ${endpoint}: ${response.status} - ${response.data?.message || 'OK'}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.data?.msg || error.response.data?.message || 'Error'}`);
        if (error.response.status === 404) {
          console.log(`   📝 This suggests the route is not registered on production`);
        }
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  // Test if the server is running at all
  console.log('\n🏠 Testing if server is running...');
  try {
    const response = await axios.get('https://itmanagement.bylinelms.com', {
      timeout: 10000,
      headers: {
        'User-Agent': 'IT-Management-Test-Script'
      }
    });
    console.log(`✅ Server is running: ${response.status}`);
  } catch (error) {
    console.log(`❌ Server not accessible: ${error.message}`);
  }
}

testProductionBackend();


