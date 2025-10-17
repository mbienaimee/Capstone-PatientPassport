#!/usr/bin/env node

/**
 * Integration Test Script for PatientPassport Frontend-Backend
 * Tests the complete integration between frontend and Azure backend
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://patientpassport-api.azurewebsites.net';
const FRONTEND_URL = 'http://localhost:3000'; // Update this to your frontend URL

console.log('🚀 Starting PatientPassport Integration Test...\n');

// Test functions
async function testBackendHealth() {
  return new Promise((resolve) => {
    console.log('1. Testing Backend Health Check...');
    
    const req = https.get(`${BACKEND_URL}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Backend health check passed');
            console.log(`   Status: ${response.message}`);
            console.log(`   Environment: ${response.environment}`);
            resolve(true);
          } else {
            console.log('❌ Backend health check failed');
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Backend health check failed - Invalid JSON response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Backend health check failed - Connection error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Backend health check failed - Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function testSwaggerDocumentation() {
  return new Promise((resolve) => {
    console.log('\n2. Testing Swagger Documentation...');
    
    const req = https.get(`${BACKEND_URL}/api-docs`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Swagger documentation accessible');
        resolve(true);
      } else {
        console.log(`❌ Swagger documentation failed - Status: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ Swagger documentation failed - Connection error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Swagger documentation failed - Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

async function testAPIEndpoints() {
  return new Promise((resolve) => {
    console.log('\n3. Testing API Endpoints...');
    
    const endpoints = [
      '/api/auth/login',
      '/api/patients',
      '/api/hospitals',
      '/api/medical/conditions',
      '/api/dashboard/stats'
    ];
    
    let successCount = 0;
    let totalTests = endpoints.length;
    
    const testEndpoint = (endpoint) => {
      return new Promise((endpointResolve) => {
        const req = https.get(`${BACKEND_URL}${endpoint}`, (res) => {
          // We expect 401 for most endpoints without auth, which is correct
          if (res.statusCode === 401 || res.statusCode === 200) {
            console.log(`✅ ${endpoint} - Status: ${res.statusCode}`);
            successCount++;
          } else {
            console.log(`❌ ${endpoint} - Status: ${res.statusCode}`);
          }
          endpointResolve();
        });
        
        req.on('error', (error) => {
          console.log(`❌ ${endpoint} - Error: ${error.message}`);
          endpointResolve();
        });
        
        req.setTimeout(5000, () => {
          console.log(`❌ ${endpoint} - Timeout`);
          req.destroy();
          endpointResolve();
        });
      });
    };
    
    Promise.all(endpoints.map(testEndpoint)).then(() => {
      console.log(`\n   API Endpoints: ${successCount}/${totalTests} passed`);
      resolve(successCount === totalTests);
    });
  });
}

async function testCORSConfiguration() {
  return new Promise((resolve) => {
    console.log('\n4. Testing CORS Configuration...');
    
    const options = {
      hostname: 'patientpassport-api.azurewebsites.net',
      port: 443,
      path: '/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    };
    
    const req = https.request(options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      };
      
      if (corsHeaders['access-control-allow-origin']) {
        console.log('✅ CORS configuration working');
        console.log(`   Allow Origin: ${corsHeaders['access-control-allow-origin']}`);
        console.log(`   Allow Methods: ${corsHeaders['access-control-allow-methods']}`);
        resolve(true);
      } else {
        console.log('❌ CORS configuration missing');
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ CORS test failed - Connection error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ CORS test failed - Timeout');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Main test runner
async function runIntegrationTests() {
  const results = [];
  
  results.push(await testBackendHealth());
  results.push(await testSwaggerDocumentation());
  results.push(await testAPIEndpoints());
  results.push(await testCORSConfiguration());
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 INTEGRATION TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your integration is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your frontend: npm run dev');
    console.log('2. Open http://localhost:3000');
    console.log('3. Test the complete application flow');
    console.log('4. Deploy frontend to your hosting platform');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend configuration.');
  }
  
  console.log('\n🔗 Useful Links:');
  console.log(`   Backend API: ${BACKEND_URL}`);
  console.log(`   Swagger Docs: ${BACKEND_URL}/api-docs`);
  console.log(`   Health Check: ${BACKEND_URL}/health`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
}

// Run the tests
runIntegrationTests().catch(console.error);
