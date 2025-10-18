require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function setupRealMonitoring() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    console.log('\n🎯 Setting up Real Network Monitoring...');
    console.log('==========================================');

    // Check if we have admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`\n👥 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
    });

    if (adminUsers.length === 0) {
      console.log('\n❌ No admin users found. Cannot proceed with setup.');
      return;
    }

    console.log('\n📋 REAL NETWORK MONITORING SETUP GUIDE:');
    console.log('==========================================');
    
    console.log('\n1️⃣ CLEAN DATABASE (COMPLETED):');
    console.log('   ✅ All fake/simulated data cleared');
    console.log('   ✅ Database ready for real monitoring');

    console.log('\n2️⃣ DOWNLOAD REAL AGENT:');
    console.log('   🌐 Go to: http://localhost:5174');
    console.log('   🔐 Login with admin credentials');
    console.log('   📥 Click download button to get real agent installer');

    console.log('\n3️⃣ INSTALL REAL AGENT:');
    console.log('   💻 Run installer as Administrator');
    console.log('   🔧 Installer will set up real network monitoring');
    console.log('   📁 Agent files installed to: C:\\Program Files\\ITNetworkMonitor\\');

    console.log('\n4️⃣ REGISTER AGENT:');
    console.log('   🎫 Get registration token from dashboard');
    console.log('   💻 Run registration command:');
    console.log('   python "C:\\Program Files\\ITNetworkMonitor\\network_monitor_agent.py" register YOUR_TOKEN');

    console.log('\n5️⃣ VERIFY REAL DATA:');
    console.log('   📊 Check dashboard for real network activity');
    console.log('   🔍 Only websites you actually visit will appear');
    console.log('   📈 Data amounts will reflect your real usage');

    console.log('\n🎯 WHAT YOU\'LL SEE WITH REAL MONITORING:');
    console.log('==========================================');
    console.log('✅ Only websites you actually visit');
    console.log('✅ Real data usage amounts');
    console.log('✅ Accurate timestamps of your activity');
    console.log('✅ Your actual system information');
    console.log('❌ NO fake YouTube, GitHub, Facebook data');

    console.log('\n🚀 QUICK START COMMANDS:');
    console.log('========================');
    console.log('1. Open dashboard: http://localhost:5174');
    console.log('2. Login and download agent installer');
    console.log('3. Run installer as Administrator');
    console.log('4. Register agent with token from dashboard');
    console.log('5. Check dashboard for real data');

    console.log('\n📊 MONITORING REAL DATA:');
    console.log('========================');
    console.log('• Browse websites normally');
    console.log('• Dashboard will show only sites you visit');
    console.log('• Data amounts will be accurate');
    console.log('• Updates will be real-time');

    console.log('\n✅ Setup guide complete!');
    console.log('🎉 Ready to install real network monitoring agent');

  } catch (error) {
    console.error('❌ Error setting up real monitoring:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

setupRealMonitoring();
