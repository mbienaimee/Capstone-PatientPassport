const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Patient = require('../dist/models/Patient').default;

async function checkPatientData() {
  try {
    console.log('Checking patient data...');

    // Find the user
    const user = await User.findOne({ email: 'm.bienaimee@alustudent.com' });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('User found:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified
    });

    // Find the patient profile
    const patient = await Patient.findOne({ user: user._id }).populate('user');
    
    if (!patient) {
      console.log('No patient profile found for this user');
    } else {
      console.log('Patient profile found:', {
        _id: patient._id,
        user: patient.user._id,
        userName: patient.user.name,
        nationalId: patient.nationalId,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        contactNumber: patient.contactNumber,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        status: patient.status
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking patient data:', error);
    process.exit(1);
  }
}

checkPatientData();
