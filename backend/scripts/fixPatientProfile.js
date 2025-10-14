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

async function fixPatientProfile() {
  try {
    console.log('Fixing patient profile for existing user...');

    // Find the existing user
    const user = await User.findOne({ email: 'm.bienaimee@alustudent.com' });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user:', user.name, user.email);

    // Check if patient profile already exists
    const existingPatient = await Patient.findOne({ user: user._id });
    if (existingPatient) {
      console.log('Patient profile already exists, updating with correct data...');
      
      // Update with realistic data
      existingPatient.nationalId = '1234567890123456';
      existingPatient.dateOfBirth = new Date('1995-06-15');
      existingPatient.gender = 'female';
      existingPatient.contactNumber = '+250788123456';
      existingPatient.address = 'Kigali, Rwanda';
      existingPatient.emergencyContact = {
        name: 'Jean Baptiste',
        relationship: 'Brother',
        phone: '+250788654321'
      };
      existingPatient.bloodType = 'O+';
      existingPatient.allergies = ['Penicillin', 'Shellfish'];
      existingPatient.status = 'active';

      await existingPatient.save();
      console.log('Patient profile updated successfully!');
    } else {
      console.log('Creating new patient profile...');
      
      // Create patient profile with realistic data
      const patientData = {
        user: user._id,
        nationalId: '1234567890123456',
        dateOfBirth: new Date('1995-06-15'),
        gender: 'female',
        contactNumber: '+250788123456',
        address: 'Kigali, Rwanda',
        emergencyContact: {
          name: 'Jean Baptiste',
          relationship: 'Brother',
          phone: '+250788654321'
        },
        bloodType: 'O+',
        allergies: ['Penicillin', 'Shellfish'],
        status: 'active'
      };

      const patient = new Patient(patientData);
      await patient.save();
      console.log('Patient profile created successfully!');
    }
    
    console.log('Fix completed! Your patient profile should now work correctly.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing patient profile:', error);
    process.exit(1);
  }
}

fixPatientProfile();
