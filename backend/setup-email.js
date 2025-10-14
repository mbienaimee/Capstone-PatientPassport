#!/usr/bin/env node

/**
 * Quick Email Setup Script
 * This script helps you quickly configure email for OTP delivery
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEmail() {
  console.log('🚀 PatientPassport Email Setup');
  console.log('='.repeat(50));
  console.log('This script will help you configure email delivery for OTP codes.\n');

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('📋 Creating .env file from env.example...');
      fs.copyFileSync(envExamplePath, envPath);
    } else {
      console.log('📋 Creating new .env file...');
      fs.writeFileSync(envPath, '');
    }
  }

  console.log('\n📧 Choose your email provider:');
  console.log('1. Gmail (Recommended for testing)');
  console.log('2. SendGrid (Recommended for production)');
  console.log('3. Skip setup (use console logging only)');

  const choice = await question('\nEnter your choice (1-3): ');

  let emailConfig = {};

  switch (choice) {
    case '1':
      emailConfig = await setupGmail();
      break;
    case '2':
      emailConfig = await setupSendGrid();
      break;
    case '3':
      console.log('✅ Skipping email setup. OTP codes will be logged to console only.');
      console.log('💡 You can set up email later by editing the .env file.');
      rl.close();
      return;
    default:
      console.log('❌ Invalid choice. Please run the script again.');
      rl.close();
      return;
  }

  // Update .env file
  await updateEnvFile(envPath, emailConfig);
  
  console.log('\n✅ Email configuration saved!');
  console.log('🔄 Please restart your backend server for changes to take effect.');
  console.log('🧪 Run "node test-email-config.js" to test your configuration.');
  
  rl.close();
}

async function setupGmail() {
  console.log('\n📧 Gmail Setup');
  console.log('='.repeat(20));
  
  const email = await question('Enter your Gmail address: ');
  
  console.log('\n🔐 Gmail App Password Setup:');
  console.log('1. Go to your Google Account settings');
  console.log('2. Security → 2-Step Verification → Turn on (if not already)');
  console.log('3. Security → 2-Step Verification → App passwords');
  console.log('4. Generate password for "Mail"');
  console.log('5. Copy the 16-character password');
  
  const appPassword = await question('\nEnter your Gmail App Password (16 characters): ');
  
  return {
    EMAIL_HOST: 'smtp.gmail.com',
    EMAIL_PORT: '587',
    EMAIL_USER: email,
    EMAIL_PASS: appPassword,
    EMAIL_FROM: `PatientPassport <${email}>`
  };
}

async function setupSendGrid() {
  console.log('\n📧 SendGrid Setup');
  console.log('='.repeat(20));
  
  console.log('1. Go to https://sendgrid.com and create an account');
  console.log('2. Go to Settings → API Keys');
  console.log('3. Create API Key with "Mail Send" permissions');
  console.log('4. Copy the API key');
  
  const apiKey = await question('\nEnter your SendGrid API Key: ');
  const fromEmail = await question('Enter your verified sender email: ');
  
  return {
    EMAIL_HOST: 'smtp.sendgrid.net',
    EMAIL_PORT: '587',
    EMAIL_USER: 'apikey',
    EMAIL_PASS: apiKey,
    EMAIL_FROM: `PatientPassport <${fromEmail}>`
  };
}

async function updateEnvFile(envPath, emailConfig) {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing email configuration
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => 
    !line.startsWith('EMAIL_HOST=') &&
    !line.startsWith('EMAIL_PORT=') &&
    !line.startsWith('EMAIL_USER=') &&
    !line.startsWith('EMAIL_PASS=') &&
    !line.startsWith('EMAIL_FROM=')
  );
  
  // Add new email configuration
  const newConfig = Object.entries(emailConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const updatedContent = [...filteredLines, '', '# Email Configuration', newConfig].join('\n');
  
  fs.writeFileSync(envPath, updatedContent);
}

// Run the setup
setupEmail().catch(console.error);
