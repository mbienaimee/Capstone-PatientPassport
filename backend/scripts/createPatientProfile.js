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

async function createPatientProfile() {
  try {
    console.log('Creating Patient profile for existing user...');

    // Find the existing user
    const user = await User.findOne({ email: 'm.bienaimee@alustudent.com' });
    
    if (!user) {
      console.error('User not found with email: m.bienaimee@alustudent.com');
      process.exit(1);
    }

    console.log('Found user:', user.name, user.email);

    // Check if patient profile already exists
    const existingPatient = await Patient.findOne({ user: user._id });
    if (existingPatient) {
      console.log('Patient profile already exists for this user:', existingPatient._id);
      process.exit(0);
    }

    // Create patient profile
    const patientData = {
      user: user._id,
      nationalId: '12345678999', // You can change this to a real national ID
      dateOfBirth: new Date('1995-01-01'), // You can change this to your real date of birth
      gender: 'female', // You can change this to your gender
      contactNumber: '+250123456789', // You can change this to your real phone number
      address: 'Kigali, Rwanda', // You can change this to your real address
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+250123456790'
      },
      bloodType: 'O+', // Optional
      allergies: [], // Optional
      status: 'active'
    };

    const patient = new Patient(patientData);
    await patient.save();
    
    console.log('Patient profile created successfully!');
    console.log('Patient ID:', patient._id);
    console.log('User ID:', user._id);
    console.log('National ID:', patient.nationalId);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating patient profile:', error);
    process.exit(1);
  }
}

createPatientProfile();
