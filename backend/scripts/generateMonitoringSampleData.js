// Script to generate sample monitoring data for testing
// Run with: node scripts/generateMonitoringSampleData.js

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001/api/monitoring/events';
const API_KEY = process.env.MONITORING_API_KEY || 'your-monitoring-api-key-change-this-in-production';
const NUM_HOSTS = 5;

// Sample data generators
const OS_TYPES = ['Windows 10', 'Windows 11', 'Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 7', 'macOS Monterey'];
const PROCESS_NAMES = ['chrome.exe', 'firefox.exe', 'code.exe', 'node.exe', 'python.exe', 'java', 'nginx', 'apache2', 'mysql', 'postgres'];
const FILE_OPERATIONS = ['create', 'modify', 'delete'];
const PROTOCOLS = ['tcp', 'udp'];

function generateHostname() {
  const prefixes = ['DESKTOP', 'LAPTOP', 'SERVER', 'WORKSTATION'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${prefix}-${number}`;
}

function generateAgentId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function generateSystemMetrics() {
  return {
    os: OS_TYPES[Math.floor(Math.random() * OS_TYPES.length)],
    osVersion: '10.0.19041',
    agentVersion: '1.0.0',
    macAddress: Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
    cpu: {
      model: 'Intel Core i7-9700K',
      cores: 8,
      usage: randomInRange(10, 95)
    },
    ram: {
      total: 16384,
      used: randomInRange(4096, 14336),
      usage: randomInRange(25, 90)
    },
    disk: {
      total: 500,
      used: randomInRange(100, 450),
      usage: randomInRange(20, 90)
    }
  };
}

function generateProcesses(count = 20) {
  const processes = [];
  for (let i = 0; i < count; i++) {
    processes.push({
      pid: Math.floor(Math.random() * 10000) + 1000,
      name: PROCESS_NAMES[Math.floor(Math.random() * PROCESS_NAMES.length)],
      user: Math.random() > 0.5 ? 'Administrator' : 'User',
      exe: '/usr/bin/process',
      cmdline: 'process --arg1 --arg2',
      cpu_percent: randomInRange(0, 25),
      memory_mb: randomInRange(10, 500),
      create_time: Date.now() / 1000 - Math.floor(Math.random() * 3600),
      status: 'running'
    });
  }
  return processes;
}

function generateFileEvents(count = 10) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      path: `/home/user/documents/file${i}.txt`,
      operation: FILE_OPERATIONS[Math.floor(Math.random() * FILE_OPERATIONS.length)],
      file_type: '.txt',
      size: Math.floor(Math.random() * 1000000),
      user: 'User',
      process: PROCESS_NAMES[Math.floor(Math.random() * PROCESS_NAMES.length)],
      timestamp: new Date().toISOString()
    });
  }
  return events;
}

function generateNetworkConnections(count = 15) {
  const connections = [];
  for (let i = 0; i < count; i++) {
    connections.push({
      pid: Math.floor(Math.random() * 10000) + 1000,
      process: PROCESS_NAMES[Math.floor(Math.random() * PROCESS_NAMES.length)],
      protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
      local_address: '192.168.1.' + Math.floor(Math.random() * 255),
      local_port: Math.floor(Math.random() * 65535),
      remote_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      remote_port: Math.floor(Math.random() * 65535),
      bytes_sent: Math.floor(Math.random() * 10000000),
      bytes_recv: Math.floor(Math.random() * 10000000),
      packets_sent: Math.floor(Math.random() * 10000),
      packets_recv: Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString()
    });
  }
  return connections;
}

async function sendTelemetry(telemetry) {
  try {
    const response = await axios.post(BACKEND_URL, telemetry, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    console.log(`✅ Telemetry sent for ${telemetry.hostname}: ${response.data.msg}`);
    if (response.data.alertsTriggered > 0) {
      console.log(`   ⚠️  Triggered ${response.data.alertsTriggered} alerts`);
    }
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending telemetry for ${telemetry.hostname}:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.msg || error.response.data}`);
    }
    throw error;
  }
}

