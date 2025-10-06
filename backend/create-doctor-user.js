const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Doctor = require('./dist/models/Doctor').default;
const Hospital = require('./dist/models/Hospital').default;

async function createDoctorUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const password = 'password123';
    const hospitalId = '68e41de879d2b412e642d44b';

    // Delete existing user if exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('🗑️ Deleting existing user...');
      await User.findByIdAndDelete(existingUser._id);
    }

    // Create doctor user
    console.log('👤 Creating doctor user...');
    const doctorUser = await User.create({
      name: 'Dr. Bienaimee',
      email: email,
      password: password,
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });

    console.log('✅ Doctor user created:', doctorUser.email);

    // Find hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      console.log('❌ Hospital not found');
      return;
    }

    // Create doctor profile
    console.log('👨‍⚕️ Creating doctor profile...');
    const doctor = await Doctor.create({
      name: 'Dr. Bienaimee',
      email: email,
      licenseNumber: 'DOC-123456',
      specialization: 'General Medicine',
      hospitalId: hospitalId,
      user: doctorUser._id
    });

    console.log('✅ Doctor profile created');

    // Test login
    const testUser = await User.findOne({ email }).select('+password');
    const isPasswordValid = await testUser.comparePassword(password);
    console.log('✅ Password test result:', isPasswordValid);

    if (isPasswordValid) {
      console.log('\n🎉 Doctor user created successfully!');
      console.log('📋 Login Credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: doctor');
      console.log('Hospital ID:', hospitalId);
      console.log('User ID:', doctorUser._id);
      console.log('Doctor ID:', doctor._id);
    } else {
      console.log('❌ Password test failed');
    }

  } catch (error) {
    console.error('❌ Error creating doctor user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the function
createDoctorUser();
