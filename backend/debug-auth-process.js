#!/usr/bin/env node

/**
 * Debug Authentication Process
 * 
 * This script will debug the exact authentication process step by step
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function debugAuthenticationProcess() {
  try {
    console.log('🔍 Debugging Authentication Process...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const testEmail = 'test@doctor.com';
    const testPassword = 'Password123';
    
    console.log('\n📋 Step 1: Finding User by Email');
    console.log('=================================');
    
    // Find user by email
    const user = await User.findOne({ email: testEmail }).select('+password');
    
    if (!user) {
      console.log('❌ User not found with email:', testEmail);
      
      // List all users to see what's available
      console.log('\n👥 All Users in Database:');
      const allUsers = await User.find({});
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. ${u.name} (${u.email}) - Role: ${u.role} - Active: ${u.isActive}`);
      });
      
      return;
    }
    
    console.log('✅ User found:');
    console.log('ID:', user._id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Is Active:', user.isActive);
    console.log('Is Email Verified:', user.isEmailVerified);
    console.log('Has Password:', !!user.password);
    console.log('Password Length:', user.password ? user.password.length : 0);
    console.log('Password Preview:', user.password ? user.password.substring(0, 20) + '...' : 'No password');
    
    console.log('\n🔐 Step 2: Testing Password Comparison');
    console.log('=======================================');
    
    // Test password comparison
    try {
      const isPasswordValid = await user.comparePassword(testPassword);
      console.log(`Password "${testPassword}": ${isPasswordValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isPasswordValid) {
        console.log('\n🔍 Step 3: Testing Different Passwords');
        console.log('=====================================');
        
        const testPasswords = [
          'Password123',
          'password123',
          'TestPass123',
          'testpassword123',
          'Password123!',
          'TestPassword123'
        ];
        
        for (const pwd of testPasswords) {
          const isValid = await user.comparePassword(pwd);
          console.log(`Password "${pwd}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Password comparison error:', error.message);
    }
    
    console.log('\n🔧 Step 4: Checking Authentication Requirements');
    console.log('===============================================');
    
    // Check all authentication requirements
    console.log('User is active:', user.isActive);
    console.log('Email is verified:', user.isEmailVerified);
    console.log('Role is doctor:', user.role === 'doctor');
    
    if (!user.isActive) {
      console.log('❌ User account is not active');
    }
    
    if (!user.isEmailVerified) {
      console.log('❌ Email is not verified');
    }
    
    if (user.role !== 'doctor') {
      console.log('❌ User role is not doctor:', user.role);
    }
    
    console.log('\n🧪 Step 5: Simulating Authentication Controller Logic');
    console.log('=====================================================');
    
    // Simulate the exact logic from authController
    if (!user.isActive) {
      console.log('❌ Would throw: Account has been deactivated');
    } else if (!user.isEmailVerified) {
      console.log('❌ Would throw: Please verify your email address');
    } else {
      console.log('✅ User passes basic checks');
      
      // Test password
      const isPasswordValid = await user.comparePassword(testPassword);
      if (!isPasswordValid) {
        console.log('❌ Would throw: Invalid credentials');
      } else {
        console.log('✅ Password is valid - would proceed with OTP generation');
        
        // Check role-specific logic
        if (user.role === 'patient' || user.role === 'hospital') {
          console.log('✅ Would login directly (no OTP required)');
        } else {
          console.log('✅ Would require OTP verification');
        }
      }
    }
    
    console.log('\n🔧 Step 6: Creating a Fresh Test Doctor');
    console.log('========================================');
    
    // Delete existing test doctor
    await User.deleteOne({ email: testEmail });
    console.log('✅ Deleted existing test doctor');
    
    // Create a fresh test doctor with known password
    const bcrypt = require('bcryptjs');
    const freshPassword = 'DoctorPass123';
    const hashedPassword = await bcrypt.hash(freshPassword, 12);
    
    const freshDoctor = await User.create({
      name: 'Dr. Fresh Test',
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
    
    console.log('✅ Created fresh test doctor');
    console.log('Name:', freshDoctor.name);
    console.log('Email:', freshDoctor.email);
    console.log('Password Hash:', freshDoctor.password.substring(0, 20) + '...');
    
    // Test password with fresh doctor
    const freshDoctorWithPassword = await User.findOne({ email: testEmail }).select('+password');
    const passwordTest = await freshDoctorWithPassword.comparePassword(freshPassword);
    console.log(`Fresh password "${freshPassword}": ${passwordTest ? '✅ VALID' : '❌ INVALID'}`);
    
    if (passwordTest) {
      console.log('\n🎉 SUCCESS! Fresh doctor credentials work correctly.');
      console.log('\n📋 Working Credentials:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${freshPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging authentication:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAuthenticationProcess().catch(console.error);
