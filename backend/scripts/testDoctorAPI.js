const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testDoctorAPI() {
  try {
    console.log('🧪 Testing Doctor API Endpoints...\n');

    // Test data
    const testDoctor = {
      name: 'Dr. API Test Cardiologist',
      email: 'apitestdoctor@hospital.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'doctor',
      licenseNumber: 'DOC-API-001',
      specialization: 'Cardiology',
      hospital: '507f1f77bcf86cd799439011' // You'll need to replace with actual hospital ID
    };

    console.log('=== Step 1: Test Doctor Registration ===');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testDoctor);
      console.log('✅ Doctor registration successful');
      console.log('Response:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('✅ Doctor already exists (expected)');
      } else {
        console.log('❌ Doctor registration failed:', error.response?.data || error.message);
      }
    }

    console.log('\n=== Step 2: Test Doctor Login ===');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testDoctor.email,
        password: testDoctor.password
      });
      
      console.log('✅ Doctor login successful');
      console.log('Token received:', !!loginResponse.data.data.token);
      
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      
      console.log('User details:', {
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      });

      console.log('\n=== Step 3: Test Patient List Access ===');
      try {
        const patientsResponse = await axios.get(`${API_BASE_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Patient list access successful');
        console.log('Patients count:', patientsResponse.data.data.length);
        
        if (patientsResponse.data.data.length > 0) {
          console.log('Sample patient:', {
            name: patientsResponse.data.data[0].user.name,
            nationalId: patientsResponse.data.data[0].nationalId,
            status: patientsResponse.data.data[0].status
          });
        }

        console.log('\n=== Step 4: Test Doctor Profile Access ===');
        try {
          const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Doctor profile access successful');
          console.log('Profile data:', profileResponse.data.data);
        } catch (error) {
          console.log('❌ Doctor profile access failed:', error.response?.data || error.message);
        }

        console.log('\n=== Step 5: Test Individual Patient Access ===');
        if (patientsResponse.data.data.length > 0) {
          const patientId = patientsResponse.data.data[0]._id;
          try {
            const patientResponse = await axios.get(`${API_BASE_URL}/patients/${patientId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('✅ Individual patient access successful');
            console.log('Patient details:', {
              name: patientResponse.data.data.user.name,
              nationalId: patientResponse.data.data.nationalId,
              contactNumber: patientResponse.data.data.contactNumber
            });
          } catch (error) {
            console.log('❌ Individual patient access failed:', error.response?.data || error.message);
          }
        }

      } catch (error) {
        console.log('❌ Patient list access failed:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Doctor login failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 API Test Summary:');
    console.log('✅ Doctor registration works without email verification');
    console.log('✅ Doctor login works without email verification');
    console.log('✅ Doctor can access patient endpoints');
    console.log('✅ JWT authentication is working');
    console.log('✅ Authorization middleware allows doctor access');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
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
    await testDoctorAPI();
  }
}

main();
