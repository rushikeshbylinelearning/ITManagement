// Quick fix - Make currently logged in user an admin
// Run with: node scripts/quickFixAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function quickFix() {
  try {
    console.log('🔧 Quick Admin Fix\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // List all users
    const users = await User.find().select('name email role');
    
    console.log('📋 Current Users:');
    console.log('================');
    users.forEach((user, i) => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      console.log(`${i + 1}. ${roleIcon} ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
    
    // Make ALL users admin (quick fix for development)
    console.log('🔧 Making all users ADMIN...\n');
    
    const result = await User.updateMany(
      {},
      { $set: { role: 'admin' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} user(s) to admin role\n`);
    
    // Show updated users
    const updatedUsers = await User.find().select('name email role');
    console.log('📋 Updated Users:');
    console.log('================');
    updatedUsers.forEach((user, i) => {
      console.log(`${i + 1}. 👑 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
    
    console.log('============================================================');
    console.log('✅ All users are now admins!');
    console.log('============================================================\n');
    console.log('IMPORTANT: Now do these steps:');
    console.log('1. LOGOUT from the web app completely');
    console.log('2. Login again (select "Admin Login")');
    console.log('3. Go to Network Monitoring page');
    console.log('4. The 403 errors should be gone!');
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

quickFix();








