# Zero-Touch Monitoring - Quick Start Guide

## For Developers

### Prerequisites

- Node.js 16+ and npm
- MongoDB 4.4+
- Python 3.7+ (for agent development/testing)

### Setup Steps

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp env.template .env

# Edit .env and set:
MONGO_URI=mongodb://localhost:27017/it-management
LOCAL_JWT_SECRET=your-secret-key-here
MONITORING_API_KEY=your-monitoring-api-key-change-me
FRONTEND_URL=http://localhost:5173
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp env.template .env

# Edit .env and set:
VITE_API_URL=http://localhost:5001/api
```

#### 3. Agent Binaries Setup

```bash
cd backend/agent-binaries

# Make package script executable (Linux/Mac)
chmod +x package_agent.sh

# Run packaging script
./package_agent.sh  # Linux/Mac
# Or manually copy files from agent/ directory
```

#### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Test Agent Simulator (Optional):**
```bash
cd backend
node scripts/testAgentSimulator.js
```

### Testing the Zero-Touch Flow

1. **Open Browser**: Navigate to `http://localhost:5173`

2. **Login**: Use existing credentials or register new user

3. **Agent Setup Dialog**: Should appear automatically on dashboard
   - If not, clear browser sessionStorage and refresh

4. **Download Agent**: Click download (will try to download from backend)
   - Note: Agent binaries must be present in `backend/agent-binaries/`

5. **Install Agent**: 
   - **Development Tip**: Instead of installing, run agent directly:
   ```bash
   cd agent
   python3 monitoring_agent.py
   ```
   - Make sure to edit `config.json` with:
     - `registration_token`: Get from browser console after clicking download
     - `registration_url`: `http://localhost:5001/api/monitoring/register`
     - `backend_url`: `http://localhost:5001/api/monitoring/events`

6. **Verify Registration**:
   - Check backend console for registration log
   - Go to `/monitoring` in frontend
   - Should see host appear with "online" status

7. **View Telemetry**:
   - Click on host to view details
   - See processes, file events, network usage
   - Wait for alerts to be generated (high CPU, etc.)

### Using the Test Simulator

The test simulator creates virtual agents without requiring actual installation:

```bash
cd backend

# Set environment variables (optional)
export BACKEND_URL=http://localhost:5001/api/monitoring
export MONITORING_API_KEY=your-api-key
export NUM_AGENTS=3
export SEND_INTERVAL=10

# Run simulator
node scripts/testAgentSimulator.js
```

This will:
- Create 3 virtual hosts (test-host-1, test-host-2, test-host-3)
- Send realistic telemetry every 10 seconds
- Randomly trigger alerts (high CPU, bulk deletion, high network)

## For System Administrators

### Production Deployment

#### 1. Backend Deployment

```bash
# Install PM2 (process manager)
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start server.js --name it-management-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 2. Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# Serve using nginx, Apache, or any static server
# dist/ folder contains the production build
```

**Example nginx configuration:**
```nginx
server {
    listen 80;
    server_name itmanagement.company.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name itmanagement.company.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    root /var/www/it-management/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 3. MongoDB Setup

**Production Best Practices:**

```bash
# Enable authentication
mongod --auth

# Create admin user
mongo admin
> db.createUser({
    user: "admin",
    pwd: "secure-password",
    roles: ["root"]
  })

# Create application database and user
mongo it-management
> db.createUser({
    user: "itapp",
    pwd: "secure-password",
    roles: [{ role: "readWrite", db: "it-management" }]
  })

# Update .env with authenticated connection string
MONGO_URI=mongodb://itapp:secure-password@localhost:27017/it-management?authSource=it-management
```

#### 4. Security Hardening

1. **Generate Strong Secrets**:
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Monitoring API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Enable HTTPS**: Use Let's Encrypt for free SSL certificates
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d itmanagement.company.com
```

3. **Firewall Configuration**:
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirects to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

4. **Environment Variables**: Never commit `.env` files
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env" >> .gitignore
```

### Agent Distribution

#### Option 1: Web Portal Download (Recommended)

Users download agents directly from the web portal after login. Files are served from:
```
backend/agent-binaries/
├── monitoring_agent.py
├── monitoring_agent_installer.sh (Linux)
├── monitoring_agent_installer_macos.sh (macOS)
└── monitoring_agent_installer.ps1 (Windows)
```

**Ensure these files are present** before deploying to production.

#### Option 2: Group Policy (Windows Enterprise)

For Windows domains, deploy via Group Policy:

1. Create MSI installer using WiX Toolset
2. Deploy via GPO
3. Pre-configure with company backend URLs
4. Use central token generation for batch deployment

#### Option 3: Configuration Management (Ansible, Chef, Puppet)

**Example Ansible Playbook:**
```yaml
---
- name: Deploy IT Monitoring Agent
  hosts: all
  become: yes
  vars:
    backend_url: "https://itmanagement.company.com/api/monitoring/events"
    registration_url: "https://itmanagement.company.com/api/monitoring/register"
    
  tasks:
    - name: Install Python 3 and pip
      package:
        name: 
          - python3
          - python3-pip
        state: present
        
    - name: Download agent script
      get_url:
        url: "{{ registration_url }}/../../agent/monitoring_agent.py"
        dest: /opt/it-monitoring-agent/monitoring_agent.py
        mode: '0755'
        
    - name: Install Python dependencies
      pip:
        name:
          - psutil>=5.9.0
          - requests>=2.28.0
          - watchdog>=2.1.9
        state: present
        
    - name: Generate registration token
      uri:
        url: "{{ registration_url }}/../auth/agent-token"
        method: POST
        headers:
          Authorization: "Bearer {{ admin_jwt_token }}"
        return_content: yes
      register: token_response
      
    - name: Create agent configuration
      template:
        src: config.json.j2
        dest: /opt/it-monitoring-agent/config.json
        mode: '0600'
        
    - name: Create systemd service
      copy:
        dest: /etc/systemd/system/it-monitoring-agent.service
        content: |
          [Unit]
          Description=IT Management Monitoring Agent
          After=network.target
          
          [Service]
          Type=simple
          User=root
          WorkingDirectory=/opt/it-monitoring-agent
          ExecStart=/usr/bin/python3 /opt/it-monitoring-agent/monitoring_agent.py
          Restart=always
          RestartSec=10
          
          [Install]
          WantedBy=multi-user.target
          
    - name: Enable and start service
      systemd:
        name: it-monitoring-agent
        enabled: yes
        state: started
        daemon_reload: yes
