const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function checkAPIDates() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'm.bienaimee@alustudent.com',
      password: 'Bienaimee@2004'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;
    console.log('✅ Logged in - User ID:', userId);

    console.log('\n📡 Fetching passport...');
    const passportResponse = await axios.get(`${API_URL}/api/patients/passport/${userId}`, {
      headers: { 'x-auth-token': token }
    });

    const data = passportResponse.data.data;
    const conditions = data.medicalRecords?.conditions || [];
    
    console.log(`\n📊 Total conditions returned: ${conditions.length}`);
    
    if (conditions.length === 0) {
      console.log('❌ NO CONDITIONS RETURNED!');
      return;
    }
    
    console.log('\n📅 First 10 conditions with dates:\n');
    conditions.slice(0, 10).forEach((cond, index) => {
      console.log(`${index + 1}. ${cond.data?.name || 'Unknown'}`);
      console.log(`   Details: ${cond.data?.details || 'N/A'}`);
      console.log(`   Diagnosed: ${cond.data?.diagnosed || 'Not set'}`);
      console.log(`   Created: ${cond.createdAt || 'Not set'}`);
      console.log(`   Updated: ${cond.updatedAt || 'Not set'}`);
      console.log(`   OpenMRS: ${cond.openmrsData?.synced ? 'YES' : 'NO'}`);
      console.log('');
    });

    // Group by diagnosed date
    console.log('\n📊 Grouping by diagnosed date:');
    const byDate = {};
    conditions.forEach(cond => {
      const diagnosed = cond.data?.diagnosed || cond.createdAt || 'Unknown';
      if (!byDate[diagnosed]) byDate[diagnosed] = 0;
      byDate[diagnosed]++;
    });

    Object.entries(byDate).forEach(([date, count]) => {
      console.log(`   ${date}: ${count} observations`);
    });

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to backend. Is it running on port 5000?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

checkAPIDates();
