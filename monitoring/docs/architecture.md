# Computer Monitoring Module - Architecture

## Overview

The Computer Monitoring Module is an integrated endpoint monitoring system that collects, processes, and analyzes telemetry data from managed workstations within an enterprise environment.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React + MUI)                │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │ Hosts List   │  │ Host Details  │  │ Alerts Page  │     │
│  │ Dashboard    │  │ (Tabs)        │  │ Settings     │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
┌────────────────────────┴────────────────────────────────────┐
│                  Backend (Node.js + Express)                 │
│                                                               │
│  ┌─────────────────────┐      ┌──────────────────────┐      │
│  │  API Routes         │      │  Alert Rules Engine  │      │
│  │  - Telemetry        │◄────►│  - High Upload       │      │
│  │  - Hosts            │      │  - Bulk Deletion     │      │
│  │  - Alerts           │      │  - Off-Network       │      │
│  │  - Settings         │      │  - Resource Usage    │      │
│  └─────────────────────┘      └──────────────────────┘      │
│           │                              │                    │
│           ▼                              ▼                    │
│  ┌─────────────────────────────────────────────────┐         │
│  │           MongoDB Database                       │         │
│  │  - Hosts           - NetworkUsage                │         │
│  │  - ProcessEvents   - FileEvents                  │         │
│  │  - DomainAccess    - UserSessions                │         │
│  │  - MonitoringAlerts - MonitoringSettings         │         │
│  └─────────────────────────────────────────────────┘         │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼───────────────────┐
          │                │                   │
          ▼                ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Go Agent     │  │ Enrichment   │  │ Integration      │
│ (Endpoint)   │  │ Worker       │  │ Adapters         │
│              │  │              │  │                  │
│ • Metrics    │  │ • Reverse DNS│  │ • Proxy Logs     │
│ • Processes  │  │ • Normalize  │  │ • DNS Logs       │
│ • Files      │  │ • Correlate  │  │ • NetFlow        │
│ • Network    │  │ • Aggregate  │  │ • SSO Events     │
└──────────────┘  └──────────────┘  └──────────────────┘
```

## Data Flow

### 1. Telemetry Collection (Agent → Backend)

```
Agent (Go)
   │
   ├─► Collect System Metrics (CPU, RAM, Disk, Uptime)
   ├─► Monitor Processes (PID, CPU%, Memory)
   ├─► Watch File Operations (Create, Modify, Delete)
   ├─► Track Network Connections (Established connections)
   ├─► Detect Network Context (VPN, SSID, Public IP)
   │
   └─► POST /api/monitoring/events
       {
         agent_id, hostname, metrics, processes,
         file_events, network, domains, sessions,
         host_ip, public_ip, vpn, ssid
       }
       │
       ▼
   Backend Ingestion
       │
       ├─► Validate Payload
       ├─► Upsert Host Record
       ├─► Insert Events (processes, files, network)
       ├─► Record Domain Access
       ├─► Track User Sessions
       │
       └─► Trigger Alert Rules
           │
           ├─► High Upload Check
           ├─► Bulk Deletion Check
           ├─► Suspicious Domain Check
           ├─► Off-Network Check
           └─► Resource Usage Checks
```

### 2. Enrichment Pipeline (Background Worker)

```
Enrichment Worker (Node.js)
   │
   ├─► Every 5 minutes:
   │   ├─► Reverse DNS Lookup (IP → Domain)
   │   ├─► Normalize Domain Names
   │   └─► Correlate Users (OS user → DB User)
   │
   ├─► Every 15 minutes:
   │   └─► Aggregate Bandwidth Statistics
   │
   └─► Every hour:
       └─► Cleanup Expired Data (based on retention settings)
```

### 3. Integration Data Flow

```
External Sources
   │
   ├─► Proxy Logs (Squid/BlueCoat)
   │   └─► Parse → Map User → Map IP to Host → Insert DomainAccess
   │
   ├─► DNS Server Logs (BIND/Windows DNS)
   │   └─► Parse → Aggregate by domain → Map IP to Host → Insert DomainAccess
   │
   ├─► NetFlow v5 Packets (UDP:2055)
   │   └─► Parse → Map IP to Host → Insert NetworkUsage
   │
   └─► SSO Events (IdP API)
       └─► Fetch Sessions → Map User → Insert UserSession
```

## Alert Rules Engine

### Rule Types

1. **High Upload Alert**
   - Trigger: >150 MB upload in 1 minute
   - Severity: High/Critical
   - Purpose: Detect data exfiltration

2. **Bulk File Deletion Alert**
   - Trigger: >50 file deletions in 1 minute
   - Severity: Medium/High/Critical
   - Purpose: Detect ransomware or malicious deletion

3. **Suspicious Domain Upload Alert**
   - Trigger: Large upload to non-whitelisted domain
   - Severity: High/Critical
   - Purpose: Detect unauthorized data sharing

4. **Off-Network Access Alert**
   - Trigger: Host connects outside corporate network without VPN
   - Severity: Medium
   - Purpose: Enforce network security policies

5. **Resource Usage Alerts**
   - High CPU (>90%)
   - High Memory (>90%)
   - High Disk (>90%)
   - Purpose: System health monitoring

### Alert Lifecycle

```
Event Detected
    │
    ▼
Check if similar alert exists (deduplication)
    │
    ├─► Exists? Skip
    │
    └─► New? Create Alert
        │
        ├─► Insert to MonitoringAlert collection
        ├─► Emit WebSocket event (real-time notification)
        └─► Display in Alerts page
            │
            ├─► Admin Acknowledges
            │   └─► Mark acknowledgedAt
            │
            └─► Admin Resolves
                └─► Mark resolved, add resolution note
