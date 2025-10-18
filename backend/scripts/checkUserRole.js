require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUserRole() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    // Find the user
    const user = await User.findOne({ email: 'newadmin@portal.io' });

    if (!user) {
      console.log('❌ User not found: newadmin@portal.io');
      return;
    }

    console.log(`\n👤 User Details:`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Employee ID: ${user.employeeId}`);
    console.log(`Is Active: ${user.isActive}`);
    console.log(`Created: ${user.createdAt}`);

    // Check if user has admin role
    if (user.role === 'admin') {
      console.log('\n✅ User has admin role - should be able to access network monitoring');
    } else {
      console.log(`\n❌ User role is '${user.role}' - needs admin role for network monitoring`);
      console.log('🔧 Updating user role to admin...');
      
      user.role = 'admin';
      await user.save();
      console.log('✅ User role updated to admin');
    }

    // Check all users with admin role
    console.log('\n👥 All admin users:');
    const adminUsers = await User.find({ role: 'admin' });
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Error checking user role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

checkUserRole();
