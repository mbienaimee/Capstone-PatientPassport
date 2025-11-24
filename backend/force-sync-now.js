const axios = require('axios');

async function forceSyncNow() {
  try {
    console.log('\n🔄 Triggering OpenMRS sync...\n');
    
    // Get auth token first (you'll need to login)
    // For now, let's just trigger the sync endpoint
    const response = await axios.post('http://localhost:5000/api/openmrs-sync/sync-all', {
      fullHistory: true
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Sync triggered successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error triggering sync:', error.response?.data || error.message);
  }
}

forceSyncNow();
