const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Patient = require('../dist/models/Patient').default;

async function testPatientPassport() {
  try {
    console.log('Testing /patients/passport/:patientId endpoint...');

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

    console.log('Patient ID:', patient._id);
    console.log('User ID:', user._id);

    // Simulate the passport endpoint logic
    const completePatient = await Patient.findById(patient._id)
      .populate('user', 'name email role');

    console.log('Complete patient data:', {
      _id: completePatient._id,
      user: completePatient.user,
      nationalId: completePatient.nationalId,
      dateOfBirth: completePatient.dateOfBirth,
      gender: completePatient.gender,
      contactNumber: completePatient.contactNumber,
      address: completePatient.address,
      emergencyContact: completePatient.emergencyContact,
      status: completePatient.status
    });

    // Simulate the response structure
    const response = {
      success: true,
      message: 'Patient passport retrieved successfully',
      data: {
        patient: completePatient,
        medicalRecords: {
          conditions: [],
          medications: [],
          tests: [],
          visits: [],
          images: []
        },
        summary: completePatient.getSummary()
      }
    };

    console.log('\n=== /patients/passport/:patientId Response Structure ===');
    console.log(JSON.stringify(response, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error testing patient passport:', error);
    process.exit(1);
  }
}

testPatientPassport();
