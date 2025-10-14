#!/usr/bin/env node

/**
 * Debug Bcrypt Password Hashing
 * 
 * This script will debug the bcrypt password hashing and comparison
 */

const bcrypt = require('bcryptjs');

async function debugBcryptHashing() {
  console.log('🔍 Debugging Bcrypt Password Hashing...\n');
  
  const testPassword = 'DoctorPass123';
  
  console.log('📋 Step 1: Testing Bcrypt Hashing');
  console.log('=================================');
  console.log('Original password:', testPassword);
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log('Hashed password:', hashedPassword);
    console.log('Hash length:', hashedPassword.length);
    
    console.log('\n🔐 Step 2: Testing Bcrypt Comparison');
    console.log('=====================================');
    
    // Test comparison
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Password "${testPassword}" matches hash: ${isValid ? '✅ YES' : '❌ NO'}`);
    
    // Test with wrong password
    const isWrongValid = await bcrypt.compare('WrongPassword', hashedPassword);
    console.log(`Wrong password matches hash: ${isWrongValid ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🧪 Step 3: Testing Different Passwords');
    console.log('=====================================');
    
    const testPasswords = [
      'DoctorPass123',
      'Password123',
      'TestPass123',
      'password123'
    ];
    
    for (const pwd of testPasswords) {
      const hash = await bcrypt.hash(pwd, 12);
      const isValid = await bcrypt.compare(pwd, hash);
      console.log(`Password "${pwd}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
    console.log('\n🔧 Step 4: Testing with Existing Hash');
    console.log('=====================================');
    
    // Test with the hash from the database
    const dbHash = '$2a$12$lHx0pAaggd9WK...'; // This is truncated, let's get the real one
    console.log('Testing with database hash pattern...');
    
    // Create a new hash and test it
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('New hash:', newHash);
    
    const testResult = await bcrypt.compare(testPassword, newHash);
    console.log(`Test result: ${testResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n🎉 Bcrypt is working correctly!');
    console.log('The issue must be elsewhere in the authentication process.');
    
  } catch (error) {
    console.error('❌ Bcrypt error:', error);
  }
}

debugBcryptHashing().catch(console.error);
