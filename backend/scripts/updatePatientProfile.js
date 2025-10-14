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

async function updatePatientProfile() {
  try {
    console.log('Updating patient profile with realistic data...');

    // Find the user
    const user = await User.findOne({ email: 'm.bienaimee@alustudent.com' });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // Find the patient profile
    const patient = await Patient.findOne({ user: user._id });
    
    if (!patient) {
      console.error('Patient profile not found');
      process.exit(1);
    }

    // Update with more realistic data
    patient.nationalId = '1234567890123456';
    patient.dateOfBirth = new Date('1995-06-15');
    patient.gender = 'female';
    patient.contactNumber = '+250788123456';
    patient.address = 'Kigali, Rwanda';
    patient.emergencyContact = {
      name: 'Jean Baptiste',
      relationship: 'Brother',
      phone: '+250788654321'
    };
    patient.bloodType = 'O+';
    patient.allergies = ['Penicillin', 'Shellfish'];
    patient.status = 'active';

    await patient.save();
    
    console.log('Patient profile updated successfully!');
    console.log('Updated data:', {
      nationalId: patient.nationalId,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      status: patient.status
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating patient profile:', error);
    process.exit(1);
  }
}

updatePatientProfile();
