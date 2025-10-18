// Quick script to check and fix admin role
// Run with: node scripts/fixAdminRole.js your-email@example.com

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/fixAdminRole.js your-email@example.com');
  process.exit(1);
}

async function fixAdminRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log('\n📋 Current User Details:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Current Role:', user.role);
    console.log('  Employee ID:', user.employeeId);

    if (user.role === 'admin') {
      console.log('\n✅ User is already an admin!');
    } else {
      console.log('\n🔧 Updating role to admin...');
      user.role = 'admin';
      await user.save();
      console.log('✅ Role updated to admin successfully!');
    }

    console.log('\n📋 Updated User Details:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);

    console.log('\n✅ Done! Please logout and login again to apply changes.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminRole();








