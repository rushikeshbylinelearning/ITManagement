#!/usr/bin/env node

/**
 * SSO Integration Test Script
 * 
 * This script tests the complete SSO integration flow between the SSO portal
 * and the IT Management app in both development and production environments.
 */

const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

const config = {
  development: {
    ssoPortalUrl: 'http://localhost:5000',
    ssoApiUrl: 'http://localhost:5000',
    itManagementBackend: 'http://localhost:5002',
    itManagementFrontend: 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET || 'test-secret-key'
  },
  production: {
    ssoPortalUrl: 'https://sso.bylinelms.com',
    ssoApiUrl: 'https://sso.bylinelms.com',
    itManagementBackend: 'https://itmanagement.bylinelms.com',
    itManagementFrontend: 'https://itmanagement.bylinelms.com',
    jwtSecret: process.env.JWT_SECRET || 'production-secret-key'
  }
};

const currentConfig = isDevelopment ? config.development : config.production;

// Test user data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'employee',
  employeeId: 'EMP001',
  department: 'IT',
  position: 'Developer'
};

// Test app data
const testApp = {
  id: 'test-app-456',
  name: 'IT Management',
  url: currentConfig.itManagementFrontend
};

/**
 * Generate a test SSO token
 */
function generateTestSSOToken() {
  const payload = {
    sub: testUser.id,
    iss: 'sso-portal',
    aud: testApp.id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    employeeId: testUser.employeeId,
    user: {
      id: testUser.id,
      employeeId: testUser.employeeId,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      department: testUser.department,
      position: testUser.position
    },
    app: {
      id: testApp.id,
      name: testApp.name,
      url: testApp.url
    }
  };

  return jwt.sign(payload, currentConfig.jwtSecret, { algorithm: 'HS256' });
}

/**
 * Test SSO token validation
 */
async function testSSOTokenValidation() {
  console.log('🔍 Testing SSO Token Validation...');
  
  try {
    const token = generateTestSSOToken();
    const validateUrl = `${currentConfig.itManagementBackend}/api/auth/validate`;
    
    const response = await axios.post(validateUrl, {
      sso_token: token,
      return_url: '/dashboard'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ SSO token validation successful');
      console.log('   User:', response.data.user);
      return true;
    } else {
      console.log('❌ SSO token validation failed');
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ SSO token validation error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

/**
 * Test SSO callback flow
 */
async function testSSOCallbackFlow() {
  console.log('🔄 Testing SSO Callback Flow...');
  
  try {
    const token = generateTestSSOToken();
    const callbackUrl = `${currentConfig.itManagementBackend}/api/auth/callback?sso_token=${encodeURIComponent(token)}&return_url=/dashboard`;
    
    // Test the callback endpoint
    const response = await axios.get(callbackUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });

    if (response.status === 302 || response.status === 200) {
      console.log('✅ SSO callback flow successful');
      console.log('   Status:', response.status);
      if (response.headers.location) {
        console.log('   Redirect to:', response.headers.location);
      }
      return true;
    } else {
      console.log('❌ SSO callback flow failed');
      console.log('   Status:', response.status);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 302) {
      console.log('✅ SSO callback flow successful (redirect)');
      console.log('   Redirect to:', error.response.headers.location);
      return true;
    } else {
      console.log('❌ SSO callback flow error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
      return false;
    }
  }
}

/**
 * Test SSO portal health
 */
async function testSSOPortalHealth() {
  console.log('🏥 Testing SSO Portal Health...');
  
  try {
    const healthUrl = `${currentConfig.ssoApiUrl}/health`;
    const response = await axios.get(healthUrl, { timeout: 5000 });

    if (response.status === 200) {
      console.log('✅ SSO portal is healthy');
      return true;
    } else {
      console.log('❌ SSO portal health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ SSO portal health check error:', error.message);
    return false;
  }
}

/**
 * Test IT Management backend health
 */
async function testITManagementHealth() {
  console.log('🏥 Testing IT Management Backend Health...');
  
  try {
    const healthUrl = `${currentConfig.itManagementBackend}/api/health`;
    const response = await axios.get(healthUrl, { timeout: 5000 });

    if (response.status === 200) {
      console.log('✅ IT Management backend is healthy');
      return true;
    } else {
      console.log('❌ IT Management backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ IT Management backend health check error:', error.message);
    return false;
  }
}

/**
 * Generate test URLs for manual testing
 */
function generateTestUrls() {
  console.log('🔗 Test URLs for Manual Testing:');
  console.log('================================\n');
  
  const token = generateTestSSOToken();
  
  console.log('1. Complete SSO Flow:');
  console.log(`   ${currentConfig.itManagementFrontend}?sso_token=${token}&return_url=/dashboard\n`);
  
  console.log('2. Direct SSO Callback:');
  console.log(`   ${currentConfig.itManagementFrontend}/auth/callback?sso_token=${token}&return_url=/dashboard\n`);
  
  console.log('3. SSO Portal Login:');
  console.log(`   ${currentConfig.ssoPortalUrl}/login\n`);
  
  console.log('4. IT Management Dashboard:');
  console.log(`   ${currentConfig.itManagementFrontend}/dashboard\n`);
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 SSO Integration Test Suite');
  console.log('=============================\n');
  
  console.log('Environment:', isDevelopment ? 'Development' : 'Production');
  console.log('SSO Portal URL:', currentConfig.ssoPortalUrl);
  console.log('IT Management Backend:', currentConfig.itManagementBackend);
  console.log('IT Management Frontend:', currentConfig.itManagementFrontend);
  console.log('');

  const results = {
    ssoPortalHealth: await testSSOPortalHealth(),
    itManagementHealth: await testITManagementHealth(),
    ssoTokenValidation: await testSSOTokenValidation(),
    ssoCallbackFlow: await testSSOCallbackFlow()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log('SSO Portal Health:', results.ssoPortalHealth ? '✅ PASS' : '❌ FAIL');
  console.log('IT Management Health:', results.itManagementHealth ? '✅ PASS' : '❌ FAIL');
  console.log('SSO Token Validation:', results.ssoTokenValidation ? '✅ PASS' : '❌ FAIL');
  console.log('SSO Callback Flow:', results.ssoCallbackFlow ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! SSO integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
  }

  console.log('\n');
  generateTestUrls();
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  generateTestSSOToken,
  testSSOTokenValidation,
  testSSOCallbackFlow
};

