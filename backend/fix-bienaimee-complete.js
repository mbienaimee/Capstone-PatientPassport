const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function fixBienaimeeComplete() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const password = 'password123';
    const hospitalId = '68e41de879d2b412e642d44b';

    // Delete existing user completely
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('🗑️ Deleting existing user...');
      await User.findByIdAndDelete(existingUser._id);
    }

    // Create new user with proper password
    console.log('👤 Creating new hospital user...');
    const hospitalUser = new User({
      name: 'Bienaimee Hospital Admin',
      email: email,
      password: password, // Let pre-save middleware hash it
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });

    await hospitalUser.save();
    console.log('✅ Hospital user created:', hospitalUser.email);

    // Update hospital to link with user
    const hospital = await Hospital.findById(hospitalId);
    if (hospital) {
      hospital.user = hospitalUser._id;
      await hospital.save();
      console.log('✅ Hospital linked to user');
    }

    // Test the password
    const testUser = await User.findOne({ email }).select('+password');
    const isPasswordValid = await testUser.comparePassword(password);
    console.log('✅ Password test result:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n🎉 Everything is working!');
      console.log('📋 Login Credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: hospital');
      console.log('Hospital ID:', hospitalId);
      console.log('User ID:', hospitalUser._id);
    } else {
      console.log('❌ Password still not working');
    }

  } catch (error) {
    console.error('❌ Error setting up user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixBienaimeeComplete();
