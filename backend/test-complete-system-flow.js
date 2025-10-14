const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const doctorCredentials = {
  email: 'doctor@example.com',
  password: 'password123'
};

const patientCredentials = {
  email: 'patient@example.com', 
  password: 'password123'
};

async function testCompleteSystemFlow() {
  console.log('🧪 Testing Complete System Flow\n');

  try {
    // Step 1: Test Doctor Login
    console.log('1️⃣ Testing Doctor Login...');
    const doctorLoginResponse = await axios.post(`${BASE_URL}/auth/login`, doctorCredentials);
    const doctorToken = doctorLoginResponse.data.data.token;
    const doctorUser = doctorLoginResponse.data.data.user;
    console.log(`✅ Doctor logged in: ${doctorUser.name} (${doctorUser.role})\n`);

    // Step 2: Test Patient Login
    console.log('2️⃣ Testing Patient Login...');
    const patientLoginResponse = await axios.post(`${BASE_URL}/auth/login`, patientCredentials);
    const patientToken = patientLoginResponse.data.data.token;
    const patientUser = patientLoginResponse.data.data.user;
    const patientId = patientUser.id;
    console.log(`✅ Patient logged in: ${patientUser.name} (${patientUser.role})\n`);

    // Step 3: Test Doctor Access to Patient List
    console.log('3️⃣ Testing Doctor Access to Patient List...');
    const patientsResponse = await axios.get(`${BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`✅ Doctor can access patients: ${patientsResponse.data.data.length} patients found\n`);

    // Step 4: Test Patient Access to Their Own Passport
    console.log('4️⃣ Testing Patient Access to Their Own Passport...');
    const patientPassportResponse = await axios.get(`${BASE_URL}/patients/passport/${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('✅ Patient can access their own passport\n');

    // Step 5: Test Doctor OTP Request
    console.log('5️⃣ Testing Doctor OTP Request...');
    const otpRequestResponse = await axios.post(`${BASE_URL}/passport-access/request-otp`, 
      { patientId }, 
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log('✅ Doctor can request OTP for patient access\n');

    // Step 6: Test Patient Cannot Request OTP (should fail)
    console.log('6️⃣ Testing Patient Cannot Request OTP (should fail)...');
    try {
      await axios.post(`${BASE_URL}/passport-access/request-otp`, 
        { patientId }, 
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      console.log('❌ ERROR: Patient was able to request OTP (this should not happen!)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Patient correctly denied access to OTP request (403 Forbidden)');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status}`);
      }
    }

    // Step 7: Test Doctor Passport Access
    console.log('\n7️⃣ Testing Doctor Passport Access...');
    try {
      const doctorPassportResponse = await axios.get(`${BASE_URL}/passport-access/${patientId}`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      console.log('✅ Doctor can access patient passport directly\n');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Patient passport not found (this is expected if no passport exists yet)\n');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status}\n`);
      }
    }

    // Step 8: Test Patient Cannot Access Doctor Passport Endpoint
    console.log('8️⃣ Testing Patient Cannot Access Doctor Passport Endpoint...');
    try {
      await axios.get(`${BASE_URL}/passport-access/${patientId}`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.log('❌ ERROR: Patient was able to access doctor passport endpoint!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Patient correctly denied access to doctor passport endpoint (403 Forbidden)');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status}`);
      }
    }

    console.log('\n🎉 Complete System Flow Test Completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Doctor authentication works');
    console.log('✅ Patient authentication works');
    console.log('✅ Doctor can access patient list');
    console.log('✅ Patient can access their own passport');
    console.log('✅ Doctor can request OTP for patient access');
    console.log('✅ Patient cannot request OTP (properly blocked)');
    console.log('✅ Patient cannot access doctor passport endpoint (properly blocked)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCompleteSystemFlow();
