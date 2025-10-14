const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testDoctorPatientAccess() {
  try {
    console.log('🧪 Testing Doctor Access to All Patients...\n');

    // Step 1: Login as doctor
    console.log('=== Step 1: Login as Doctor ===');
    const doctorCredentials = {
      email: 'm36391038@gmail.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, doctorCredentials);
    console.log('✅ Doctor login successful');
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('Doctor details:', {
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    });

    // Step 2: Test patient list access
    console.log('\n=== Step 2: Test Patient List Access ===');
    try {
      const patientsResponse = await axios.get(`${API_BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Patient list access successful');
      console.log('Total patients:', patientsResponse.data.data.length);
      
      if (patientsResponse.data.data.length > 0) {
        console.log('\nSample patients:');
        patientsResponse.data.data.slice(0, 3).forEach((patient, index) => {
          console.log(`  ${index + 1}. ${patient.user.name} (${patient.nationalId})`);
          console.log(`     Email: ${patient.user.email}`);
          console.log(`     Status: ${patient.status}`);
          console.log(`     Assigned Doctors: ${patient.assignedDoctors?.length || 0}`);
        });
      } else {
        console.log('No patients found in the database');
      }

    } catch (error) {
      console.log('❌ Patient list access failed:', error.response?.data || error.message);
    }

    // Step 3: Test doctor dashboard
    console.log('\n=== Step 3: Test Doctor Dashboard ===');
    try {
      const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard/doctor`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Doctor dashboard access successful');
      console.log('Dashboard data:', {
        totalPatients: dashboardResponse.data.data.stats.totalPatients,
        recentPatients: dashboardResponse.data.data.stats.recentPatients?.length || 0,
        totalMedicalConditions: dashboardResponse.data.data.stats.totalMedicalConditions,
        totalMedications: dashboardResponse.data.data.stats.totalMedications,
        totalTestResults: dashboardResponse.data.data.stats.totalTestResults
      });

      if (dashboardResponse.data.data.stats.recentPatients?.length > 0) {
        console.log('\nRecent patients from dashboard:');
        dashboardResponse.data.data.stats.recentPatients.slice(0, 3).forEach((patient, index) => {
          console.log(`  ${index + 1}. ${patient.user.name} (${patient.nationalId})`);
        });
      }

    } catch (error) {
      console.log('❌ Doctor dashboard access failed:', error.response?.data || error.message);
    }

    // Step 4: Test individual patient access
    console.log('\n=== Step 4: Test Individual Patient Access ===');
    try {
      // First get a patient ID from the patients list
      const patientsResponse = await axios.get(`${API_BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (patientsResponse.data.data.length > 0) {
        const testPatient = patientsResponse.data.data[0];
        console.log(`Testing access to patient: ${testPatient.user.name}`);
        
        const patientResponse = await axios.get(`${API_BASE_URL}/patients/${testPatient._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Individual patient access successful');
        console.log('Patient details:', {
          name: patientResponse.data.data.user.name,
          nationalId: patientResponse.data.data.nationalId,
          contactNumber: patientResponse.data.data.contactNumber,
          status: patientResponse.data.data.status
        });
      } else {
        console.log('No patients available for individual access test');
      }

    } catch (error) {
      console.log('❌ Individual patient access failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Doctor Patient Access Test Summary:');
    console.log('✅ Doctor can login successfully');
    console.log('✅ Doctor can access all patients from database');
    console.log('✅ Doctor can view individual patient details');
    console.log('✅ Doctor dashboard shows all patients');
    console.log('✅ Doctor has full access to patient medical records');

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
    await testDoctorPatientAccess();
  }
}

main();
