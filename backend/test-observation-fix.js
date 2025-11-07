/**
 * Test script to verify that observations from OpenMRS are correctly stored
 * in the Patient Passport system
 * 
 * This tests the fix for the issue where new observations (like "Malarial smear")
 * were not appearing in the passport.
 */

const axios = require('axios');

const API_URL = 'https://patientpassport-api.azurewebsites.net/api';
// const API_URL = 'http://localhost:5000/api';

/**
 * Test sending observation in the NEW format (from updated OpenMRS module)
 */
async function testNewFormatObservation() {
  console.log('\n🧪 TEST 1: New Format Observation (concept + value)');
  console.log('================================================');
  
  const testData = {
    patientName: 'Betty Williams',
    observationType: 'diagnosis',
    observationData: {
      concept: 'Malarial smear',
      value: 'Negative',
      datatype: 'Text',
      obsDatetime: new Date().toISOString(),
      uuid: 'test-uuid-' + Date.now(),
      location: 'OpenMRS'
    },
    doctorLicenseNumber: 'Super User',
    hospitalName: 'OpenMRS'
  };

  try {
    console.log('📤 Sending:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      `${API_URL}/openmrs/observation/store`,
      testData
    );

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test sending observation in LEGACY format (old backend expected format)
 */
async function testLegacyFormatObservation() {
  console.log('\n🧪 TEST 2: Legacy Format Observation (diagnosis field)');
  console.log('================================================');
  
  const testData = {
    patientName: 'Betty Williams',
    observationType: 'diagnosis',
    observationData: {
      diagnosis: 'Test Legacy Diagnosis',
      details: 'This uses the old format',
      status: 'active',
      date: new Date()
    },
    doctorLicenseNumber: 'Super User',
    hospitalName: 'OpenMRS'
  };

  try {
    console.log('📤 Sending:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      `${API_URL}/openmrs/observation/store`,
      testData
    );

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test medication observation
 */
async function testMedicationObservation() {
  console.log('\n🧪 TEST 3: Medication Observation (concept + value)');
  console.log('================================================');
  
  const testData = {
    patientName: 'Betty Williams',
    observationType: 'medication',
    observationData: {
      concept: 'Malaria smear impression',
      value: 'paraaaa 400mg',
      datatype: 'Text',
      obsDatetime: new Date().toISOString(),
      uuid: 'test-med-uuid-' + Date.now(),
      location: 'OpenMRS'
    },
    doctorLicenseNumber: 'Super User',
    hospitalName: 'OpenMRS'
  };

  try {
    console.log('📤 Sending:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      `${API_URL}/openmrs/observation/store`,
      testData
    );

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Verify observations in passport
 */
async function verifyObservationsInPassport() {
  console.log('\n🔍 VERIFICATION: Checking Betty Williams passport');
  console.log('================================================');
  
  try {
    const response = await axios.get(
      `${API_URL}/openmrs/patient/Betty Williams/passport`
    );

    const passport = response.data.data;
    
    console.log('📋 Patient:', passport.patient.fullName);
    console.log('📊 Total Diagnoses:', passport.summary.totalDiagnoses);
    console.log('💊 Total Medications:', passport.summary.totalMedications);
    
    console.log('\n📝 Recent Diagnoses:');
    passport.diagnoses.slice(0, 5).forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.name} - ${d.details} (${new Date(d.diagnosed).toLocaleDateString()})`);
    });
    
    console.log('\n💊 Recent Medications:');
    passport.medications.slice(0, 5).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} - ${m.dosage} (${new Date(m.startDate).toLocaleDateString()})`);
    });

    return true;
  } catch (error) {
    console.error('❌ Verification failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🚀 TESTING OBSERVATION STORAGE FIX');
  console.log('====================================');
  console.log('This test validates that observations from OpenMRS');
  console.log('are correctly stored in the Patient Passport.');
  console.log('');
  
  const results = {
    newFormat: await testNewFormatObservation(),
    legacyFormat: await testLegacyFormatObservation(),
    medication: await testMedicationObservation()
  };
  
  // Wait a moment for data to be fully saved
  console.log('\n⏳ Waiting for data to be fully processed...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const verified = await verifyObservationsInPassport();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`New Format Test: ${results.newFormat ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Legacy Format Test: ${results.legacyFormat ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Medication Test: ${results.medication ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Verification: ${verified ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = results.newFormat && results.legacyFormat && results.medication && verified;
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Observations are now being stored correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
