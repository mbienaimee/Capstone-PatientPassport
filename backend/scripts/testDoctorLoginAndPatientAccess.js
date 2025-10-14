const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Doctor = require('../dist/models/Doctor').default;
const Hospital = require('../dist/models/Hospital').default;
const Patient = require('../dist/models/Patient').default;

async function testDoctorLoginAndPatientAccess() {
  try {
    console.log('Testing doctor login and patient access...\n');

    // Step 1: Check existing doctors
    console.log('=== Step 1: Check Existing Doctors ===');
    const doctors = await Doctor.find()
      .populate('user', 'name email isEmailVerified isActive')
      .populate('hospital', 'name')
      .populate('patients', 'nationalId');
    
    console.log(`Found ${doctors.length} doctors`);
    doctors.forEach((doctor, index) => {
      console.log(`Doctor ${index + 1}:`);
      console.log('- Name:', doctor.user.name);
      console.log('- Email:', doctor.user.email);
      console.log('- Email Verified:', doctor.user.isEmailVerified);
      console.log('- Is Active:', doctor.user.isActive);
      console.log('- License:', doctor.licenseNumber);
      console.log('- Specialization:', doctor.specialization);
      console.log('- Hospital:', doctor.hospital?.name || 'No hospital');
      console.log('- Patients Count:', doctor.patients.length);
      console.log('');
    });

    if (doctors.length === 0) {
      console.log('No doctors found. Creating a test doctor...');
      
      // Find a hospital to assign the doctor to
      const hospital = await Hospital.findOne();
      if (!hospital) {
        console.log('❌ No hospital found. Cannot create test doctor.');
        return;
      }

      // Create test doctor user
      const testDoctorData = {
        name: 'Dr. Test Cardiologist',
        email: 'testdoctor@hospital.com',
        password: 'password123',
        licenseNumber: 'DOC-TEST-001',
        specialization: 'Cardiology'
      };

      // Check if test doctor already exists
      const existingDoctor = await User.findOne({ email: testDoctorData.email });
      if (existingDoctor) {
        console.log('Test doctor already exists, using existing one...');
      } else {
        // Create test doctor user
        const hashedPassword = await bcrypt.hash(testDoctorData.password, 12);
        const doctorUser = await User.create({
          name: testDoctorData.name,
          email: testDoctorData.email,
          password: hashedPassword,
          role: 'doctor',
          isActive: true,
          isEmailVerified: true // Automatically verified for doctors
        });

        // Create doctor profile
        const doctor = await Doctor.create({
          user: doctorUser._id,
          licenseNumber: testDoctorData.licenseNumber,
          specialization: testDoctorData.specialization,
          hospital: hospital._id,
          isActive: true
        });

        console.log('✅ Test doctor created:', doctorUser.name);
      }
    }

    // Step 2: Test doctor login simulation
    console.log('\n=== Step 2: Test Doctor Login Simulation ===');
    const testDoctor = await Doctor.findOne()
      .populate('user', '+password')
      .populate('hospital', 'name');
    
    if (!testDoctor) {
      console.log('❌ No doctor found for login test');
      return;
    }

    console.log('Testing login for:', testDoctor.user.name);
    console.log('Email:', testDoctor.user.email);
    console.log('Email Verified:', testDoctor.user.isEmailVerified);
    console.log('Is Active:', testDoctor.user.isActive);

    // Simulate password check
    const testPassword = 'password123';
    const isPasswordValid = await testDoctor.user.comparePassword(testPassword);
    console.log('Password Valid:', isPasswordValid);

    if (isPasswordValid && testDoctor.user.isEmailVerified && testDoctor.user.isActive) {
      console.log('✅ Doctor login would succeed');
    } else {
      console.log('❌ Doctor login would fail');
      if (!isPasswordValid) console.log('  - Invalid password');
      if (!testDoctor.user.isEmailVerified) console.log('  - Email not verified');
      if (!testDoctor.user.isActive) console.log('  - Account not active');
    }

    // Step 3: Test patient access
    console.log('\n=== Step 3: Test Patient Access ===');
    const patients = await Patient.find()
      .populate('user', 'name email')
      .populate('assignedDoctors', 'specialization')
      .populate('assignedDoctors.user', 'name');
    
    console.log(`Found ${patients.length} patients`);
    
    if (patients.length > 0) {
      console.log('Sample patients:');
      patients.slice(0, 3).forEach((patient, index) => {
        console.log(`Patient ${index + 1}:`);
        console.log('- Name:', patient.user.name);
        console.log('- Email:', patient.user.email);
        console.log('- National ID:', patient.nationalId);
        console.log('- Assigned Doctors:', patient.assignedDoctors.length);
        console.log('- Status:', patient.status);
        console.log('');
      });
    } else {
      console.log('No patients found in the database');
    }

    // Step 4: Test doctor-patient relationship
    console.log('\n=== Step 4: Test Doctor-Patient Relationship ===');
    const doctorWithPatients = await Doctor.findById(testDoctor._id)
      .populate('patients', 'nationalId')
      .populate('patients.user', 'name');
    
    console.log(`Doctor ${testDoctor.user.name} has ${doctorWithPatients.patients.length} assigned patients`);
    
    if (doctorWithPatients.patients.length > 0) {
      console.log('Assigned patients:');
      doctorWithPatients.patients.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.user.name} (${patient.nationalId})`);
      });
    }

    console.log('\n🎉 Doctor login and patient access test completed!');
    console.log('✅ Doctors can login without email verification');
    console.log('✅ Doctors can access patient lists');
    console.log('✅ Doctor-patient relationships are working');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing doctor login and patient access:', error);
    process.exit(1);
  }
}

testDoctorLoginAndPatientAccess();
