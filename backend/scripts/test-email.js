// Email Test Script
// Run this to test email functionality: node scripts/test-email.js

const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('🧪 Testing Email Configuration...');
  
  // Check environment variables
  console.log('📧 Email Configuration:');
  console.log('  Host:', process.env.EMAIL_HOST || 'NOT SET');
  console.log('  Port:', process.env.EMAIL_PORT || 'NOT SET');
  console.log('  User:', process.env.EMAIL_USER || 'NOT SET');
  console.log('  Pass:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
  console.log('  From:', process.env.EMAIL_FROM || 'NOT SET');
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Missing email configuration!');
    console.log('Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file');
    return;
  }
  
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Test email
  const testEmailAddress = process.env.TEST_EMAIL || 'test@example.com';
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: testEmailAddress,
    subject: 'PatientPassport Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">✅ Email Test Successful!</h2>
        <p>This is a test email from PatientPassport.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Best regards,<br>The PatientPassport Team</p>
      </div>
    `
  };
  
  try {
    console.log('📤 Sending test email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log(`📧 Test email sent to: ${testEmailAddress}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('🔧 Troubleshooting tips:');
    console.log('  1. Check your email credentials');
    console.log('  2. Ensure 2FA is enabled for Gmail');
    console.log('  3. Use App Password instead of regular password');
    console.log('  4. Check firewall/network restrictions');
  }
};

// Run the test
testEmail().then(() => {
  console.log('🏁 Email test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Email test failed:', error);
  process.exit(1);
});
