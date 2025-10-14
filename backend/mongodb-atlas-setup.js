#!/usr/bin/env node

/**
 * 🚀 Quick MongoDB Atlas Setup
 * 
 * This script helps you set up MongoDB Atlas quickly
 */

function showMongoDBAtlasSetup() {
  console.log('🚀 QUICK MONGODB ATLAS SETUP');
  console.log('='.repeat(50));
  console.log('');
  console.log('✅ Gmail App Password: FIXED!');
  console.log('❌ MongoDB: Not installed locally');
  console.log('');
  console.log('🎯 SOLUTION: Use MongoDB Atlas (Free Cloud Database)');
  console.log('');
  console.log('📋 STEP-BY-STEP SETUP:');
  console.log('');
  console.log('1. 🌐 Go to MongoDB Atlas:');
  console.log('   https://www.mongodb.com/atlas');
  console.log('');
  console.log('2. 📝 Create Free Account:');
  console.log('   - Click "Try Free"');
  console.log('   - Sign up with email');
  console.log('   - Choose "Free" plan');
  console.log('');
  console.log('3. 🏗️ Create Free Cluster:');
  console.log('   - Choose "AWS" provider');
  console.log('   - Select region closest to you');
  console.log('   - Click "Create Cluster"');
  console.log('   - Wait 3-5 minutes for setup');
  console.log('');
  console.log('4. 🔐 Get Connection String:');
  console.log('   - Click "Connect" on your cluster');
  console.log('   - Choose "Connect your application"');
  console.log('   - Copy the connection string');
  console.log('   - It looks like: mongodb+srv://username:password@cluster.mongodb.net/');
  console.log('');
  console.log('5. ✏️ Update .env file:');
  console.log('   - Replace MONGODB_URI with your Atlas connection string');
  console.log('   - Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/patient-passport');
  console.log('');
  console.log('6. 🔄 Restart server:');
  console.log('   - Stop current server (Ctrl+C)');
  console.log('   - Run: npm start');
  console.log('');
  console.log('🎉 After setup:');
  console.log('   ✅ MongoDB will connect successfully');
  console.log('   ✅ Gmail will send real emails');
  console.log('   ✅ Patients will receive OTP codes');
  console.log('');
  console.log('⏱️ Total setup time: 5-10 minutes');
  console.log('💰 Cost: FREE (500MB storage, shared clusters)');
}

// Run the setup guide
showMongoDBAtlasSetup();
