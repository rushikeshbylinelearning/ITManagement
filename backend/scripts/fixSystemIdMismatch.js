require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');
const NetworkMonitoring = require('../models/NetworkMonitoring');

async function fixSystemIdMismatch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    console.log('\n🔧 Fixing System ID Mismatch...');
    console.log('================================');

    // Current database record
    const dbAgent = await SystemAgent.findOne({});
    if (!dbAgent) {
      console.log('❌ No system agent found in database');
      return;
    }

    console.log('\n📊 Current Database Record:');
    console.log(`   System ID: ${dbAgent.systemId}`);
    console.log(`   System Name: ${dbAgent.systemName}`);
    console.log(`   User: ${dbAgent.userId?.name || 'Unknown'}`);
    console.log(`   Status: ${dbAgent.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Last Heartbeat: ${dbAgent.lastHeartbeat}`);

    // Agent config shows different system ID
    const agentSystemId = 'sys-92c0c8852431';
    const agentSystemName = 'byline23';

    console.log('\n🤖 Agent Configuration:');
    console.log(`   System ID: ${agentSystemId}`);
    console.log(`   System Name: ${agentSystemName}`);

    if (dbAgent.systemId === agentSystemId) {
      console.log('\n✅ System IDs match - no fix needed');
      return;
    }

    console.log('\n🔧 System ID Mismatch Detected!');
    console.log('Updating database to match agent configuration...');

    // Update the system agent record
    const updatedAgent = await SystemAgent.findOneAndUpdate(
      { _id: dbAgent._id },
      {
        systemId: agentSystemId,
        systemName: agentSystemName,
        lastHeartbeat: new Date()
      },
      { new: true }
    );

    if (updatedAgent) {
      console.log('\n✅ System Agent Updated:');
      console.log(`   New System ID: ${updatedAgent.systemId}`);
      console.log(`   New System Name: ${updatedAgent.systemName}`);
      console.log(`   Updated: ${updatedAgent.updatedAt}`);
    }

    // Check if there are any network monitoring logs with the old system ID
    const oldLogs = await NetworkMonitoring.find({ systemId: dbAgent.systemId });
    console.log(`\n📊 Found ${oldLogs.length} network logs with old system ID`);

    if (oldLogs.length > 0) {
      console.log('Updating network monitoring logs...');
      
      // Update all network monitoring logs to use the new system ID
      const updateResult = await NetworkMonitoring.updateMany(
        { systemId: dbAgent.systemId },
        { 
          systemId: agentSystemId,
          systemName: agentSystemName
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} network monitoring logs`);
    }

    // Verify the fix
    console.log('\n🔍 Verifying Fix...');
    const verifyAgent = await SystemAgent.findOne({ systemId: agentSystemId });
    const verifyLogs = await NetworkMonitoring.countDocuments({ systemId: agentSystemId });

    if (verifyAgent) {
      console.log('✅ System Agent verified:');
      console.log(`   System ID: ${verifyAgent.systemId}`);
      console.log(`   System Name: ${verifyAgent.systemName}`);
      console.log(`   Status: ${verifyAgent.isActive ? 'Active' : 'Inactive'}`);
    }

    console.log(`✅ Network Logs verified: ${verifyLogs} logs found`);

    console.log('\n🎉 System ID Mismatch Fixed!');
    console.log('The agent should now send data that appears in the dashboard.');

  } catch (error) {
    console.error('❌ Error fixing system ID mismatch:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

fixSystemIdMismatch();
