const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function debugLoginIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const password = 'password123';

    // Find the user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('🔑 Password field exists:', !!user.password);
    console.log('🔑 Password length:', user.password ? user.password.length : 'No password');
    console.log('🔑 Password starts with $2a$:', user.password ? user.password.startsWith('$2a$') : false);

    // Test password comparison
    console.log('\n🔍 Testing password comparison...');
    try {
      const isValid = await user.comparePassword(password);
      console.log('✅ Password comparison result:', isValid);
    } catch (error) {
      console.log('❌ Password comparison error:', error.message);
    }

    // Test with direct bcrypt
    console.log('\n🔍 Testing direct bcrypt...');
    try {
      const directValid = await bcrypt.compare(password, user.password);
      console.log('✅ Direct bcrypt result:', directValid);
    } catch (error) {
      console.log('❌ Direct bcrypt error:', error.message);
    }

    // Test with a fresh hash
    console.log('\n🔍 Testing with fresh hash...');
    try {
      const freshHash = await bcrypt.hash(password, 12);
      const freshValid = await bcrypt.compare(password, freshHash);
      console.log('✅ Fresh hash result:', freshValid);
    } catch (error) {
      console.log('❌ Fresh hash error:', error.message);
    }

  } catch (error) {
    console.error('❌ Error debugging login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the debug
debugLoginIssue();
