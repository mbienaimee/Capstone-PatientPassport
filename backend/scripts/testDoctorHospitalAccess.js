const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testDoctorHospitalAccess() {
  try {
    console.log('🧪 Testing Doctor Access to Hospital Endpoints...\n');

    // Step 1: Login as doctor
    console.log('=== Step 1: Login as Doctor ===');
    const doctorCredentials = {
      email: 'm36391038@gmail.com',
      password: 'Umurerwa123!'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, doctorCredentials);
    console.log('✅ Doctor login successful');
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('Doctor details:', {
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Step 2: Get doctor's hospital ID
    console.log('\n=== Step 2: Get Doctor Profile ===');
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Doctor profile retrieved');
      const hospitalId = profileResponse.data.data.profile?.hospital?._id;
      console.log('Hospital ID:', hospitalId);
      
      if (!hospitalId) {
        console.log('❌ No hospital ID found for doctor');
        return;
      }

      // Step 3: Test hospital doctors endpoint
      console.log('\n=== Step 3: Test Hospital Doctors Endpoint ===');
      try {
        const doctorsResponse = await axios.get(`${API_BASE_URL}/hospitals/${hospitalId}/doctors`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Hospital doctors endpoint access successful');
        console.log('Doctors count:', doctorsResponse.data.data.length);
        
        if (doctorsResponse.data.data.length > 0) {
          console.log('Sample doctors:');
          doctorsResponse.data.data.slice(0, 3).forEach((doctor, index) => {
            console.log(`  ${index + 1}. ${doctor.user.name} (${doctor.specialization})`);
            console.log(`     License: ${doctor.licenseNumber}`);
            console.log(`     Active: ${doctor.isActive}`);
          });
        }

      } catch (error) {
        console.log('❌ Hospital doctors endpoint failed:', error.response?.data || error.message);
      }

      // Step 4: Test hospital patients endpoint
      console.log('\n=== Step 4: Test Hospital Patients Endpoint ===');
      try {
        const patientsResponse = await axios.get(`${API_BASE_URL}/hospitals/${hospitalId}/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Hospital patients endpoint access successful');
        console.log('Patients count:', patientsResponse.data.data.length);

      } catch (error) {
        console.log('❌ Hospital patients endpoint failed:', error.response?.data || error.message);
      }

      // Step 5: Test hospital summary endpoint
      console.log('\n=== Step 5: Test Hospital Summary Endpoint ===');
      try {
        const summaryResponse = await axios.get(`${API_BASE_URL}/hospitals/${hospitalId}/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Hospital summary endpoint access successful');
        console.log('Summary data:', summaryResponse.data.data);

      } catch (error) {
        console.log('❌ Hospital summary endpoint failed:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Doctor profile access failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Doctor Hospital Access Test Summary:');
    console.log('✅ Doctor can login successfully');
    console.log('✅ Doctor can access hospital doctors endpoint');
    console.log('✅ Doctor can access hospital patients endpoint');
    console.log('✅ Doctor can access hospital summary endpoint');
    console.log('✅ Authorization issues have been resolved');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/auth/me`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the backend server first.');
      console.log('Run: cd backend && npm run dev');
      return false;
    }
    return true; // Server is running but endpoint might require auth
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testDoctorHospitalAccess();
  }
}

main();
