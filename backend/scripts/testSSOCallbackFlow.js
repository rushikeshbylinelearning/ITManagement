// scripts/testSSOCallbackFlow.js
// Test script for the updated SSO callback flow with proper environment configuration

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

// Test the SSO callback flow
function testSSOCallbackFlow() {
  console.log('🔐 SSO Callback Flow Test');
  console.log('==========================\n');

  const token = generateTestToken();
  
  // Environment-specific URLs
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const frontendUrl = isDevelopment ? 'http://localhost:5173' : 'https://itmanagement.bylinelms.com';
  const ssoApiUrl = isDevelopment ? 'http://localhost:5001' : 'https://sso.bylinelms.com';
  const ssoPortalUrl = isDevelopment ? 'http://localhost:3000' : 'https://sso.bylinelms.com';
  
  console.log('📋 Environment Configuration:');
  console.log(`   Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`   Frontend URL: ${frontendUrl}`);
  console.log(`   SSO API URL: ${ssoApiUrl}`);
  console.log(`   SSO Portal URL: ${ssoPortalUrl}`);
  console.log(`   SSO Issuer: ${process.env.SSO_ISSUER || 'https://test-sso-portal.com'}`);
  console.log(`   SSO Audience: ${process.env.SSO_AUDIENCE || 'it-management-portal'}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}\n`);

  // Test URLs for the SSO callback flow
  const testUrls = {
    // Complete SSO flow
    completeFlow: `${frontendUrl}?sso_token=${token}&return_url=/dashboard`,
    
    // Direct SSO callback route
    ssoCallback: `${frontendUrl}/auth/callback?sso_token=${token}&return_url=/dashboard`,
    
    // Backend validation endpoint
    backendValidate: `${ssoApiUrl}/api/auth/validate`,
    
    // Backend auth check endpoint
    authCheck: `${frontendUrl}/api/auth/me`,
    
    // Dashboard (after authentication)
    dashboard: `${frontendUrl}/dashboard`
  };

  console.log('🧪 Test URLs:');
  console.log('\n1. 🎯 COMPLETE SSO FLOW:');
  console.log(`   ${testUrls.completeFlow}\n`);
  
  console.log('2. 🔧 Direct SSO Callback Route:');
  console.log(`   ${testUrls.ssoCallback}\n`);
  
  console.log('3. 🔍 Backend Validation Endpoint:');
  console.log(`   ${testUrls.backendValidate}\n`);
  
  console.log('4. 📊 Backend Auth Check:');
  console.log(`   ${testUrls.authCheck}\n`);
  
  console.log('5. 🏠 Dashboard (Post-Auth):');
  console.log(`   ${testUrls.dashboard}\n`);

  console.log('🔑 Generated Test Token:');
  console.log(`   ${token}\n`);

  console.log('📖 Test Instructions:');
  console.log('   ====================\n');
  
  if (isDevelopment) {
    console.log('   DEVELOPMENT TESTING:');
    console.log('   --------------------\n');
    
    console.log('   STEP 1: Start SSO Backend (Port 5001)');
    console.log('     cd sso-backend && npm start');
    console.log('     ✅ Verify: "Server running on port 5001"\n');
    
    console.log('   STEP 2: Start IT Management Backend (Port 5002)');
    console.log('     cd it-management-backend && npm start');
    console.log('     ✅ Verify: "Server running on port 5002"\n');
    
    console.log('   STEP 3: Start IT Management Frontend (Port 5173)');
    console.log('     cd it-management-frontend && npm run dev');
    console.log('     ✅ Verify: Frontend loads at http://localhost:5173\n');
    
    console.log('   STEP 4: Set Development Environment Variables');
    console.log('     Frontend .env.development:');
    console.log('       VITE_API_URL=http://localhost:5002/api');
    console.log('       VITE_SSO_API_URL=http://localhost:5001');
    console.log('       VITE_SSO_PORTAL_URL=http://localhost:3000\n');
    
  } else {
    console.log('   PRODUCTION TESTING:');
    console.log('   -------------------\n');
    
    console.log('   STEP 1: Deploy SSO Backend');
    console.log('     Deploy to: https://sso.bylinelms.com');
    console.log('     ✅ Verify: SSO backend is accessible\n');
    
    console.log('   STEP 2: Deploy IT Management Backend');
    console.log('     Deploy to: https://itmanagement.bylinelms.com');
    console.log('     ✅ Verify: IT Management backend is accessible\n');
    
    console.log('   STEP 3: Deploy IT Management Frontend');
    console.log('     Deploy to: https://itmanagement.bylinelms.com');
    console.log('     ✅ Verify: Frontend loads correctly\n');
    
    console.log('   STEP 4: Set Production Environment Variables');
    console.log('     Frontend .env.production:');
    console.log('       VITE_API_URL=https://itmanagement.bylinelms.com/api');
    console.log('       VITE_SSO_API_URL=https://sso.bylinelms.com');
    console.log('       VITE_SSO_PORTAL_URL=https://sso.bylinelms.com\n');
  }
  
  console.log('   STEP 5: Test SSO Callback Flow');
  console.log('     a) Open browser and go to: COMPLETE SSO FLOW URL above');
  console.log('     b) You should see: "Processing SSO authentication..."');
  console.log('     c) Then: Redirect to /auth/callback route');
  console.log('     d) Then: "Processing SSO Authentication..." with spinner');
  console.log('     e) Finally: Redirected to dashboard with user logged in\n');
  
  console.log('   STEP 6: Verify Authentication Persistence');
  console.log('     a) Refresh the page - should stay logged in');
  console.log('     b) Open new tab with dashboard URL - should stay logged in');
  console.log('     c) Check browser cookies: Should see httpOnly "token" cookie\n');

  console.log('✅ Expected Results:');
  console.log('   ==================\n');
  
  console.log('   🔐 SSO Authentication Flow:');
  console.log('     ✅ SSO token received in frontend');
  console.log('     ✅ Redirect to /auth/callback route');
  console.log('     ✅ Token sent to SSO_API_URL/api/auth/validate');
  console.log('     ✅ SSO backend validates token and sets cookie');
  console.log('     ✅ User redirected to dashboard\n');
  
  console.log('   🍪 Cookie Management:');
  console.log('     ✅ httpOnly cookie set with JWT token');
  console.log('     ✅ Cookie persists across page refreshes');
  console.log('     ✅ Cookie sent with all API requests\n');
  
  console.log('   🔄 API Authentication:');
  console.log('     ✅ /auth/validate endpoint returns success');
  console.log('     ✅ /auth/me endpoint returns user data');
  console.log('     ✅ All protected routes work with cookie\n');
  
  console.log('   🎯 User Experience:');
  console.log('     ✅ No "split second" login disappearance');
  console.log('     ✅ User stays logged in across refreshes');
  console.log('     ✅ Proper error handling with SSO portal redirect\n');

  console.log('🐛 Debugging Checklist:');
  console.log('   =====================\n');
  
  console.log('   Frontend Logs (check browser console for):');
  console.log('     🔧 Environment configuration logs');
  console.log('     🚀 "Sending SSO token to SSO backend for validation"');
  console.log('     📡 "SSO validation response" with status');
  console.log('     ✅ "SSO token validated successfully" with user data');
  console.log('     💾 "User data stored in session storage"\n');
  
  console.log('   Backend Logs (check SSO backend logs for):');
  console.log('     🔍 "SSO Token Validation" with user details');
  console.log('     ✅ "SSO token validated and session established"');
  console.log('     🍪 Cookie setting confirmation\n');
  
  console.log('   Browser Dev Tools:');
  console.log('     🍪 Application → Cookies → Should see "token" cookie');
  console.log('     🌐 Network → Should see request to SSO_API_URL/api/auth/validate');
  console.log('     📊 Network → /auth/validate should return 200 with user data\n');

  console.log('🔧 Environment Variables to Verify:');
  console.log('   ===================================\n');
  console.log('   Frontend Environment Variables:');
  console.log('     ✅ VITE_API_URL (IT Management backend)');
  console.log('     ✅ VITE_SSO_API_URL (SSO backend)');
  console.log('     ✅ VITE_SSO_PORTAL_URL (SSO portal)\n');
  
  console.log('   Backend Environment Variables:');
  console.log('     ✅ JWT_SECRET');
  console.log('     ✅ SSO_ISSUER');
  console.log('     ✅ SSO_AUDIENCE');
  console.log('     ✅ SSO_API_URL\n');

  console.log('🚨 Common Issues & Solutions:');
  console.log('   ============================\n');
  
  console.log('   Issue: "Unable to connect to SSO server"');
  console.log('   Solution: Check VITE_SSO_API_URL is set correctly\n');
  
  console.log('   Issue: "Invalid SSO token"');
  console.log('   Solution: Verify JWT_SECRET matches between SSO portal and backend\n');
  
  console.log('   Issue: "Authentication failed"');
  console.log('   Solution: Check SSO backend is running and accessible\n');
  
  console.log('   Issue: CORS errors');
  console.log('   Solution: Verify SSO backend CORS configuration\n');

  console.log('📞 Support Information:');
  console.log('   =====================\n');
  console.log('   If tests fail:');
  console.log('   1. Check all console logs (frontend and SSO backend)');
  console.log('   2. Verify environment variables are set correctly');
  console.log('   3. Ensure both backends are running');
  console.log('   4. Check browser network tab for failed requests');
  console.log('   5. Verify database connections are working');
  console.log('   6. Check that SSO portal is configured correctly\n');

  return { token, testUrls, isDevelopment };
}

// Run the test
if (require.main === module) {
  testSSOCallbackFlow();
}

module.exports = {
  generateTestToken,
  testSSOCallbackFlow
};
