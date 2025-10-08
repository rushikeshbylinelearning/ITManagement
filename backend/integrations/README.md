# Integration Adapters

This directory contains adapters for ingesting monitoring data from external sources.

## Available Adapters

### 1. Proxy Adapter (`proxyAdapter.js`)
Ingests web proxy logs and creates domain access records.

**Supported Formats:**
- Squid access logs
- BlueCoat proxy logs (CSV format)

**Usage:**
```javascript
const { ingestProxyLogs } = require('./integrations/proxyAdapter');

// Ingest Squid logs
await ingestProxyLogs('/var/log/squid/access.log', 'squid');

// Ingest BlueCoat logs
await ingestProxyLogs('/path/to/bluecoat.csv', 'bluecoat');
```

**Configuration:**
Set in monitoring settings:
- `integrations.proxyEnabled`: Enable proxy integration
- `integrations.proxyUrl`: Proxy management URL
- `privacy.storeFullUrls`: Whether to store full URLs or just domains

### 2. DNS Adapter (`dnsAdapter.js`)
Ingests DNS server logs and creates domain access records.

**Supported Formats:**
- BIND query logs
- Windows DNS server logs

**Usage:**
```javascript
const { ingestDnsLogs } = require('./integrations/dnsAdapter');

// Ingest BIND logs
await ingestDnsLogs('/var/log/named/query.log', 'bind');

// Ingest Windows DNS logs
await ingestDnsLogs('C:\\Windows\\System32\\dns\\dns.log', 'windows');
```

**Configuration:**
Set in monitoring settings:
- `integrations.dnsEnabled`: Enable DNS integration
- `integrations.dnsServerUrl`: DNS server address

### 3. NetFlow Adapter (`netflowAdapter.js`)
Receives NetFlow v5 data and creates network usage records.

**Usage:**
```javascript
const { startNetFlowCollector } = require('./integrations/netflowAdapter');

// Start collector on port 2055
const server = startNetFlowCollector(2055);

// For testing: simulate NetFlow data
const { simulateNetFlowData } = require('./integrations/netflowAdapter');
await simulateNetFlowData();
```

**Configuration:**
Set in monitoring settings:
- `integrations.netflowEnabled`: Enable NetFlow integration
- `integrations.netflowCollectorUrl`: Collector listening address

**Network Setup:**
Configure your routers/switches to send NetFlow data to your server:
```
# Cisco example
ip flow-export destination <server-ip> 2055
ip flow-export version 5
```

## Setting Up Cron Jobs

### Proxy Log Ingestion
```bash
# Add to crontab: Import proxy logs every hour
0 * * * * /usr/bin/node /path/to/backend/scripts/importProxyLogs.js
```

### DNS Log Ingestion
```bash
# Add to crontab: Import DNS logs every 30 minutes
*/30 * * * * /usr/bin/node /path/to/backend/scripts/importDnsLogs.js
```

## Testing Integrations

Use the admin API endpoints to test integrations:

```bash
# Test proxy connection
curl -X POST http://localhost:5001/api/monitoring/integrations/proxy/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"proxyUrl": "http://proxy.example.com:3128"}'

# Test DNS connection
curl -X POST http://localhost:5001/api/monitoring/integrations/dns/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dnsServerUrl": "dns.example.com"}'

# Simulate NetFlow data
curl -X POST http://localhost:5001/api/monitoring/integrations/netflow/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Creating Custom Adapters

To create a new adapter:

1. Create a new file: `yourAdapter.js`
2. Implement these functions:
   - `ingestData()` - Main ingestion function
   - `testConnection()` - Test connectivity
   - `parseLogLine()` - Parse log format

3. Example template:
```javascript
async function ingestData(sourcePath) {
  // Read from source
  // Parse data
  // Map to database models
  // Insert records
}

async function testConnection(url) {
  // Test connectivity
  return { success: true, message: 'Connected' };
}

module.exports = { ingestData, testConnection };
```

4. Add API endpoint in `routes/monitoring.js`
5. Add configuration in `MonitoringSettings` model

## Data Mapping

### IP to Host Mapping
All adapters attempt to map IP addresses to monitored hosts:
```javascript
const host = await Host.findOne({ ipAddress: '192.168.1.100' });
```

If no host is found, the record is skipped. Ensure hosts are registered before ingesting external data.

### Username to User Mapping
Proxy and DNS logs may contain usernames. Adapters attempt to map these to User IDs:
```javascript
const user = await User.findOne({
  $or: [
    { email: /username/i },
    { name: /username/i }
  ]
});
```

## Privacy Considerations

- **Full URLs**: Only stored if `privacy.storeFullUrls` is enabled
- **Usernames**: Encrypted or anonymized based on `privacy.anonymizeUserData`
- **Retention**: Data auto-expires based on retention settings

## Troubleshooting

### Logs Not Appearing
1. Check file permissions on log files
2. Verify log format matches parser expectations
3. Check that hosts are registered with correct IP addresses

### Performance Issues
1. Use batch inserts (100-1000 records at a time)
2. Run imports during off-peak hours
3. Add indexes to frequently queried fields

### Duplicate Records
Adapters use timestamps and deduplication logic to prevent duplicates. If you see duplicates:
1. Check timestamp parsing
2. Verify unique key generation in adapter
3. Consider using `upsert` instead of `insert`

