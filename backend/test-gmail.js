const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Testing Gmail SMTP Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'undefined');
console.log('');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

async function testGmail() {
  try {
    console.log('🔍 Verifying Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail connection verified successfully!\n');
    
    console.log('📧 Sending test email...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Test Email - Patient Passport',
      html: `
        <h2>🎉 Gmail Test Successful!</h2>
        <p>Your Gmail configuration is working correctly.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Gmail test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Gmail Authentication Issues:');
      console.log('1. Make sure 2-Factor Authentication is enabled on your Gmail account');
      console.log('2. Generate a new App Password:');
      console.log('   - Go to: https://myaccount.google.com/security');
      console.log('   - Security → 2-Step Verification → App passwords');
      console.log('   - Generate password for "Mail"');
      console.log('   - Use the 16-character password (no spaces)');
      console.log('3. Update your .env file with the new App Password');
    } else if (error.message.includes('Less secure app access')) {
      console.log('\n🔧 Enable Less Secure Apps:');
      console.log('1. Go to: https://myaccount.google.com/security');
      console.log('2. Security → Less secure app access');
      console.log('3. Turn it ON');
    }
  }
}

testGmail();


