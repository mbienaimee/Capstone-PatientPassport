const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testPassportAPI() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'm.bienaimee@alustudent.com',
      password: 'Bienaimee@2004'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;
    console.log('✅ Logged in successfully');
    console.log('User ID:', userId);

    console.log('\n📡 Fetching passport data...');
    const passportResponse = await axios.get(`${API_URL}/api/patients/passport/${userId}`, {
      headers: { 'x-auth-token': token }
    });

    const passport = passportResponse.data;
    console.log('\n📊 PASSPORT API RESPONSE:');
    console.log('Status:', passportResponse.status);
    console.log('\n🏥 Medical Records:');
    console.log('Total Conditions:', passport.medicalRecords?.conditions?.length || 0);
    
    if (passport.medicalRecords?.conditions) {
      console.log('\n📋 First 5 conditions:');
      passport.medicalRecords.conditions.slice(0, 5).forEach((condition, index) => {
        console.log(`\n${index + 1}. ${condition.data?.name || condition.name || 'Unknown'}`);
        console.log('   Details:', condition.data?.details || condition.details || 'N/A');
        console.log('   Diagnosed:', condition.data?.diagnosed || condition.diagnosed || 'Unknown');
        console.log('   Created:', condition.createdAt);
        console.log('   OpenMRS Synced:', condition.openmrsData?.synced ? 'YES' : 'NO');
      });

      console.log('\n🔍 Checking for duplicates...');
      const seen = new Map();
      passport.medicalRecords.conditions.forEach(condition => {
        const key = `${condition.data?.name || condition.name}_${condition.createdAt}`;
        if (seen.has(key)) {
          seen.set(key, seen.get(key) + 1);
        } else {
          seen.set(key, 1);
        }
      });

      const duplicates = Array.from(seen.entries()).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('⚠️  Found duplicates:');
        duplicates.forEach(([key, count]) => {
          console.log(`   "${key}": ${count} times`);
        });
      } else {
        console.log('✅ No duplicates found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPassportAPI();
