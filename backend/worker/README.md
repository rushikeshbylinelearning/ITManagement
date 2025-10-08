# Computer Monitoring Enrichment Worker

This background worker processes telemetry data and performs enrichment tasks:

## Features

1. **Reverse DNS Lookup**: Resolves IP addresses to domain names
2. **Domain Normalization**: Cleans and standardizes domain names
3. **User Correlation**: Maps OS usernames to database User IDs
4. **Bandwidth Aggregation**: Creates summary statistics for reporting
5. **Data Retention**: Automatically deletes expired data based on settings

## Running the Worker

### Development
```bash
cd backend/worker
npm install
npm run dev
```

### Production
```bash
cd backend/worker
npm install
npm start
```

### As a System Service (Linux)

Create `/etc/systemd/system/monitoring-worker.service`:

```ini
[Unit]
Description=IT Monitoring Enrichment Worker
After=network.target mongod.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend/worker
ExecStart=/usr/bin/node enrichmentWorker.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitoring-worker
sudo systemctl start monitoring-worker
sudo systemctl status monitoring-worker
```

## Configuration

The worker uses the same `.env` file as the main backend:

```env
MONGO_URI=mongodb://localhost:27017/it-management
```

## Task Schedule

- **Enrichment** (reverse DNS, normalization, correlation): Every 5 minutes
- **Aggregation** (bandwidth stats): Every 15 minutes
- **Cleanup** (expired data): Every hour

## Monitoring the Worker

View logs:
```bash
# If running as service
sudo journalctl -u monitoring-worker -f

# If running directly
# Check console output
```

## Extending the Worker

To add new enrichment tasks:

1. Create a new async function in `enrichmentWorker.js`
2. Add it to the main `runWorker()` function
3. Schedule it with `setInterval()` as needed

Example:
```javascript
async function myCustomEnrichment() {
  // Your enrichment logic here
}

// In runWorker():
setInterval(async () => {
  await myCustomEnrichment();
}, 10 * 60 * 1000); // Every 10 minutes
```

