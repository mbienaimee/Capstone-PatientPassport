#!/usr/bin/env node

/**
 * 🧪 Email Delivery Test Script
 * 
 * This script tests if real email delivery is working
 */

const { sendOTPEmail } = require('./dist/services/simpleEmailService');

async function testEmailDelivery() {
  console.log('🧪 Testing Real Email Delivery');
  console.log('='.repeat(50));
  
  // Test email (replace with your email)
  const testEmail = 'reine123e@gmail.com';
  
  console.log(`📧 Testing OTP delivery to: ${testEmail}`);
  console.log('');
  
  try {
    // Generate a random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('🔢 Generated OTP:', otpCode);
    console.log('📤 Sending email...');
    
    // Send OTP email
    await sendOTPEmail(testEmail, otpCode);
    
    console.log('');
    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('📬 CHECK YOUR EMAIL:');
    console.log('   - Look for email from: PatientPassport <reine123e@gmail.com>');
    console.log('   - Subject: Patient Passport - OTP Verification');
    console.log('   - OTP Code:', otpCode);
    console.log('');
    console.log('📱 If you received the email:');
    console.log('   ✅ Email delivery is working!');
    console.log('   ✅ Patients will receive OTP codes');
    console.log('   ✅ Registration and login will work properly');
    console.log('');
    console.log('❌ If you did NOT receive the email:');
    console.log('   1. Check spam/junk folder');
    console.log('   2. Verify Gmail App Password is correct');
    console.log('   3. Check .env file configuration');
    console.log('   4. Restart the backend server');
    console.log('');
    
  } catch (error) {
    console.error('❌ Email delivery failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check if .env file exists');
    console.log('   2. Verify EMAIL_USER and EMAIL_PASS in .env');
    console.log('   3. Ensure Gmail App Password is correct');
    console.log('   4. Check if 2FA is enabled on Gmail');
    console.log('   5. Restart the backend server');
  }
}

// Run the test
testEmailDelivery().catch(console.error);
