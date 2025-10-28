/**
 * Test script for USSD Passport Access
 * Run with: node test-ussd.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/ussd';

// Color codes for console output
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

async function testUSSDFlow(testName, text, phoneNumber = '+250788123456') {
  log('cyan', `\n${'='.repeat(60)}`);
  log('blue', `TEST: ${testName}`);
  log('cyan', '='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/test`, {
      sessionId: `test-${Date.now()}`,
      phoneNumber: phoneNumber,
      text: text
    });

    if (response.data.success) {
      log('green', '✓ Test passed');
      log('yellow', `Response: ${response.data.data.response}`);
    } else {
      log('red', '✗ Test failed');
      log('red', `Error: ${response.data.message}`);
    }
  } catch (error) {
    log('red', '✗ Request failed');
    if (error.response) {
      log('red', `Status: ${error.response.status}`);
      log('red', `Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      log('red', `Error: ${error.message}`);
    }
  }
}

async function runTests() {
  log('cyan', '\n' + '='.repeat(60));
  log('blue', 'USSD PASSPORT ACCESS - TEST SUITE');
  log('cyan', '='.repeat(60));

  // Test 1: Language selection
  await testUSSDFlow('Language Selection (English)', '');

  // Test 2: Access method menu
  await testUSSDFlow('Access Method Menu (English)', '1');

  // Test 3: National ID input prompt
  await testUSSDFlow('National ID Input Prompt', '1*1');

  // Test 4: Email input prompt
  await testUSSDFlow('Email Input Prompt', '1*2');

  // Test 5: Complete flow with National ID (replace with actual ID)
  await testUSSDFlow(
    'Complete Flow - National ID (REPLACE WITH REAL ID)',
    '1*1*1234567890123456'
  );

  // Test 6: Complete flow with Email (replace with actual email)
  await testUSSDFlow(
    'Complete Flow - Email (REPLACE WITH REAL EMAIL)',
    '1*2*patient@example.com'
  );

  // Test 7: Complete flow with Email (uppercase)
  await testUSSDFlow(
    'Complete Flow - Email Uppercase',
    '1*2*PATIENT@EXAMPLE.COM'
  );

  // Test 8: Invalid National ID (too short)
  await testUSSDFlow(
    'Invalid National ID - Too Short',
    '1*1*123'
  );

  // Test 9: Invalid National ID (with letters)
  await testUSSDFlow(
    'Invalid National ID - Contains Letters',
    '1*1*12345abc67890123'
  );

  // Test 10: Invalid Email
  await testUSSDFlow(
    'Invalid Email Format',
    '1*2*invalid-email'
  );

  // Test 11: Non-existent National ID
  await testUSSDFlow(
    'Non-existent National ID',
    '1*1*9999999999999999'
  );

  // Test 12: Non-existent Email
  await testUSSDFlow(
    'Non-existent Email',
    '1*2*nonexistent@example.com'
  );

  // Test 13: Kinyarwanda language
  await testUSSDFlow('Kinyarwanda - Language Menu', '2');

  // Test 14: Kinyarwanda with National ID
  await testUSSDFlow(
    'Kinyarwanda - Complete Flow (REPLACE WITH REAL ID)',
    '2*1*1234567890123456'
  );

  log('cyan', '\n' + '='.repeat(60));
  log('green', 'TEST SUITE COMPLETED');
  log('cyan', '='.repeat(60) + '\n');

  log('yellow', 'IMPORTANT NOTES:');
  log('yellow', '1. Replace test National IDs and emails with real values from your database');
  log('yellow', '2. Ensure the backend server is running on http://localhost:5000');
  log('yellow', '3. Check the backend console for detailed logs');
  log('yellow', '4. Verify SMS is sent (check Africa\'s Talking dashboard)');
  log('yellow', '5. Test with actual Africa\'s Talking USSD simulator for production testing\n');
}

// Run the tests
runTests().catch(console.error);
