const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function checkPassportDataNow() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'm.bienaimee@alustudent.com',
      password: 'Bienaimee@2004'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;
    console.log('✅ Logged in - User ID:', userId);

    console.log('\n📡 Fetching passport data...');
    const passportResponse = await axios.get(`${API_URL}/api/patients/passport/${userId}`, {
      headers: { 'x-auth-token': token }
    });

    const data = passportResponse.data.data;
    const conditions = data.medicalRecords?.conditions || [];
    
    console.log(`\n📊 API Response Summary:`);
    console.log(`Total conditions returned: ${conditions.length}`);
    
    if (conditions.length === 0) {
      console.log('❌ NO CONDITIONS IN API RESPONSE!');
      console.log('\nFull response:', JSON.stringify(passportResponse.data, null, 2));
      return;
    }

    // Group by date to see what frontend will show
    console.log('\n📅 Conditions grouped by diagnosed date:\n');
    const byDate = {};
    conditions.forEach(cond => {
      const date = cond.data?.diagnosed || cond.createdAt || 'Unknown date';
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push({
        name: cond.data?.name || 'Unknown',
        details: cond.data?.details || 'No details',
        synced: cond.openmrsData?.synced ? 'OpenMRS' : 'Manual'
      });
    });

    Object.entries(byDate).sort().reverse().forEach(([date, conds]) => {
      console.log(`\n📆 ${date} (${conds.length} observations)`);
      conds.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} - ${c.details} [${c.synced}]`);
      });
      if (conds.length > 5) {
        console.log(`   ... and ${conds.length - 5} more`);
      }
    });

    // Show most recent 5
    console.log('\n\n🔍 Most recent 5 conditions by createdAt:\n');
    const sorted = [...conditions].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    sorted.slice(0, 5).forEach((cond, i) => {
      console.log(`${i + 1}. ${cond.data?.name || 'Unknown'}`);
      console.log(`   Details: ${cond.data?.details || 'N/A'}`);
      console.log(`   Diagnosed: ${cond.data?.diagnosed || 'Not set'}`);
      console.log(`   Created: ${cond.createdAt}`);
      console.log(`   OpenMRS: ${cond.openmrsData?.synced ? 'YES ✅' : 'NO'}`);
      console.log('');
    });

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status);
      console.error('Message:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to backend on port 5000');
      console.error('   Make sure backend is running: npm run dev');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

checkPassportDataNow();
