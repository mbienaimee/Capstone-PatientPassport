#!/usr/bin/env node

/**
 * Simple OTP Email Test
 * Tests email functionality without requiring build
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testOTPEmail() {
  console.log('🧪 Testing OTP Email Functionality');
  console.log('='.repeat(50));
  
  console.log('\n📧 Email Configuration:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email configuration incomplete!');
    console.log('Please check your .env file has EMAIL_USER and EMAIL_PASS set.');
    return;
  }
  
  const testEmail = process.env.EMAIL_USER; // Send to yourself
  const testOTP = '123456';
  
  console.log('\n📬 Sending test OTP email to:', testEmail);
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s/g, '') // Remove spaces from app password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verify connection
    console.log('🔗 Testing email connection...');
    await transporter.verify();
    console.log('✅ Email connection successful!');
    
    // Send test email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: 'PatientPassport - OTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Patient Passport</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">OTP Test Email</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">
              This is a test email to verify your OTP system is working correctly.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px;">${testOTP}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If you received this email, your OTP system is working correctly!
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Check your inbox:', testEmail);
    console.log('🔢 Test OTP Code:', testOTP);
    console.log('\n🎉 SUCCESS! Your OTP email system is working correctly!');
    
  } catch (error) {
    console.log('❌ Failed to send OTP email:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Gmail App Password is correct');
    console.log('2. Ensure 2-Factor Authentication is enabled on Gmail');
    console.log('3. Verify EMAIL_PASS in .env file (should be 16 characters, no spaces)');
    console.log('4. Make sure EMAIL_USER is your full Gmail address');
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Gmail App Password Setup:');
      console.log('1. Go to Google Account → Security → 2-Step Verification');
      console.log('2. App passwords → Generate password for "Mail"');
      console.log('3. Use the 16-character password (not your regular password)');
    }
  }
}

testOTPEmail().catch(console.error);


