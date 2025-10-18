const axios = require('axios');

async function verifyProductionDeployment() {
  console.log('🔍 Verifying Production Deployment...\n');

  const baseURL = 'https://itmanagement.bylinelms.com/api';
  let allTestsPassed = true;

  // Test 1: Basic server connectivity
  console.log('1️⃣ Testing basic server connectivity...');
  try {
    const response = await axios.get('https://itmanagement.bylinelms.com', { timeout: 10000 });
    console.log(`✅ Server is running: ${response.status}`);
  } catch (error) {
    console.log(`❌ Server not accessible: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 2: Network monitoring test endpoint
  console.log('\n2️⃣ Testing network monitoring test endpoint...');
  try {
    const response = await axios.get(`${baseURL}/network-monitoring/test-auth`, { timeout: 10000 });
    console.log(`✅ Network monitoring routes are deployed: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`❌ Network monitoring routes NOT deployed (404 error)`);
      console.log(`   📝 This is the main issue - routes need to be deployed`);
      allTestsPassed = false;
    } else {
      console.log(`⚠️  Network monitoring endpoint error: ${error.response?.status || error.message}`);
    }
  }

  // Test 3: Check if auth routes are working
  console.log('\n3️⃣ Testing authentication routes...');
  try {
    const response = await axios.get(`${baseURL}/auth/test`, { timeout: 10000 });
    console.log(`✅ Auth routes are working: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`❌ Auth routes NOT deployed (404 error)`);
      console.log(`   📝 This suggests incomplete deployment`);
      allTestsPassed = false;
    } else {
      console.log(`⚠️  Auth endpoint error: ${error.response?.status || error.message}`);
    }
  }

  // Test 4: Check dashboard routes
  console.log('\n4️⃣ Testing dashboard routes...');
  try {
    const response = await axios.get(`${baseURL}/dashboard/stats`, { timeout: 10000 });
    console.log(`✅ Dashboard routes are working: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ Dashboard routes are working (401 = auth required, which is correct)`);
    } else if (error.response?.status === 404) {
      console.log(`❌ Dashboard routes NOT deployed (404 error)`);
      allTestsPassed = false;
    } else {
      console.log(`⚠️  Dashboard endpoint error: ${error.response?.status || error.message}`);
    }
  }

  // Summary
  console.log('\n📋 DEPLOYMENT VERIFICATION SUMMARY:');
  console.log('=====================================');
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED - Production deployment is working correctly!');
    console.log('🎉 Network monitoring should be functional');
  } else {
    console.log('❌ DEPLOYMENT ISSUES DETECTED:');
    console.log('   📝 The production server needs to be updated with the latest backend code');
    console.log('   📝 Specifically, the network monitoring routes are missing');
    console.log('   📝 This is why agents cannot send network data');
  }

  console.log('\n🔧 NEXT STEPS:');
  if (allTestsPassed) {
    console.log('1. Test agent connectivity');
    console.log('2. Check network monitoring dashboard');
    console.log('3. Verify agents are sending data');
  } else {
    console.log('1. Deploy latest backend code to production');
    console.log('2. Restart production server');
    console.log('3. Run this verification script again');
    console.log('4. Test agent connectivity');
  }
}

verifyProductionDeployment();


