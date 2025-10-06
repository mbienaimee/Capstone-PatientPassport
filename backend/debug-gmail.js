const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Gmail Debug Test');
console.log('==================');

// Check environment variables
console.log('Environment Variables:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'undefined');
console.log('EMAIL_PASS (first 4 chars):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) + '...' : 'undefined');
console.log('');

// Test different Gmail configurations
const configs = [
  {
    name: 'Gmail with TLS',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Gmail with SSL',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }
  },
  {
    name: 'Gmail with OAuth2 (if available)',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }
  }
];

async function testGmailConfigs() {
  for (const { name, config } of configs) {
    console.log(`\n🧪 Testing ${name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      // Test connection
      await transporter.verify();
      console.log(`✅ ${name} - Connection successful!`);
      
      // Try to send a test email
      const result = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: `Test Email - ${name}`,
        html: `<h2>Test from ${name}</h2><p>This is a test email sent using ${name} configuration.</p>`
      });
      
      console.log(`✅ ${name} - Email sent successfully!`);
      console.log(`   Message ID: ${result.messageId}`);
      
      // If we get here, this config works!
      console.log(`\n🎉 SUCCESS! Use this configuration: ${name}`);
      return true;
      
    } catch (error) {
      console.log(`❌ ${name} - Failed: ${error.message}`);
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
    }
  }
  
  console.log('\n❌ All Gmail configurations failed');
  return false;
}

// Additional troubleshooting
console.log('\n🔧 Troubleshooting Tips:');
console.log('1. Make sure 2-Factor Authentication is enabled on your Gmail account');
console.log('2. Go to: https://myaccount.google.com/security');
console.log('3. Security → 2-Step Verification → App passwords');
console.log('4. Generate a NEW app password for "Mail"');
console.log('5. Make sure to use the 16-character password WITHOUT spaces');
console.log('6. The password should look like: abcd efgh ijkl mnop (but remove spaces)');
console.log('');

testGmailConfigs().then(success => {
  if (!success) {
    console.log('\n💡 Alternative Solutions:');
    console.log('1. Try generating a new App Password');
    console.log('2. Check if your Gmail account has any security restrictions');
    console.log('3. Consider using a different email service (SendGrid, Mailgun)');
    console.log('4. Use the console display for development (current working solution)');
  }
});
