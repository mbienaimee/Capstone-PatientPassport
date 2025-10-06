const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function fixExistingUserPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const hospitalEmail = 'reine123e@gmail.com';
    const password = 'password123';

    // Find the existing user
    const user = await User.findOne({ email: hospitalEmail });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.email);
    console.log('🔑 Current password length:', user.password ? user.password.length : 'No password');

    // Update password using save() method to trigger pre-save middleware
    user.password = password; // Let the pre-save middleware hash it
    await user.save();

    console.log('✅ Password updated using save() method');

    // Test the password
    const testUser = await User.findOne({ email: hospitalEmail }).select('+password');
    const isPasswordValid = await testUser.comparePassword(password);
    console.log('✅ Password test result:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n🎉 Password fixed successfully!');
      console.log('📋 Login Credentials:');
      console.log('Email:', hospitalEmail);
      console.log('Password:', password);
    } else {
      console.log('❌ Password still not working');
    }

  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixExistingUserPassword();
