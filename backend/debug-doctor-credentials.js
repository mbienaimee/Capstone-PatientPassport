#!/usr/bin/env node

/**
 * Debug Doctor Credentials Issue
 * 
 * This script will help us understand why the doctor login is failing
 * even though we created the account with the same credentials
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function debugDoctorCredentials() {
  try {
    console.log('🔍 Debugging Doctor Credentials Issue...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the test doctor
    const doctor = await User.findOne({ 
      email: 'test@doctor.com',
      role: 'doctor'
    }).select('+password');
    
    if (!doctor) {
      console.log('❌ Test doctor not found');
      return;
    }
    
    console.log('📋 Doctor Account Details:');
    console.log('========================');
    console.log(`ID: ${doctor._id}`);
    console.log(`Name: ${doctor.name}`);
    console.log(`Email: ${doctor.email}`);
    console.log(`Role: ${doctor.role}`);
    console.log(`Is Active: ${doctor.isActive}`);
    console.log(`Is Email Verified: ${doctor.isEmailVerified}`);
    console.log(`Has Password: ${!!doctor.password}`);
    console.log(`Password Length: ${doctor.password ? doctor.password.length : 0}`);
    console.log(`Password Preview: ${doctor.password ? doctor.password.substring(0, 20) + '...' : 'No password'}`);
    
    // Test password comparison
    console.log('\n🔐 Testing Password Comparison:');
    console.log('===============================');
    
    const testPasswords = [
      'Password123',
      'password123', 
      'Password123!',
      'testpassword123',
      'TestPassword123'
    ];
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await doctor.comparePassword(testPassword);
        console.log(`Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      } catch (error) {
        console.log(`Password "${testPassword}": ❌ ERROR - ${error.message}`);
      }
    }
    
    // Check if there are any other doctors
    console.log('\n👥 All Doctor Accounts:');
    console.log('======================');
    const allDoctors = await User.find({ role: 'doctor' });
    console.log(`Found ${allDoctors.length} doctor accounts:`);
    
    allDoctors.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.name} (${doc.email}) - Active: ${doc.isActive}, Verified: ${doc.isEmailVerified}`);
    });
    
    // Try to create a new doctor with a known password
    console.log('\n🆕 Creating New Test Doctor:');
    console.log('==========================');
    
    const bcrypt = require('bcryptjs');
    const newPassword = 'TestPass123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Delete existing test doctor
    await User.deleteOne({ email: 'test@doctor.com' });
    console.log('✅ Deleted existing test doctor');
    
    // Create new doctor
    const newDoctor = await User.create({
      name: 'Dr. Test New',
      email: 'test@doctor.com',
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
    
    console.log('✅ Created new test doctor');
    console.log(`Name: ${newDoctor.name}`);
    console.log(`Email: ${newDoctor.email}`);
    console.log(`Password Hash: ${newDoctor.password.substring(0, 20)}...`);
    
    // Test password with new doctor
    console.log('\n🧪 Testing New Doctor Password:');
    console.log('===============================');
    
    const newDoctorWithPassword = await User.findOne({ email: 'test@doctor.com' }).select('+password');
    const passwordTest = await newDoctorWithPassword.comparePassword(newPassword);
    console.log(`Password "${newPassword}": ${passwordTest ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    if (passwordTest) {
      console.log('\n🎉 SUCCESS! New doctor credentials work correctly.');
      console.log('\n📋 Working Credentials:');
      console.log(`Email: test@doctor.com`);
      console.log(`Password: ${newPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging credentials:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugDoctorCredentials().catch(console.error);
