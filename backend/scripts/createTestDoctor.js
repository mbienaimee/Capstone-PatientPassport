const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../dist/models/User').default;
const Doctor = require('../dist/models/Doctor').default;
const Hospital = require('../dist/models/Hospital').default;

async function createTestDoctor() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the hospital
    const hospital = await Hospital.findOne({ name: 'King Faisal' });
    if (!hospital) {
      console.log('Hospital not found');
      return;
    }
    console.log('Found hospital:', hospital.name);

    // Create a test doctor user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    const user = await User.create({
      name: 'Dr. Test Doctor',
      email: 'testdoctor@gmail.com',
      password: hashedPassword,
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });

    console.log('Created user:', user.email);

    // Create doctor
    const doctor = await Doctor.create({
      user: user._id,
      licenseNumber: 'DOC-TEST-123456',
      specialization: 'General Practice',
      hospital: hospital._id,
      isActive: true
    });

    console.log('Created doctor:', doctor.licenseNumber);

    // Add doctor to hospital
    hospital.doctors.push(doctor._id);
    await hospital.save();

    console.log('Added doctor to hospital');

    // Test login
    const testUser = await User.findOne({ email: 'testdoctor@gmail.com' }).select('+password');
    const passwordMatch = await testUser.comparePassword('testpassword123');
    console.log('Password test result:', passwordMatch);

    console.log('Test doctor created successfully!');
    console.log('Email: testdoctor@gmail.com');
    console.log('Password: testpassword123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestDoctor();
