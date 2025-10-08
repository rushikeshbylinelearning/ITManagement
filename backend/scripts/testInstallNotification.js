/**
 * Test Script for Installation Notification Endpoint
 * 
 * This script simulates the MSI installer sending an installation notification
 * to the backend server.
 * 
 * Usage:
 *   node testInstallNotification.js [backend-url]
 * 
 * Example:
 *   node testInstallNotification.js http://localhost:5001
 */

const http = require('http');
const https = require('https');
const url = require('url');
const os = require('os');

// Configuration
const BACKEND_URL = process.argv[2] || 'http://localhost:5001';
const ENDPOINT = '/api/monitoring/agent/install-notify';

console.log('='.repeat(60));
console.log('IT Monitoring Agent - Installation Notification Test');
console.log('='.repeat(60));
console.log('');

// Prepare test data
const testData = {
  hostname: os.hostname(),
  username: os.userInfo().username,
  status: 'installed',
  timestamp: new Date().toISOString(),
  os: os.platform(),
  os_version: os.release(),
  installer_version: '1.0.0'
};

console.log('Test Data:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

// Parse backend URL
const backendUrl = url.parse(BACKEND_URL);
const fullUrl = `${BACKEND_URL}${ENDPOINT}`;

console.log(`Target Endpoint: ${fullUrl}`);
console.log('');

// Prepare request options
const options = {
  hostname: backendUrl.hostname,
  port: backendUrl.port || (backendUrl.protocol === 'https:' ? 443 : 80),
  path: ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ITMonitoringAgent-Test/1.0'
  }
};

const postData = JSON.stringify(testData);

// Select HTTP or HTTPS based on protocol
const protocol = backendUrl.protocol === 'https:' ? https : http;

console.log('Sending installation notification...');
console.log('');

// Send request
const req = protocol.request(options, (res) => {
  console.log(`Response Status: ${res.statusCode}`);
  console.log(`Response Headers:`);
  console.log(JSON.stringify(res.headers, null, 2));
  console.log('');

  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const jsonResponse = JSON.parse(responseBody);
      console.log(JSON.stringify(jsonResponse, null, 2));
      console.log('');

      if (res.statusCode === 200 && jsonResponse.success) {
        console.log('='.repeat(60));
        console.log('✅ TEST PASSED - Installation notification successful!');
        console.log('='.repeat(60));
        console.log('');
        console.log(`Host ID: ${jsonResponse.hostId}`);
        console.log(`Hostname: ${jsonResponse.hostname}`);
        console.log(`Next Step: ${jsonResponse.next_step}`);
        console.log('');
        process.exit(0);
      } else {
        console.log('='.repeat(60));
        console.log('❌ TEST FAILED - Backend returned error');
        console.log('='.repeat(60));
        console.log('');
        console.log(`Message: ${jsonResponse.msg || 'Unknown error'}`);
        console.log('');
        process.exit(1);
      }
    } catch (e) {
      console.log(responseBody);
      console.log('');
      console.log('='.repeat(60));
      console.log('❌ TEST FAILED - Invalid JSON response');
      console.log('='.repeat(60));
      console.log('');
      console.log(`Error: ${e.message}`);
      console.log('');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.log('='.repeat(60));
  console.log('❌ TEST FAILED - Network error');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Error: ${e.message}`);
  console.log('');
  console.log('Possible causes:');
  console.log('  - Backend server is not running');
  console.log('  - Incorrect backend URL');
  console.log('  - Firewall blocking connection');
  console.log('  - Network connectivity issues');
  console.log('');
  process.exit(1);
});

// Write data to request body
req.write(postData);
req.end();


