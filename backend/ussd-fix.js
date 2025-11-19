#!/usr/bin/env node

/**
 * USSD Quick Fix and Diagnostic Tool
 * Run this script to diagnose and fix common USSD issues
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log('cyan', `  ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function checkServerHealth(baseUrl) {
  header('Checking Server Health');
  
  try {
    log('blue', `Testing: ${baseUrl}/health`);
    const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    
    if (response.data.success) {
      log('green', '✓ Server is running');
      log('green', `✓ Environment: ${response.data.environment || 'unknown'}`);
      log('green', `✓ Database: ${response.data.openmrs?.connectedHospitals !== undefined ? 'Connected' : 'Unknown'}`);
      return true;
    }
  } catch (error) {
    log('red', '✗ Server health check failed');
    if (error.code === 'ECONNREFUSED') {
      log('red', '  → Server is not running. Start it with: npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      log('red', '  → Server is not responding. Check if it\'s overloaded.');
    } else {
      log('red', `  → Error: ${error.message}`);
    }
    return false;
  }
}

async function checkUSSDHealth(baseUrl) {
  header('Checking USSD Service');
  
  try {
    log('blue', `Testing: ${baseUrl}/api/ussd/health`);
    const response = await axios.get(`${baseUrl}/api/ussd/health`, { timeout: 5000 });
    
    if (response.data.success) {
      log('green', '✓ USSD service is running');
      log('green', `✓ Timestamp: ${response.data.timestamp}`);
      return true;
    }
  } catch (error) {
    log('red', '✗ USSD service health check failed');
    if (error.response?.status === 404) {
      log('red', '  → USSD routes not registered. Check server.ts');
    } else {
      log('red', `  → Error: ${error.message}`);
    }
    return false;
  }
}

async function testUSSDSession(baseUrl) {
  header('Testing USSD Session Flow');
  
  const sessionId = `test-${Date.now()}`;
  const phoneNumber = '+250788123456';
  
  const tests = [
    { name: 'Language Selection', text: '' },
    { name: 'Access Method Menu (English)', text: '1' },
    { name: 'National ID Prompt', text: '1*1' }
  ];
  
  for (const test of tests) {
    try {
      log('blue', `\nTest: ${test.name}`);
      log('yellow', `  Sending: "${test.text}"`);
      
      const response = await axios.post(`${baseUrl}/api/ussd/callback`, {
        sessionId,
        phoneNumber,
        serviceCode: '*384#',
        text: test.text
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const responseText = response.data;
      log('green', `  ✓ Response received (${responseText.length} chars)`);
      
      // Show first 100 chars of response
      const preview = responseText.substring(0, 100).replace(/\n/g, ' ↵ ');
      log('cyan', `  Preview: ${preview}...`);
      
    } catch (error) {
      log('red', `  ✗ Test failed: ${test.name}`);
      if (error.response) {
        log('red', `    HTTP ${error.response.status}: ${error.response.statusText}`);
        log('red', `    Response: ${error.response.data}`);
      } else {
        log('red', `    Error: ${error.message}`);
      }
      return false;
    }
  }
  
  log('green', '\n✓ All USSD flow tests passed!');
  return true;
}

async function checkDatabaseConnection(baseUrl) {
  header('Checking Database Connection');
  
  try {
    const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    
    if (response.data.openmrs) {
      log('green', '✓ Database connection information available');
      log('cyan', `  Connected Hospitals: ${response.data.openmrs.connectedHospitals || 0}`);
      log('cyan', `  Sync Status: ${response.data.openmrs.isRunning ? 'Running' : 'Stopped'}`);
      return true;
    } else {
      log('yellow', '⚠ Database information not available in health check');
      return false;
    }
  } catch (error) {
    log('red', '✗ Could not check database connection');
    return false;
  }
}

async function checkEnvironmentVariables() {
  header('Checking Environment Configuration');
  
  const requiredVars = [
    'MONGODB_URI',
    'PORT',
    'NODE_ENV'
  ];
  
  const optionalVars = [
    'AFRICASTALKING_API_KEY',
    'AFRICASTALKING_USERNAME',
    'AFRICASTALKING_USSD_CODE'
  ];
  
  log('blue', 'Required Variables:');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log('green', `  ✓ ${varName} is set`);
    } else {
      log('red', `  ✗ ${varName} is missing`);
    }
  });
  
  log('blue', '\nOptional Variables (for production):');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log('green', `  ✓ ${varName} is set`);
    } else {
      log('yellow', `  ⚠ ${varName} is not set (OK for testing)`);
    }
  });
}

function showQuickFixes() {
  header('Quick Fixes for Common Issues');
  
  log('magenta', '1. Server Not Running:');
  log('cyan', '   cd backend && npm run dev\n');
  
  log('magenta', '2. Database Connection Issues:');
  log('cyan', '   Check MONGODB_URI in .env file');
  log('cyan', '   Ensure MongoDB Atlas IP whitelist includes your IP\n');
  
  log('magenta', '3. USSD Simulator Socket Errors:');
  log('cyan', '   Clear browser cache and reload');
  log('cyan', '   Use the built-in simulator: http://localhost:5000/ussd-simulator\n');
  
  log('magenta', '4. CORS Errors:');
  log('cyan', '   Already fixed - Africa\'s Talking domains whitelisted');
  log('cyan', '   Restart server to apply changes\n');
  
  log('magenta', '5. Session Management Issues:');
  log('cyan', '   Use same sessionId for all requests in a flow');
  log('cyan', '   Don\'t restart server during testing\n');
  
  log('magenta', '6. Patient Not Found:');
  log('cyan', '   Verify test patient exists: node check-patient-passport.js');
  log('cyan', '   Create test patient in admin dashboard\n');
}

function showNextSteps() {
  header('Next Steps');
  
  log('blue', '1. Open USSD Simulator:');
  log('cyan', '   http://localhost:5000/ussd-simulator\n');
  
  log('blue', '2. Test with Africa\'s Talking Simulator:');
  log('cyan', '   https://simulator.africastalking.com/\n');
  
  log('blue', '3. Set up ngrok for webhook testing:');
  log('cyan', '   ngrok http 5000');
  log('cyan', '   Copy URL to Africa\'s Talking dashboard\n');
  
  log('blue', '4. View API Documentation:');
  log('cyan', '   http://localhost:5000/api-docs\n');
  
  log('blue', '5. Check Logs:');
  log('cyan', '   Watch the server terminal for detailed USSD logs\n');
}

async function runDiagnostics(baseUrl) {
  log('cyan', `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       USSD Diagnostic and Fix Tool                        ║
║       Patient Passport System                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
  
  log('yellow', `Testing server at: ${baseUrl}\n`);
  
  // Run checks
  const serverOk = await checkServerHealth(baseUrl);
  if (!serverOk) {
    log('red', '\n⚠️  Server is not accessible. Please start the backend server first.\n');
    showQuickFixes();
    return;
  }
  
  await checkUSSDHealth(baseUrl);
  await checkDatabaseConnection(baseUrl);
  checkEnvironmentVariables();
  
  // Ask if user wants to test USSD flow
  rl.question('\nWould you like to test the USSD flow? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await testUSSDSession(baseUrl);
    }
    
    showQuickFixes();
    showNextSteps();
    
    log('green', '\n✨ Diagnostics complete!\n');
    rl.close();
    process.exit(0);
  });
}

// Main execution
const baseUrl = process.env.API_URL || 'http://localhost:5000';

// Load environment variables
require('dotenv').config();

runDiagnostics(baseUrl);
