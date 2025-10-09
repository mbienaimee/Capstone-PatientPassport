const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Doctor = require('../dist/models/Doctor').default;

async function checkDoctorUser() {
  try {
    console.log('Checking for doctor users...');

    // Check if any users with doctor role exist
    const doctorUsers = await User.find({ role: 'doctor' });
    console.log('Found', doctorUsers.length, 'doctor users:');
    
    doctorUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Email: ${user.email}, Name: ${user.name}, Active: ${user.isActive}, Verified: ${user.isEmailVerified}`);
    });

    // Check if any doctor records exist
    const doctors = await Doctor.find();
    console.log('\nFound', doctors.length, 'doctor records:');
    
    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ID: ${doctor._id}, License: ${doctor.licenseNumber}, Specialization: ${doctor.specialization}`);
    });

    // If no doctor users exist, create one
    if (doctorUsers.length === 0) {
      console.log('\nNo doctor users found. Creating test doctor...');
      await createTestDoctor();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking doctor users:', error);
    process.exit(1);
  }
}

async function createTestDoctor() {
  try {
    const bcrypt = require('bcryptjs');
    
    // Create doctor user
    const doctorUser = new User({
      name: 'Dr. Test Doctor',
      email: 'doctor@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });
    
    await doctorUser.save();
    console.log('✅ Created doctor user:', doctorUser.email);
    
    // Create doctor record
    const doctor = new Doctor({
      user: doctorUser._id,
      licenseNumber: 'DOC123456',
      specialization: 'General Practice',
      isActive: true
    });
    
    await doctor.save();
    console.log('✅ Created doctor record:', doctor.licenseNumber);
    
  } catch (error) {
    console.error('Error creating test doctor:', error);
  }
}

checkDoctorUser();

