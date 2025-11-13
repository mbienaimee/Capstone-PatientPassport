const fetch = require('node-fetch');

async function checkAPIStructure() {
  try {
    console.log('🔍 Testing API response structure...\n');
    
    const response = await fetch('http://localhost:5000/api/patients/passport/690d8bd1ca834ca95a82e17c');
    const data = await response.json();
    
    console.log('✅ API Response received\n');
    console.log('📊 Response structure:');
    console.log('   - success:', data.success);
    console.log('   - message:', data.message);
    console.log('\n📋 Medical Records structure:');
    if (data.data && data.data.medicalRecords) {
      const mr = data.data.medicalRecords;
      console.log('   - conditions:', mr.conditions ? `${mr.conditions.length} items` : 'undefined');
      console.log('   - medications:', mr.medications ? `${mr.medications.length} items` : 'undefined');
      console.log('   - tests:', mr.tests ? `${mr.tests.length} items` : 'undefined');
      console.log('   - visits:', mr.visits ? `${mr.visits.length} items` : 'undefined');
      
      if (mr.conditions && mr.conditions.length > 0) {
        console.log('\n🔍 First condition structure:');
        const firstCond = mr.conditions[0];
        console.log('   Keys:', Object.keys(firstCond).join(', '));
        
        if (firstCond.data) {
          console.log('\n   📦 data object keys:', Object.keys(firstCond.data).join(', '));
          console.log('      - diagnosis:', firstCond.data.diagnosis);
          console.log('      - diagnosedDate:', firstCond.data.diagnosedDate);
          console.log('      - hospital:', firstCond.data.hospital?.name || firstCond.data.hospital);
          console.log('      - openmrsData:', firstCond.data.openmrsData ? `YES (obsId: ${firstCond.data.openmrsData.obsId})` : 'NO');
        }
        
        console.log('\n📋 Second condition (if exists):');
        if (mr.conditions[1]) {
          const secondCond = mr.conditions[1];
          if (secondCond.data) {
            console.log('   - diagnosis:', secondCond.data.diagnosis);
            console.log('   - diagnosedDate:', secondCond.data.diagnosedDate);
            console.log('   - openmrsData:', secondCond.data.openmrsData ? `YES (obsId: ${secondCond.data.openmrsData.obsId})` : 'NO');
          }
        }
        
        // Show last 3 conditions (most recent syncs)
        console.log('\n🆕 Last 3 conditions (most recent):');
        mr.conditions.slice(-3).forEach((cond, idx) => {
          if (cond.data) {
            console.log(`   ${idx + 1}. ${cond.data.diagnosis} - ${cond.data.diagnosedDate} - OpenMRS: ${cond.data.openmrsData ? 'YES' : 'NO'}`);
          }
        });
      }
    } else {
      console.log('   ❌ No medicalRecords found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAPIStructure();
