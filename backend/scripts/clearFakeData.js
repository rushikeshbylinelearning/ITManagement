require('dotenv').config();
const mongoose = require('mongoose');
const NetworkMonitoring = require('../models/NetworkMonitoring');
const SystemAgent = require('../models/SystemAgent');

async function clearFakeData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    console.log('\n🧹 Clearing all fake/simulated network monitoring data...');

    // Count existing data
    const existingLogs = await NetworkMonitoring.countDocuments();
    const existingAgents = await SystemAgent.countDocuments();

    console.log(`📊 Found ${existingLogs} network monitoring logs`);
    console.log(`🤖 Found ${existingAgents} system agents`);

    if (existingLogs > 0) {
      // Delete all network monitoring logs
      const deletedLogs = await NetworkMonitoring.deleteMany({});
      console.log(`🗑️ Deleted ${deletedLogs.deletedCount} network monitoring logs`);
    }

    if (existingAgents > 0) {
      // Delete all system agents
      const deletedAgents = await SystemAgent.deleteMany({});
      console.log(`🗑️ Deleted ${deletedAgents.deletedCount} system agents`);
    }

    // Verify cleanup
    const remainingLogs = await NetworkMonitoring.countDocuments();
    const remainingAgents = await SystemAgent.countDocuments();

    console.log('\n✅ Cleanup completed:');
    console.log(`📊 Remaining network logs: ${remainingLogs}`);
    console.log(`🤖 Remaining system agents: ${remainingAgents}`);

    if (remainingLogs === 0 && remainingAgents === 0) {
      console.log('\n🎉 All fake data cleared successfully!');
      console.log('📝 The database is now clean and ready for real network monitoring');
    } else {
      console.log('\n⚠️ Some data may still remain');
    }

  } catch (error) {
    console.error('❌ Error clearing fake data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

clearFakeData();
