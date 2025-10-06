const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function linkHospitalToUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';
    const hospitalId = '68e41de879d2b412e642d44b';

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Find the hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      console.log('❌ Hospital not found');
      return;
    }

    console.log('👤 User found:', user.email, user._id);
    console.log('🏥 Hospital found:', hospital.name, hospital._id);

    // Link hospital to user
    hospital.user = user._id;
    await hospital.save();

    console.log('✅ Hospital linked to user');
    console.log('📋 Final Setup:');
    console.log('Email:', email);
    console.log('Password: password123');
    console.log('Hospital ID:', hospitalId);
    console.log('User ID:', user._id);

  } catch (error) {
    console.error('❌ Error linking hospital:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the function
linkHospitalToUser();
