/**
 * API Integration Verification Script
 * Run this script to verify the frontend is properly integrated with the deployed API
 */

const API_BASE_URL = 'https://patientpassport-api.azurewebsites.net';
const API_DOCS_URL = `${API_BASE_URL}/api-docs/`;

console.log('🔍 Verifying API Integration...\n');

async function checkEndpoint(url, name) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log(`✅ ${name}: OK (${response.status})`);
      return true;
    } else {
      console.log(`❌ ${name}: Failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return false;
  }
}

async function verifyIntegration() {
  const checks = [
    { url: `${API_BASE_URL}/health`, name: 'API Health Endpoint' },
    { url: API_BASE_URL, name: 'API Root Endpoint' },
    { url: API_DOCS_URL, name: 'Swagger Documentation' },
  ];

  console.log('Checking endpoints...\n');
  const results = await Promise.all(checks.map(check => checkEndpoint(check.url, check.name)));

  console.log('\n📊 Summary:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✅ All checks passed! Integration is working correctly.');
    console.log(`\n📚 Swagger Documentation: ${API_DOCS_URL}`);
    console.log(`🔗 API Base URL: ${API_BASE_URL}/api`);
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.');
  }
}

// Run verification
verifyIntegration().catch(console.error);

