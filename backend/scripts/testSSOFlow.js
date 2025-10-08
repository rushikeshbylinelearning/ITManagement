// scripts/testSSOFlow.js
// Comprehensive test script for SSO callback flow

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test JWT token generation
function generateTestToken() {
  const payload = {
    sub: 'test-user-123',
    email: 'test.user@company.com',
    name: 'Test User',
    role: 'employee',
    employee_id: 'TEST001',
    domain: 'company.com',
    iss: process.env.SSO_ISSUER || 'https://test-sso-portal.com',
    aud: process.env.SSO_AUDIENCE || 'it-management-portal',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000)
  };

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

  return token;
}

// Test the complete SSO flow
function testSSOFlow() {
  console.log('🔐 SSO Flow Test Script');
  console.log('========================\n');

  const token = generateTestToken();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  console.log('📋 Test Configuration:');
  console.log(`   Frontend URL: ${frontendUrl}`);
  console.log(`   Backend URL: ${backendUrl}`);
  console.log(`   SSO Issuer: ${process.env.SSO_ISSUER || 'https://test-sso-portal.com'}`);
  console.log(`   SSO Audience: ${process.env.SSO_AUDIENCE || 'it-management-portal'}\n`);

  // Test URLs for different scenarios
  const testUrls = {
    // Direct frontend with SSO token (should redirect to backend callback)
    frontendWithToken: `${frontendUrl}?sso_token=${token}&return_url=/dashboard`,
    
    // Direct backend callback (should work directly)
    backendCallback: `${backendUrl}/api/auth/callback?sso_token=${token}&return_url=/dashboard`,
    
    // Backend auth check endpoint
    authCheck: `${backendUrl}/api/auth/me`
  };

  console.log('🧪 Test URLs:');
  console.log('\n1. Frontend with SSO Token (should redirect to backend callback):');
  console.log(`   ${testUrls.frontendWithToken}\n`);
  
  console.log('2. Direct Backend Callback URL:');
  console.log(`   ${testUrls.backendCallback}\n`);
  
  console.log('3. Backend Auth Check Endpoint:');
  console.log(`   ${testUrls.authCheck}\n`);

  console.log('🔑 Generated Test Token:');
  console.log(`   ${token}\n`);

  console.log('📖 Test Instructions:');
  console.log('   STEP 1: Start your backend server');
  console.log('     cd backend && npm start\n');
  
  console.log('   STEP 2: Start your frontend server');
  console.log('     cd frontend && npm run dev\n');
  
  console.log('   STEP 3: Test the SSO flow');
  console.log('     a) Copy and paste the "Frontend with SSO Token" URL into your browser');
  console.log('     b) You should see "Processing SSO authentication..." briefly');
  console.log('     c) Then be redirected to the backend callback');
  console.log('     d) Finally be redirected to the dashboard with authentication\n');
  
  console.log('   STEP 4: Verify authentication persistence');
  console.log('     a) Refresh the page - you should stay logged in');
  console.log('     b) Open a new tab and go to the frontend URL - you should stay logged in');
  console.log('     c) Check browser cookies - you should see an httpOnly "token" cookie\n');

  console.log('   STEP 5: Test direct backend callback');
  console.log('     a) Copy and paste the "Direct Backend Callback URL" into your browser');
  console.log('     b) You should be redirected to the dashboard immediately\n');

  console.log('   STEP 6: Test auth check endpoint');
  console.log('     a) After authentication, visit the "Backend Auth Check Endpoint"');
  console.log('     b) You should get a JSON response with user data\n');

  console.log('✅ Expected Results:');
  console.log('   - SSO token should be processed by backend callback');
  console.log('   - Authentication cookie should be set');
  console.log('   - User should be redirected to dashboard');
  console.log('   - Session should persist across page refreshes');
  console.log('   - No "split second" login disappearance\n');

  console.log('🐛 Troubleshooting:');
  console.log('   - Check browser developer console for errors');
  console.log('   - Check backend server logs for authentication errors');
  console.log('   - Verify database connection is working');
  console.log('   - Check that cookies are being set in browser');
  console.log('   - Ensure CORS is properly configured\n');

  console.log('🔧 Environment Variables to Check:');
  console.log('   - JWT_SECRET: Should be set in backend/.env');
  console.log('   - FRONTEND_URL: Should match your frontend server URL');
  console.log('   - SSO_ISSUER: Should match the issuer in the test token');
  console.log('   - SSO_AUDIENCE: Should match the audience in the test token\n');

  return { token, testUrls };
}

// Run the test
if (require.main === module) {
  testSSOFlow();
}

module.exports = {
  generateTestToken,
  testSSOFlow
};
