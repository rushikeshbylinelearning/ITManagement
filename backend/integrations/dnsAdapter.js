// DNS Log Adapter
// Ingests DNS server logs and creates DomainAccess records

const fs = require('fs');
const readline = require('readline');
const DomainAccess = require('../models/DomainAccess');
const Host = require('../models/Host');
const MonitoringSettings = require('../models/MonitoringSettings');

/**
 * Parse BIND DNS query log line
 * Format: timestamp client IP#port (domain): query: domain IN A/AAAA/etc. (server IP)
 */
function parseBindLogLine(line) {
  try {
    // Example: 15-Jan-2025 10:30:45.123 client 192.168.1.100#54321 (example.com): query: example.com IN A + (10.0.0.1)
    const timestampMatch = line.match(/(\d+-\w+-\d+ \d+:\d+:\d+\.\d+)/);
    const clientMatch = line.match(/client ([0-9.]+)#(\d+)/);
    const domainMatch = line.match(/query: ([\w.-]+) IN/);
    
    if (!timestampMatch || !clientMatch || !domainMatch) return null;
    
    return {
      timestamp: new Date(timestampMatch[1]),
      ipAddress: clientMatch[1],
      domain: domainMatch[1],
      port: parseInt(clientMatch[2])
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse Windows DNS log line
 * Format: Date Time Thread Event Type IP Port Hostname QueryType Response
 */
function parseWindowsDnsLogLine(line) {
  try {
    const parts = line.trim().split(/\s+/);
    
    if (parts.length < 9) return null;
    
    const [date, time, thread, eventType, protocol, sendReceive, ipAddress, port, hostname] = parts;
    
    // Only process query events
    if (eventType !== 'QUERY') return null;
    
    return {
      timestamp: new Date(`${date} ${time}`),
      ipAddress: ipAddress,
      domain: hostname,
      port: parseInt(port)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Map IP address to Host
 */
async function mapIpToHost(ipAddress) {
  const host = await Host.findOne({ ipAddress: ipAddress });
  return host;
}

/**
 * Extract root domain from FQDN
 */
function extractRootDomain(fqdn) {
  const parts = fqdn.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return fqdn;
}

/**
 * Ingest DNS logs from file
 */
async function ingestDnsLogs(logFilePath, format = 'bind') {
  console.log(`📥 Ingesting DNS logs from ${logFilePath} (format: ${format})`);
  
  const settings = await MonitoringSettings.getSettings();
  let processed = 0;
  let imported = 0;
  
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  // Use Map to aggregate domains by host + domain + timestamp bucket (5 minute buckets)
  const domainMap = new Map();
  
  for await (const line of rl) {
    if (!line.trim() || line.startsWith('#')) continue;
    
    let parsedLog;
    
    if (format === 'bind') {
      parsedLog = parseBindLogLine(line);
    } else if (format === 'windows') {
      parsedLog = parseWindowsDnsLogLine(line);
    } else {
      console.error(`Unknown format: ${format}`);
      break;
    }
    
    if (!parsedLog) continue;
    
    processed++;
    
    // Map IP to host
    const host = await mapIpToHost(parsedLog.ipAddress);
    if (!host) continue;
    
    // Extract root domain
    const rootDomain = extractRootDomain(parsedLog.domain);
    
    // Create 5-minute bucket for timestamp
    const bucket = Math.floor(parsedLog.timestamp.getTime() / (5 * 60 * 1000));
    
    // Create unique key
    const key = `${host._id}-${rootDomain}-${bucket}`;
    
    if (!domainMap.has(key)) {
      domainMap.set(key, {
        hostId: host._id,
        hostname: host.hostname,
        domain: rootDomain,
        frequency: 0,
        timestamp: new Date(bucket * 5 * 60 * 1000)
      });
    }
    
    domainMap.get(key).frequency++;
  }
  
  // Convert Map to array and insert
  const domainRecords = Array.from(domainMap.values()).map(record => ({
    ...record,
    userId: null,
    url: null,
    source: 'dns',
    bytesTransferred: 0
  }));
  
  if (domainRecords.length > 0) {
    try {
      await DomainAccess.insertMany(domainRecords, { ordered: false });
      imported = domainRecords.length;
    } catch (error) {
      console.error('Error inserting domain records:', error.message);
    }
  }
  
  console.log(`✅ Processed ${processed} log lines, imported ${imported} domain records`);
  
  return { processed, imported };
}

/**
 * Test DNS server connection
 */
async function testDnsConnection(dnsServerUrl) {
  try {
    console.log(`Testing connection to DNS server: ${dnsServerUrl}`);
    
    // Placeholder - actual implementation would test DNS query
    const dns = require('dns').promises;
    await dns.resolve('example.com');
    
    return {
      success: true,
      message: 'DNS connection test successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

module.exports = {
  ingestDnsLogs,
  testDnsConnection,
  parseBindLogLine,
  parseWindowsDnsLogLine
};

