#!/usr/bin/env node

/**
 * 🔧 Gmail Authentication Fix
 * 
 * This script helps fix Gmail authentication issues
 */

const fs = require('fs');

function fixGmailAuth() {
  console.log('🔧 Fixing Gmail Authentication Error');
  console.log('='.repeat(50));
  
  console.log('❌ Error: "Username and Password not accepted"');
  console.log('');
  console.log('🔍 This means your Gmail App Password is incorrect.');
  console.log('');
  console.log('✅ SOLUTION - Follow these steps:');
  console.log('');
  console.log('1. 🔐 Go to Gmail App Passwords:');
  console.log('   https://myaccount.google.com/apppasswords');
  console.log('');
  console.log('2. 🔑 Generate NEW App Password:');
  console.log('   - Select "Mail" from dropdown');
  console.log('   - Click "Generate"');
  console.log('   - Copy the NEW 16-character password');
  console.log('   - It looks like: "abcd efgh ijkl mnop"');
  console.log('');
  console.log('3. ✏️  Update .env file:');
  console.log('   - Open backend/.env');
  console.log('   - Find: EMAIL_PASS=your-gmail-app-password-here');
  console.log('   - Replace with your NEW 16-character password');
  console.log('   - Save the file');
  console.log('');
  console.log('4. 🔄 Restart the server:');
  console.log('   - Stop server (Ctrl+C)');
  console.log('   - Run: npm start');
  console.log('');
  console.log('💡 IMPORTANT NOTES:');
  console.log('   - Use App Password, NOT your regular Gmail password');
  console.log('   - App Password is 16 characters with spaces');
  console.log('   - Make sure 2FA is enabled on Gmail');
  console.log('   - Remove spaces when copying to .env file');
  console.log('');
  console.log('🧪 Test after fixing:');
  console.log('   node test-real-email.js');
}

// Run the fix guide
fixGmailAuth();
