#!/usr/bin/env node

/**
 * Fix Doctor Login Issue
 * 
 * This script will create a doctor account without double-hashing the password
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function fixDoctorLogin() {
  try {
    console.log('🔧 Fixing Doctor Login Issue...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const testEmail = 'test@doctor.com';
    const testPassword = 'DoctorPass123';
    
    console.log('📋 Step 1: Deleting Existing Test Doctor');
    console.log('========================================');
    
    // Delete existing test user
    await User.deleteOne({ email: testEmail });
    console.log('✅ Deleted existing test user');
    
    console.log('\n🔐 Step 2: Creating Doctor with Plain Password');
    console.log('===============================================');
    
    // Create user with plain password (let the pre-save hook hash it)
    const user = await User.create({
      name: 'Dr. Test Fixed',
      email: testEmail,
      password: testPassword, // Plain password - will be hashed by pre-save hook
      role: 'doctor',
      isActive: true,
      isEmailVerified: true,
      nationalId: '123456789',
      dateOfBirth: '1990-01-01',
      contactNumber: '+1234567890',
      address: 'Test Address',
      gender: 'male'
    });
    
    console.log('✅ User created with plain password');
    console.log('User ID:', user._id);
    console.log('User name:', user.name);
    console.log('User email:', user.email);
    console.log('User role:', user.role);
    
    console.log('\n🧪 Step 3: Testing Password Comparison');
    console.log('=======================================');
    
    // Retrieve user with password field
    const userWithPassword = await User.findOne({ email: testEmail }).select('+password');
    
    if (!userWithPassword) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User retrieved with password');
    console.log('Password field present:', !!userWithPassword.password);
    console.log('Password length:', userWithPassword.password ? userWithPassword.password.length : 0);
    
    // Test password comparison
    try {
      const passwordValid = await userWithPassword.comparePassword(testPassword);
      console.log(`Password "${testPassword}": ${passwordValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (passwordValid) {
        console.log('\n🎉 SUCCESS! Doctor login should work now!');
        
        console.log('\n📋 Step 4: Testing Complete Login Flow');
        console.log('=====================================');
        
        // Test the complete login flow
        const axios = require('axios');
        const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
        
        try {
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: testEmail,
            password: testPassword
          });
          
          if (loginResponse.data.success) {
            console.log('✅ Login API call successful!');
            console.log('Message:', loginResponse.data.message);
            
            if (loginResponse.data.data.requiresOTPVerification) {
              console.log('✅ OTP verification required (correct behavior for doctors)');
              console.log('📧 Check backend console for OTP code');
              
              // Get OTP from database
              const OTP = require('./dist/models/OTP').default;
              const recentOTP = await OTP.findOne({
                identifier: testEmail,
                type: 'email',
                isUsed: false,
                expiresAt: { $gt: new Date() }
              }).sort({ createdAt: -1 });
              
              if (recentOTP) {
                console.log('✅ OTP found in database:', recentOTP.code);
                
                // Test OTP verification
                const otpResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
                  identifier: testEmail,
                  otpCode: recentOTP.code,
                  type: 'email'
                });
                
                if (otpResponse.data.success) {
                  console.log('✅ OTP verification successful!');
                  console.log('Token received:', !!otpResponse.data.data.token);
                  
                  // Test patient list access
                  const patientResponse = await axios.get(`${BASE_URL}/patients`, {
                    headers: {
                      'Authorization': `Bearer ${otpResponse.data.data.token}`
                    }
                  });
                  
                  if (patientResponse.data.success) {
                    console.log('✅ Patient list accessed successfully!');
                    console.log(`Found ${patientResponse.data.data.length} patients`);
                    
                    console.log('\n🎉 COMPLETE SUCCESS! Doctor login and patient list are working!');
                    console.log('\n📋 Working Credentials:');
                    console.log(`Email: ${testEmail}`);
                    console.log(`Password: ${testPassword}`);
                    console.log('\n💡 Note: Check backend console for OTP codes during testing');
                  } else {
                    console.log('❌ Patient list access failed:', patientResponse.data.message);
                  }
                } else {
                  console.log('❌ OTP verification failed:', otpResponse.data.message);
                }
              } else {
                console.log('❌ No OTP found in database');
              }
            } else {
              console.log('❌ OTP verification should be required for doctors');
            }
          } else {
            console.log('❌ Login API call failed:', loginResponse.data.message);
          }
        } catch (apiError) {
          console.log('❌ API call error:', apiError.response?.data?.message || apiError.message);
        }
      } else {
        console.log('❌ Password comparison still failing');
      }
    } catch (error) {
      console.log('❌ Password comparison error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error fixing doctor login:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixDoctorLogin().catch(console.error);
