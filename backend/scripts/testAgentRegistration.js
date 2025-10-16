// Test script to verify agent registration works
// Run with: node scripts/testAgentRegistration.js

require('dotenv').config();
const mongoose = require('mongoose');

async function testRegistration() {
  try {
    console.log('🔍 Testing Agent Registration System...\n');
    
    // Test 1: Check environment variables
    console.log('Test 1: Environment Variables');
    console.log('  MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
    console.log('  LOCAL_JWT_SECRET:', process.env.LOCAL_JWT_SECRET ? '✅ Set' : '❌ Not set');
    
    if (!process.env.MONGO_URI) {
      console.error('\n❌ MONGO_URI is not set in .env file');
      process.exit(1);
    }
    
    const jwtSecret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('\n❌ Neither LOCAL_JWT_SECRET nor JWT_SECRET is set in .env file');
      console.error('Please set at least JWT_SECRET in your .env file');
      process.exit(1);
    }
    
    if (!process.env.LOCAL_JWT_SECRET && process.env.JWT_SECRET) {
      console.log('  ⚠️  Using JWT_SECRET as fallback (LOCAL_JWT_SECRET not set)');
    }
    console.log('');
    
    // Test 2: Database connection
    console.log('Test 2: Database Connection');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('  ✅ Connected to MongoDB\n');
    
    // Test 3: Load models
    console.log('Test 3: Load Models');
    const SystemAgent = require('../models/SystemAgent');
    const User = require('../models/User');
    console.log('  ✅ SystemAgent model loaded');
    console.log('  ✅ User model loaded\n');
    
    // Test 4: Check if users exist
    console.log('Test 4: Check Users');
    const userCount = await User.countDocuments();
    console.log(`  Found ${userCount} user(s) in database`);
    
    if (userCount === 0) {
      console.error('  ❌ No users found. Create a user first.');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    const testUser = await User.findOne();
    console.log(`  ✅ Test user: ${testUser.email} (${testUser.role})\n`);
    
    // Test 5: Create test agent
    console.log('Test 5: Create Test Agent');
    const testSystemId = `test-sys-${Date.now()}`;
    const testAgent = new SystemAgent({
      systemId: testSystemId,
      systemName: 'Test System',
      userId: testUser._id,
      systemInfo: {
        os: 'Test',
        test: true
      }
    });
    
    console.log('  Creating agent...');
    
    // Test 6: Generate token
    console.log('Test 6: Generate Token');
    try {
      const token = testAgent.generateAgentToken();
      testAgent.agentToken = token;
      console.log('  ✅ Token generated');
      console.log('  Token preview:', token.substring(0, 50) + '...\n');
    } catch (error) {
      console.error('  ❌ Token generation failed:', error.message);
      throw error;
    }
    
    // Test 7: Save to database
    console.log('Test 7: Save to Database');
    await testAgent.save();
    console.log('  ✅ Agent saved successfully');
    console.log('  System ID:', testAgent.systemId);
    console.log('  System Name:', testAgent.systemName);
    console.log('  User:', testUser.email);
    console.log('');
    
    // Test 8: Retrieve agent
    console.log('Test 8: Retrieve Agent');
    const retrievedAgent = await SystemAgent.findOne({ systemId: testSystemId });
    console.log('  ✅ Agent retrieved');
    console.log('  System ID:', retrievedAgent.systemId);
    console.log('  System Name:', retrievedAgent.systemName);
    console.log('');
    
    // Test 9: Clean up
    console.log('Test 9: Clean Up');
    await SystemAgent.deleteOne({ systemId: testSystemId });
    console.log('  ✅ Test agent deleted\n');
    
    console.log('============================================================');
    console.log('✅ All tests passed! Agent registration system is working.');
    console.log('============================================================\n');
    
    console.log('If you\'re still getting 500 errors:');
    console.log('1. Make sure backend server was RESTARTED after code changes');
    console.log('2. Check that you\'re logged in as employee (not admin)');
    console.log('3. Look at backend console logs for detailed error messages');
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nError details:', error);
    
    if (error.code === 11000) {
      console.error('\n💡 Duplicate key error - agent with this systemId already exists');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

testRegistration();

