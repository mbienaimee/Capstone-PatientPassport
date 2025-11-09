// Test the patient passport API endpoint
const axios = require('axios');

async function testPassportAPI() {
  try {
    // First, login as Betty Williams to get a token
    console.log('🔐 Logging in as Betty Williams...\n');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'm.bienaimee@alustudent.com',
      password: 'Test1234!' // You may need to adjust this
    });

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user._id;

    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}\n`);

    // Get patient passport
    console.log('📋 Fetching patient passport...\n');
    
    const passportResponse = await axios.get(
      `http://localhost:5000/api/patients/passport/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = passportResponse.data.data;

    console.log('✅ Passport data retrieved successfully\n');
    console.log('📊 Summary:');
    console.log(`   Message: ${passportResponse.data.message}`);
    console.log(`   Patient: ${data.patient?.user?.name || 'Unknown'}`);
    console.log(`   Total Conditions: ${data.medicalRecords?.conditions?.length || 0}`);
    console.log(`   Total Medications: ${data.medicalRecords?.medications?.length || 0}`);
    console.log(`   Total Tests: ${data.medicalRecords?.tests?.length || 0}`);
    console.log(`   Total Visits: ${data.medicalRecords?.visits?.length || 0}\n`);

    // Show recent conditions
    console.log('🔍 Recent 10 Medical Conditions:');
    const conditions = data.medicalRecords?.conditions || [];
    
    conditions.slice(0, 10).forEach((cond, index) => {
      console.log(`\n${index + 1}. ${cond.data.name}`);
      console.log(`   Details: ${cond.data.details}`);
      console.log(`   Diagnosed: ${cond.data.diagnosed}`);
      console.log(`   Status: ${cond.data.status || 'N/A'}`);
      if (cond.openmrsData?.synced) {
        console.log(`   ✅ Synced from OpenMRS`);
      }
    });

    // Check for today's observation
    const today = new Date().toLocaleDateString();
    const todaysConditions = conditions.filter(cond => {
      return cond.data.diagnosed === today || 
             new Date(cond.createdAt).toLocaleDateString() === today;
    });

    console.log(`\n\n🎯 TODAY'S Observations (${today}):`);
    console.log(`   Count: ${todaysConditions.length}\n`);

    if (todaysConditions.length > 0) {
      todaysConditions.forEach((cond, index) => {
        console.log(`${index + 1}. ${cond.data.name} - "${cond.data.details}"`);
        console.log(`   Diagnosed: ${cond.data.diagnosed}`);
        console.log(`   Created: ${new Date(cond.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  No observations from today found in API response');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ No response from server');
      console.error('Is the backend running on http://localhost:5000?');
    } else {
      console.error('❌ Error:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testPassportAPI();
