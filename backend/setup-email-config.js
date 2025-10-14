#!/usr/bin/env node

/**
 * 🚀 Email Configuration Setup Script
 * 
 * This script helps you set up real email delivery for OTP codes
 */

const fs = require('fs');
const path = require('path');

function createEnvFile() {
  console.log('🚀 Setting up Email Configuration');
  console.log('='.repeat(50));
  
  const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/patient-passport
MONGODB_TEST_URI=mongodb://localhost:27017/patient-passport-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# Password Reset
JWT_RESET_SECRET=your-reset-secret-key-here-change-this-in-production
JWT_RESET_EXPIRE=10m

# Email Configuration - Gmail Setup
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=reine123e@gmail.com
EMAIL_PASS=your-gmail-app-password-here
EMAIL_FROM=PatientPassport <reine123e@gmail.com>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here-change-this-in-production

# API Documentation
API_DOCS_PATH=/api-docs`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully!');
    console.log('');
    console.log('📧 NEXT STEPS TO ENABLE EMAIL DELIVERY:');
    console.log('='.repeat(50));
    console.log('');
    console.log('1. 🔐 Enable 2-Factor Authentication on Gmail:');
    console.log('   - Go to your Google Account settings');
    console.log('   - Security → 2-Step Verification → Turn on');
    console.log('');
    console.log('2. 🔑 Generate App Password:');
    console.log('   - Go to Google Account → Security → 2-Step Verification → App passwords');
    console.log('   - Select "Mail" and generate password');
    console.log('   - Copy the 16-character password');
    console.log('');
    console.log('3. ✏️  Update .env file:');
    console.log('   - Open backend/.env file');
    console.log('   - Replace "your-gmail-app-password-here" with your 16-character app password');
    console.log('   - Save the file');
    console.log('');
    console.log('4. 🔄 Restart the backend server:');
    console.log('   - Stop the current server (Ctrl+C)');
    console.log('   - Run: npm start');
    console.log('');
    console.log('5. 🧪 Test email delivery:');
    console.log('   - Register a new user');
    console.log('   - Check your email for OTP code');
    console.log('');
    console.log('💡 IMPORTANT:');
    console.log('   - Use App Password, NOT your regular Gmail password');
    console.log('   - The App Password is 16 characters long');
    console.log('   - Keep your App Password secure');
    console.log('');
    console.log('🎯 After setup, patients will receive real OTP emails!');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('');
    console.log('📝 Manual Setup:');
    console.log('1. Copy env.example to .env');
    console.log('2. Update EMAIL_USER and EMAIL_PASS in .env');
    console.log('3. Restart the server');
  }
}

// Run the setup
createEnvFile();
