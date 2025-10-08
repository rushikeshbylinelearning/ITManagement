// scripts/testCompleteSSOFlow.js
// Comprehensive test script for complete SSO flow verification

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
function testCompleteSSOFlow() {
  console.log('🔐 Complete SSO Flow Test');
  console.log('==========================\n');

  const token = generateTestToken();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  console.log('📋 Test Configuration:');
  console.log(`   Frontend URL: ${frontendUrl}`);
  console.log(`   Backend URL: ${backendUrl}`);
  console.log(`   SSO Issuer: ${process.env.SSO_ISSUER || 'https://test-sso-portal.com'}`);
  console.log(`   SSO Audience: ${process.env.SSO_AUDIENCE || 'it-management-portal'}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}\n`);

  // Test URLs for different scenarios
  const testUrls = {
    // Complete SSO flow (recommended)
    completeFlow: `${frontendUrl}?sso_token=${token}&return_url=/dashboard`,
    
    // Direct backend callback
    directCallback: `${backendUrl}/api/auth/callback?sso_token=${token}&return_url=/dashboard`,
    
    // Backend auth check endpoint
    authCheck: `${backendUrl}/api/auth/me`,
    
    // Frontend dashboard (after authentication)
    dashboard: `${frontendUrl}/dashboard`
  };

  console.log('🧪 Test URLs:');
  console.log('\n1. 🎯 COMPLETE SSO FLOW (Recommended Test):');
  console.log(`   ${testUrls.completeFlow}\n`);
  
  console.log('2. 🔧 Direct Backend Callback (Debug Test):');
  console.log(`   ${testUrls.directCallback}\n`);
  
  console.log('3. 🔍 Backend Auth Check (API Test):');
  console.log(`   ${testUrls.authCheck}\n`);
  
  console.log('4. 📊 Frontend Dashboard (Post-Auth Test):');
  console.log(`   ${testUrls.dashboard}\n`);

  console.log('🔑 Generated Test Token:');
  console.log(`   ${token}\n`);

  console.log('📖 Complete Test Instructions:');
  console.log('   ======================================\n');
  
  console.log('   STEP 1: Start Backend Server');
  console.log('     cd backend && npm start');
  console.log('     ✅ Verify: "MongoDB connected successfully"');
  console.log('     ✅ Verify: "Server running on port 5001"\n');
  
  console.log('   STEP 2: Start Frontend Server');
  console.log('     cd frontend && npm run dev');
  console.log('     ✅ Verify: Frontend loads at http://localhost:5173\n');
  
  console.log('   STEP 3: Test Complete SSO Flow');
  console.log('     a) Open browser and go to: COMPLETE SSO FLOW URL above');
  console.log('     b) You should see: "Processing SSO authentication..."');
  console.log('     c) Then: "Verifying authentication..."');
  console.log('     d) Finally: Redirected to dashboard with user logged in');
  console.log('     e) Check browser cookies: Should see httpOnly "token" cookie\n');
  
  console.log('   STEP 4: Verify Authentication Persistence');
  console.log('     a) Refresh the page - should stay logged in');
  console.log('     b) Open new tab with dashboard URL - should stay logged in');
  console.log('     c) Check browser dev tools → Network → Should see /auth/me calls\n');
  
  console.log('   STEP 5: Test Direct Backend Callback');
  console.log('     a) Go to: DIRECT BACKEND CALLBACK URL above');
  console.log('     b) Should redirect to dashboard immediately');
  console.log('     c) Check backend logs for detailed SSO processing\n');

  console.log('✅ Expected Results:');
  console.log('   ==================\n');
  
  console.log('   🔐 SSO Authentication:');
  console.log('     ✅ SSO token received and validated');
  console.log('     ✅ User created/updated in database');
  console.log('     ✅ JWT token generated and stored in cookie');
  console.log('     ✅ User redirected to dashboard\n');
  
  console.log('   🍪 Cookie Management:');
  console.log('     ✅ httpOnly cookie set with JWT token');
  console.log('     ✅ Cookie persists across page refreshes');
  console.log('     ✅ Cookie sent with all API requests\n');
  
  console.log('   🔄 API Authentication:');
  console.log('     ✅ /auth/me endpoint returns user data');
  console.log('     ✅ All protected routes work with cookie');
  console.log('     ✅ Frontend session synced with backend\n');
  
  console.log('   🎯 User Experience:');
  console.log('     ✅ No "split second" login disappearance');
  console.log('     ✅ User stays logged in across refreshes');
  console.log('     ✅ No redirect to login page after SSO\n');

  console.log('🐛 Debugging Checklist:');
  console.log('   =====================\n');
  
  console.log('   Backend Logs (check for):');
  console.log('     🔍 "SSO Callback Processing" with user details');
  console.log('     ✅ "Authentication cookie set successfully"');
  console.log('     🔄 "Redirecting to frontend" with redirect URL');
  console.log('     🔍 "Auth /me endpoint called" with cookie info\n');
  
  console.log('   Frontend Logs (check browser console for):');
  console.log('     🔧 "API Configuration" with correct settings');
  console.log('     🚀 "API Request" for /auth/me calls');
  console.log('     ✅ "API Response" with successful status');
  console.log('     🔐 "Verifying SSO authentication" messages\n');
  
  console.log('   Browser Dev Tools:');
  console.log('     🍪 Application → Cookies → Should see "token" cookie');
  console.log('     🌐 Network → Should see requests with cookies');
  console.log('     📊 Network → /auth/me should return 200 with user data\n');

  console.log('🔧 Environment Variables to Verify:');
  console.log('   ==================================\n');
  console.log('   Backend (.env):');
  console.log('     ✅ JWT_SECRET=your-secret-key');
  console.log('     ✅ FRONTEND_URL=http://localhost:5173');
  console.log('     ✅ SSO_ISSUER=https://test-sso-portal.com');
  console.log('     ✅ SSO_AUDIENCE=it-management-portal\n');
  
  console.log('   Frontend (.env):');
  console.log('     ✅ VITE_API_URL=http://localhost:5001/api\n');

  console.log('🚨 Common Issues & Solutions:');
  console.log('   ============================\n');
  
  console.log('   Issue: "Not authenticated, no token provided"');
  console.log('   Solution: Check cookie domain settings, ensure withCredentials: true\n');
  
  console.log('   Issue: "Split second" login disappearance');
  console.log('   Solution: Verify /auth/me is called and returns user data\n');
  
  console.log('   Issue: CORS errors');
  console.log('   Solution: Check backend CORS configuration includes frontend URL\n');
  
  console.log('   Issue: Redirect loops');
  console.log('   Solution: Verify frontend/backend URLs match environment variables\n');

  console.log('📞 Support Information:');
  console.log('   =====================\n');
  console.log('   If tests fail:');
  console.log('   1. Check all console logs (backend and frontend)');
  console.log('   2. Verify environment variables are set correctly');
  console.log('   3. Ensure both servers are running');
  console.log('   4. Check browser network tab for failed requests');
  console.log('   5. Verify database connection is working\n');

  return { token, testUrls };
}

// Run the test
if (require.main === module) {
  testCompleteSSOFlow();
}

module.exports = {
  generateTestToken,
  testCompleteSSOFlow
};
