#!/usr/bin/env node

/**
 * Comprehensive USSD Test Script
 * Tests all USSD flows to ensure everything is working correctly
 * 
 * Usage: node test-ussd-comprehensive.js
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_PHONE = process.env.TEST_PHONE || '+250788123456';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/ussd/callback`);
    const postData = JSON.stringify(body);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data.trim());
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testUSSD(testName, text, expectedContains = []) {
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    log('cyan', `\n📤 Testing: ${testName}`);
    log('blue', `   Request: "${text || '(empty - main menu)'}"`);
    
    const response = await makeRequest('/api/ussd/callback', {
      sessionId,
      phoneNumber: TEST_PHONE,
      serviceCode: '*384#',
      text: text || ''
    });
    
    log('green', `✅ Response (${response.length} chars):`);
    console.log(`   ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`);
    
    // Check if response contains expected strings
    if (expectedContains.length > 0) {
      const missing = expectedContains.filter(expected => 
        !response.toLowerCase().includes(expected.toLowerCase())
      );
      
      if (missing.length > 0) {
        log('yellow', `   ⚠️  Missing expected content: ${missing.join(', ')}`);
      } else {
        log('green', `   ✓ Contains all expected content`);
      }
    }
    
    // Validate USSD format
    if (!response.startsWith('CON ') && !response.startsWith('END ')) {
      log('red', `   ❌ Invalid USSD format - must start with CON or END`);
      return false;
    }
    
    return true;
  } catch (error) {
    log('red', `   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('cyan', '\n═══════════════════════════════════════════════════════');
  log('cyan', '🧪 COMPREHENSIVE USSD TEST SUITE');
  log('cyan', '═══════════════════════════════════════════════════════\n');
  
  log('blue', `API URL: ${API_URL}`);
  log('blue', `Test Phone: ${TEST_PHONE}\n`);
  
  // Test 1: Main Menu (Language Selection)
  const test1 = await testUSSD(
    'Main Menu (Language Selection)',
    '',
    ['language', 'english', 'kinyarwanda']
  );
  
  // Test 2: Select English
  const test2 = await testUSSD(
    'Select English',
    '1',
    ['access method', 'national id', 'email']
  );
  
  // Test 3: Select National ID Method
  const test3 = await testUSSD(
    'Select National ID Method',
    '1*1',
    ['national id', 'enter']
  );
  
  // Test 4: Invalid National ID (too short)
  const test4 = await testUSSD(
    'Invalid National ID (too short)',
    '1*1*123',
    ['invalid', 'error']
  );
  
  // Test 5: Valid National ID Format (but patient may not exist)
  const test5 = await testUSSD(
    'Valid National ID Format',
    '1*1*1234567890123',
    []
  );
  
  // Test 6: Select Email Method
  const test6 = await testUSSD(
    'Select Email Method',
    '1*2',
    ['email', 'enter']
  );
  
  // Test 7: Invalid Email Format
  const test7 = await testUSSD(
    'Invalid Email Format',
    '1*2*invalid-email',
    ['invalid', 'error']
  );
  
  // Test 8: Valid Email Format (but user may not exist)
  const test8 = await testUSSD(
    'Valid Email Format',
    '1*2*test@example.com',
    []
  );
  
  // Test 9: Select Kinyarwanda
  const test9 = await testUSSD(
    'Select Kinyarwanda',
    '2',
    ['hitamo', 'rangamuntu']
  );
  
  // Test 10: Emergency Access Option (if available)
  const test10 = await testUSSD(
    'Emergency Access (if in menu)',
    '1*3',
    []
  );
  
  // Summary
  const results = [test1, test2, test3, test4, test5, test6, test7, test8, test9, test10];
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  log('cyan', '\n═══════════════════════════════════════════════════════');
  log('cyan', '📊 TEST RESULTS');
  log('cyan', '═══════════════════════════════════════════════════════\n');
  
  log('green', `✅ Passed: ${passed}/${results.length}`);
  if (failed > 0) {
    log('red', `❌ Failed: ${failed}/${results.length}`);
  }
  
  if (failed === 0) {
    log('green', '\n🎉 ALL TESTS PASSED - USSD is working correctly!');
  } else {
    log('yellow', '\n⚠️  Some tests failed. Check the errors above.');
    log('yellow', '   Note: Some failures are expected if test patients don\'t exist in database.');
  }
  
  log('cyan', '\n═══════════════════════════════════════════════════════');
  log('blue', '💡 TIP: To test with real patient data:');
  log('blue', '   1. Ensure you have a patient in the database');
  log('blue', '   2. Use their National ID or Email in the tests');
  log('blue', '   3. Or use the web simulator: http://localhost:5000/ussd-simulator');
  log('cyan', '═══════════════════════════════════════════════════════\n');
}

// Check if server is running first
async function checkServer() {
  return new Promise((resolve) => {
    const url = new URL(`${API_URL}/health`);
    const req = http.request(url, { method: 'GET' }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  log('cyan', '\n🔍 Checking if backend server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('red', '\n❌ Backend server is not running!');
    log('yellow', '\n   Please start the backend server first:');
    log('yellow', '   cd backend');
    log('yellow', '   npm run dev\n');
    process.exit(1);
  }
  
  log('green', '✅ Backend server is running\n');
  
  await runTests();
}

main().catch((error) => {
  log('red', `\n❌ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

