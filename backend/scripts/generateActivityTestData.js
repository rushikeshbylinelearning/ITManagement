const mongoose = require('mongoose');
const UserActivityLog = require('../models/UserActivityLog');
const ActivityAlert = require('../models/ActivityAlert');
const User = require('../models/User');

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const sampleWebsites = [
  { url: 'https://github.com', title: 'GitHub', domain: 'github.com' },
  { url: 'https://stackoverflow.com', title: 'Stack Overflow', domain: 'stackoverflow.com' },
  { url: 'https://google.com', title: 'Google', domain: 'google.com' },
  { url: 'https://youtube.com', title: 'YouTube', domain: 'youtube.com' },
  { url: 'https://linkedin.com', title: 'LinkedIn', domain: 'linkedin.com' },
  { url: 'https://twitter.com', title: 'Twitter', domain: 'twitter.com' },
  { url: 'https://reddit.com', title: 'Reddit', domain: 'reddit.com' },
  { url: 'https://facebook.com', title: 'Facebook', domain: 'facebook.com' },
  { url: 'https://docs.google.com', title: 'Google Docs', domain: 'docs.google.com' },
  { url: 'https://slack.com', title: 'Slack', domain: 'slack.com' }
];

const sampleApps = [
  'chrome.exe',
  'code.exe',
  'outlook.exe',
  'teams.exe',
  'excel.exe',
  'word.exe',
  'slack.exe',
  'firefox.exe'
];

const sampleFiles = [
  { name: 'project_report.pdf', minSize: 1, maxSize: 10 },
  { name: 'presentation.pptx', minSize: 5, maxSize: 50 },
  { name: 'data_export.csv', minSize: 1, maxSize: 20 },
  { name: 'image.jpg', minSize: 2, maxSize: 15 },
  { name: 'backup.zip', minSize: 100, maxSize: 500 },
  { name: 'database.sql', minSize: 50, maxSize: 200 },
  { name: 'video.mp4', minSize: 100, maxSize: 1000 }
];

const transferMethods = ['USB', 'Network', 'Email', 'Cloud'];
const transferActions = ['Copy', 'Move', 'Upload', 'Download'];

