const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Doctor = require('./dist/models/Doctor').default;
const Hospital = require('./dist/models/Hospital').default;

async function createDoctorWithExistingHospital() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const password = 'password123';

    // Find all hospitals
    const hospitals = await Hospital.find();
    console.log('🏥 Available hospitals:');
    hospitals.forEach(h => {
      console.log(`  - ${h.name} (${h._id}) - Status: ${h.status}`);
    });

    if (hospitals.length === 0) {
      console.log('❌ No hospitals found');
      return;
    }

    // Use the first active hospital or create one
    let hospital = hospitals.find(h => h.status === 'active') || hospitals[0];
    
    if (hospital.status !== 'active') {
      console.log('🔄 Activating hospital...');
      hospital.status = 'active';
      await hospital.save();
    }

    console.log('🏥 Using hospital:', hospital.name, hospital._id);

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

    // Create doctor profile
    console.log('👨‍⚕️ Creating doctor profile...');
    const doctor = await Doctor.create({
      name: 'Dr. Bienaimee',
      email: email,
      licenseNumber: 'DOC-123456',
      specialization: 'General Medicine',
      hospitalId: hospital._id,
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
      console.log('Hospital ID:', hospital._id);
      console.log('Hospital Name:', hospital.name);
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
createDoctorWithExistingHospital();
