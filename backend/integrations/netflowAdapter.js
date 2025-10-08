// NetFlow Adapter
// Ingests NetFlow v5/v9 data and creates NetworkUsage records

const dgram = require('dgram');
const NetworkUsage = require('../models/NetworkUsage');
const Host = require('../models/Host');

/**
 * Parse NetFlow v5 packet
 * NetFlow v5 format: Header + Flow Records
 */
function parseNetFlowV5Packet(buffer) {
  try {
    // NetFlow v5 Header (24 bytes)
    const version = buffer.readUInt16BE(0);
    const count = buffer.readUInt16BE(2);
    const sysUptime = buffer.readUInt32BE(4);
    const unixSecs = buffer.readUInt32BE(8);
    const unixNsecs = buffer.readUInt32BE(12);
    
    if (version !== 5) {
      return null; // Not NetFlow v5
    }
    
    const flows = [];
    let offset = 24; // Start after header
    
    for (let i = 0; i < count; i++) {
      if (offset + 48 > buffer.length) break;
      
      // Parse flow record (48 bytes each)
      const srcAddr = [
        buffer.readUInt8(offset),
        buffer.readUInt8(offset + 1),
        buffer.readUInt8(offset + 2),
        buffer.readUInt8(offset + 3)
      ].join('.');
      
      const dstAddr = [
        buffer.readUInt8(offset + 4),
        buffer.readUInt8(offset + 5),
        buffer.readUInt8(offset + 6),
        buffer.readUInt8(offset + 7)
      ].join('.');
      
      const srcPort = buffer.readUInt16BE(offset + 32);
      const dstPort = buffer.readUInt16BE(offset + 34);
      const protocol = buffer.readUInt8(offset + 38);
      const packets = buffer.readUInt32BE(offset + 16);
      const octets = buffer.readUInt32BE(offset + 20);
      
      flows.push({
        srcAddr,
        dstAddr,
        srcPort,
        dstPort,
        protocol: getProtocolName(protocol),
        packets,
        bytes: octets,
        timestamp: new Date(unixSecs * 1000)
      });
      
      offset += 48;
    }
    
    return flows;
  } catch (error) {
    console.error('Error parsing NetFlow packet:', error);
    return null;
  }
}

/**
 * Get protocol name from number
 */
function getProtocolName(protocolNum) {
  const protocols = {
    1: 'icmp',
    6: 'tcp',
    17: 'udp'
  };
  return protocols[protocolNum] || 'other';
}

/**
 * Map IP address to Host
 */
async function mapIpToHost(ipAddress) {
  const host = await Host.findOne({ ipAddress: ipAddress });
  return host;
}

/**
 * Start NetFlow collector
 * Listens for NetFlow packets on specified port
 */
function startNetFlowCollector(port = 2055) {
  console.log(`🌐 Starting NetFlow collector on port ${port}...`);
  
  const server = dgram.createSocket('udp4');
  
  server.on('message', async (msg, rinfo) => {
    const flows = parseNetFlowV5Packet(msg);
    
    if (!flows) return;
    
    // Process flows
    const networkRecords = [];
    
    for (const flow of flows) {
      // Map source IP to host
      const host = await mapIpToHost(flow.srcAddr);
      
      if (!host) continue; // Skip if not a monitored host
      
      networkRecords.push({
        hostId: host._id,
        hostname: host.hostname,
        pid: null,
        processName: 'netflow',
        protocol: flow.protocol,
        localAddress: flow.srcAddr,
        localPort: flow.srcPort,
        remoteAddress: flow.dstAddr,
        remotePort: flow.dstPort,
        bytesIn: 0,
        bytesOut: flow.bytes,
        packetsIn: 0,
        packetsOut: flow.packets,
        timestamp: flow.timestamp
      });
    }
    
    if (networkRecords.length > 0) {
      try {
        await NetworkUsage.insertMany(networkRecords, { ordered: false });
        console.log(`✅ Imported ${networkRecords.length} NetFlow records from ${rinfo.address}`);
      } catch (error) {
        console.error('Error inserting NetFlow records:', error.message);
      }
    }
  });
  
  server.on('error', (err) => {
    console.error('NetFlow collector error:', err);
    server.close();
  });
  
  server.bind(port);
  
  console.log(`✅ NetFlow collector listening on port ${port}`);
  
  return server;
}

/**
 * Simulate NetFlow data for testing
 */
async function simulateNetFlowData() {
  console.log('🧪 Simulating NetFlow data...');
  
  const hosts = await Host.find({ status: 'online' }).limit(5);
  
  if (hosts.length === 0) {
    console.log('No online hosts found for simulation');
    return;
  }
  
  const networkRecords = [];
  
  for (const host of hosts) {
    // Simulate 5 flow records per host
    for (let i = 0; i < 5; i++) {
      networkRecords.push({
        hostId: host._id,
        hostname: host.hostname,
        pid: null,
        processName: 'netflow-simulated',
        protocol: 'tcp',
        localAddress: host.ipAddress,
        localPort: Math.floor(Math.random() * 60000) + 1024,
        remoteAddress: `8.8.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        remotePort: [80, 443, 8080][Math.floor(Math.random() * 3)],
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000),
        packetsIn: Math.floor(Math.random() * 1000),
        packetsOut: Math.floor(Math.random() * 1000),
        timestamp: new Date()
      });
    }
  }
  
  try {
    await NetworkUsage.insertMany(networkRecords);
    console.log(`✅ Simulated ${networkRecords.length} NetFlow records`);
  } catch (error) {
    console.error('Error simulating NetFlow data:', error.message);
  }
}

module.exports = {
  startNetFlowCollector,
  simulateNetFlowData,
  parseNetFlowV5Packet
};