const externalIPs = [
  { ip: '8.8.8.8', country: 'United States', city: 'Mountain View' },
  { ip: '1.1.1.1', country: 'Australia', city: 'Sydney' },
  { ip: '208.67.222.222', country: 'United States', city: 'San Francisco' },
  { ip: '185.228.168.9', country: 'Czech Republic', city: 'Prague' },
  { ip: '76.76.2.0', country: 'United States', city: 'Newark' }
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement(array) {
  return array[randomInt(0, array.length - 1)];
}

function generateWebsites(count = 5) {
  const websites = [];
  for (let i = 0; i < count; i++) {
    const site = randomElement(sampleWebsites);
    websites.push({
      url: site.url,
      title: site.title,
      domain: site.domain,
      duration: randomInt(60, 1800), // 1-30 minutes
      visitTime: new Date(Date.now() - randomInt(0, 3600000)) // Last hour
    });
  }
  return websites;
}

function generateApplications(count = 5) {
  const apps = [];
  for (let i = 0; i < count; i++) {
    const appName = randomElement(sampleApps);
    apps.push({
      appName,
      windowTitle: `${appName} - Document${i}`,
      processName: appName,
      isActive: i === 0 // First one is active
    });
  }
  return apps;
}

function generateFileTransfers(count = 2) {
  const transfers = [];
  for (let i = 0; i < count; i++) {
    const file = randomElement(sampleFiles);
    const sizeInMB = randomInt(file.minSize, file.maxSize);
    transfers.push({
      fileName: file.name,
      filePath: `C:\\Users\\Employee\\Documents\\${file.name}`,
      fileSize: sizeInMB * 1024 * 1024, // Convert to bytes
      target: 'External',
      method: randomElement(transferMethods),
      action: randomElement(transferActions),
      timestamp: new Date(Date.now() - randomInt(0, 3600000))
    });
  }
  return transfers;
}

function generateConnections(count = 5) {
  const connections = [];
  for (let i = 0; i < count; i++) {
    const ipInfo = randomElement(externalIPs);
    connections.push({
      remoteIP: ipInfo.ip,
      remotePort: randomInt(80, 65535),
      localPort: randomInt(1024, 65535),
      protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
      location: {
        country: ipInfo.country,
        city: ipInfo.city,
        coordinates: {
          lat: randomFloat(-90, 90),
          lng: randomFloat(-180, 180)
        }
      },
      connectionTime: new Date(Date.now() - randomInt(0, 3600000)),
      status: 'ESTABLISHED'
    });
  }
  return connections;
}

function generateLoggedAccounts() {
  const accounts = [];
  
  // Chrome account
  if (Math.random() > 0.3) {
    accounts.push({
      browser: 'Chrome',
      platform: 'Google',
      email: 'user@company.com',
      accountType: 'Browser Profile',
      loginTime: new Date()
    });
  }
  
  // Edge account
  if (Math.random() > 0.5) {
    accounts.push({
      browser: 'Edge',
      platform: 'Microsoft',
      email: 'user@company.com',
      accountType: 'Browser Profile',
      loginTime: new Date()
    });
  }
  
  // Outlook
  if (Math.random() > 0.4) {
    accounts.push({
      browser: 'Outlook',
      platform: 'Microsoft',
      email: 'user@company.com',
      accountType: 'Email',
      loginTime: new Date()
    });
  }
  
  return accounts;
}

async function generateActivityLogForUser(user, timestamp) {
  const uploadMB = randomFloat(5, 150);
  const downloadMB = randomFloat(10, 300);
  
  const log = new UserActivityLog({
    userId: user._id,
    userName: user.username,
    systemName: `${user.username.toUpperCase()}-PC`,
    timestamp,
    network: {
      uploadBytes: uploadMB * 1024 * 1024,
      downloadBytes: downloadMB * 1024 * 1024,
      uploadMB,
      downloadMB,
      totalMB: uploadMB + downloadMB,
      activeConnections: randomInt(5, 25)
    },
    websites: generateWebsites(randomInt(3, 8)),
    systemStatus: {
      cpuUsage: randomFloat(20, 80),
      memoryUsage: randomFloat(30, 75),
      memoryUsedMB: randomFloat(4000, 12000),
      memoryTotalMB: 16000,
      diskUsage: randomFloat(40, 80),
      uptime: randomInt(3600, 86400 * 7), // 1 hour to 7 days
      activeApps: randomInt(10, 30),
      idleTime: randomInt(0, 600),
      temperature: randomFloat(40, 70),
      batteryLevel: randomInt(20, 100)
    },
    applications: generateApplications(randomInt(3, 7)),
    fileTransfers: generateFileTransfers(randomInt(0, 3)),
    loggedAccounts: generateLoggedAccounts(),
    externalConnections: generateConnections(randomInt(3, 8)),
    agentVersion: '1.0.0',
    osVersion: 'Windows 10 Pro',
    reportInterval: 300
  });
  
  // Analyze and flag
  log.analyzeAndFlag();
  
  return log;
}

async function generateTestData() {
  try {
    console.log('🚀 Starting Activity Monitor Test Data Generation...\n');
    
    // Get all users (or create test users)
    const users = await User.find({ role: { $in: ['employee', 'technician'] } }).limit(5);
    
    if (users.length === 0) {
      console.log('❌ No employee/technician users found.');
      console.log('Please create some users first, or modify the script to create test users.');
      mongoose.connection.close();
      return;
    }
    
    console.log(`Found ${users.length} users to generate data for:\n`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });
    console.log('');
    
    let totalLogs = 0;
    let totalAlerts = 0;
    
    // Generate activity logs for each user
    for (const user of users) {
      console.log(`\n📊 Generating activity logs for ${user.username}...`);
      
      // Generate logs for the past 7 days (every 5 minutes = ~2000 logs per user)
      // Let's do 20 logs per user for testing (across 24 hours)
      const logsToGenerate = 20;
      
      for (let i = 0; i < logsToGenerate; i++) {
        // Spread logs across last 24 hours
        const timestamp = new Date(Date.now() - (i * 1.2 * 60 * 60 * 1000)); // ~1.2 hours apart
        
        const log = await generateActivityLogForUser(user, timestamp);
        await log.save();
        
        totalLogs++;
        
        // Generate alerts for high-risk logs
        if (log.riskScore > 60) {
          const alertType = log.flags.highBandwidth ? 'HIGH_BANDWIDTH' :
                           log.flags.largeFileTransfer ? 'LARGE_FILE_TRANSFER' :
                           log.flags.suspiciousActivity ? 'SUSPICIOUS_ACTIVITY' :
                           'POLICY_VIOLATION';
          
          const severity = log.riskScore > 80 ? 'CRITICAL' :
                          log.riskScore > 70 ? 'HIGH' :
                          'MEDIUM';
          
          const alert = new ActivityAlert({
            userId: user._id,
            userName: user.username,
            systemName: log.systemName,
            alertType,
            severity,
            title: `${alertType.replace(/_/g, ' ')} Detected`,
            description: `${user.username} has a risk score of ${log.riskScore} with suspicious activity patterns.`,
            relatedLogId: log._id,
            metadata: {
              riskScore: log.riskScore,
              bandwidthMB: log.network.totalMB
            },
            triggeredAt: timestamp,
            status: Math.random() > 0.7 ? 'ACKNOWLEDGED' : 'NEW'
          });
          
          await alert.save();
          totalAlerts++;
        }
        
        if ((i + 1) % 5 === 0) {
          console.log(`  Created ${i + 1}/${logsToGenerate} logs...`);
        }
      }
      
      console.log(`  ✅ Completed ${logsToGenerate} logs for ${user.username}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Data Generation Complete!\n');
    console.log(`📈 Summary:`);
    console.log(`  - Total Users: ${users.length}`);
    console.log(`  - Total Activity Logs: ${totalLogs}`);
    console.log(`  - Total Alerts Generated: ${totalAlerts}`);
    console.log('');
    console.log('🎯 You can now view this data in the Activity Monitor dashboard!');
    console.log('   Navigate to: http://localhost:5173/activity-monitor');
    console.log('');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
generateTestData();

