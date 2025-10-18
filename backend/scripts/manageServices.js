const { exec } = require('child_process');
const fs = require('fs');

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function manageServices() {
  const action = process.argv[2];
  
  if (!action) {
    console.log('🔧 Service Management Script');
    console.log('Usage: node manageServices.js [start|stop|status|test]');
    console.log('');
    console.log('Commands:');
    console.log('  start  - Start all services');
    console.log('  stop   - Stop all services');
    console.log('  status - Check service status');
    console.log('  test   - Test all services');
    return;
  }

  switch (action) {
    case 'start':
      await startServices();
      break;
    case 'stop':
      await stopServices();
      break;
    case 'status':
      await checkStatus();
      break;
    case 'test':
      await testServices();
      break;
    default:
      console.log('❌ Invalid command. Use: start, stop, status, or test');
  }
}

async function startServices() {
  console.log('🚀 Starting Services...\n');
  
  try {
    // Check if services are already running
    const backendRunning = await isPortInUse(5001);
    const frontendRunning = await isPortInUse(5174);
    
    if (backendRunning) {
      console.log('⚠️  Backend already running on port 5001');
    } else {
      console.log('🔄 Starting backend server...');
      console.log('   Run: cd backend && node server.js');
    }
    
    if (frontendRunning) {
      console.log('⚠️  Frontend already running on port 5174');
    } else {
      console.log('🔄 Starting frontend server...');
      console.log('   Run: cd frontend && npm run dev');
    }
    
    console.log('\n✅ Service start instructions provided');
    console.log('📝 Note: Run these commands in separate terminals');
    
  } catch (error) {
    console.log('❌ Error checking services:', error.message);
  }
}

async function stopServices() {
  console.log('🛑 Stopping Services...\n');
  
  try {
    // Find processes using ports 5001 and 5174
    const backendPid = await getProcessIdByPort(5001);
    const frontendPid = await getProcessIdByPort(5174);
    
    if (backendPid) {
      console.log(`🔄 Stopping backend server (PID: ${backendPid})...`);
      await runCommand(`taskkill /PID ${backendPid} /F`);
      console.log('✅ Backend server stopped');
    } else {
      console.log('ℹ️  Backend server not running');
    }
    
    if (frontendPid) {
      console.log(`🔄 Stopping frontend server (PID: ${frontendPid})...`);
      await runCommand(`taskkill /PID ${frontendPid} /F`);
      console.log('✅ Frontend server stopped');
    } else {
      console.log('ℹ️  Frontend server not running');
    }
    
    console.log('\n✅ All services stopped');
    
  } catch (error) {
    console.log('❌ Error stopping services:', error.message);
  }
}

async function checkStatus() {
  console.log('📊 Service Status Check...\n');
  
  try {
    const backendRunning = await isPortInUse(5001);
    const frontendRunning = await isPortInUse(5174);
    const mongoRunning = await isPortInUse(27017);
    
    console.log('🔍 Service Status:');
    console.log(`   Backend (Port 5001):  ${backendRunning ? '✅ Running' : '❌ Stopped'}`);
    console.log(`   Frontend (Port 5174): ${frontendRunning ? '✅ Running' : '❌ Stopped'}`);
    console.log(`   MongoDB (Port 27017): ${mongoRunning ? '✅ Running' : '❌ Stopped'}`);
    
    if (backendRunning && frontendRunning && mongoRunning) {
      console.log('\n🎉 All services are running!');
    } else {
      console.log('\n⚠️  Some services are not running');
    }
    
  } catch (error) {
    console.log('❌ Error checking status:', error.message);
  }
}

async function testServices() {
  console.log('🧪 Testing Services...\n');
  
  try {
    // Run the comprehensive test
    const { spawn } = require('child_process');
    
    const testProcess = spawn('node', ['scripts/testAllServices.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      console.log(`\n✅ Service test completed with code: ${code}`);
    });
    
  } catch (error) {
    console.log('❌ Error running tests:', error.message);
  }
}

async function isPortInUse(port) {
  try {
    const result = await runCommand(`netstat -an | findstr :${port}`);
    return result.includes('LISTENING');
  } catch {
    return false;
  }
}

async function getProcessIdByPort(port) {
  try {
    const result = await runCommand(`netstat -aon | findstr :${port} | findstr LISTENING`);
    const lines = result.trim().split('\n');
    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      return parts[parts.length - 1];
    }
    return null;
  } catch {
    return null;
  }
}

manageServices();
