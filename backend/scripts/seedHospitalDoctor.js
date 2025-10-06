const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../dist/models/User').default;
const Hospital = require('../dist/models/Hospital').default;
const Doctor = require('../dist/models/Doctor').default;

async function seedHospitalDoctor() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    await Promise.all([
      User.deleteMany({ email: { $in: ['admin@testhospital.com', 'dr.smith@testhospital.com'] } }),
      Hospital.deleteMany({ licenseNumber: 'HOSP001' }),
      Doctor.deleteMany({ licenseNumber: 'DOC001' })
    ]);
    console.log('🗑️ Cleared existing test data');

    // Create hospital user
    const hospitalUser = new User({
      name: 'Test Hospital Admin',
      email: 'admin@testhospital.com',
      password: 'password123', // Let the pre-save middleware hash it
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });
    await hospitalUser.save();
    console.log('✅ Created hospital user:', hospitalUser.name);

    // Create hospital
    const hospital = new Hospital({
      user: hospitalUser._id,
      name: 'Test General Hospital',
      address: '123 Medical Street, Test City',
      contact: '+1-555-0123',
      licenseNumber: 'HOSP001',
      adminContact: 'admin@testhospital.com',
      status: 'active'
    });
    await hospital.save();
    console.log('✅ Created hospital:', hospital.name);

    // Create doctor user
    const doctorUser = new User({
      name: 'Dr. John Smith',
      email: 'dr.smith@testhospital.com',
      password: 'password123', // Let the pre-save middleware hash it
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });
    await doctorUser.save();
    console.log('✅ Created doctor user:', doctorUser.name);

    // Create doctor
    const doctor = new Doctor({
      user: doctorUser._id,
      licenseNumber: 'DOC001',
      specialization: 'General Practice',
      hospital: hospital._id,
      isActive: true
    });
    await doctor.save();
    console.log('✅ Created doctor:', doctor.licenseNumber);

    // Add doctor to hospital
    hospital.doctors.push(doctor._id);
    await hospital.save();
    console.log('✅ Added doctor to hospital');

    console.log('\n🎉 Hospital and Doctor test data seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Hospital Login:');
    console.log('  Email: admin@testhospital.com');
    console.log('  Password: password123');
    console.log('\nDoctor Login:');
    console.log('  Email: dr.smith@testhospital.com');
    console.log('  Password: password123');
    console.log('  License: DOC001');

  } catch (error) {
    console.error('❌ Error seeding hospital and doctor data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedHospitalDoctor();
