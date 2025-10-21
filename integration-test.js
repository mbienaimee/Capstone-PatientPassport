#!/usr/bin/env node

/**
 * Patient Passport Integration Test Script
 * Tests the complete integration between frontend and deployed Azure backend
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'https://patientpassport-api.azurewebsites.net';
const FRONTEND_URL = 'https://jade-pothos-e432d0.netlify.app';
const API_BASE_URL = `${BACKEND_URL}/api`;

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test function
async function runTest(name, testFunction) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFunction();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`❌ ${name} - FAILED: ${error.message}`);
  }
}

// Individual test functions
async function testBackendHealth() {
  const response = await makeRequest(`${BACKEND_URL}/health`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.data.success) {
    throw new Error('Health check returned success: false');
  }
  
  if (response.data.environment !== 'production') {
    throw new Error(`Expected environment 'production', got '${response.data.environment}'`);
  }
  
  console.log(`   Backend is healthy: ${response.data.message}`);
  console.log(`   Environment: ${response.data.environment}`);
  console.log(`   Version: ${response.data.version}`);
}

async function testApiDocumentation() {
  const response = await makeRequest(`${BACKEND_URL}/api-docs/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.rawData.includes('PatientPassport API Documentation')) {
    throw new Error('API documentation page not found');
  }
  
  console.log('   API documentation is accessible');
}

async function testFrontendAccess() {
  const response = await makeRequest(FRONTEND_URL);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.rawData.includes('Patient Passport')) {
    throw new Error('Frontend page not found or incorrect content');
  }
  
  console.log('   Frontend is accessible');
}

async function testCorsConfiguration() {
  const response = await makeRequest(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'GET'
    }
  });
  
  // Check for CORS headers
  const corsHeaders = [
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-allow-methods',
    'access-control-allow-headers'
  ];
  
  const missingHeaders = corsHeaders.filter(header => !response.headers[header]);
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing CORS headers: ${missingHeaders.join(', ')}`);
  }
  
  console.log('   CORS headers are properly configured');
  console.log(`   Origin allowed: ${response.headers['access-control-allow-origin']}`);
}

async function testAuthenticationEndpoints() {
  // Test login endpoint (should return validation error, not 404)
  const loginResponse = await makeRequest(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email: 'test@example.com', password: 'test' }
  });
  
  if (loginResponse.statusCode === 404) {
    throw new Error('Login endpoint not found');
  }
  
  if (loginResponse.statusCode !== 400 && loginResponse.statusCode !== 401) {
    throw new Error(`Expected status 400/401 for invalid login, got ${loginResponse.statusCode}`);
  }
  
  console.log('   Authentication endpoints are accessible');
}

async function testProtectedEndpoints() {
  // Test protected endpoint without token
  const response = await makeRequest(`${API_BASE_URL}/patients`);
  
  if (response.statusCode !== 401) {
    throw new Error(`Expected status 401 for protected endpoint, got ${response.statusCode}`);
  }
  
  if (!response.data.message || !response.data.message.includes('token')) {
    throw new Error('Protected endpoint should require authentication');
  }
  
  console.log('   Protected endpoints properly require authentication');
}

async function testSocketConfiguration() {
  // Test if Socket.IO endpoint is accessible
  const response = await makeRequest(`${BACKEND_URL}/socket.io/`);
  
  if (response.statusCode !== 200 && response.statusCode !== 400) {
    throw new Error(`Socket.IO endpoint not accessible, got ${response.statusCode}`);
  }
  
  console.log('   Socket.IO endpoint is accessible');
}

async function testEnvironmentVariables() {
  // Test if environment variables are properly set by checking health response
  const response = await makeRequest(`${BACKEND_URL}/health`);
  
  if (response.data.environment !== 'production') {
    throw new Error('Backend should be running in production mode');
  }
  
  console.log('   Environment variables are properly configured');
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Patient Passport Integration Tests');
  console.log('=' .repeat(60));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('=' .repeat(60));

  // Run all tests
  await runTest('Backend Health Check', testBackendHealth);
  await runTest('API Documentation Access', testApiDocumentation);
  await runTest('Frontend Access', testFrontendAccess);
  await runTest('CORS Configuration', testCorsConfiguration);
  await runTest('Authentication Endpoints', testAuthenticationEndpoints);
  await runTest('Protected Endpoints Security', testProtectedEndpoints);
  await runTest('Socket.IO Configuration', testSocketConfiguration);
  await runTest('Environment Variables', testEnvironmentVariables);

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is fully integrated and ready for use.');
    console.log('\n📱 You can now access your application at:');
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   API Docs: ${BACKEND_URL}/api-docs/`);
    console.log(`   Health Check: ${BACKEND_URL}/health`);
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
