const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const password = 'password123';

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('📧 Is Email Verified:', user.isEmailVerified);
    console.log('✅ Is Active:', user.isActive);
    console.log('🔑 Password exists:', !!user.password);

    // Test password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n🎉 Login should work!');
      console.log('📋 Test with these credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('❌ Login will fail - password invalid');
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testLogin();
