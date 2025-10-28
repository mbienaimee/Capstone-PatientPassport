/**
 * USSD Testing Script
 * This script simulates USSD interactions for testing purposes
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Test scenarios
const testScenarios = [
  {
    name: 'Language Selection - English',
    sessionId: 'test-session-1',
    phoneNumber: '+250788123456',
    text: '',
    expectedResponse: 'CON Choose a language'
  },
  {
    name: 'Access Method Selection - English',
    sessionId: 'test-session-2',
    phoneNumber: '+250788123456',
    text: '1',
    expectedResponse: 'CON View my Patient Passport'
  },
  {
    name: 'National ID Input Prompt - English',
    sessionId: 'test-session-3',
    phoneNumber: '+250788123456',
    text: '1*1',
    expectedResponse: 'CON Enter your National ID'
  },
  {
    name: 'Language Selection - Kinyarwanda',
    sessionId: 'test-session-4',
    phoneNumber: '+250788123456',
    text: '2',
    expectedResponse: 'CON Reba Passport yawe'
  },
  {
    name: 'Email Input Prompt - English',
    sessionId: 'test-session-5',
    phoneNumber: '+250788123456',
    text: '1*2',
    expectedResponse: 'CON Enter your Email'
  },
  {
    name: 'Invalid National ID',
    sessionId: 'test-session-6',
    phoneNumber: '+250788123456',
    text: '1*1*12345',
    expectedResponse: 'END Error: Invalid National ID'
  },
  {
    name: 'Invalid Email',
    sessionId: 'test-session-7',
    phoneNumber: '+250788123456',
    text: '1*2*notanemail',
    expectedResponse: 'END Error: Invalid email format'
  }
];

/**
 * Test USSD callback endpoint
 */
async function testUSSDCallback(scenario) {
  try {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`   Text: "${scenario.text}"`);
    
    const response = await axios.post(`${BASE_URL}/api/ussd/callback`, {
      sessionId: scenario.sessionId,
      serviceCode: '*123#',
      phoneNumber: scenario.phoneNumber,
      text: scenario.text
    });

    const result = response.data;
    console.log(`   Response: ${result}`);
    
    if (result.includes(scenario.expectedResponse)) {
      console.log('   ✅ PASSED');
      return true;
    } else {
      console.log('   ❌ FAILED');
      console.log(`   Expected: ${scenario.expectedResponse}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR');
    console.error('   ', error.message);
    return false;
  }
}

/**
 * Test USSD test endpoint (admin only)
 */
async function testUSSDTestEndpoint() {
  try {
    console.log('\n🧪 Testing Admin Test Endpoint');
    
    const response = await axios.post(
      `${BASE_URL}/api/ussd/test`,
      {
        sessionId: 'admin-test-session',
        phoneNumber: '+250788123456',
        text: '1*1'
      },
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    console.log('   Response:', JSON.stringify(response.data, null, 2));
    console.log('   ✅ PASSED');
    return true;
  } catch (error) {
    console.log('   ❌ FAILED');
    console.error('   ', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test USSD stats endpoint (admin only)
 */
async function testUSSDStatsEndpoint() {
  try {
    console.log('\n🧪 Testing Stats Endpoint');
    
    const response = await axios.get(
      `${BASE_URL}/api/ussd/stats`,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    console.log('   Response:', JSON.stringify(response.data, null, 2));
    console.log('   ✅ PASSED');
    return true;
  } catch (error) {
    console.log('   ❌ FAILED');
    console.error('   ', error.response?.data || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting USSD Tests');
  console.log('📍 Base URL:', BASE_URL);
  console.log('=' . repeat(60));

  let passed = 0;
  let failed = 0;

  // Test USSD callback scenarios
  for (const scenario of testScenarios) {
    const result = await testUSSDCallback(scenario);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await sleep(500); // Small delay between tests
  }

  // Test admin endpoints if token provided
  if (ADMIN_TOKEN) {
    const testResult = await testUSSDTestEndpoint();
    if (testResult) passed++; else failed++;
    
    const statsResult = await testUSSDStatsEndpoint();
    if (statsResult) passed++; else failed++;
  } else {
    console.log('\n⚠️  Skipping admin endpoint tests (no ADMIN_TOKEN provided)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('=' . repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runTests();
