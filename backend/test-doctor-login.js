const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function testDoctorLogin() {
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
    console.log('🔑 Role:', user.role);
    console.log('🔑 Is Active:', user.isActive);
    console.log('🔑 Is Email Verified:', user.isEmailVerified);
    console.log('🔑 Password exists:', !!user.password);

    // Test password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n🎉 Doctor login should work!');
      console.log('📋 Test with these credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role:', user.role);
    } else {
      console.log('❌ Password is invalid');
    }

  } catch (error) {
    console.error('❌ Error testing doctor login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testDoctorLogin();
