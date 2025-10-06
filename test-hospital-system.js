const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hospital = require('./backend/dist/models/Hospital').default;
const Doctor = require('./backend/dist/models/Doctor').default;
const User = require('./backend/dist/models/User').default;

async function testHospitalSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    // Create a test hospital
    const hospital = new Hospital({
      name: 'Test General Hospital',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      country: 'USA',
      phone: '+1-555-0123',
      email: 'test@testhospital.com',
      licenseNumber: 'HOSP001',
      isActive: true
    });
    await hospital.save();
    console.log('✅ Created test hospital:', hospital.name);

    // Create a test user for doctor
    const user = new User({
      firstName: 'John',
      lastName: 'Smith',
      email: 'dr.john.smith@testhospital.com',
      phone: '+1-555-1001',
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });
    await user.save();
    console.log('✅ Created test doctor user:', user.firstName, user.lastName);

    // Create a test doctor
    const doctor = new Doctor({
      user: user._id,
      licenseNumber: 'DOC001',
      specialization: 'Cardiology',
      hospital: hospital._id,
      isActive: true
    });
    await doctor.save();
    console.log('✅ Created test doctor:', doctor.licenseNumber);

    // Add doctor to hospital's registered doctors
    hospital.registeredDoctors.push(doctor._id);
    await hospital.save();
    console.log('✅ Added doctor to hospital');

    console.log('\n🎉 Hospital system test completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Hospital License: HOSP001');
    console.log('Doctor Name: John Smith');
    console.log('Doctor License: DOC001');

  } catch (error) {
    console.error('❌ Error testing hospital system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testHospitalSystem();

