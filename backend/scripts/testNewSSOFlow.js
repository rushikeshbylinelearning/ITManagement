// scripts/testNewSSOFlow.js
// Test script for the new SSO callback flow

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

// Test the new SSO flow
function testNewSSOFlow() {
  console.log('🔐 New SSO Flow Test');
  console.log('=====================\n');

  const token = generateTestToken();
  const frontendUrl = process.env.FRONTEND_URL || 'https://itmanagement.bylinelms.com';
  const backendUrl = process.env.BACKEND_URL || 'https://itmanagement.bylinelms.com';
  
  console.log('📋 Test Configuration:');
  console.log(`   Frontend URL: ${frontendUrl}`);
  console.log(`   Backend URL: ${backendUrl}`);
  console.log(`   SSO Issuer: ${process.env.SSO_ISSUER || 'https://test-sso-portal.com'}`);
  console.log(`   SSO Audience: ${process.env.SSO_AUDIENCE || 'it-management-portal'}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}\n`);

  // Test URLs for the new flow
  const testUrls = {
    // New SSO flow (frontend callback route)
    newSSOFlow: `${frontendUrl}?sso_token=${token}&return_url=/dashboard`,
    
    // Direct SSO callback route
    ssoCallback: `${frontendUrl}/auth/callback?sso_token=${token}&return_url=/dashboard`,
    
    // Backend validation endpoint
    backendValidate: `${backendUrl}/api/auth/validate`,
    
    // Backend auth check endpoint
    authCheck: `${backendUrl}/api/auth/me`,
    
    // Dashboard (after authentication)
    dashboard: `${frontendUrl}/dashboard`
  };

  console.log('🧪 Test URLs for New SSO Flow:');
  console.log('\n1. 🎯 NEW SSO FLOW (Recommended Test):');
  console.log(`   ${testUrls.newSSOFlow}\n`);
  
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

  console.log('📖 New SSO Flow Test Instructions:');
  console.log('   ====================================\n');
  
  console.log('   STEP 1: Start Backend Server');
  console.log('     cd backend && npm start');
  console.log('     ✅ Verify: "MongoDB connected successfully"');
  console.log('     ✅ Verify: "Server running on port 5001"\n');
  
  console.log('   STEP 2: Start Frontend Server');
  console.log('     cd frontend && npm run dev');
  console.log('     ✅ Verify: Frontend loads at http://localhost:5173\n');
  
  console.log('   STEP 3: Test New SSO Flow');
  console.log('     a) Open browser and go to: NEW SSO FLOW URL above');
  console.log('     b) You should see: "Processing SSO authentication..."');
  console.log('     c) Then: Redirect to /auth/callback route');
  console.log('     d) Then: "Processing SSO Authentication..." with spinner');
  console.log('     e) Finally: Redirected to dashboard with user logged in');
  console.log('     f) Check browser cookies: Should see httpOnly "token" cookie\n');
  
  console.log('   STEP 4: Verify Authentication Persistence');
  console.log('     a) Refresh the page - should stay logged in');
  console.log('     b) Open new tab with dashboard URL - should stay logged in');
  console.log('     c) Check browser dev tools → Network → Should see /auth/me calls\n');
  
  console.log('   STEP 5: Test Direct SSO Callback');
  console.log('     a) Go to: DIRECT SSO CALLBACK URL above');
  console.log('     b) Should show processing screen then redirect to dashboard');
  console.log('     c) Check backend logs for detailed SSO processing\n');

  console.log('✅ Expected Results for New Flow:');
  console.log('   =================================\n');
  
  console.log('   🔐 SSO Authentication Flow:');
  console.log('     ✅ SSO token received in frontend');
  console.log('     ✅ Redirect to /auth/callback route');
  console.log('     ✅ Token sent to /api/auth/validate endpoint');
  console.log('     ✅ Backend validates token and sets cookie');
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
  console.log('     ✅ No redirect to local login page');
  console.log('     ✅ Direct redirect to SSO portal if not authenticated\n');

  console.log('🐛 Debugging Checklist:');
  console.log('   =====================\n');
  
  console.log('   Backend Logs (check for):');
  console.log('     🔍 "SSO Token Validation" with user details');
  console.log('     ✅ "SSO token validated and session established"');
  console.log('     🔍 "Auth /me endpoint called" with cookie info\n');
  
  console.log('   Frontend Logs (check browser console for):');
  console.log('     🔧 "API Configuration" with correct settings');
  console.log('     🚀 "API Request" for /auth/validate calls');
  console.log('     ✅ "API Response" with successful status');
  console.log('     🔄 "Redirecting to SSO callback route" messages\n');
  
  console.log('   Browser Dev Tools:');
  console.log('     🍪 Application → Cookies → Should see "token" cookie');
  console.log('     🌐 Network → Should see requests to /auth/validate and /auth/me');
  console.log('     📊 Network → /auth/validate should return 200 with user data\n');

  console.log('🔧 Environment Variables to Verify:');
  console.log('   ===================================\n');
  console.log('   Backend (.env):');
  console.log('     ✅ JWT_SECRET=your-secret-key');
  console.log('     ✅ FRONTEND_URL=https://itmanagement.bylinelms.com');
  console.log('     ✅ SSO_ISSUER=https://test-sso-portal.com');
  console.log('     ✅ SSO_AUDIENCE=it-management-portal\n');
  
  console.log('   Frontend (.env.production):');
  console.log('     ✅ VITE_API_URL=https://itmanagement.bylinelms.com/api');
  console.log('     ✅ VITE_SSO_PORTAL_URL=https://sso.bylinelms.com\n');

  console.log('🚨 Common Issues & Solutions:');
  console.log('   ============================\n');
  
  console.log('   Issue: "No SSO token provided" error');
  console.log('   Solution: Check that SSO portal is sending token correctly\n');
  
  console.log('   Issue: "SSO token validation failed"');
  console.log('   Solution: Verify JWT_SECRET matches SSO portal configuration\n');
  
  console.log('   Issue: Cookie not being set');
  console.log('   Solution: Check cookie domain settings and CORS configuration\n');
  
  console.log('   Issue: Redirect loops');
  console.log('   Solution: Verify environment variables match production URLs\n');

  console.log('📞 Support Information:');
  console.log('   =====================\n');
  console.log('   If tests fail:');
  console.log('   1. Check all console logs (backend and frontend)');
  console.log('   2. Verify environment variables are set correctly');
  console.log('   3. Ensure both servers are running');
  console.log('   4. Check browser network tab for failed requests');
  console.log('   5. Verify database connection is working');
  console.log('   6. Check that SSO portal is configured correctly\n');

  return { token, testUrls };
}

// Run the test
if (require.main === module) {
  testNewSSOFlow();
}

module.exports = {
  generateTestToken,
  testNewSSOFlow
};
