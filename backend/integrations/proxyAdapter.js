// Proxy Log Adapter
// Ingests web proxy logs (Squid, BlueCoat, etc.) and creates DomainAccess records

const fs = require('fs');
const readline = require('readline');
const DomainAccess = require('../models/DomainAccess');
const Host = require('../models/Host');
const User = require('../models/User');
const MonitoringSettings = require('../models/MonitoringSettings');

/**
 * Parse Squid access log line
 * Format: timestamp elapsed remotehost code/status bytes method URL rfc931 peerstatus/peerhost type
 */
function parseSquidLogLine(line) {
  const parts = line.trim().split(/\s+/);
  
  if (parts.length < 10) return null;
  
  const [timestamp, elapsed, remotehost, codeStatus, bytes, method, url, username] = parts;
  
  try {
    const urlObj = new URL(url);
    return {
      timestamp: new Date(parseFloat(timestamp) * 1000),
      ipAddress: remotehost,
      domain: urlObj.hostname,
      url: url,
      bytes: parseInt(bytes) || 0,
      username: username !== '-' ? username : null,
      method: method
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse BlueCoat proxy log line (CSV format)
 * Format: date,time,c-ip,cs-username,cs-method,cs-uri-scheme,cs-host,cs-uri-port,cs-uri-path,cs-uri-query,sc-status,sc-bytes,time-taken
 */
function parseBlueCoatLogLine(line) {
  const parts = line.split(',');
  
  if (parts.length < 13) return null;
  
  try {
    const [date, time, clientIp, username, method, scheme, host, port, path, query, status, bytes, timeTaken] = parts;
    
    const timestamp = new Date(`${date} ${time}`);
    const fullUrl = `${scheme}://${host}${path}${query ? '?' + query : ''}`;
    
    return {
      timestamp: timestamp,
      ipAddress: clientIp,
      domain: host,
      url: fullUrl,
      bytes: parseInt(bytes) || 0,
      username: username !== '-' ? username : null,
      method: method
    };
  } catch (error) {
    return null;
  }
}

/**
 * Map proxy username to User ID
 */
async function mapUsernameToUserId(username) {
  if (!username) return null;
  
  // Try exact match
  let user = await User.findOne({ 
    $or: [
      { email: new RegExp(username, 'i') },
      { name: new RegExp(username, 'i') }
    ]
  });
  
  if (!user) {
    // Try username without domain (e.g., 'john.doe' from 'john.doe@company.com')
    const usernameWithoutDomain = username.split('@')[0];
    user = await User.findOne({
      $or: [
        { email: new RegExp(usernameWithoutDomain, 'i') },
        { name: new RegExp(usernameWithoutDomain, 'i') }
      ]
    });
  }
  
  return user ? user._id : null;
}

/**
 * Map IP address to Host
 */
async function mapIpToHost(ipAddress) {
  const host = await Host.findOne({ ipAddress: ipAddress });
  return host;
}

/**
 * Ingest proxy logs from file
 */
async function ingestProxyLogs(logFilePath, format = 'squid') {
  console.log(`📥 Ingesting proxy logs from ${logFilePath} (format: ${format})`);
  
  const settings = await MonitoringSettings.getSettings();
  let processed = 0;
  let imported = 0;
  
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const domainRecords = [];
  
  for await (const line of rl) {
    if (!line.trim() || line.startsWith('#')) continue; // Skip comments and empty lines
    
    let parsedLog;
    
    if (format === 'squid') {
      parsedLog = parseSquidLogLine(line);
    } else if (format === 'bluecoat') {
      parsedLog = parseBlueCoatLogLine(line);
    } else {
      console.error(`Unknown format: ${format}`);
      break;
    }
    
    if (!parsedLog) continue;
    
    processed++;
    
    // Map username to userId
    const userId = await mapUsernameToUserId(parsedLog.username);
    
    // Map IP to host
    const host = await mapIpToHost(parsedLog.ipAddress);
    
    if (!host) {
      // Create a placeholder host for this IP
      continue; // Or create: await Host.create({ hostname: `unknown-${parsedLog.ipAddress}`, ... })
    }
    
    domainRecords.push({
      hostId: host._id,
      hostname: host.hostname,
      userId: userId,
      domain: parsedLog.domain,
      url: settings.privacy.storeFullUrls ? parsedLog.url : null,
      source: 'proxy',
      frequency: 1,
      bytesTransferred: parsedLog.bytes,
      timestamp: parsedLog.timestamp
    });
    
    // Batch insert every 100 records
    if (domainRecords.length >= 100) {
      try {
        await DomainAccess.insertMany(domainRecords, { ordered: false });
        imported += domainRecords.length;
        domainRecords.length = 0; // Clear array
      } catch (error) {
        console.error('Error inserting domain records:', error.message);
      }
    }
  }
  
  // Insert remaining records
  if (domainRecords.length > 0) {
    try {
      await DomainAccess.insertMany(domainRecords, { ordered: false });
      imported += domainRecords.length;
    } catch (error) {
      console.error('Error inserting domain records:', error.message);
    }
  }
  
  console.log(`✅ Processed ${processed} log lines, imported ${imported} domain records`);
  
  return { processed, imported };
}

/**
 * Test proxy connection
 */
async function testProxyConnection(proxyUrl) {
  try {
    // Placeholder - actual implementation would test connectivity to proxy management API
    console.log(`Testing connection to proxy: ${proxyUrl}`);
    
    // For now, just check if URL is valid
    new URL(proxyUrl);
    
    return {
      success: true,
      message: 'Proxy connection test successful (placeholder)'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

module.exports = {
  ingestProxyLogs,
  testProxyConnection,
  parseSquidLogLine,
  parseBlueCoatLogLine
};

