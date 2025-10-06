const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function fixPasswordFinal() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const password = 'password123';

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('🔑 Current password hash:', user.password ? user.password.substring(0, 20) + '...' : 'No password');

    // Delete the user completely
    console.log('🗑️ Deleting user completely...');
    await User.findByIdAndDelete(user._id);

    // Create a fresh user with proper password hashing
    console.log('👤 Creating fresh user...');
    const newUser = new User({
      name: 'Bienaimee Hospital Admin',
      email: email,
      password: password, // This will be hashed by pre-save middleware
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });

    // Save the user (this triggers password hashing)
    await newUser.save();
    console.log('✅ User created with fresh password hash');

    // Test the password
    const testUser = await User.findOne({ email }).select('+password');
    console.log('🔑 New password hash:', testUser.password ? testUser.password.substring(0, 20) + '...' : 'No password');
    
    const isPasswordValid = await testUser.comparePassword(password);
    console.log('✅ Password test result:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n🎉 Password fixed successfully!');
      console.log('📋 Login Credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('User ID:', newUser._id);
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
fixPasswordFinal();
