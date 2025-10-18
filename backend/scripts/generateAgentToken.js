// Quick script to register an agent and generate token
// Run with: node scripts/generateAgentToken.js employee-email@example.com

require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');
const User = require('../models/User');

const email = process.argv[2];
const systemName = process.argv[3] || 'UnknownSystem';

if (!email) {
  console.error('❌ Please provide user email');
  console.log('Usage: node scripts/generateAgentToken.js user-email@example.com [system-name]');
  process.exit(1);
}

async function generateToken() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('📋 User Details:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('');

    // Generate system ID
    const systemId = `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create agent
    const agent = new SystemAgent({
      systemId,
      systemName,
      userId: user._id,
      systemInfo: {
        registeredBy: user.name,
        registeredAt: new Date().toISOString()
      }
    });

    const agentToken = agent.generateAgentToken();
    agent.agentToken = agentToken;
    await agent.save();

    console.log('✅ Agent registered successfully!\n');
    console.log('📋 Agent Details:');
    console.log('  System ID:', systemId);
    console.log('  System Name:', systemName);
    console.log('  User:', user.name);
    console.log('');
    console.log('🔑 Agent Token:');
    console.log('  ', agentToken);
    console.log('');
    console.log('📝 Registration Command:');
    console.log(`  python "C:\\Program Files\\ITNetworkMonitor\\network_monitor_agent.py" register ${agentToken}`);
    console.log('');
    console.log('✅ Copy and run the command above in Command Prompt (as Administrator)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateToken();








