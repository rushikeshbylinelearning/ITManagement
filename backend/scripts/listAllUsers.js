// Script to list all users and their roles
// Run with: node scripts/listAllUsers.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('name email role employeeId');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      process.exit(0);
    }

    console.log(`📋 Found ${users.length} user(s):\n`);
    console.log('ID'.padEnd(25), 'Name'.padEnd(25), 'Email'.padEnd(30), 'Role'.padEnd(15), 'Employee ID');
    console.log('-'.repeat(120));

    users.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      console.log(
        user._id.toString().substring(0, 24).padEnd(25),
        user.name.substring(0, 24).padEnd(25),
        user.email.substring(0, 29).padEnd(30),
        `${roleIcon} ${user.role}`.padEnd(15),
        user.employeeId
      );
    });

    console.log('\n📊 Summary:');
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    Object.entries(roleCounts).forEach(([role, count]) => {
      const icon = role === 'admin' ? '👑' : '👤';
      console.log(`  ${icon} ${role}: ${count}`);
    });

    console.log('\n💡 To make a user admin:');
    console.log('  node scripts/fixAdminRole.js user@email.com');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listUsers();








