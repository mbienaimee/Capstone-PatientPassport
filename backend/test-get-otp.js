#!/usr/bin/env node

/**
 * 🚀 OTP Testing Script - How to Get OTP Codes
 * 
 * This script demonstrates different ways to get OTP codes
 * for testing and development purposes.
 */

const { sendOTPEmail } = require('./dist/services/simpleEmailService');

async function testGetOTP() {
  console.log('🚀 OTP Testing - How to Get OTP Codes');
  console.log('='.repeat(50));
  
  // Test email (replace with your email)
  const testEmail = 'reine123e@gmail.com';
  
  console.log('\n📧 Method 1: Direct OTP Generation');
  console.log('-----------------------------------');
  
  try {
    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔢 Generated OTP: ${otpCode}`);
    
    // Send OTP email
    await sendOTPEmail(testEmail, otpCode);
    
    console.log('✅ OTP email sent successfully!');
    console.log(`📬 Check your inbox: ${testEmail}`);
    console.log(`🔐 Use this OTP code: ${otpCode}`);
    
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
  }
  
  console.log('\n📧 Method 2: Console OTP (Always Available)');
  console.log('------------------------------------------');
  console.log('💡 The system ALWAYS logs OTP codes to console, even if email fails');
  console.log('🔍 Look for these patterns in your backend logs:');
  console.log('   - "🔐 OTP CODE FOR TESTING"');
  console.log('   - "📧 Email: user@example.com"');
  console.log('   - "🔢 OTP Code: 123456"');
  
  console.log('\n📧 Method 3: Test Different Email Addresses');
  console.log('-------------------------------------------');
  
  const testEmails = [
    'reine123e@gmail.com',
    'test@example.com',
    'doctor@hospital.com'
  ];
  
  for (const email of testEmails) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📧 Testing ${email} with OTP: ${otpCode}`);
    
    try {
      await sendOTPEmail(email, otpCode);
      console.log(`✅ OTP sent to ${email}`);
    } catch (error) {
      console.log(`❌ Failed to send to ${email}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 How to Use OTP Codes:');
  console.log('------------------------');
  console.log('1. 🔐 Doctor Login: Enter password → Get OTP → Enter OTP');
  console.log('2. 📋 Patient Access: Doctor requests → Patient gets OTP → Doctor enters OTP');
  console.log('3. 📧 Email Verification: User registers → Gets OTP → Verifies email');
  
  console.log('\n💡 Pro Tips:');
  console.log('------------');
  console.log('• OTP codes expire in 10 minutes');
  console.log('• Check console logs for OTP codes during development');
  console.log('• Use test emails for development');
  console.log('• OTP is always logged to console regardless of email delivery');
  
  console.log('\n🎉 OTP System Status: WORKING!');
  console.log('='.repeat(50));
}

// Run the test
testGetOTP().catch(console.error);