```

## Database Schema (MongoDB)

### Collections

#### hosts
```javascript
{
  _id: ObjectId,
  hostname: String (unique),
  agentId: String (unique),
  os: String,
  osVersion: String,
  cpu: { model, cores, usage },
  ram: { total, used, usage },
  disk: { total, used, usage },
  agentVersion: String,
  ipAddress: String,
  publicIp: String,
  macAddress: String,
  vpnActive: Boolean,
  ssid: String,
  uptime: Number,
  batteryPercent: Number,
  status: Enum['online', 'offline', 'warning', 'pending'],
  lastSeen: Date,
  firstSeen: Date,
  metadata: Map<String, String>
}
```

#### network_usage
```javascript
{
  _id: ObjectId,
  hostId: ObjectId (ref: Host),
  hostname: String,
  pid: Number,
  processName: String,
  protocol: Enum['tcp', 'udp', 'icmp', 'other'],
  localAddress: String,
  localPort: Number,
  remoteAddress: String,
  remotePort: Number,
  bytesIn: Number,
  bytesOut: Number,
  packetsIn: Number,
  packetsOut: Number,
  timestamp: Date,
  createdAt: Date (TTL: 15 days)
}
```

#### domain_access
```javascript
{
  _id: ObjectId,
  hostId: ObjectId (ref: Host),
  hostname: String,
  userId: ObjectId (ref: User, nullable),
  domain: String,
  url: String (nullable, privacy setting),
  source: Enum['dns', 'proxy', 'agent', 'netflow'],
  frequency: Number,
  bytesTransferred: Number,
  timestamp: Date,
  createdAt: Date (TTL: 90 days)
}
```

#### file_events
```javascript
{
  _id: ObjectId,
  hostId: ObjectId (ref: Host),
  hostname: String,
  path: String,
  operation: Enum['create', 'modify', 'delete', 'rename', 'access'],
  fileType: String,
  size: Number (bytes),
  user: String,
  processName: String,
  hash: String (optional),
  timestamp: Date,
  createdAt: Date (TTL: 30 days)
}
```

#### user_sessions
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  hostId: ObjectId (ref: Host),
  sessionType: Enum['sso', 'browser', 'local_login', 'rdp', 'vpn'],
  sessionId: String (unique),
  client: String,
  clientVersion: String,
  ipAddress: String,
  userAgent: String,
  isActive: Boolean,
  lastSeen: Date,
  endedAt: Date,
  metadata: Mixed,
  createdAt: Date (TTL: 90 days)
}
```

#### monitoring_alerts
```javascript
{
  _id: ObjectId,
  hostId: ObjectId (ref: Host),
  hostname: String,
  type: Enum[
    'high_network_usage', 'high_upload', 'bulk_file_deletion',
    'suspicious_upload', 'off_network', 'high_cpu_usage',
    'high_memory_usage', 'high_disk_usage', 'host_offline'
  ],
  severity: Enum['low', 'medium', 'high', 'critical'],
  title: String,
  description: String,
  metadata: Mixed,
  resolved: Boolean,
  resolvedAt: Date,
  resolvedBy: ObjectId (ref: User),
  resolvedNote: String,
  acknowledgedAt: Date,
  acknowledgedBy: ObjectId (ref: User),
  createdAt: Date
}
```

## Security & Privacy

### Authentication
- **Agent → Backend**: API Key authentication (header: `X-API-Key`)
- **Frontend → Backend**: JWT tokens (session-based)
- **Optional**: mTLS for agent authentication (TLS client certificates)

### Privacy Controls
- **Domain vs URL Storage**: Configurable (default: domain-only)
- **No File Contents**: Only metadata stored
- **No Keystrokes**: Not captured
- **No Screenshots**: Not captured
- **Data Retention**: Configurable (default: 15-90 days)
- **User Consent**: Legal template provided

### Data Access
- **Admin Only**: All monitoring data requires admin role
- **Audit Logging**: Settings changes tracked (lastModifiedBy)
- **Alert Resolution**: Tracked with user ID and notes

## Scalability Considerations

### Performance Optimization
1. **Database Indexes**: On hostId, timestamp, userId
2. **TTL Indexes**: Automatic data expiration
3. **Batch Inserts**: Agents batch telemetry every N seconds
4. **Aggregation Pipelines**: Pre-computed statistics

### Scaling Strategies
1. **Horizontal Agent Scaling**: Unlimited agents supported
2. **Backend Scaling**: Stateless API (can run multiple instances)
3. **Worker Scaling**: Multiple enrichment workers can run in parallel
4. **Database Scaling**: MongoDB sharding for large deployments

### Monitoring at Scale
- **10-100 hosts**: Single backend + worker + database
- **100-1,000 hosts**: Load balanced backend, dedicated worker, replica set database
- **1,000+ hosts**: Microservices architecture, sharded database, message queue

## Disaster Recovery

### Backup Strategy
- **Database**: Daily backups with point-in-time recovery
- **Agent Config**: Stored in backend, downloadable by agents
- **Settings**: Versioned and backed up

### Agent Offline Behavior
- **Local Queue**: Agents buffer telemetry locally when offline
- **Retry Logic**: Exponential backoff
- **Data Limits**: Max 1000 events buffered locally

## Future Enhancements

1. **Machine Learning**: Anomaly detection for behavioral analysis
2. **Compliance Reports**: Automated GDPR/HIPAA compliance reporting
3. **Mobile Agents**: iOS/Android support
4. **Cloud Integration**: AWS/Azure/GCP resource monitoring
5. **Advanced Forensics**: Detailed timeline reconstruction
6. **Threat Intelligence**: Integration with threat feeds
7. **Custom Dashboards**: User-configurable views
8. **Export/Import**: Bulk data export for analysis

