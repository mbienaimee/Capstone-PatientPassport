#!/usr/bin/env node

/**
 * Test Script: Doctor Login and Patient List Flow
 * 
 * This script tests:
 * 1. Doctor login
 * 2. Doctor dashboard with patient list
 * 3. Patient list API access
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test data - we'll create these accounts
const TEST_DOCTOR_EMAIL = 'doctor@test.com';
const TEST_DOCTOR_PASSWORD = 'Password123';

let doctorToken = null;

console.log('👨‍⚕️ Testing Doctor Login and Patient List Flow\n');

async function createTestDoctor() {
  console.log('1️⃣ Creating Test Doctor Account...');
  
  try {
    // First, let's try to login with a doctor account
    // If it doesn't exist, we'll create one
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_DOCTOR_EMAIL,
      password: TEST_DOCTOR_PASSWORD
    });
    
    if (loginResponse.data.success) {
      doctorToken = loginResponse.data.data.token;
      console.log('✅ Doctor login successful');
      console.log(`   Doctor: ${loginResponse.data.data.user.name}`);
      console.log(`   Role: ${loginResponse.data.data.user.role}`);
      return true;
    }
  } catch (error) {
    console.log('⚠️  Doctor account not found, will create one...');
  }
  
  // Create doctor account
  try {
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Dr. Test Doctor',
      email: TEST_DOCTOR_EMAIL,
      password: TEST_DOCTOR_PASSWORD,
      confirmPassword: TEST_DOCTOR_PASSWORD,
      role: 'doctor'
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Doctor account created');
      console.log(`   Doctor: ${registerResponse.data.data.user.name}`);
      console.log(`   Email: ${registerResponse.data.data.user.email}`);
      
      // Try to login with the new account
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_DOCTOR_EMAIL,
        password: TEST_DOCTOR_PASSWORD
      });
      
      if (loginResponse.data.success) {
        doctorToken = loginResponse.data.data.token;
        console.log('✅ Doctor login successful after creation');
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Error creating doctor account:', error.response?.data?.message || error.message);
  }
  
  return false;
}

async function testDoctorProfile() {
  console.log('\n2️⃣ Testing Doctor Profile...');
  
  if (!doctorToken) {
    console.log('❌ No doctor token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ Doctor profile loaded');
      console.log(`   Doctor: ${data.user.name}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Is Active: ${data.user.isActive}`);
      console.log(`   Is Email Verified: ${data.user.isEmailVerified}`);
      return true;
    } else {
      console.log('❌ Doctor profile failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Doctor profile error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPatientList() {
  console.log('\n3️⃣ Testing Patient List API...');
  
  if (!doctorToken) {
    console.log('❌ No doctor token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/patients`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    
    if (response.data.success) {
      const patients = response.data.data;
      console.log('✅ Patient list loaded');
      console.log(`   Found ${patients.length} patients in database`);
      
      if (patients.length > 0) {
        console.log('\n   Sample patients:');
        patients.slice(0, 3).forEach((patient, index) => {
          console.log(`   ${index + 1}. ${patient.user?.name || 'Unknown'} (ID: ${patient.nationalId})`);
        });
      } else {
        console.log('   ⚠️  No patients found in database');
      }
      return true;
    } else {
      console.log('❌ Patient list failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Patient list error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDoctorDashboard() {
  console.log('\n4️⃣ Testing Doctor Dashboard...');
  
  if (!doctorToken) {
    console.log('❌ No doctor token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/doctor`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ Doctor dashboard loaded');
      console.log(`   Total Patients: ${data.stats?.totalPatients || 0}`);
      console.log(`   Medical Conditions: ${data.stats?.totalMedicalConditions || 0}`);
      console.log(`   Medications: ${data.stats?.totalMedications || 0}`);
      console.log(`   Test Results: ${data.stats?.totalTestResults || 0}`);
      
      if (data.stats?.recentPatients && data.stats.recentPatients.length > 0) {
        console.log(`   Recent Patients: ${data.stats.recentPatients.length}`);
      }
      
      return true;
    } else {
      console.log('❌ Doctor dashboard failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Doctor dashboard error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting Doctor Login and Patient List Tests...\n');
  
  const results = {
    doctorCreation: await createTestDoctor(),
    doctorProfile: await testDoctorProfile(),
    patientList: await testPatientList(),
    doctorDashboard: await testDoctorDashboard()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Doctor Creation/Login: ${results.doctorCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Doctor Profile: ${results.doctorProfile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Patient List API: ${results.patientList ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Doctor Dashboard: ${results.doctorDashboard ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Doctor login and patient list functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n🔗 Frontend Flow:');
  console.log('1. Go to /doctor-login');
  console.log('2. Login with doctor credentials');
  console.log('3. View doctor dashboard with patient list');
  console.log('4. Patient list should display all patients');
  console.log('5. Search and filter functionality should work');
  
  console.log('\n📋 Test Credentials:');
  console.log(`Email: ${TEST_DOCTOR_EMAIL}`);
  console.log(`Password: ${TEST_DOCTOR_PASSWORD}`);
}

// Run the tests
runTests().catch(console.error);
