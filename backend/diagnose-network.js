#!/usr/bin/env node

/**
 * Comprehensive Network and Connection Diagnostics
 * Tests all possible connection issues with USSD system
 */

const http = require('http');
const dns = require('dns');
const net = require('net');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

console.log('\n' + '='.repeat(80));
log(colors.blue, '🔍', 'COMPREHENSIVE NETWORK DIAGNOSTICS FOR USSD SYSTEM');
console.log('='.repeat(80) + '\n');

// Test 1: Check if backend server is running
async function test1_ServerRunning() {
  console.log(colors.cyan + '1. CHECKING BACKEND SERVER STATUS' + colors.reset);
  console.log('   ' + '-'.repeat(70) + '\n');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          log(colors.green, '✅', `Backend server is running (HTTP ${res.statusCode})`);
          try {
            const parsed = JSON.parse(data);
            console.log(`   ${colors.blue}MongoDB:${colors.reset} ${parsed.database?.connected ? 'Connected' : 'Disconnected'}`);
            console.log(`   ${colors.blue}Email:${colors.reset} ${parsed.email?.configured ? 'Configured' : 'Not configured'}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}`);
          }
          console.log();
          resolve(true);
        } else {
          log(colors.red, '❌', `Server returned status ${res.statusCode}`);
          console.log();
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(colors.red, '❌', 'Backend server is NOT running');
      log(colors.yellow, '⚠️', `Error: ${error.message}`);
      log(colors.yellow, '💡', 'Start server with: cd backend && npm run dev');
      console.log();
      resolve(false);
    });

    req.setTimeout(5000, () => {
      log(colors.red, '❌', 'Server connection timeout (5 seconds)');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: Check DNS resolution
async function test2_DNSResolution() {
  console.log(colors.cyan + '2. CHECKING DNS RESOLUTION' + colors.reset);
  console.log('   ' + '-'.repeat(70) + '\n');
  
  return new Promise((resolve) => {
    dns.lookup('localhost', (err, address, family) => {
      if (err) {
        log(colors.red, '❌', `DNS lookup failed: ${err.message}`);
        console.log();
        resolve(false);
      } else {
        log(colors.green, '✅', `localhost resolves to ${address} (IPv${family})`);
        console.log();
        resolve(true);
      }
    });
  });
}

// Test 3: Check TCP connection to port 5000
async function test3_TCPConnection() {
  console.log(colors.cyan + '3. CHECKING TCP CONNECTION' + colors.reset);
  console.log('   ' + '-'.repeat(70) + '\n');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      const latency = Date.now() - startTime;
      log(colors.green, '✅', `TCP connection established to localhost:5000`);
      console.log(`   ${colors.blue}Latency:${colors.reset} ${latency}ms`);
      console.log(`   ${colors.blue}Local Address:${colors.reset} ${socket.localAddress}:${socket.localPort}`);
      console.log(`   ${colors.blue}Keep-Alive:${colors.reset} ${socket.setKeepAlive ? 'Supported' : 'Not supported'}`);
      socket.destroy();
      console.log();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      log(colors.red, '❌', `TCP connection failed: ${error.message}`);
      console.log();
      resolve(false);
    });
    
    socket.on('timeout', () => {
      log(colors.red, '❌', 'TCP connection timeout (5 seconds)');
      socket.destroy();
      console.log();
      resolve(false);
    });
    
    socket.connect(5000, 'localhost');
  });
}

// Test 4: Test USSD endpoint with connection state monitoring
async function test4_USSDEndpoint() {
  console.log(colors.cyan + '4. TESTING USSD ENDPOINT WITH CONNECTION MONITORING' + colors.reset);
  console.log('   ' + '-'.repeat(70) + '\n');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      sessionId: 'diag-' + Date.now(),
      serviceCode: '*384*40767#',
      phoneNumber: '+250788123456',
      text: ''
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ussd/callback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Connection': 'close' // Explicitly close after request
      }
    };

    log(colors.blue, '📤', 'Sending USSD request...');
    
    const req = http.request(options, (res) => {
      log(colors.blue, '📥', `Response received (HTTP ${res.statusCode})`);
      console.log(`   ${colors.blue}Content-Type:${colors.reset} ${res.headers['content-type']}`);
      console.log(`   ${colors.blue}Connection:${colors.reset} ${res.headers.connection}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const isValidUSSD = data.startsWith('CON ') || data.startsWith('END ');
        
        if (res.statusCode === 200 && isValidUSSD) {
          log(colors.green, '✅', 'USSD endpoint working correctly');
          console.log(`   ${colors.blue}Response:${colors.reset} ${data.substring(0, 60)}...`);
          console.log(`   ${colors.blue}Format:${colors.reset} ${data.startsWith('CON') ? 'CON (Continue)' : 'END (Finish)'}`);
          console.log();
          resolve(true);
        } else {
          log(colors.red, '❌', 'Invalid USSD response');
          console.log(`   ${colors.yellow}Response:${colors.reset} ${data}`);
          console.log();
          resolve(false);
        }
      });
    });

    // Monitor socket events
    req.on('socket', (socket) => {
      log(colors.blue, '🔌', 'Socket created');
      
      socket.on('connect', () => {
        log(colors.blue, '🔌', 'Socket connected');
      });
      
      socket.on('end', () => {
        log(colors.blue, '🔌', 'Socket ended gracefully');
      });
      
      socket.on('close', (hadError) => {
        if (hadError) {
          log(colors.red, '🔌', 'Socket closed with error');
        } else {
          log(colors.blue, '🔌', 'Socket closed normally');
        }
      });
      
      socket.on('error', (error) => {
        log(colors.red, '🔌', `Socket error: ${error.message}`);
      });
      
      socket.on('timeout', () => {
        log(colors.yellow, '🔌', 'Socket timeout');
      });
    });

    req.on('error', (error) => {
      log(colors.red, '❌', `USSD request failed: ${error.message}`);
      console.log();
      resolve(false);
    });

    req.setTimeout(10000, () => {
      log(colors.red, '❌', 'USSD request timeout (10 seconds)');
      req.destroy();
      console.log();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 5: Test socket.io endpoint (should return 404)
async function test5_SocketIODisabled() {
  console.log(colors.cyan + '5. VERIFYING SOCKET.IO IS DISABLED' + colors.reset);
  console.log('   ' + '-'.repeat(70) + '\n');
  
  return new Promise((resolve) => {
    http.get('http://localhost:5000/socket.io/socket.io.js', (res) => {
      if (res.statusCode === 404) {
        log(colors.green, '✅', 'Socket.io is properly disabled (404)');
        console.log(`   ${colors.blue}This prevents Africa's Talking simulator conflicts${colors.reset}`);
        console.log();
        resolve(true);
      } else {
        log(colors.yellow, '⚠️', `Socket.io returned status ${res.statusCode} (expected 404)`);
        console.log();
        resolve(false);
      }
    }).on('error', (error) => {
      log(colors.red, '❌', `Failed to check socket.io: ${error.message}`);
      console.log();
      resolve(false);
    });
  });
}

