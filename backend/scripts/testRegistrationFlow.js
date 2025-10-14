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

async function testRegistrationFlow() {
  try {
    console.log('Testing registration flow...');

    // Test data that matches what the frontend should send
    const testRegistrationData = {
      name: 'Test Patient',
      email: 'test.patient@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'patient',
      nationalId: '9876543210987654',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      contactNumber: '+250123456789',
      address: 'Test Address, Kigali',
      emergencyContact: {
        name: 'Test Emergency Contact',
        relationship: 'Sister',
        phone: '+250987654321'
      },
      bloodType: 'A+'
    };

    console.log('Test registration data:', testRegistrationData);

    // Check if test user already exists
    const existingUser = await User.findOne({ email: testRegistrationData.email });
    if (existingUser) {
      console.log('Test user already exists, deleting...');
      await User.findByIdAndDelete(existingUser._id);
      await Patient.findOneAndDelete({ user: existingUser._id });
    }

    // Simulate the registration process
    console.log('Creating user...');
    const user = await User.create({
      name: testRegistrationData.name,
      email: testRegistrationData.email,
      password: testRegistrationData.password,
      role: testRegistrationData.role
    });
    console.log('User created:', user._id);

    // Check if patient profile should be created
    const { role, nationalId, dateOfBirth, gender, contactNumber, address } = testRegistrationData;
    
    console.log('Checking conditions for patient creation:');
    console.log('- role === "patient":', role === 'patient');
    console.log('- nationalId exists:', !!nationalId);
    console.log('- dateOfBirth exists:', !!dateOfBirth);
    console.log('- gender exists:', !!gender);
    console.log('- contactNumber exists:', !!contactNumber);
    console.log('- address exists:', !!address);

    if (role === 'patient' && nationalId && dateOfBirth && gender && contactNumber && address) {
      console.log('All conditions met, creating patient profile...');
      
      const patient = await Patient.create({
        user: user._id,
        nationalId,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        contactNumber,
        address,
        emergencyContact: testRegistrationData.emergencyContact,
        bloodType: testRegistrationData.bloodType,
        status: 'active'
      });
      
      console.log('Patient profile created successfully:', patient._id);
      console.log('Patient data:', {
        nationalId: patient.nationalId,
        gender: patient.gender,
        contactNumber: patient.contactNumber,
        address: patient.address,
        emergencyContact: patient.emergencyContact
      });
    } else {
      console.log('Patient creation skipped - missing required fields');
    }

    // Clean up test data
    console.log('Cleaning up test data...');
    await User.findByIdAndDelete(user._id);
    const patient = await Patient.findOne({ user: user._id });
    if (patient) {
      await Patient.findByIdAndDelete(patient._id);
    }

    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing registration flow:', error);
    process.exit(1);
  }
}

testRegistrationFlow();
