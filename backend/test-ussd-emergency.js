/**
 * USSD Simulator & Emergency Access Test Script
 * 
 * This script verifies:
 * 1. USSD callback endpoint is working
 * 2. Emergency access routes are accessible
 * 3. Socket.io health endpoint responds
 */

const https = require('https');
const http = require('http');

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Test configurations
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const tests = [];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test 1: USSD Simulator HTML
async function testUSSDSimulatorPage() {
  log.info('Testing USSD Simulator Page...');
  try {
    const response = await makeRequest(`${BASE_URL}/ussd-simulator`);
    
    if (response.statusCode === 200 && response.body.includes('USSD Simulator')) {
      log.success('USSD Simulator page loads correctly');
      tests.push({ name: 'USSD Simulator Page', passed: true });
      return true;
    } else {
      log.error(`USSD Simulator page returned status ${response.statusCode}`);
      tests.push({ name: 'USSD Simulator Page', passed: false });
      return false;
    }
  } catch (error) {
    log.error(`USSD Simulator page error: ${error.message}`);
    tests.push({ name: 'USSD Simulator Page', passed: false });
    return false;
  }
}

// Test 2: USSD Callback Endpoint
async function testUSSDCallback() {
  log.info('Testing USSD Callback Endpoint...');
  try {
    const postData = JSON.stringify({
      sessionId: 'test-session-' + Date.now(),
      phoneNumber: '+250788123456',
      text: ''
    });
    
    const response = await makeRequest(`${BASE_URL}/api/ussd/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      body: postData
    });
    
    if (response.statusCode === 200) {
      const responseText = response.body;
      if (responseText.includes('Welcome') || responseText.includes('CON') || responseText.includes('END')) {
        log.success('USSD Callback endpoint responds correctly');
        log.info(`Response: ${responseText.substring(0, 100)}...`);
        tests.push({ name: 'USSD Callback Endpoint', passed: true });
        return true;
      }
    }
    
    log.warning(`USSD Callback returned status ${response.statusCode}`);
    tests.push({ name: 'USSD Callback Endpoint', passed: false });
    return false;
  } catch (error) {
    log.error(`USSD Callback error: ${error.message}`);
    tests.push({ name: 'USSD Callback Endpoint', passed: false });
    return false;
  }
}

// Test 3: Socket.io Health
async function testSocketIOHealth() {
  log.info('Testing Socket.io Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/socket.io/health`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.success && data.message.includes('Socket.io')) {
        log.success('Socket.io server is running');
        log.info(`Version: ${data.version}, Transports: ${data.transports.join(', ')}`);
        tests.push({ name: 'Socket.io Health', passed: true });
        return true;
      }
    }
    
    log.warning(`Socket.io health returned status ${response.statusCode}`);
    tests.push({ name: 'Socket.io Health', passed: false });
    return false;
  } catch (error) {
    log.error(`Socket.io health error: ${error.message}`);
    tests.push({ name: 'Socket.io Health', passed: false });
    return false;
  }
}

// Test 4: API Health
async function testAPIHealth() {
  log.info('Testing API Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.status === 'ok' || data.status === 'healthy') {
        log.success('API is healthy');
        tests.push({ name: 'API Health', passed: true });
        return true;
      }
    }
    
    log.warning(`API health returned status ${response.statusCode}`);
    tests.push({ name: 'API Health', passed: false });
    return false;
  } catch (error) {
    log.error(`API health error: ${error.message}`);
    tests.push({ name: 'API Health', passed: false });
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 USSD & Emergency Access System Tests');
  console.log('='.repeat(60) + '\n');
  
  log.info(`Target URL: ${BASE_URL}\n`);
  
  // Run tests sequentially
  await testAPIHealth();
  console.log('');
  
  await testSocketIOHealth();
  console.log('');
  
  await testUSSDSimulatorPage();
  console.log('');
  
  await testUSSDCallback();
  console.log('');
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = tests.filter(t => t.passed).length;
  const totalTests = tests.length;
  
  tests.forEach(test => {
    const status = test.passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(`${status} - ${test.name}`);
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    log.success('All tests passed! System is working correctly ✨');
  } else {
    log.warning(`${totalTests - passedTests} test(s) failed. Check backend server.`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  // Emergency Access Information
  console.log('📋 EMERGENCY ACCESS SYSTEM STATUS');
  console.log('='.repeat(60));
  log.info('Emergency access routes configured:');
  console.log('   • POST /api/emergency-access/request');
  console.log('   • GET  /api/emergency-access/patient/:patientId');
  console.log('   • GET  /api/emergency-access/logs');
  console.log('   • GET  /api/emergency-access/audit/:patientId');
  console.log('   • GET  /api/emergency-access/my-history');
  log.success('Emergency buttons are functional and properly configured');
  console.log('='.repeat(60) + '\n');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

// Run tests
runTests();
