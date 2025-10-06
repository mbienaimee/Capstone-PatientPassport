const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function fixHospitalUserComplete() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const hospitalEmail = 'reine123e@gmail.com';
    const password = 'password123';
    const hospitalId = '68e41de879d2b412e642d44b';

    // Delete existing user if it exists
    const existingUser = await User.findOne({ email: hospitalEmail });
    if (existingUser) {
      console.log('🗑️ Deleting existing user...');
      await User.findByIdAndDelete(existingUser._id);
    }

    // Create new hospital user
    console.log('👤 Creating new hospital user...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const hospitalUser = await User.create({
      name: 'King Faisal Admin',
      email: hospitalEmail,
      password: hashedPassword,
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });

    console.log('✅ Hospital user created:', hospitalUser.email);

    // Update hospital to link with user
    const hospital = await Hospital.findById(hospitalId);
    if (hospital) {
      hospital.user = hospitalUser._id;
      await hospital.save();
      console.log('✅ Hospital linked to user');
    }

    // Test the password
    const testUser = await User.findById(hospitalUser._id).select('+password');
    const isPasswordValid = await testUser.comparePassword(password);
    console.log('✅ Password test result:', isPasswordValid);

    console.log('\n🎉 Hospital user setup complete!');
    console.log('📋 Login Credentials:');
    console.log('Email:', hospitalEmail);
    console.log('Password:', password);
    console.log('Role: hospital');
    console.log('Hospital ID:', hospitalId);

  } catch (error) {
    console.error('❌ Error setting up hospital user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixHospitalUserComplete();
