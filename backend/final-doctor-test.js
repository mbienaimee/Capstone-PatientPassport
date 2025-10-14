#!/usr/bin/env node

/**
 * Final Doctor Login and Patient List Test
 * 
 * This script tests the complete doctor login flow and patient list functionality
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testCompleteDoctorFlow() {
  console.log('🎉 Testing Complete Doctor Login and Patient List Flow...\n');
  
  const credentials = {
    email: 'test@doctor.com',
    password: 'DoctorPass123'
  };
  
  console.log('📋 Test Credentials:');
  console.log(`Email: ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
  
  try {
    console.log('\n🔐 Step 1: Doctor Login (Password Verification)');
    console.log('================================================');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    if (loginResponse.data.success) {
      console.log('✅ Doctor login successful!');
      console.log('Message:', loginResponse.data.message);
      
      if (loginResponse.data.data.requiresOTPVerification) {
        console.log('✅ OTP verification required (correct behavior)');
        
        console.log('\n📧 Step 2: Getting OTP from Database');
        console.log('=====================================');
        
        // Get OTP from database
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        await mongoose.connect(process.env.MONGODB_URI);
        const OTP = require('./dist/models/OTP').default;
        
        const recentOTP = await OTP.findOne({
          identifier: credentials.email,
          type: 'email',
          isUsed: false,
          expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        
        if (recentOTP) {
          console.log('✅ OTP found in database');
          console.log('OTP Code:', recentOTP.code);
          console.log('Expires at:', recentOTP.expiresAt);
          
          console.log('\n🔐 Step 3: OTP Verification');
          console.log('===========================');
          
          const otpResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
            identifier: credentials.email,
            otpCode: recentOTP.code,
            type: 'email'
          });
          
          if (otpResponse.data.success) {
            console.log('✅ OTP verification successful!');
            console.log('Token received:', !!otpResponse.data.data.token);
            console.log('User:', otpResponse.data.data.user?.name);
            console.log('Role:', otpResponse.data.data.user?.role);
            
            const token = otpResponse.data.data.token;
            
            console.log('\n📋 Step 4: Testing Patient List Access');
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
                patientResponse.data.data.slice(0, 3).forEach((patient, index) => {
                  console.log(`${index + 1}. ${patient.user?.name || 'Unknown'} (ID: ${patient.nationalId})`);
                });
              }
              
              console.log('\n🏥 Step 5: Testing Doctor Dashboard');
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
                
                console.log('\n🎉 COMPLETE SUCCESS! All functionality is working!');
                console.log('\n📊 Test Results Summary:');
                console.log('========================');
                console.log('✅ Doctor login with password verification');
                console.log('✅ OTP generation and storage');
                console.log('✅ OTP verification');
                console.log('✅ Patient list access');
                console.log('✅ Doctor dashboard access');
                
                console.log('\n🔗 Frontend Flow:');
                console.log('=================');
                console.log('1. Doctor goes to /doctor-login');
                console.log('2. Enters email: test@doctor.com');
                console.log('3. Enters password: DoctorPass123');
                console.log('4. System shows OTP verification modal');
                console.log('5. Doctor enters OTP from email/console');
                console.log('6. Doctor is redirected to /doctor-dashboard');
                console.log('7. Dashboard shows patient list with search/filter');
                
                console.log('\n📋 Working Test Credentials:');
                console.log('============================');
                console.log('Email: test@doctor.com');
                console.log('Password: DoctorPass123');
                console.log('Note: OTP codes are displayed in backend console');
                
                return true;
              } else {
                console.log('❌ Doctor dashboard access failed:', dashboardResponse.data.message);
              }
            } else {
              console.log('❌ Patient list access failed:', patientResponse.data.message);
            }
          } else {
            console.log('❌ OTP verification failed:', otpResponse.data.message);
          }
        } else {
          console.log('❌ No OTP found in database');
        }
        
        await mongoose.disconnect();
      } else {
        console.log('❌ OTP verification should be required for doctors');
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

async function runFinalTest() {
  console.log('🧪 Running Final Doctor Login and Patient List Test...\n');
  
  const success = await testCompleteDoctorFlow();
  
  if (success) {
    console.log('\n🎉 SUCCESS! Doctor login and patient list functionality is working correctly!');
    console.log('\n💡 The issue was that the password was being double-hashed during user creation.');
    console.log('   The User model has a pre-save hook that automatically hashes passwords,');
    console.log('   so we need to provide plain text passwords, not pre-hashed ones.');
  } else {
    console.log('\n❌ There are still issues with the doctor login flow.');
  }
}

runFinalTest().catch(console.error);
