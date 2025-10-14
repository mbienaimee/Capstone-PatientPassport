#!/usr/bin/env node

/**
 * Debug User Model Password Comparison
 * 
 * This script will debug the User model's comparePassword method
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function debugUserModelPassword() {
  try {
    console.log('🔍 Debugging User Model Password Comparison...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const testEmail = 'test@doctor.com';
    const testPassword = 'DoctorPass123';
    
    console.log('📋 Step 1: Creating Test User with Known Password');
    console.log('=================================================');
    
    // Delete existing test user
    await User.deleteOne({ email: testEmail });
    console.log('✅ Deleted existing test user');
    
    // Create user with manual password hashing
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    console.log('Original password:', testPassword);
    console.log('Hashed password:', hashedPassword);
    
    const user = await User.create({
      name: 'Dr. Test Debug',
      email: testEmail,
      password: hashedPassword,
      role: 'doctor',
      isActive: true,
      isEmailVerified: true,
      nationalId: '123456789',
      dateOfBirth: '1990-01-01',
      contactNumber: '+1234567890',
      address: 'Test Address',
      gender: 'male'
    });
    
    console.log('✅ User created');
    console.log('User ID:', user._id);
    console.log('User password field:', user.password ? 'Present' : 'Missing');
    console.log('Password length:', user.password ? user.password.length : 0);
    
    console.log('\n🔐 Step 2: Testing Direct Bcrypt Comparison');
    console.log('============================================');
    
    // Test direct bcrypt comparison
    const directComparison = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Direct bcrypt comparison: ${directComparison ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n🔍 Step 3: Retrieving User with Password Field');
    console.log('===============================================');
    
    // Retrieve user with password field
    const userWithPassword = await User.findOne({ email: testEmail }).select('+password');
    
    if (!userWithPassword) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User retrieved with password');
    console.log('Retrieved password:', userWithPassword.password ? 'Present' : 'Missing');
    console.log('Retrieved password length:', userWithPassword.password ? userWithPassword.password.length : 0);
    console.log('Retrieved password preview:', userWithPassword.password ? userWithPassword.password.substring(0, 20) + '...' : 'No password');
    
    console.log('\n🧪 Step 4: Testing User Model comparePassword Method');
    console.log('====================================================');
    
    // Test the User model's comparePassword method
    try {
      const modelComparison = await userWithPassword.comparePassword(testPassword);
      console.log(`User model comparePassword: ${modelComparison ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      // Test with wrong password
      const wrongComparison = await userWithPassword.comparePassword('WrongPassword');
      console.log(`Wrong password comparison: ${wrongComparison ? '✅ SUCCESS' : '❌ FAILED'}`);
      
    } catch (error) {
      console.log('❌ User model comparePassword error:', error.message);
    }
    
    console.log('\n🔧 Step 5: Testing Different Password Retrieval Methods');
    console.log('=======================================================');
    
    // Test different ways to retrieve the user
    const userById = await User.findById(user._id).select('+password');
    const userByEmail = await User.findOne({ email: testEmail }).select('+password');
    
    console.log('User by ID password:', userById?.password ? 'Present' : 'Missing');
    console.log('User by email password:', userByEmail?.password ? 'Present' : 'Missing');
    
    if (userById?.password) {
      const idComparison = await userById.comparePassword(testPassword);
      console.log(`User by ID comparison: ${idComparison ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    if (userByEmail?.password) {
      const emailComparison = await userByEmail.comparePassword(testPassword);
      console.log(`User by email comparison: ${emailComparison ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    console.log('\n🎯 Step 6: Testing Authentication Controller Simulation');
    console.log('=====================================================');
    
    // Simulate the exact authentication controller logic
    const authUser = await User.findOne({ email: testEmail }).select('+password');
    
    if (!authUser) {
      console.log('❌ User not found in auth simulation');
    } else if (!authUser.isActive) {
      console.log('❌ User not active in auth simulation');
    } else if (!authUser.isEmailVerified) {
      console.log('❌ Email not verified in auth simulation');
    } else {
      console.log('✅ User passes basic checks in auth simulation');
      
      const passwordValid = await authUser.comparePassword(testPassword);
      if (!passwordValid) {
        console.log('❌ Password invalid in auth simulation');
      } else {
        console.log('✅ Password valid in auth simulation - would proceed with OTP');
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging user model:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugUserModelPassword().catch(console.error);
