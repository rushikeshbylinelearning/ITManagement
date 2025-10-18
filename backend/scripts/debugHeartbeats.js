require('dotenv').config();
const mongoose = require('mongoose');
const SystemAgent = require('../models/SystemAgent');

async function debugHeartbeats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    console.log('\n🔍 Debugging Heartbeat Issue...');
    console.log('================================');

    // Get all system agents
    const agents = await SystemAgent.find({}).select('+agentToken');
    
    console.log(`\n📊 Found ${agents.length} system agents in database:`);
    
    agents.forEach((agent, index) => {
      console.log(`\n${index + 1}. Agent Details:`);
      console.log(`   System ID: ${agent.systemId}`);
      console.log(`   System Name: ${agent.systemName}`);
      console.log(`   User: ${agent.userId?.name || 'Unknown'} (${agent.userId?.email || 'Unknown'})`);
      console.log(`   Status: ${agent.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Last Heartbeat: ${agent.lastHeartbeat}`);
      console.log(`   Heartbeat Age: ${agent.lastHeartbeat ? Math.round((Date.now() - new Date(agent.lastHeartbeat).getTime()) / 1000 / 60) : 'Never'} minutes ago`);
      console.log(`   Token Present: ${agent.agentToken ? 'Yes' : 'No'}`);
      console.log(`   Created: ${agent.createdAt}`);
      console.log(`   Updated: ${agent.updatedAt}`);
    });

    // Check for recent heartbeats
    const recentHeartbeats = agents.filter(agent => {
      if (!agent.lastHeartbeat) return false;
      const ageMinutes = (Date.now() - new Date(agent.lastHeartbeat).getTime()) / 1000 / 60;
      return ageMinutes < 10; // Less than 10 minutes ago
    });

    console.log(`\n⏰ Recent heartbeats (last 10 minutes): ${recentHeartbeats.length}`);
    
    if (recentHeartbeats.length > 0) {
      console.log('\n🚨 PROBLEM IDENTIFIED:');
      console.log('=====================');
      console.log('❌ There are agents with recent heartbeats but no Python processes running!');
      console.log('❌ This suggests stale data or a different process sending heartbeats.');
      
      recentHeartbeats.forEach((agent, index) => {
        console.log(`\n${index + 1}. Problematic Agent:`);
        console.log(`   System: ${agent.systemName} (${agent.systemId})`);
        console.log(`   Last Heartbeat: ${agent.lastHeartbeat}`);
        console.log(`   Token: ${agent.agentToken ? 'Present' : 'Missing'}`);
      });
      
      console.log('\n🔧 SOLUTIONS:');
      console.log('=============');
      console.log('1. Clear stale agent data from database');
      console.log('2. Reinstall and properly register the agent');
      console.log('3. Check if there are other processes sending heartbeats');
    } else {
      console.log('\n✅ No recent heartbeats found - this is expected if no agent is running');
    }

    // Check for agents without tokens
    const agentsWithoutTokens = agents.filter(agent => !agent.agentToken);
    console.log(`\n🔑 Agents without tokens: ${agentsWithoutTokens.length}`);
    
    if (agentsWithoutTokens.length > 0) {
      console.log('\n⚠️  Agents without tokens cannot send data:');
      agentsWithoutTokens.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.systemName} (${agent.systemId})`);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging heartbeats:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
}

debugHeartbeats();
