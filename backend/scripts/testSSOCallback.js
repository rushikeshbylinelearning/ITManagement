// scripts/testSSOCallback.js
// Test script for SSO callback integration

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test JWT token generation for SSO callback testing
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

  // Use JWT_SECRET for development testing (HS256)
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

  return token;
}

// Generate test URLs
function generateTestUrls() {
  const token = generateTestToken();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  
  const frontendTestUrl = `${frontendUrl}?sso_token=${token}&return_url=/dashboard`;
  const callbackTestUrl = `${backendUrl}/api/auth/callback?sso_token=${token}&return_url=/dashboard`;
  
  return { frontendTestUrl, callbackTestUrl, token };
}

// Main execution
function main() {
  console.log('🔐 SSO Callback Test Script');
  console.log('============================\n');

  const { frontendTestUrl, callbackTestUrl, token } = generateTestUrls();

  console.log('📋 Test Configuration:');
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`   Backend URL: ${process.env.BACKEND_URL || 'http://localhost:5001'}`);
  console.log(`   SSO Issuer: ${process.env.SSO_ISSUER || 'https://test-sso-portal.com'}`);
  console.log(`   SSO Audience: ${process.env.SSO_AUDIENCE || 'it-management-portal'}\n`);

  console.log('🧪 Test URLs:');
  console.log(`   1. Frontend Test URL (with SSO token):`);
  console.log(`      ${frontendTestUrl}\n`);
  
  console.log(`   2. Direct Callback URL (backend):`);
  console.log(`      ${callbackTestUrl}\n`);

  console.log('🔑 Generated Test Token:');
  console.log(`   ${token}\n`);

  console.log('📖 Test Instructions:');
  console.log('   1. Start your backend server: npm run dev');
  console.log('   2. Start your frontend server: npm run dev');
  console.log('   3. Copy and paste the Frontend Test URL into your browser');
  console.log('   4. You should be automatically authenticated and redirected to the dashboard');
  console.log('   5. Alternatively, test the direct callback URL to verify backend processing\n');

  console.log('⚠️  Important Notes:');
  console.log('   - This test uses HS256 algorithm with JWT_SECRET');
  console.log('   - For production, configure RS256 with JWKS');
  console.log('   - Ensure your .env file has the correct SSO configuration');
  console.log('   - The test token expires in 1 hour\n');

  console.log('🐛 Troubleshooting:');
  console.log('   - Check server logs for authentication errors');
  console.log('   - Verify database connection is working');
  console.log('   - Ensure CORS is properly configured');
  console.log('   - Check that the user is created in the database');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateTestToken,
  generateTestUrls
};
