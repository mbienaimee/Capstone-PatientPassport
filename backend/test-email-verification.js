#!/usr/bin/env node

/**
 * 🧪 Email Verification Test
 * 
 * This script tests that OTP emails are sent to the correct email address
 */

const { sendOTPEmail } = require('./dist/services/simpleEmailService');

async function testEmailVerification() {
  console.log('🧪 Testing Email Verification');
  console.log('='.repeat(50));
  
  // Test with different email addresses
  const testEmails = [
    'user1@example.com',
    'user2@test.com', 
    'patient@hospital.com',
    'doctor@clinic.com'
  ];
  
  for (const email of testEmails) {
    console.log(`\n📧 Testing OTP for: ${email}`);
    console.log('-'.repeat(30));
    
    try {
      // Generate a random OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send OTP to the specific email
      await sendOTPEmail(email, otpCode);
      
      console.log(`✅ OTP sent successfully to: ${email}`);
      console.log(`🔐 OTP Code: ${otpCode}`);
      
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${email}:`, error.message);
    }
  }
  
  console.log('\n🎯 Verification Complete!');
  console.log('='.repeat(50));
  console.log('💡 Check the console logs above to verify:');
  console.log('   - Each OTP is sent to the correct email address');
  console.log('   - No hardcoded email addresses are used');
  console.log('   - The system respects the email parameter');
}

// Run the test
testEmailVerification().catch(console.error);
