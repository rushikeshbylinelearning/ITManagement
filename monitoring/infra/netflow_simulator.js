// NetFlow v5 Simulator
// Simulates NetFlow packets for testing

const dgram = require('dgram');

const COLLECTOR_HOST = process.env.COLLECTOR_HOST || 'localhost';
const COLLECTOR_PORT = process.env.COLLECTOR_PORT || 2055;
const INTERVAL_MS = process.env.INTERVAL_MS || 10000; // 10 seconds

console.log(`🌐 NetFlow Simulator starting...`);
console.log(`Sending to: ${COLLECTOR_HOST}:${COLLECTOR_PORT}`);
console.log(`Interval: ${INTERVAL_MS}ms`);

const client = dgram.createSocket('udp4');

// Sample source IPs (simulated internal hosts)
const sourceIPs = [
  '192.168.1.100',
  '192.168.1.101',
  '192.168.1.102',
  '10.0.0.50',
  '10.0.0.51'
];

// Sample destination IPs (simulated external services)
const destIPs = [
  '142.250.185.78',  // Google
  '104.16.132.229',  // Cloudflare
  '13.107.42.14',    // Microsoft
  '54.230.150.23',   // AWS
  '151.101.1.140'    // Fastly
];

function createNetFlowV5Packet() {
  // NetFlow v5 header (24 bytes)
  const header = Buffer.alloc(24);
  
  header.writeUInt16BE(5, 0);                  // version = 5
  header.writeUInt16BE(5, 2);                  // count = 5 flows
  header.writeUInt32BE(Date.now(), 4);         // sysUptime
  header.writeUInt32BE(Math.floor(Date.now() / 1000), 8);  // unix_secs
  header.writeUInt32BE((Date.now() % 1000) * 1000000, 12); // unix_nsecs
  header.writeUInt32BE(0, 16);                 // flow_sequence
  header.writeUInt8(0, 20);                    // engine_type
  header.writeUInt8(0, 21);                    // engine_id
  header.writeUInt16BE(0, 22);                 // sampling_interval
  
  // NetFlow v5 flow records (48 bytes each, 5 flows)
  const flows = [];
  
  for (let i = 0; i < 5; i++) {
    const flow = Buffer.alloc(48);
    
    // Source IP
    const srcIP = sourceIPs[Math.floor(Math.random() * sourceIPs.length)];
    const srcParts = srcIP.split('.').map(Number);
    flow.writeUInt8(srcParts[0], 0);
    flow.writeUInt8(srcParts[1], 1);
    flow.writeUInt8(srcParts[2], 2);
    flow.writeUInt8(srcParts[3], 3);
    
    // Dest IP
    const dstIP = destIPs[Math.floor(Math.random() * destIPs.length)];
    const dstParts = dstIP.split('.').map(Number);
    flow.writeUInt8(dstParts[0], 4);
    flow.writeUInt8(dstParts[1], 5);
    flow.writeUInt8(dstParts[2], 6);
    flow.writeUInt8(dstParts[3], 7);
    
    // Next hop (0.0.0.0)
    flow.writeUInt32BE(0, 8);
    
    // SNMP indexes
    flow.writeUInt16BE(0, 12); // input
    flow.writeUInt16BE(0, 14); // output
    
    // Packets and octets
    const packets = Math.floor(Math.random() * 1000) + 10;
    const octets = packets * (Math.floor(Math.random() * 1400) + 100);
    flow.writeUInt32BE(packets, 16);
    flow.writeUInt32BE(octets, 20);
    
    // Flow times
    const firstSwitched = Math.floor(Math.random() * 10000);
    const lastSwitched = firstSwitched + Math.floor(Math.random() * 5000);
    flow.writeUInt32BE(firstSwitched, 24);
    flow.writeUInt32BE(lastSwitched, 28);
    
    // Ports
    flow.writeUInt16BE(Math.floor(Math.random() * 60000) + 1024, 32); // src port
    flow.writeUInt16BE([80, 443, 8080, 22, 3389][Math.floor(Math.random() * 5)], 34); // dst port
    
    // Padding
    flow.writeUInt8(0, 36);
    
    // TCP flags
    flow.writeUInt8(0x18, 37); // PSH, ACK
    
    // Protocol (6 = TCP, 17 = UDP)
    flow.writeUInt8(6, 38);
    
    // ToS
    flow.writeUInt8(0, 39);
    
    // AS numbers (0 = unknown)
    flow.writeUInt16BE(0, 40); // src AS
    flow.writeUInt16BE(0, 42); // dst AS
    
    // Masks
    flow.writeUInt8(24, 44); // src mask
    flow.writeUInt8(24, 45); // dst mask
    
    // Padding
    flow.writeUInt16BE(0, 46);
    
    flows.push(flow);
  }
  
  // Combine header and flows
  return Buffer.concat([header, ...flows]);
}

function sendNetFlowPacket() {
  const packet = createNetFlowV5Packet();
  
  client.send(packet, COLLECTOR_PORT, COLLECTOR_HOST, (err) => {
    if (err) {
      console.error('❌ Error sending NetFlow packet:', err.message);
    } else {
      console.log(`✅ Sent NetFlow packet with 5 flows (${packet.length} bytes)`);
    }
  });
}

// Send initial packet
sendNetFlowPacket();

// Send packets at regular intervals
setInterval(sendNetFlowPacket, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down NetFlow simulator...');
  client.close();
  process.exit(0);
});

console.log('✅ NetFlow simulator running. Press Ctrl+C to stop.');

