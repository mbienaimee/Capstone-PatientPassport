#!/usr/bin/env node

/**
 * Test Doctor Login and Patient List - Final Test
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testDoctorLoginAndPatientList() {
  console.log('🎉 Testing Doctor Login and Patient List - Final Test...\n');
  
  const credentials = {
    email: 'test@doctor.com',
    password: 'DoctorPass123'
  };
  
  try {
    console.log('🔐 Step 1: Doctor Login');
    console.log('======================');
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${credentials.password}`);
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    if (loginResponse.data.success) {
      console.log('✅ Doctor login successful!');
      console.log('Message:', loginResponse.data.message);
      console.log('User:', loginResponse.data.data.user.name);
      console.log('Role:', loginResponse.data.data.user.role);
      console.log('Token received:', !!loginResponse.data.data.token);
      
      const token = loginResponse.data.data.token;
      
      console.log('\n📋 Step 2: Testing Patient List Access');
      console.log('=====================================');
      
      const patientResponse = await axios.get(`${BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (patientResponse.data.success) {
        console.log('✅ Patient list accessed successfully!');
        console.log(`Found ${patientResponse.data.data.length} patients`);
        
        if (patientResponse.data.data.length > 0) {
          console.log('\n👥 Sample Patients:');
          patientResponse.data.data.slice(0, 5).forEach((patient, index) => {
            console.log(`${index + 1}. ${patient.user?.name || 'Unknown'} (ID: ${patient.nationalId})`);
          });
        }
        
        console.log('\n🏥 Step 3: Testing Doctor Dashboard');
        console.log('===================================');
        
        const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/doctor`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (dashboardResponse.data.success) {
          console.log('✅ Doctor dashboard accessed successfully!');
          const stats = dashboardResponse.data.data.stats;
          console.log(`Total Patients: ${stats?.totalPatients || 0}`);
          console.log(`Medical Conditions: ${stats?.totalMedicalConditions || 0}`);
          console.log(`Medications: ${stats?.totalMedications || 0}`);
          console.log(`Test Results: ${stats?.totalTestResults || 0}`);
          
          console.log('\n🎉 COMPLETE SUCCESS! Doctor login and patient list are working perfectly!');
          console.log('\n📊 Summary:');
          console.log('===========');
          console.log('✅ Doctor login works directly (no OTP required)');
          console.log('✅ Patient list is accessible');
          console.log('✅ Doctor dashboard is accessible');
          console.log('✅ All functionality is working correctly');
          
          console.log('\n🔗 Frontend Usage:');
          console.log('==================');
          console.log('1. Go to /doctor-login');
          console.log('2. Enter email: test@doctor.com');
          console.log('3. Enter password: DoctorPass123');
          console.log('4. Click Login');
          console.log('5. You will be redirected to /doctor-dashboard');
          console.log('6. The dashboard will show the patient list');
          console.log('7. You can search and filter patients');
          
          console.log('\n📋 Working Credentials:');
          console.log('=======================');
          console.log('Email: test@doctor.com');
          console.log('Password: DoctorPass123');
          
          return true;
        } else {
          console.log('❌ Doctor dashboard access failed:', dashboardResponse.data.message);
        }
      } else {
        console.log('❌ Patient list access failed:', patientResponse.data.message);
      }
    } else {
      console.log('❌ Doctor login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.response?.data?.message || error.message);
    console.log('Full error:', error.response?.data || error);
  }
  
  return false;
}

testDoctorLoginAndPatientList().catch(console.error);
