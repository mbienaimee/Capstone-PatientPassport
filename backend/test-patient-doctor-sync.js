const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const doctorCredentials = {
  email: 'doctor@example.com',
  password: 'password123'
};

const patientCredentials = {
  email: 'patient@example.com', 
  password: 'password123'
};

async function testPatientDoctorSync() {
  console.log('🧪 Testing Patient-Doctor Passport Synchronization\n');

  try {
    // Step 1: Login as doctor
    console.log('1️⃣ Logging in as doctor...');
    const doctorLoginResponse = await axios.post(`${BASE_URL}/auth/login`, doctorCredentials);
    const doctorToken = doctorLoginResponse.data.data.token;
    console.log('✅ Doctor logged in successfully\n');

    // Step 2: Login as patient
    console.log('2️⃣ Logging in as patient...');
    const patientLoginResponse = await axios.post(`${BASE_URL}/auth/login`, patientCredentials);
    const patientToken = patientLoginResponse.data.data.token;
    const patientId = patientLoginResponse.data.data.user.id;
    console.log('✅ Patient logged in successfully\n');

    // Step 3: Get patient passport as patient (before doctor updates)
    console.log('3️⃣ Getting patient passport as patient (before updates)...');
    const patientPassportBefore = await axios.get(`${BASE_URL}/patients/passport/${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    const conditionsBefore = patientPassportBefore.data.data.medicalRecords?.conditions?.length || 0;
    const medicationsBefore = patientPassportBefore.data.data.medicalRecords?.medications?.length || 0;
    console.log(`   Conditions before: ${conditionsBefore}`);
    console.log(`   Medications before: ${medicationsBefore}\n`);

    // Step 4: Request OTP as doctor
    console.log('4️⃣ Requesting OTP as doctor...');
    const otpRequestResponse = await axios.post(`${BASE_URL}/passport-access/request-otp`, 
      { patientId }, 
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log('✅ OTP requested successfully\n');

    // Step 5: Verify OTP (simulating patient providing OTP)
    console.log('5️⃣ Verifying OTP...');
    const otpCode = '123456'; // This would normally come from email
    const otpVerifyResponse = await axios.post(`${BASE_URL}/passport-access/verify-otp`, 
      { patientId, otpCode }, 
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log('✅ OTP verified successfully\n');

    // Step 6: Update passport as doctor
    console.log('6️⃣ Updating passport as doctor...');
    const updateData = {
      medicalInfo: {
        medicalConditions: [
          {
            condition: 'Hypertension',
            diagnosedDate: new Date(),
            diagnosedBy: 'Dr. Smith',
            status: 'active',
            notes: 'High blood pressure detected'
          }
        ],
        currentMedications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            prescribedBy: 'Dr. Smith',
            startDate: new Date()
          }
        ]
      }
    };

    const updateResponse = await axios.put(`${BASE_URL}/passport-access/${patientId}`, 
      updateData, 
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log('✅ Passport updated by doctor successfully\n');

    // Step 7: Get patient passport as patient (after doctor updates)
    console.log('7️⃣ Getting patient passport as patient (after updates)...');
    const patientPassportAfter = await axios.get(`${BASE_URL}/patients/passport/${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    const conditionsAfter = patientPassportAfter.data.data.medicalRecords?.conditions?.length || 0;
    const medicationsAfter = patientPassportAfter.data.data.medicalRecords?.medications?.length || 0;
    console.log(`   Conditions after: ${conditionsAfter}`);
    console.log(`   Medications after: ${medicationsAfter}\n`);

    // Step 8: Verify synchronization
    console.log('8️⃣ Verifying synchronization...');
    if (conditionsAfter > conditionsBefore) {
      console.log('✅ Medical conditions updated successfully!');
    } else {
      console.log('❌ Medical conditions not updated');
    }

    if (medicationsAfter > medicationsBefore) {
      console.log('✅ Medications updated successfully!');
    } else {
      console.log('❌ Medications not updated');
    }

    console.log('\n🎉 Patient-Doctor synchronization test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPatientDoctorSync();
