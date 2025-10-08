// Test Agent Simulator
// This script simulates multiple monitoring agents sending telemetry to test the system

const axios = require('axios');
const os = require('os');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001/api/monitoring';
const API_KEY = process.env.MONITORING_API_KEY || 'default-monitoring-key-change-me';
const NUM_AGENTS = parseInt(process.env.NUM_AGENTS) || 3;
const SEND_INTERVAL = parseInt(process.env.SEND_INTERVAL) || 10; // seconds

// Generate random telemetry data
function generateTelemetry(agentId, hostname) {
  const cpuUsage = Math.random() * 100;
  const ramUsage = 50 + Math.random() * 40;
  const diskUsage = 30 + Math.random() * 50;

  return {
    agent_id: agentId,
    hostname: hostname,
    metrics: {
      os: os.platform(),
      osVersion: os.release(),
      agentVersion: '1.0.0-test',
      macAddress: `00:11:22:33:44:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
      cpu: {
        model: os.cpus()[0].model,
        cores: os.cpus().length,
        usage: cpuUsage
      },
      ram: {
        total: os.totalmem() / (1024 * 1024), // MB
        used: (os.totalmem() - os.freemem()) / (1024 * 1024),
        usage: ramUsage
      },
      disk: {
        total: 500000, // 500GB in MB
        used: 250000,
        usage: diskUsage
      }
    },
    processes: generateProcesses(),
    file_events: generateFileEvents(),
    network: generateNetworkConnections(),
    timestamp: new Date().toISOString()
  };
}

// Generate random process list
function generateProcesses() {
  const processes = [];
  const processNames = ['chrome.exe', 'node.exe', 'code.exe', 'explorer.exe', 'system', 'svchost.exe'];
  
  for (let i = 0; i < 10; i++) {
    processes.push({
      pid: 1000 + Math.floor(Math.random() * 9000),
      name: processNames[Math.floor(Math.random() * processNames.length)],
      exe: `/usr/bin/${processNames[i % processNames.length]}`,
      cmdline: 'sample command line',
      user: os.userInfo().username,
      cpu_percent: Math.random() * 20,
      memory_mb: 50 + Math.random() * 500,
      create_time: Date.now() / 1000 - Math.random() * 86400,
      status: 'running'
    });
  }
  
  return processes;
}

// Generate random file events
function generateFileEvents() {
  const events = [];
  const operations = ['create', 'modify', 'delete'];
  
  // Occasionally generate bulk deletions to trigger alerts
  const numEvents = Math.random() > 0.9 ? 60 : Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numEvents; i++) {
    events.push({
      path: `/home/user/documents/file${i}.txt`,
      operation: operations[Math.floor(Math.random() * operations.length)],
      file_type: '.txt',
      size: Math.floor(Math.random() * 1000000),
      user: os.userInfo().username,
      process: 'explorer.exe',
      hash: null,
      timestamp: new Date().toISOString()
    });
  }
  
  return events;
}

// Generate random network connections
function generateNetworkConnections() {
  const connections = [];
  const processNames = ['chrome.exe', 'node.exe', 'teams.exe', 'slack.exe'];
  
  // Occasionally generate high bandwidth usage to trigger alerts
  const bytesMultiplier = Math.random() > 0.95 ? 150 * 1024 * 1024 : 1024 * 1024; // 150 MB or 1 MB
  
  for (let i = 0; i < 5; i++) {
    connections.push({
      pid: 1000 + Math.floor(Math.random() * 9000),
      process: processNames[Math.floor(Math.random() * processNames.length)],
      protocol: Math.random() > 0.5 ? 'tcp' : 'udp',
      local_address: '192.168.1.' + Math.floor(Math.random() * 255),
      local_port: 40000 + Math.floor(Math.random() * 20000),
      remote_address: '8.8.8.' + Math.floor(Math.random() * 255),
      remote_port: 443,
      bytes_sent: Math.floor(Math.random() * bytesMultiplier),
      bytes_recv: Math.floor(Math.random() * bytesMultiplier),
      packets_sent: Math.floor(Math.random() * 1000),
      packets_recv: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString()
    });
  }
  
  return connections;
}

// Send telemetry to backend
async function sendTelemetry(telemetry) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/events`,
      telemetry,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        timeout: 10000
      }
    );
    
    if (response.data.success) {
      console.log(`✓ [${telemetry.hostname}] Telemetry sent successfully. Alerts: ${response.data.alertsTriggered}`);
    } else {
      console.log(`✗ [${telemetry.hostname}] Failed: ${response.data.msg}`);
    }
  } catch (error) {
    console.error(`✗ [${telemetry.hostname}] Error:`, error.message);
  }
}

// Create simulated agents
function createAgents(numAgents) {
  const agents = [];
  
  for (let i = 1; i <= numAgents; i++) {
    agents.push({
      agentId: `test-agent-${i.toString().padStart(3, '0')}`,
      hostname: `test-host-${i}`,
    });
  }
  
  return agents;
}

// Main simulation loop
async function runSimulation() {
  console.log('========================================');
  console.log('Monitoring Agent Simulator');
  console.log('========================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Number of Agents: ${NUM_AGENTS}`);
  console.log(`Send Interval: ${SEND_INTERVAL} seconds`);
  console.log('========================================\n');
  
  const agents = createAgents(NUM_AGENTS);
  console.log(`Created ${agents.length} simulated agents:\n`);
  agents.forEach(agent => {
    console.log(`  - ${agent.hostname} (${agent.agentId})`);
  });
  console.log('\nStarting telemetry simulation...\n');
  
  let cycle = 0;
  
  setInterval(async () => {
    cycle++;
    console.log(`\n[Cycle ${cycle}] Sending telemetry from all agents...`);
    
    for (const agent of agents) {
      const telemetry = generateTelemetry(agent.agentId, agent.hostname);
      await sendTelemetry(telemetry);
      
      // Small delay between agents
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[Cycle ${cycle}] Complete\n`);
  }, SEND_INTERVAL * 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down simulator...');
  process.exit(0);
});

// Start simulation
runSimulation();




