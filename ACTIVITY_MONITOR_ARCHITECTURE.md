# Activity Monitor - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    IT MANAGEMENT APPLICATION                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   FRONTEND (React)                         │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │        Activity Monitor Dashboard                    │ │ │
│  │  │  /activity-monitor                                   │ │ │
│  │  │                                                       │ │ │
│  │  │  [Overview] [Network] [Websites] [System Health]   │ │ │
│  │  │  [Files] [Connections] [Live] [Alerts]             │ │ │
│  │  │                                                       │ │ │
│  │  │  📊 Charts (Recharts)                               │ │ │
│  │  │  📋 Tables (Sortable/Filterable)                    │ │ │
│  │  │  🔄 Auto-refresh (30s)                              │ │ │
│  │  │  🎨 Modern UI/UX                                     │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                          │                                 │ │
│  │                          │ REST API Calls                  │ │
│  │                          │ (JWT Auth)                      │ │
│  └──────────────────────────┼─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │                   BACKEND (Node.js + Express)            │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  API Routes: /api/activity-monitor                 │  │ │
│  │  │                                                     │  │ │
│  │  │  Agent Endpoints:                                  │  │ │
│  │  │  • POST /upload         (Receive activity data)    │  │ │
│  │  │  • POST /heartbeat      (Agent health check)       │  │ │
│  │  │                                                     │  │ │
│  │  │  Admin Endpoints:                                  │  │ │
│  │  │  • GET  /summary        (Dashboard stats)          │  │ │
│  │  │  • GET  /logs           (Activity logs)            │  │ │
│  │  │  • GET  /network-usage  (Bandwidth stats)          │  │ │
│  │  │  • GET  /websites       (Browsing history)         │  │ │
│  │  │  • GET  /file-transfers (File activity)            │  │ │
│  │  │  • GET  /connections    (External IPs)             │  │ │
│  │  │  • GET  /alerts         (Security alerts)          │  │ │
│  │  │  • GET  /live           (Real-time stream)         │  │ │
│  │  │  • PUT  /alerts/:id/*   (Alert management)         │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                          │                                 │ │
│  │  ┌────────────────────────▼─────────────────────────────┐ │ │
│  │  │        Background Worker (ActivityAnalyzer)         │ │ │
│  │  │                                                      │ │ │
│  │  │  Runs every 10 minutes:                             │ │ │
│  │  │  • Analyze recent activity                          │ │ │
│  │  │  • Detect anomalies                                 │ │ │
│  │  │  • Generate alerts                                  │ │ │
│  │  │  • Aggregate statistics                             │ │ │
│  │  │  • Cleanup old data (30+ days)                      │ │ │
│  │  │                                                      │ │ │
│  │  │  Anomaly Detection:                                 │ │ │
│  │  │  ✓ High bandwidth (>500 MB)                         │ │ │
│  │  │  ✓ Multiple logins (>3 accounts)                    │ │ │
│  │  │  ✓ Large files (>100 MB)                            │ │ │
│  │  │  ✓ Unusual connections (>10 IPs)                    │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                          │                                 │ │
│  └──────────────────────────┼─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │                   DATABASE (MongoDB)                       │ │
│  │                                                            │ │
│  │  Collections:                                             │ │
│  │  • user_activity_logs    (30-day retention)               │ │
│  │  • activity_alerts       (60-day for resolved)            │ │
│  │  • daily_activity_stats  (aggregated summaries)           │ │
│  │  • agenttokens          (agent authentication)            │ │
│  │                                                            │ │
│  │  Indexes:                                                 │ │
│  │  • userId + timestamp                                     │ │
│  │  • riskScore                                              │ │
│  │  • flags.suspiciousActivity                               │ │
│  │  • TTL index for auto-cleanup                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                             ▲                                    │
│                             │                                    │
│                             │ HTTPS + Token Auth                │
│                             │                                    │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────▼────────┐                       ┌──────────▼──────────┐
│  EMPLOYEE PC 1  │                       │  EMPLOYEE PC N     │
│                │                       │                    │
│  ┌──────────────────────────────────┐ │  ┌────────────────────────────────┐
│  │  Activity Monitor Agent          │ │  │  Activity Monitor Agent        │
│  │  (Python Windows Service)        │ │  │  (Python Windows Service)      │
│  │                                  │ │  │                                │
│  │  Data Collectors:                │ │  │  Data Collectors:              │
│  │  ✓ Network Usage                 │ │  │  ✓ Network Usage               │
│  │    • Bandwidth tracking          │ │  │    • Bandwidth tracking        │
│  │    • Connection counting         │ │  │    • Connection counting       │
│  │                                  │ │  │                                │
│  │  ✓ Browser History               │ │  │  ✓ Browser History             │
│  │    • Chrome SQLite DB            │ │  │    • Chrome SQLite DB          │
│  │    • Edge SQLite DB              │ │  │    • Edge SQLite DB            │
│  │                                  │ │  │                                │
│  │  ✓ System Status                 │ │  │  ✓ System Status               │
│  │    • CPU/Memory/Disk             │ │  │    • CPU/Memory/Disk           │
│  │    • Uptime & idle time          │ │  │    • Uptime & idle time        │
│  │                                  │ │  │                                │
│  │  ✓ Applications                  │ │  │  ✓ Applications                │
│  │    • Active windows              │ │  │    • Active windows            │
│  │    • Process list                │ │  │    • Process list              │
│  │                                  │ │  │                                │
│  │  ✓ File Transfers                │ │  │  ✓ File Transfers              │
│  │    • USB monitoring              │ │  │    • USB monitoring            │
│  │    • Network shares              │ │  │    • Network shares            │
│  │                                  │ │  │                                │
│  │  ✓ Logged Accounts               │ │  │  ✓ Logged Accounts             │
│  │    • Browser profiles            │ │  │    • Browser profiles          │
│  │    • Outlook (registry)          │ │  │    • Outlook (registry)        │
│  │                                  │ │  │                                │
│  │  ✓ External Connections          │ │  │  ✓ External Connections        │
│  │    • TCP/UDP monitoring          │ │  │    • TCP/UDP monitoring        │
│  │    • GeoIP lookup                │ │  │    • GeoIP lookup              │
│  │                                  │ │  │                                │
│  │  Features:                       │ │  │  Features:                     │
│  │  • Report every 5 min            │ │  │  • Report every 5 min          │
│  │  • Offline caching               │ │  │  • Offline caching             │
│  │  • Heartbeat mechanism           │ │  │  • Heartbeat mechanism         │
│  │  • Auto-retry on failure         │ │  │  • Auto-retry on failure       │
│  └──────────────────────────────────┘ │  └────────────────────────────────┘
└────────────────┘                       └─────────────────────┘
```

---

## 🔄 Data Flow

### 1. Agent Collection & Upload Flow

```
Employee PC Agent
       │
       ├─[Every 5 minutes]─────────────────────┐
       │                                       │
       ▼                                       ▼
  Collect Data:                         Cache Locally
  • Network stats                       (if offline)
  • Browser history                          │
  • System status                            │
  • File activity                       activity_cache.json
  • Connections                              │
       │                                     │
       ▼                                     │
  Create JSON Payload                        │
       │                                     │
       ▼                                     │
  POST /api/activity-monitor/upload ◄────────┘
  Headers: X-Agent-Token                (retry when online)
       │
       ▼
  Backend Validation
       │
       ├─ Authenticate token
       ├─ Validate user exists
       └─ Check required fields
       │
       ▼
  Create UserActivityLog
       │
       ├─ Save to MongoDB
       ├─ Analyze & flag anomalies
       └─ Calculate risk score
       │
       ▼
  Generate Alerts (if needed)
       │
       └─ ActivityAlert saved to DB
```

### 2. Background Analysis Flow

```
ActivityAnalyzer Worker
       │
       ├─[Every 10 minutes]──────────────────┐
       │                                     │
       ▼                                     ▼
  Analyze Recent Activity            Detect Anomalies
  (last 30 minutes)                  (last hour)
       │                                     │
       ├─ Get unanalyzed logs               ├─ Group by user
       ├─ Calculate risk scores             ├─ Check thresholds:
       └─ Flag suspicious patterns          │   • Bandwidth > 2GB
       │                                    │   • File transfers > 20
       ▼                                    │   • Connections > 50
  Update Flags & Risk Scores                │
       │                                    ▼
       │                              Create Alerts
       │                              (if threshold exceeded)
       │                                    │
       ├────────────────────────────────────┤
       │                                    │
       ▼                                    ▼
  Aggregate Daily Stats            Cleanup Old Data
  (for reporting)                  (>30 days)
       │                                    │
       └────────────────┬───────────────────┘
                        │
                        ▼
                 Save to MongoDB
```

### 3. Dashboard Display Flow

```
Admin User
       │
       ▼
  Navigate to /activity-monitor
       │
       ▼
  Load Dashboard (React)
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
  GET /summary            GET /alerts
       │                         │
       ▼                         ▼
  Backend aggregates      Backend fetches
  statistics              active alerts
       │                         │
       ▼                         ▼
  Return JSON             Return JSON
       │                         │
       ├─────────────────────────┤
       │                         │
       ▼                         ▼
  Display Overview Cards   Display Alerts
       │
       ├─[User switches tab]─────┐
       │                         │
       ▼                         ▼
  GET /network-usage      GET /websites
       │                         │
       ▼                         ▼
  Render charts           Render tables
       │
       ├─[Auto-refresh every 30s]
       │
       ▼
  GET /live
       │
       ▼
  Update activity stream
```

---

## 🔐 Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Security Layers                       │
└──────────────────────────────────────────────────────────┘

Layer 1: Transport Security
─────────────────────────────
  HTTPS/TLS 1.2+
  • Encrypted data in transit
  • Certificate validation
  • Secure headers (helmet.js)

Layer 2: Authentication
─────────────────────────────
  Agent Authentication:
  • X-Agent-Token header
  • Token stored in AgentToken model
  • Per-agent unique tokens
  
  Admin Authentication:
  • JWT Bearer token
  • Session management
  • Token expiration

Layer 3: Authorization
─────────────────────────────
  Role-Based Access Control:
  • Admin-only dashboard access
  • Agent-only upload endpoints
  • User data isolation

Layer 4: Data Protection
─────────────────────────────
  Privacy Measures:
  • No passwords collected
  • No keystroke logging
  • No screenshots
  • Read-only browser access
  
  Data Retention:
  • Auto-delete after 30 days
  • Configurable policies
  • Secure deletion

Layer 5: Input Validation
─────────────────────────────
  Backend Validation:
  • Required field checks
  • Data type validation
  • User existence verification
  • Token validation
  
  MongoDB Security:
  • NoSQL injection prevention (mongoSanitize)
  • Schema validation
  • Index protection
```

---

## 📊 Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                  user_activity_logs                     │
├─────────────────────────────────────────────────────────┤
│ _id               : ObjectId                            │
│ userId            : ObjectId → users                    │
│ userName          : String                              │
│ systemName        : String                              │
│ timestamp         : Date (indexed)                      │
│ agentId           : String                              │
│                                                         │
│ network           : {                                   │
│   uploadBytes     : Number                              │
│   downloadBytes   : Number                              │
│   uploadMB        : Number                              │
│   downloadMB      : Number                              │
│   totalMB         : Number                              │
│   activeConnections: Number                             │
│ }                                                       │
│                                                         │
│ websites          : [{                                  │
│   url             : String                              │
│   title           : String                              │
│   domain          : String                              │
│   duration        : Number                              │
│   visitTime       : Date                                │
│ }]                                                      │
│                                                         │
│ systemStatus      : {                                   │
│   cpuUsage        : Number (0-100)                      │
│   memoryUsage     : Number (0-100)                      │
│   diskUsage       : Number (0-100)                      │
│   uptime          : Number (seconds)                    │
│   idleTime        : Number (seconds)                    │
│   activeApps      : Number                              │
│ }                                                       │
│                                                         │
│ applications      : [{ appName, windowTitle, ... }]     │
│ fileTransfers     : [{ fileName, size, method, ... }]   │
│ loggedAccounts    : [{ browser, email, ... }]           │
│ externalConnections: [{ remoteIP, location, ... }]      │
│                                                         │
│ flags             : {                                   │
│   highBandwidth        : Boolean                        │
│   suspiciousActivity   : Boolean                        │
│   multipleLogins       : Boolean                        │
│   largeFileTransfer    : Boolean                        │
│ }                                                       │
│                                                         │
│ riskScore         : Number (0-100)                      │
│ analysisNotes     : [String]                            │
│                                                         │
│ createdAt         : Date (TTL: 30 days)                 │
│ updatedAt         : Date                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    activity_alerts                      │
├─────────────────────────────────────────────────────────┤
│ _id               : ObjectId                            │
│ userId            : ObjectId → users                    │
│ userName          : String                              │
│ systemName        : String                              │
│                                                         │
│ alertType         : String (enum)                       │
│   • HIGH_BANDWIDTH                                      │
│   • SUSPICIOUS_ACTIVITY                                 │
│   • LARGE_FILE_TRANSFER                                 │
│   • MULTIPLE_LOGINS                                     │
│   • UNUSUAL_CONNECTION                                  │
│   • POLICY_VIOLATION                                    │
│                                                         │
│ severity          : String (enum)                       │
│   • LOW / MEDIUM / HIGH / CRITICAL                      │
│                                                         │
│ title             : String                              │
│ description       : String                              │
│                                                         │
│ status            : String (enum)                       │
│   • NEW / ACKNOWLEDGED / RESOLVED / DISMISSED           │
│                                                         │
│ relatedLogId      : ObjectId → user_activity_logs       │
│ metadata          : Object (alert-specific data)        │
│                                                         │
│ acknowledgedBy    : ObjectId → users                    │
│ acknowledgedAt    : Date                                │
│ resolvedBy        : ObjectId → users                    │
│ resolvedAt        : Date                                │
│ resolution        : String                              │
│                                                         │
│ notes             : [{                                  │
│   addedBy         : ObjectId → users                    │
│   content         : String                              │
│   timestamp       : Date                                │
│ }]                                                      │
│                                                         │
│ triggeredAt       : Date (indexed)                      │
│ createdAt         : Date                                │
│ updatedAt         : Date                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Interaction Matrix

```
┌──────────────┬──────────┬──────────┬──────────┬──────────┐
│ Component    │ Agent    │ Backend  │ Worker   │ Frontend │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Agent        │    -     │   HTTPS  │    -     │    -     │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Backend      │  Token   │    -     │ Internal │   JWT    │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Worker       │    -     │ MongoDB  │    -     │    -     │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Frontend     │    -     │   REST   │    -     │    -     │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ MongoDB      │  Write   │ Read/Write│ Read/Write│  Read  │
└──────────────┴──────────┴──────────┴──────────┴──────────┘

Legend:
  - : No direct interaction
  HTTPS : Secure HTTP communication
  Token : Agent token authentication
  JWT : JSON Web Token authentication
  REST : RESTful API calls
  Internal : Direct function calls
  Read/Write : Database operations
```

---

## 🚀 Deployment Architecture

```
Production Environment
─────────────────────

┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│                    (NGINX / AWS ALB)                    │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│  Frontend      │         │  Backend        │
│  (Static)      │         │  (Node.js)      │
│                │         │                 │
│  • Nginx       │         │  • Express      │
│  • React build │         │  • PM2/cluster  │
│  • Gzip        │         │  • Worker       │
└────────────────┘         └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │  MongoDB        │
                           │  (Replica Set)  │
                           │                 │
                           │  • Primary      │
                           │  • Secondary    │
                           │  • Arbiter      │
                           └─────────────────┘

Agent Deployment
─────────────────

┌─────────────────────────────────────────────────────────┐
│           Group Policy / MDM / SCCM                     │
│                                                         │
│  • MSI package distribution                             │
│  • Automated installation                               │
│  • Centralized configuration                            │
│  • Remote management                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┬─────────────┐
        │                           │             │
┌───────▼────────┐         ┌────────▼────────┐   │
│  Employee PC 1  │         │  Employee PC 2  │  ...
│                │         │                 │
│  Agent Service │         │  Agent Service  │
└────────────────┘         └─────────────────┘
```

---

**This architecture provides**:
- ✅ Scalability (horizontal scaling)
- ✅ High availability (load balancing)
- ✅ Security (multi-layer defense)
- ✅ Performance (caching, indexing)
- ✅ Reliability (offline caching, retry logic)
- ✅ Maintainability (modular design)

---

**Version**: 1.0.0  
**Last Updated**: October 8, 2025

