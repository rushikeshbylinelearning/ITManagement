# Zero-Touch Monitoring Deployment Checklist

## Pre-Deployment Checklist

### Backend Requirements
- [ ] Node.js 16+ installed
- [ ] MongoDB 4.4+ installed and running
- [ ] All npm dependencies installed (`cd backend && npm install`)
- [ ] `.env` file created and configured
- [ ] Agent binaries present in `backend/agent-binaries/`
- [ ] Backend starts without errors (`npm run dev`)

### Frontend Requirements
- [ ] Node.js 16+ installed
- [ ] All npm dependencies installed (`cd frontend && npm install`)
- [ ] `.env` file created with correct API URL
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Frontend can reach backend API

### Environment Variables

**Backend `.env`:**
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/it-management

# JWT Secrets
LOCAL_JWT_SECRET=<generate-with-crypto.randomBytes(64).toString('hex')>

# Monitoring
MONITORING_API_KEY=<generate-with-crypto.randomBytes(32).toString('hex')>

# URLs
FRONTEND_URL=http://localhost:5173  # Dev: 5173, Prod: your-domain
BACKEND_URL=http://localhost:5001   # Update for production
PORT=5001

# Optional: SSO Configuration
SSO_PORTAL_URL=https://sso.company.com
SSO_PUBLIC_KEY=<your-sso-public-key>
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5001/api  # Update for production
```

### Agent Binaries Check

Verify these files exist in `backend/agent-binaries/`:
- [ ] `monitoring_agent.py` (copied from `agent/monitoring_agent.py`)
- [ ] `requirements.txt` (copied from `agent/requirements.txt`)
- [ ] `monitoring_agent_installer.sh` (Linux installer)
- [ ] `monitoring_agent_installer_macos.sh` (macOS installer)
- [ ] `monitoring_agent_installer.ps1` (Windows installer)

**Quick copy command:**
```bash
# From project root
cp agent/monitoring_agent.py backend/agent-binaries/
cp agent/requirements.txt backend/agent-binaries/
```

## Testing Checklist

### Unit Tests
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] MongoDB connection works
- [ ] All routes respond correctly

### Integration Tests
- [ ] User can login
- [ ] AgentSetup dialog appears on first dashboard visit
- [ ] OS detection works correctly
- [ ] Token generation succeeds
- [ ] Download link includes OS parameter correctly
- [ ] Agent files can be downloaded from backend

### End-to-End Test
- [ ] Login to portal
- [ ] AgentSetup dialog appears
- [ ] Click "Download Agent"
- [ ] File downloads successfully
- [ ] Run agent installer (in test environment)
- [ ] Agent registers successfully
- [ ] Host appears in `/monitoring` dashboard
- [ ] Telemetry data appears
- [ ] Alerts are generated correctly

### Test with Simulator
- [ ] Run `node scripts/testAgentSimulator.js`
- [ ] Virtual hosts appear in dashboard
- [ ] Telemetry data flows correctly
- [ ] Alerts trigger appropriately
- [ ] Dashboard updates in real-time

## Common Issues & Fixes

### Issue: Download returns 404
**Fix:**
1. Check `backend/agent-binaries/` has all installer files
2. Check backend console for file path errors
3. Verify OS detection in browser console
4. Check download URL format: `/api/monitoring/agent/download/{os}?token=...`

### Issue: Agent token generation fails
**Fix:**
1. Verify user is logged in (check sessionStorage)
2. Check backend `.env` has `LOCAL_JWT_SECRET`
3. Check network tab for API errors
4. Clear browser cache and cookies

### Issue: Agent won't register
**Fix:**
1. Check token hasn't expired (5-minute limit)
2. Verify backend URL is reachable from agent
3. Check `MONITORING_API_KEY` matches in backend `.env` and agent will receive it
4. Review agent logs for specific errors

### Issue: MongoDB connection fails
**Fix:**
1. Ensure MongoDB is running: `systemctl status mongod` or `brew services list mongodb-community`
2. Check `MONGO_URI` in `.env`
3. Test connection: `mongo it-management`
4. Check firewall isn't blocking port 27017

### Issue: Frontend can't reach backend
**Fix:**
1. Verify backend is running on correct port
2. Check CORS configuration in `backend/server.js`
3. Verify `VITE_API_URL` in frontend `.env`
4. Check browser console for CORS errors

## Production Deployment Steps

### 1. Server Setup
```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
# Follow: https://www.mongodb.com/docs/manual/installation/

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Deploy Backend
```bash
# Clone/upload your code
cd /opt/it-management/backend

# Install dependencies
npm install --production

# Create .env with production values
cp env.template .env
nano .env  # Edit with production values

# Start with PM2
pm2 start server.js --name it-management-backend
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### 3. Deploy Frontend
```bash
cd /opt/it-management/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx (recommended) or copy dist/ to web server
sudo cp -r dist/* /var/www/html/it-management/
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/it-management
```

```nginx
server {
    listen 80;
    server_name itmanagement.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name itmanagement.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/itmanagement.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itmanagement.yourdomain.com/privkey.pem;

    root /var/www/html/it-management;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/it-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d itmanagement.yourdomain.com
```

### 6. Firewall Configuration
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 7. MongoDB Security
```bash
# Enable authentication
sudo nano /etc/mongod.conf
# Add:
# security:
#   authorization: enabled

sudo systemctl restart mongod

# Create admin and app users
mongo
> use admin
> db.createUser({user: "admin", pwd: "strong-password", roles: ["root"]})
> use it-management
> db.createUser({user: "itapp", pwd: "strong-password", roles: [{role: "readWrite", db: "it-management"}]})

# Update MONGO_URI in .env
MONGO_URI=mongodb://itapp:strong-password@localhost:27017/it-management
```

### 8. Monitoring & Logs
```bash
# View backend logs
pm2 logs it-management-backend

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Check service status
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod
```

## Post-Deployment Validation

### Smoke Tests
- [ ] Access web portal via HTTPS
- [ ] Login with test account
- [ ] AgentSetup dialog appears
- [ ] Download agent installer
- [ ] Install agent on test machine
- [ ] Verify host appears in monitoring dashboard
- [ ] Check telemetry is flowing
- [ ] Trigger test alert
- [ ] Verify alert appears and can be acknowledged/resolved

### Performance Tests
- [ ] Monitor CPU/RAM usage under load
- [ ] Check MongoDB query performance
- [ ] Verify Socket.IO connections scale
- [ ] Test with 10+ simultaneous agents
- [ ] Monitor network bandwidth usage

### Security Audit
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] JWT secrets are strong and unique
- [ ] MongoDB authentication enabled
- [ ] Firewall rules restrict access
- [ ] Agent API keys are unique and secure
- [ ] No sensitive data in logs
- [ ] CORS properly configured
- [ ] Rate limiting active

## Rollback Plan

If deployment fails:
1. Stop PM2 service: `pm2 stop it-management-backend`
2. Restore previous MongoDB backup: `mongorestore /backup/mongodb/latest`
3. Revert nginx configuration: `sudo rm /etc/nginx/sites-enabled/it-management`
4. Restore previous code version
5. Restart services

## Maintenance Schedule

### Daily
- Monitor error logs
- Check disk space
- Verify all agents are reporting

### Weekly
- Review performance metrics
- Check for failed agent registrations
- Review unresolved alerts

### Monthly
- Update dependencies (`npm outdated`)
- MongoDB backup verification
- Security updates
- Review and archive old telemetry data

## Support Contact

For deployment issues:
- Check comprehensive docs: `ZERO_TOUCH_MONITORING_README.md`
- Quick start guide: `MONITORING_QUICK_START_GUIDE.md`
- Backend logs: `pm2 logs it-management-backend`
- Frontend errors: Browser Developer Console (F12)

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Production URL:** _________________

**Notes:** _________________




