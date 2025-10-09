const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Patient = require('../dist/models/Patient').default;

async function createTestPatients() {
  try {
    console.log('Creating test patients...');

    // Create test users for patients
    const testUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'patient',
        isActive: true,
        isEmailVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'patient',
        isActive: true,
        isEmailVerified: true
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'patient',
        isActive: true,
        isEmailVerified: true
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'patient',
        isActive: true,
        isEmailVerified: true
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie.wilson@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'patient',
        isActive: true,
        isEmailVerified: true
      }
    ];

    // Create users
    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`Created user: ${user.name}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`User already exists: ${userData.name}`);
      }
    }

    // Create test patients
    const testPatients = [
      {
        user: createdUsers[0]._id,
        nationalId: '12345678901',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        contactNumber: '+1234567890',
        address: '123 Main St, City, State 12345',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1234567891'
        },
        bloodType: 'O+',
        allergies: ['Penicillin', 'Shellfish'],
        status: 'active'
      },
      {
        user: createdUsers[1]._id,
        nationalId: '12345678902',
        dateOfBirth: new Date('1985-05-20'),
        gender: 'female',
        contactNumber: '+1234567892',
        address: '456 Oak Ave, City, State 12345',
        emergencyContact: {
          name: 'John Smith',
          relationship: 'Brother',
          phone: '+1234567893'
        },
        bloodType: 'A+',
        allergies: ['Latex'],
        status: 'active'
      },
      {
        user: createdUsers[2]._id,
        nationalId: '12345678903',
        dateOfBirth: new Date('1978-12-10'),
        gender: 'male',
        contactNumber: '+1234567894',
        address: '789 Pine St, City, State 12345',
        emergencyContact: {
          name: 'Mary Johnson',
          relationship: 'Sister',
          phone: '+1234567895'
        },
        bloodType: 'B+',
        allergies: [],
        status: 'active'
      },
      {
        user: createdUsers[3]._id,
        nationalId: '12345678904',
        dateOfBirth: new Date('1992-08-25'),
        gender: 'female',
        contactNumber: '+1234567896',
        address: '321 Elm St, City, State 12345',
        emergencyContact: {
          name: 'David Brown',
          relationship: 'Father',
          phone: '+1234567897'
        },
        bloodType: 'AB+',
        allergies: ['Peanuts', 'Dust'],
        status: 'active'
      },
      {
        user: createdUsers[4]._id,
        nationalId: '12345678905',
        dateOfBirth: new Date('1988-03-12'),
        gender: 'male',
        contactNumber: '+1234567898',
        address: '654 Maple Dr, City, State 12345',
        emergencyContact: {
          name: 'Sarah Wilson',
          relationship: 'Mother',
          phone: '+1234567899'
        },
        bloodType: 'O-',
        allergies: ['Aspirin'],
        status: 'inactive'
      }
    ];

    // Create patients
    for (const patientData of testPatients) {
      const existingPatient = await Patient.findOne({ nationalId: patientData.nationalId });
      if (!existingPatient) {
        const patient = new Patient(patientData);
        await patient.save();
        console.log(`Created patient: ${patientData.nationalId} - ${createdUsers.find(u => u._id.toString() === patientData.user.toString())?.name}`);
      } else {
        console.log(`Patient already exists: ${patientData.nationalId}`);
      }
    }

    console.log('Test patients created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test patients:', error);
    process.exit(1);
  }
}

createTestPatients();

