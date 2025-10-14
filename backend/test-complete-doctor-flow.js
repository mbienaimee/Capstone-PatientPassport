#!/usr/bin/env node

/**
 * Complete Doctor Login Flow Test
 * 
 * This script tests the complete doctor login flow including OTP
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testCompleteDoctorLoginFlow() {
  console.log('🧪 Testing Complete Doctor Login Flow...\n');
  
  const credentials = {
    email: 'test@doctor.com',
    password: 'Password123'
  };
  
  console.log('📋 Step 1: Initial Login (should require OTP)');
  console.log('==============================================');
  console.log(`Email: ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    console.log('✅ Login Response:');
    console.log('Status:', loginResponse.status);
    console.log('Success:', loginResponse.data.success);
    console.log('Message:', loginResponse.data.message);
    
    if (loginResponse.data.success) {
      const data = loginResponse.data.data;
      console.log('\n📊 Response Data:');
      console.log('User:', data.user?.name);
      console.log('Email:', data.email);
      console.log('Requires OTP:', data.requiresOTPVerification);
      
      if (data.requiresOTPVerification) {
        console.log('\n🔐 Step 2: OTP Verification Required');
        console.log('=====================================');
        console.log('✅ Doctor login correctly requires OTP verification');
        console.log('📧 Check the backend console for the OTP code');
        console.log('💡 The OTP should be displayed in the server logs');
        
        // For testing, let's try to get the OTP from the database
        console.log('\n🔍 Step 3: Checking OTP in Database');
        console.log('=====================================');
        
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
          console.log('✅ Found OTP in database:');
          console.log('OTP Code:', recentOTP.code);
          console.log('Expires at:', recentOTP.expiresAt);
          console.log('Created at:', recentOTP.createdAt);
          
          console.log('\n🧪 Step 4: Testing OTP Verification');
          console.log('=====================================');
          
          try {
            const otpResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
              identifier: credentials.email,
              otpCode: recentOTP.code,
              type: 'email'
            });
            
            if (otpResponse.data.success) {
              console.log('✅ OTP verification successful!');
              console.log('Token:', otpResponse.data.data.token ? 'Present' : 'Missing');
              console.log('User:', otpResponse.data.data.user?.name);
              
              // Test patient list with the token
              console.log('\n📋 Step 5: Testing Patient List Access');
              console.log('=====================================');
              
              const patientResponse = await axios.get(`${BASE_URL}/patients`, {
                headers: {
                  'Authorization': `Bearer ${otpResponse.data.data.token}`
                }
              });
              
              if (patientResponse.data.success) {
                console.log('✅ Patient list accessed successfully!');
                console.log(`Found ${patientResponse.data.data.length} patients`);
                
                console.log('\n🎉 SUCCESS! Complete doctor login flow is working!');
                console.log('\n📋 Summary:');
                console.log('1. ✅ Doctor login requires OTP (correct behavior)');
                console.log('2. ✅ OTP is generated and stored in database');
                console.log('3. ✅ OTP verification works');
                console.log('4. ✅ Doctor can access patient list after OTP verification');
                
                console.log('\n🔗 Frontend Flow:');
                console.log('1. Doctor enters email/password');
                console.log('2. System shows OTP verification modal');
                console.log('3. Doctor enters OTP from email/console');
                console.log('4. Doctor is redirected to dashboard with patient list');
                
                return true;
              } else {
                console.log('❌ Patient list access failed:', patientResponse.data.message);
              }
            } else {
              console.log('❌ OTP verification failed:', otpResponse.data.message);
            }
          } catch (otpError) {
            console.log('❌ OTP verification error:', otpError.response?.data?.message || otpError.message);
          }
        } else {
          console.log('❌ No OTP found in database');
          console.log('💡 Check if OTP generation is working');
        }
        
        await mongoose.disconnect();
      } else {
        console.log('❌ Login should require OTP for doctors');
      }
    }
    
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    console.log('Full error:', error.response?.data);
  }
  
  return false;
}

async function runTest() {
  console.log('🔍 Testing Complete Doctor Login Flow...\n');
  
  const success = await testCompleteDoctorLoginFlow();
  
  if (success) {
    console.log('\n✅ Doctor login and patient list functionality is working correctly!');
    console.log('\n📋 Working Test Credentials:');
    console.log('Email: test@doctor.com');
    console.log('Password: Password123');
    console.log('\n💡 Note: Check backend console for OTP codes during testing');
  } else {
    console.log('\n❌ There are still issues with the doctor login flow.');
  }
}

runTest().catch(console.error);