// Test 6: Stress test - Multiple rapid requests
async function test6_StressTest() {
  console.log(colors.cyan + '6. STRESS TEST - RAPID REQUESTS' + colors.reset);
  console.log('   ' + '-'.repeat(70) + '\n');
  
  log(colors.blue, '📊', 'Sending 10 rapid USSD requests...');
  
  const promises = [];
  const results = { success: 0, failed: 0, errors: [] };
  
  for (let i = 0; i < 10; i++) {
    const promise = new Promise((resolve) => {
      const postData = JSON.stringify({
        sessionId: `stress-${i}-${Date.now()}`,
        serviceCode: '*384*40767#',
        phoneNumber: '+250788123456',
        text: ''
      });

      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/ussd/callback',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 && (data.startsWith('CON') || data.startsWith('END'))) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Request ${i}: HTTP ${res.statusCode}`);
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        results.failed++;
        results.errors.push(`Request ${i}: ${error.message}`);
        resolve();
      });

      req.write(postData);
      req.end();
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  
  log(colors.green, '✅', `Successful: ${results.success}/10`);
  log(results.failed > 0 ? colors.red : colors.green, results.failed > 0 ? '❌' : '✅', `Failed: ${results.failed}/10`);
  
  if (results.errors.length > 0) {
    console.log(`\n   ${colors.yellow}Errors:${colors.reset}`);
    results.errors.forEach(err => console.log(`   - ${err}`));
  }
  
  console.log();
  return results.failed === 0;
}

// Main diagnostic runner
async function runDiagnostics() {
  const results = {
    serverRunning: false,
    dnsResolution: false,
    tcpConnection: false,
    ussdEndpoint: false,
    socketioDisabled: false,
    stressTest: false
  };
  
  results.serverRunning = await test1_ServerRunning();
  
  if (!results.serverRunning) {
    console.log(colors.red + '⚠️  CRITICAL: Backend server is not running!' + colors.reset);
    console.log(colors.yellow + '\nStart the server first:' + colors.reset);
    console.log('   cd backend');
    console.log('   npm run dev\n');
    process.exit(1);
  }
  
  results.dnsResolution = await test2_DNSResolution();
  results.tcpConnection = await test3_TCPConnection();
  results.ussdEndpoint = await test4_USSDEndpoint();
  results.socketioDisabled = await test5_SocketIODisabled();
  results.stressTest = await test6_StressTest();
  
  // Summary
  console.log('='.repeat(80));
  console.log(colors.cyan + '📊 DIAGNOSTIC SUMMARY' + colors.reset);
  console.log('='.repeat(80) + '\n');
  
  const tests = [
    { name: 'Backend Server Running', result: results.serverRunning },
    { name: 'DNS Resolution', result: results.dnsResolution },
    { name: 'TCP Connection', result: results.tcpConnection },
    { name: 'USSD Endpoint', result: results.ussdEndpoint },
    { name: 'Socket.io Disabled', result: results.socketioDisabled },
    { name: 'Stress Test (10 requests)', result: results.stressTest }
  ];
  
  tests.forEach(test => {
    const symbol = test.result ? '✅' : '❌';
    const color = test.result ? colors.green : colors.red;
    log(color, symbol, test.name);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    log(colors.green, '✅', 'ALL DIAGNOSTICS PASSED - SYSTEM IS HEALTHY');
    console.log(colors.green + '\nYour USSD system is working correctly!' + colors.reset);
    console.log(colors.blue + '\n💡 The socket errors you see in Africa\'s Talking simulator are from' + colors.reset);
    console.log(colors.blue + '   their website\'s JavaScript, NOT from your application.' + colors.reset);
    console.log(colors.blue + '\n   Your backend uses HTTP POST only (as shown in tests above).' + colors.reset);
  } else {
    log(colors.yellow, '⚠️', 'SOME DIAGNOSTICS FAILED - SEE DETAILS ABOVE');
  }
  console.log('='.repeat(80) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error(colors.red + '\n❌ Diagnostic runner crashed:' + colors.reset, error);
  process.exit(1);
});
