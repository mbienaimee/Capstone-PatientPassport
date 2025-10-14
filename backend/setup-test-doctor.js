#!/usr/bin/env node

/**
 * Verify Test Doctor Email and Test Login
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function verifyTestDoctorEmail() {
  try {
    console.log('🔧 Verifying test doctor email...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the test doctor
    const doctor = await User.findOne({ 
      email: 'test@doctor.com',
      role: 'doctor'
    });
    
    if (!doctor) {
      console.log('❌ Test doctor not found');
      return false;
    }
    
    console.log('Found test doctor:', doctor.name);
    console.log('Current email verification status:', doctor.isEmailVerified);
    
    // Verify the email
    doctor.isEmailVerified = true;
    doctor.emailVerificationToken = null;
    doctor.emailVerificationExpires = null;
    await doctor.save();
    
    console.log('✅ Test doctor email verified successfully!');
    console.log('Email verification status:', doctor.isEmailVerified);
    
    return true;
  } catch (error) {
    console.error('Error verifying test doctor email:', error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

async function testDoctorLoginAfterVerification() {
  console.log('\n🧪 Testing doctor login after email verification...');
  
  const axios = require('axios');
  const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@doctor.com',
      password: 'Password123'
    });
    
    if (response.data.success) {
      console.log('✅ Doctor login successful!');
      console.log(`   Doctor: ${response.data.data.user.name}`);
      console.log(`   Role: ${response.data.data.user.role}`);
      console.log(`   Email: ${response.data.data.user.email}`);
      console.log(`   Token: ${response.data.data.token ? 'Present' : 'Missing'}`);
      
      const token = response.data.data.token;
      
      // Test patient list
      console.log('\n📋 Testing patient list...');
      const patientResponse = await axios.get(`${BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (patientResponse.data.success) {
        const patients = patientResponse.data.data;
        console.log('✅ Patient list loaded successfully!');
        console.log(`   Found ${patients.length} patients in database`);
        
        if (patients.length > 0) {
          console.log('\n   Sample patients:');
          patients.slice(0, 5).forEach((patient, index) => {
            console.log(`   ${index + 1}. ${patient.user?.name || 'Unknown'} (ID: ${patient.nationalId})`);
          });
        }
      }
      
      // Test doctor dashboard
      console.log('\n🏥 Testing doctor dashboard...');
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/doctor`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (dashboardResponse.data.success) {
        const data = dashboardResponse.data.data;
        console.log('✅ Doctor dashboard loaded successfully!');
        console.log(`   Total Patients: ${data.stats?.totalPatients || 0}`);
        console.log(`   Medical Conditions: ${data.stats?.totalMedicalConditions || 0}`);
        console.log(`   Medications: ${data.stats?.totalMedications || 0}`);
        console.log(`   Test Results: ${data.stats?.totalTestResults || 0}`);
      }
      
      console.log('\n🎉 All tests passed! Doctor login and patient list functionality is working correctly.');
      console.log('\n📋 Working Test Credentials:');
      console.log('Email: test@doctor.com');
      console.log('Password: Password123');
      
      return true;
    } else {
      console.log('❌ Doctor login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Doctor login error:', error.response?.data?.message || error.message);
    console.log('Full error:', error.response?.data || error);
    return false;
  }
}

async function runTest() {
  console.log('🔧 Setting up test doctor for login testing...\n');
  
  const emailVerified = await verifyTestDoctorEmail();
  
  if (emailVerified) {
    await testDoctorLoginAfterVerification();
  } else {
    console.log('❌ Failed to verify email, cannot test login');
  }
}

runTest().catch(console.error);