```

### Monitoring and Maintenance

#### Health Checks

**Backend Health**:
```bash
curl http://localhost:5001/api/monitoring/stats
```

**Database Health**:
```bash
mongo it-management --eval "db.stats()"
```

**Agent Service Health**:
```bash
# Check all registered hosts
curl -H "Cookie: it_app_token=YOUR_JWT" \
     http://localhost:5001/api/monitoring/hosts
```

#### Log Monitoring

**Backend Logs** (with PM2):
```bash
pm2 logs it-management-backend
pm2 logs it-management-backend --lines 1000
```

**MongoDB Logs**:
```bash
tail -f /var/log/mongodb/mongod.log
```

#### Backup Strategy

**Database Backups**:
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --db it-management --out /backup/mongodb/$DATE
tar -czf /backup/mongodb/$DATE.tar.gz /backup/mongodb/$DATE
rm -rf /backup/mongodb/$DATE

# Keep last 30 days
find /backup/mongodb -name "*.tar.gz" -mtime +30 -delete
```

**Agent Configuration Backups**:
Keep backup of `backend/agent-binaries/` and Python agent source in version control.

### Scaling Considerations

#### Horizontal Scaling

For large deployments (1000+ endpoints):

1. **Load Balancer**: Use nginx/HAProxy for backend
2. **MongoDB Replica Set**: For high availability
3. **Redis**: For session storage and caching
4. **Message Queue**: Use RabbitMQ for telemetry ingestion

**Architecture for Scale:**
```
               ┌──────────────┐
               │ Load Balancer│
               └───────┬──────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌────▼────┐  ┌────▼────┐
    │Backend 1│   │Backend 2│  │Backend 3│
    └────┬────┘   └────┬────┘  └────┬────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
              ┌────────▼────────┐
              │  Message Queue  │
              │   (RabbitMQ)    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Telemetry      │
              │  Processor      │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  MongoDB        │
              │  Replica Set    │
              └─────────────────┘
```

## Troubleshooting Common Issues

### Issue: Agent downloads but won't install

**Cause**: Python dependencies missing or Python version too old

**Solution**:
```bash
# Check Python version
python3 --version  # Should be 3.7+

# Install dependencies manually
pip3 install psutil requests watchdog
```

### Issue: Registration token expired

**Cause**: Token expires after 5 minutes

**Solution**:
1. Generate new token from web portal
2. Update agent `config.json` manually
3. Restart agent

### Issue: High database storage usage

**Cause**: Telemetry data accumulating

**Solution**:
```javascript
// Already implemented: TTL indexes auto-delete old data
// Network data: 15 days
// Process/File events: 30 days

// Manually clean if needed:
db.networkusages.deleteMany({ createdAt: { $lt: new Date(Date.now() - 15*24*60*60*1000) }})
db.processevents.deleteMany({ createdAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) }})
db.fileevents.deleteMany({ createdAt: { $lt: new Date(Date.now() - 30*24*60*60*1000) }})
```

### Issue: Socket.IO connection issues

**Cause**: Reverse proxy not configured for WebSockets

**Solution**: Update nginx/Apache configuration:
```nginx
location /socket.io {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Support and Contact

For issues or questions:
- Review comprehensive documentation: `ZERO_TOUCH_MONITORING_README.md`
- Check logs (backend, agent, database)
- Use test simulator to isolate issues
- Contact IT Support with agent ID and hostname

---

**Quick Reference Card**

| Task | Command |
|------|---------|
| Start Backend Dev | `cd backend && npm run dev` |
| Start Frontend Dev | `cd frontend && npm run dev` |
| Run Test Simulator | `cd backend && node scripts/testAgentSimulator.js` |
| Check Agent (Linux) | `sudo systemctl status it-monitoring-agent` |
| View Agent Logs (Linux) | `sudo journalctl -u it-monitoring-agent -f` |
| Restart Agent (Linux) | `sudo systemctl restart it-monitoring-agent` |
| MongoDB Console | `mongo it-management` |
| Backend Logs (PM2) | `pm2 logs it-management-backend` |
| Generate Secrets | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |




