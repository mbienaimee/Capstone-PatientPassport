const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function debugHospitalLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    // Find hospital user
    const hospitalUser = await User.findOne({ email: 'admin@testhospital.com' });
    console.log('Hospital user found:', !!hospitalUser);
    
    if (hospitalUser) {
      console.log('User details:');
      console.log('- Name:', hospitalUser.name);
      console.log('- Email:', hospitalUser.email);
      console.log('- Role:', hospitalUser.role);
      console.log('- IsActive:', hospitalUser.isActive);
      console.log('- IsEmailVerified:', hospitalUser.isEmailVerified);
      console.log('- Password length:', hospitalUser.password ? hospitalUser.password.length : 'No password');
      
      // Test password
      const isPasswordValid = await hospitalUser.comparePassword('password123');
      console.log('- Password valid:', isPasswordValid);
      
      // Test with select password
      const hospitalUserWithPassword = await User.findOne({ email: 'admin@testhospital.com' }).select('+password');
      console.log('User with password found:', !!hospitalUserWithPassword);
      
      if (hospitalUserWithPassword) {
        const isPasswordValidWithSelect = await hospitalUserWithPassword.comparePassword('password123');
        console.log('- Password valid with select:', isPasswordValidWithSelect);
      }
    }

    // Find hospital
    const hospital = await Hospital.findOne({ user: hospitalUser?._id });
    console.log('Hospital found:', !!hospital);
    if (hospital) {
      console.log('Hospital details:');
      console.log('- Name:', hospital.name);
      console.log('- License:', hospital.licenseNumber);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

debugHospitalLogin();

