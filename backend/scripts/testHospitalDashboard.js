const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testHospitalDashboard() {
  try {
    console.log('🧪 Testing Hospital Dashboard Endpoint...\n');

    // First, let's try to login as a hospital user
    console.log('=== Step 1: Login as Hospital ===');
    
    // You'll need to replace these with actual hospital credentials
    const hospitalCredentials = {
      email: 'kingfaisal@hospital.com', // Replace with actual hospital email
      password: 'password123' // Replace with actual password
    };

    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, hospitalCredentials);
      console.log('✅ Hospital login successful');
      console.log('User:', loginResponse.data.data.user);
      
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      
      console.log('\n=== Step 2: Test Hospital Dashboard ===');
      try {
        const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/hospital`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Hospital dashboard successful');
        console.log('Dashboard data:', dashboardResponse.data);
        
        const hospitalId = dashboardResponse.data.data.hospital._id;
        console.log('Hospital ID:', hospitalId);
        
        console.log('\n=== Step 3: Test Hospital Doctors Endpoint ===');
        try {
          const doctorsResponse = await axios.get(`${API_BASE_URL}/hospitals/${hospitalId}/doctors`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Hospital doctors endpoint successful');
          console.log('Doctors count:', doctorsResponse.data.data.length);
          console.log('Doctors:', doctorsResponse.data.data);
          
        } catch (error) {
          console.log('❌ Hospital doctors endpoint failed:', error.response?.data || error.message);
        }
        
      } catch (error) {
        console.log('❌ Hospital dashboard failed:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Hospital login failed:', error.response?.data || error.message);
      
      // Try to create a test hospital if login fails
      console.log('\n=== Step 1b: Creating Test Hospital ===');
      try {
        const testHospitalData = {
          name: 'Test Hospital',
          email: 'test@hospital.com',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'hospital',
          hospitalName: 'Test Hospital',
          licenseNumber: 'HOSP-TEST-001',
          address: '123 Test St',
          contact: '555-0123',
          adminContact: 'admin@testhospital.com'
        };
        
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testHospitalData);
        console.log('✅ Test hospital created');
        console.log('Response:', registerResponse.data);
        
        // Now try to login with the test hospital
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testHospitalData.email,
          password: testHospitalData.password
        });
        
        console.log('✅ Test hospital login successful');
        const token = loginResponse.data.data.token;
        
        // Test dashboard
        const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/hospital`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Test hospital dashboard successful');
        console.log('Dashboard data:', dashboardResponse.data);
        
      } catch (registerError) {
        console.log('❌ Test hospital creation failed:', registerError.response?.data || registerError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
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
    await testHospitalDashboard();
  }
}

main();
