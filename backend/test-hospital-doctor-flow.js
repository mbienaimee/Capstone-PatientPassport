#!/usr/bin/env node

/**
 * Test Script: Hospital-Doctor-Patient Flow
 * 
 * This script tests the complete flow:
 * 1. Hospital login
 * 2. Hospital dashboard with doctor list
 * 3. Doctor login
 * 4. Doctor dashboard with patient list
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_HOSPITAL_EMAIL = 'kingfaisal@hospital.com';
const TEST_HOSPITAL_PASSWORD = 'password123';

// Test data
let hospitalToken = null;
let doctorToken = null;
let hospitalId = null;
let doctorId = null;

console.log('🏥 Testing Hospital-Doctor-Patient Flow\n');

async function testHospitalLogin() {
  console.log('1️⃣ Testing Hospital Login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_HOSPITAL_EMAIL,
      password: TEST_HOSPITAL_PASSWORD
    });
    
    if (response.data.success) {
      hospitalToken = response.data.data.token;
      console.log('✅ Hospital login successful');
      console.log(`   Hospital: ${response.data.data.user.name}`);
      console.log(`   Role: ${response.data.data.user.role}`);
      return true;
    } else {
      console.log('❌ Hospital login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Hospital login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHospitalDashboard() {
  console.log('\n2️⃣ Testing Hospital Dashboard...');
  
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/hospital`, {
      headers: {
        'Authorization': `Bearer ${hospitalToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      hospitalId = data.hospital?._id;
      
      console.log('✅ Hospital dashboard loaded');
      console.log(`   Hospital: ${data.hospital?.name}`);
      console.log(`   Total Doctors: ${data.stats?.totalDoctors || 0}`);
      console.log(`   Total Patients: ${data.stats?.totalPatients || 0}`);
      return true;
    } else {
      console.log('❌ Hospital dashboard failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Hospital dashboard error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetHospitalDoctors() {
  console.log('\n3️⃣ Testing Hospital Doctors List...');
  
  if (!hospitalId) {
    console.log('❌ No hospital ID available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/hospitals/${hospitalId}/doctors`, {
      headers: {
        'Authorization': `Bearer ${hospitalToken}`
      }
    });
    
    if (response.data.success) {
      const doctors = response.data.data;
      console.log('✅ Hospital doctors list loaded');
      console.log(`   Found ${doctors.length} doctors`);
      
      if (doctors.length > 0) {
        const firstDoctor = doctors[0];
        doctorId = firstDoctor._id;
        console.log(`   First Doctor: Dr. ${firstDoctor.user.name}`);
        console.log(`   Specialization: ${firstDoctor.specialization}`);
        console.log(`   License: ${firstDoctor.licenseNumber}`);
        return true;
      } else {
        console.log('⚠️  No doctors found in hospital');
        return false;
      }
    } else {
      console.log('❌ Hospital doctors list failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Hospital doctors list error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDoctorLogin() {
  console.log('\n4️⃣ Testing Doctor Login...');
  
  if (!hospitalId) {
    console.log('❌ No hospital ID available');
    return false;
  }
  
  try {
    // First get doctor details
    const doctorsResponse = await axios.get(`${BASE_URL}/hospitals/${hospitalId}/doctors`, {
      headers: {
        'Authorization': `Bearer ${hospitalToken}`
      }
    });
    
    if (!doctorsResponse.data.success || doctorsResponse.data.data.length === 0) {
      console.log('❌ No doctors available for login test');
      return false;
    }
    
    const doctor = doctorsResponse.data.data[0];
    const doctorEmail = doctor.user.email;
    
    // Try to login as doctor (using default password)
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: doctorEmail,
      password: 'password123' // Default password for test doctors
    });
    
    if (loginResponse.data.success) {
      doctorToken = loginResponse.data.data.token;
      console.log('✅ Doctor login successful');
      console.log(`   Doctor: Dr. ${loginResponse.data.data.user.name}`);
      console.log(`   Role: ${loginResponse.data.data.user.role}`);
      return true;
    } else {
      console.log('❌ Doctor login failed:', loginResponse.data.message);
      console.log('   This might be expected if doctor requires OTP verification');
      return false;
    }
  } catch (error) {
    console.log('❌ Doctor login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDoctorDashboard() {
  console.log('\n5️⃣ Testing Doctor Dashboard...');
  
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
      console.log(`   Doctor: Dr. ${data.user.name}`);
      console.log(`   Specialization: ${data.profile?.specialization}`);
      console.log(`   Hospital: ${data.profile?.hospital?.name}`);
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

async function testGetPatients() {
  console.log('\n6️⃣ Testing Patient List...');
  
  try {
    const response = await axios.get(`${BASE_URL}/patients`, {
      headers: {
        'Authorization': `Bearer ${doctorToken || hospitalToken}`
      }
    });
    
    if (response.data.success) {
      const patients = response.data.data;
      console.log('✅ Patient list loaded');
      console.log(`   Found ${patients.length} patients in database`);
      
      if (patients.length > 0) {
        const firstPatient = patients[0];
        console.log(`   First Patient: ${firstPatient.user?.name || firstPatient.name}`);
        console.log(`   National ID: ${firstPatient.nationalId}`);
        console.log(`   Status: ${firstPatient.status}`);
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

async function runTests() {
  console.log('Starting Hospital-Doctor-Patient Flow Tests...\n');
  
  const results = {
    hospitalLogin: await testHospitalLogin(),
    hospitalDashboard: await testHospitalDashboard(),
    hospitalDoctors: await testGetHospitalDoctors(),
    doctorLogin: await testDoctorLogin(),
    doctorDashboard: await testDoctorDashboard(),
    patientList: await testGetPatients()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Hospital Login: ${results.hospitalLogin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Hospital Dashboard: ${results.hospitalDashboard ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Hospital Doctors: ${results.hospitalDoctors ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Doctor Login: ${results.doctorLogin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Doctor Dashboard: ${results.doctorDashboard ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Patient List: ${results.patientList ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The hospital-doctor-patient flow is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n🔗 Frontend Flow:');
  console.log('1. Go to /hospital-login');
  console.log('2. Login with hospital credentials');
  console.log('3. View hospital dashboard with doctor list');
  console.log('4. Click "Login as Doctor" for any doctor');
  console.log('5. Enter doctor password');
  console.log('6. View doctor dashboard with patient list');
}

// Run the tests
runTests().catch(console.error);