async function generateSampleData() {
  console.log('🚀 Generating sample monitoring data...\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Generating data for ${NUM_HOSTS} hosts\n`);
  
  const hosts = [];
  
  // Generate hosts
  for (let i = 0; i < NUM_HOSTS; i++) {
    const hostname = generateHostname();
    const agentId = generateAgentId();
    
    hosts.push({
      hostname,
      agentId,
      agent_id: agentId,
      metrics: generateSystemMetrics(),
      processes: generateProcesses(),
      file_events: generateFileEvents(),
      network: generateNetworkConnections(),
      timestamp: new Date().toISOString()
    });
  }
  
  // Send telemetry for each host
  for (const host of hosts) {
    try {
      await sendTelemetry(host);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
    } catch (error) {
      console.error(`Failed to send telemetry for ${host.hostname}`);
    }
  }
  
  console.log('\n✨ Sample data generation complete!');
  console.log('\nYou can now:');
  console.log('1. View the monitoring dashboard at http://localhost:5173/monitoring');
  console.log('2. Check the hosts and their metrics');
  console.log('3. View any triggered alerts');
}

// Generate sample data with high resource usage to trigger alerts
async function generateAlertTriggeringData() {
  console.log('\n🚨 Generating data to trigger alerts...\n');
  
  const hostname = 'ALERT-TEST-HOST';
  const agentId = 'test-alert-' + Date.now();
  
  // High CPU usage alert
  const highCpuData = {
    hostname,
    agent_id: agentId,
    metrics: {
      ...generateSystemMetrics(),
      cpu: { model: 'Intel Core i7', cores: 8, usage: 95 },
      ram: { total: 16384, used: 8192, usage: 50 },
      disk: { total: 500, used: 250, usage: 50 }
    },
    processes: generateProcesses(),
    file_events: [],
    network: []
  };
  
  await sendTelemetry(highCpuData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // High memory usage alert
  const highMemData = {
    hostname,
    agent_id: agentId,
    metrics: {
      ...generateSystemMetrics(),
      cpu: { model: 'Intel Core i7', cores: 8, usage: 50 },
      ram: { total: 16384, used: 15360, usage: 94 },
      disk: { total: 500, used: 250, usage: 50 }
    },
    processes: generateProcesses(),
    file_events: [],
    network: []
  };
  
  await sendTelemetry(highMemData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Bulk file deletion alert
  const bulkDeleteData = {
    hostname,
    agent_id: agentId,
    metrics: generateSystemMetrics(),
    processes: generateProcesses(),
    file_events: Array.from({length: 60}, (_, i) => ({
      path: `/home/user/documents/deleted_file_${i}.txt`,
      operation: 'delete',
      file_type: '.txt',
      size: 0,
      user: 'User',
      process: 'explorer.exe',
      timestamp: new Date().toISOString()
    })),
    network: []
  };
  
  await sendTelemetry(bulkDeleteData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // High network usage alert
  const highNetworkData = {
    hostname,
    agent_id: agentId,
    metrics: generateSystemMetrics(),
    processes: generateProcesses(),
    file_events: [],
    network: [{
      pid: 1234,
      process: 'chrome.exe',
      protocol: 'tcp',
      local_address: '192.168.1.100',
      local_port: 50000,
      remote_address: '8.8.8.8',
      remote_port: 443,
      bytes_sent: 150 * 1024 * 1024, // 150 MB sent
      bytes_recv: 150 * 1024 * 1024, // 150 MB received
      packets_sent: 100000,
      packets_recv: 100000,
      timestamp: new Date().toISOString()
    }]
  };
  
  await sendTelemetry(highNetworkData);
  
  console.log('\n✨ Alert-triggering data sent!');
  console.log('Check the monitoring dashboard for alerts.');
}

async function main() {
  try {
    // Generate normal sample data
    await generateSampleData();
    
    // Generate alert-triggering data
    await generateAlertTriggeringData();
    
    console.log('\n🎉 All done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();




