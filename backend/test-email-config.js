#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * This script helps you test and configure email delivery for OTP
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔧 PatientPassport Email Configuration Test');
console.log('='.repeat(60));

// Check current environment variables
console.log('\n📧 Current Email Configuration:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Not set');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Not set');

async function testEmailConfiguration() {
  console.log('\n🧪 Testing Email Configuration...');
  
  // Test Gmail Configuration
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER.includes('@gmail.com')) {
    console.log('\n📧 Testing Gmail Configuration...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    try {
      await transporter.verify();
      console.log('✅ Gmail connection successful!');
      
      // Send test email
      const testEmail = process.env.EMAIL_USER; // Send to yourself
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
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
                This is a test email to verify your email configuration is working correctly.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px;">${otpCode}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                If you received this email, your OTP system is working correctly!
              </p>
            </div>
          </div>
        `
      };
      
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📬 Check your inbox:', testEmail);
      console.log('🔢 Test OTP Code:', otpCode);
      
    } catch (error) {
      console.log('❌ Gmail test failed:', error.message);
      console.log('\n💡 Gmail Setup Instructions:');
      console.log('1. Enable 2-Factor Authentication on your Gmail account');
      console.log('2. Generate an App Password:');
      console.log('   - Go to Google Account Settings');
      console.log('   - Security > 2-Step Verification > App passwords');
      console.log('   - Generate password for "Mail"');
      console.log('3. Use the App Password in EMAIL_PASS (not your regular password)');
    }
  }
  
  // Test SendGrid Configuration
  if (process.env.EMAIL_USER === 'apikey' && process.env.EMAIL_PASS) {
    console.log('\n📧 Testing SendGrid Configuration...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PASS
      }
    });
    
    try {
      await transporter.verify();
      console.log('✅ SendGrid connection successful!');
      
      // Send test email
      const testEmail = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'test@example.com';
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@patientpassport.com',
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
                This is a test email to verify your SendGrid configuration is working correctly.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px;">${otpCode}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                If you received this email, your SendGrid OTP system is working correctly!
              </p>
            </div>
          </div>
        `
      };
      
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📬 Check your inbox:', testEmail);
      console.log('🔢 Test OTP Code:', otpCode);
      
    } catch (error) {
      console.log('❌ SendGrid test failed:', error.message);
      console.log('\n💡 SendGrid Setup Instructions:');
      console.log('1. Create a SendGrid account at https://sendgrid.com');
      console.log('2. Generate an API Key:');
      console.log('   - Go to Settings > API Keys');
      console.log('   - Create API Key with "Mail Send" permissions');
      console.log('3. Set environment variables:');
      console.log('   EMAIL_USER=apikey');
      console.log('   EMAIL_PASS=your-sendgrid-api-key');
    }
  }
  
  // If no email configuration found
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n⚠️  No email configuration found!');
    console.log('\n📋 Quick Setup Options:');
    console.log('\n1️⃣  Gmail (Recommended for testing):');
    console.log('   EMAIL_HOST=smtp.gmail.com');
    console.log('   EMAIL_PORT=587');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-gmail-app-password');
    console.log('   EMAIL_FROM=PatientPassport <your-email@gmail.com>');
    
    console.log('\n2️⃣  SendGrid (Recommended for production):');
    console.log('   EMAIL_HOST=smtp.sendgrid.net');
    console.log('   EMAIL_PORT=587');
    console.log('   EMAIL_USER=apikey');
    console.log('   EMAIL_PASS=your-sendgrid-api-key');
    console.log('   EMAIL_FROM=PatientPassport <your-verified-email@domain.com>');
    
    console.log('\n📝 To set environment variables:');
    console.log('1. Create a .env file in the backend directory');
    console.log('2. Add the email configuration variables above');
    console.log('3. Restart your server');
  }
}

// Run the test
testEmailConfiguration().catch(console.error);
