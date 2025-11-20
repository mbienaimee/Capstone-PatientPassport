/**
 * Test System Metrics
 * 
 * This script generates sample metrics data for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  SYSTEM METRICS TEST');
  console.log('='.repeat(60) + '\n');

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.log('\n💡 Make sure your server is running: npm run dev\n');
    process.exit(1);
  }

  const SystemMetrics = require('./dist/models/SystemMetrics').default;

  console.log('📊 Generating sample metrics data...\n');

  // 1. Create sample response time metrics
  console.log('1️⃣ Creating response time metrics...');
  const endpoints = [
    { path: '/api/patients', method: 'GET' },
    { path: '/api/medical-records', method: 'GET' },
    { path: '/api/passport-access', method: 'POST' },
    { path: '/api/dashboard', method: 'GET' },
    { path: '/api/auth/login', method: 'POST' }
  ];

  for (const endpoint of endpoints) {
    for (let i = 0; i < 10; i++) {
      await SystemMetrics.create({
        metricType: 'response_time',
        endpoint: endpoint.path,
        method: endpoint.method,
        responseTime: Math.random() * 500 + 50, // 50-550ms
        statusCode: Math.random() > 0.05 ? 200 : 500, // 95% success rate
        timestamp: new Date(Date.now() - Math.random() * 86400000) // Last 24 hours
      });
    }
  }
  console.log('   ✅ Created 50 response time metrics\n');

  // 2. Create sample accuracy metrics
  console.log('2️⃣ Creating accuracy metrics...');
  const operations = ['patient-sync', 'medical-record-validation', 'passport-generation'];
  
  for (const operation of operations) {
    for (let i = 0; i < 20; i++) {
      const isAccurate = Math.random() > 0.02; // 98% accurate
      await SystemMetrics.create({
        metricType: 'accuracy',
        operation,
        isAccurate,
        accuracyScore: isAccurate ? 100 : 0,
        timestamp: new Date(Date.now() - Math.random() * 86400000)
      });
    }
  }
  console.log('   ✅ Created 60 accuracy metrics\n');

  // 3. Create sample usability metrics
  console.log('3️⃣ Creating usability metrics...');
  const actions = [
    'view-patient-passport',
    'update-medical-record',
    'search-patient',
    'generate-report',
    'login'
  ];

  for (const action of actions) {
    for (let i = 0; i < 15; i++) {
      await SystemMetrics.create({
        metricType: 'usability',
        action,
        userRole: Math.random() > 0.5 ? 'patient' : 'doctor',
        completionTime: Math.random() * 5000 + 1000, // 1-6 seconds
        clickCount: Math.floor(Math.random() * 10) + 1,
        errorCount: Math.random() > 0.8 ? 1 : 0,
        satisfactionScore: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        timestamp: new Date(Date.now() - Math.random() * 86400000)
      });
    }
  }
  console.log('   ✅ Created 75 usability metrics\n');

  // 4. Create sample error metrics
  console.log('4️⃣ Creating error metrics...');
  const errorTypes = ['ValidationError', 'NetworkError', 'AuthenticationError'];
  
  for (const errorType of errorTypes) {
    for (let i = 0; i < 5; i++) {
      await SystemMetrics.create({
        metricType: 'error',
        errorType,
        errorMessage: `Sample ${errorType} for testing`,
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)].path,
        timestamp: new Date(Date.now() - Math.random() * 86400000)
      });
    }
  }
  console.log('   ✅ Created 15 error metrics\n');

  // 5. Display summary
  console.log('='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60) + '\n');

  const counts = await Promise.all([
    SystemMetrics.countDocuments({ metricType: 'response_time' }),
    SystemMetrics.countDocuments({ metricType: 'accuracy' }),
    SystemMetrics.countDocuments({ metricType: 'usability' }),
    SystemMetrics.countDocuments({ metricType: 'error' })
  ]);

  console.log(`Response Time Metrics:  ${counts[0]}`);
  console.log(`Accuracy Metrics:       ${counts[1]}`);
  console.log(`Usability Metrics:      ${counts[2]}`);
  console.log(`Error Metrics:          ${counts[3]}`);
  console.log(`Total Metrics:          ${counts.reduce((a, b) => a + b, 0)}\n`);

  console.log('='.repeat(60));
  console.log('  NEXT STEPS');
  console.log('='.repeat(60) + '\n');

  console.log('1️⃣ Check metrics with CLI:');
  console.log('   node check-system-metrics.js\n');

  console.log('2️⃣ Test API endpoints (need admin token):');
  console.log('   GET  http://localhost:5000/api/metrics/health');
  console.log('   GET  http://localhost:5000/api/metrics/dashboard');
  console.log('   GET  http://localhost:5000/api/metrics/endpoints\n');

  console.log('3️⃣ Read the complete guide:');
  console.log('   METRICS_GUIDE.md\n');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
