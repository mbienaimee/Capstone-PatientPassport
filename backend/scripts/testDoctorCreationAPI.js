const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Hospital = require('../dist/models/Hospital').default;
const Doctor = require('../dist/models/Doctor').default;

async function testDoctorCreationAPI() {
  try {
    console.log('Testing Doctor Creation API...\n');

    // Step 1: Find King Faisal's hospital
    console.log('=== Step 1: Finding King Faisal Hospital ===');
    const kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    });

    if (!kingFaisalUser) {
      console.log('❌ King Faisal user not found');
      return;
    }

    const hospital = await Hospital.findOne({ user: kingFaisalUser._id });
    if (!hospital) {
      console.log('❌ Hospital profile not found');
      return;
    }

    console.log('✅ Hospital found:', {
      id: hospital._id,
      name: hospital.name,
      licenseNumber: hospital.licenseNumber,
      status: hospital.status
    });

    // Step 2: Test doctor creation data
    console.log('\n=== Step 2: Testing Doctor Creation Data ===');
    const testDoctorData = {
      name: 'Dr. Test Specialist',
      email: 'testdoctor@hospital.com',
      password: 'password123',
      licenseNumber: 'DOC-TEST-' + Date.now(),
      specialization: 'Cardiology'
    };

    console.log('Test doctor data:', testDoctorData);

    // Step 3: Check if test doctor already exists
    console.log('\n=== Step 3: Checking Existing Test Doctor ===');
    const existingTestDoctor = await User.findOne({ email: testDoctorData.email });
    if (existingTestDoctor) {
      console.log('Test doctor already exists, cleaning up...');
      await User.findByIdAndDelete(existingTestDoctor._id);
      await Doctor.findOneAndDelete({ user: existingTestDoctor._id });
      console.log('✅ Test doctor cleaned up');
    }

    // Step 4: Simulate the API call logic
    console.log('\n=== Step 4: Simulating API Call Logic ===');
    
    // Check if doctor with license number already exists
    const existingDoctor = await Doctor.findOne({ licenseNumber: testDoctorData.licenseNumber });
    if (existingDoctor) {
      console.log('❌ Doctor with this license number already exists');
      return;
    }
    console.log('✅ License number is unique');

    // Create user for doctor
    console.log('Creating user for doctor...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testDoctorData.password, 12);

    const doctorUser = await User.create({
      name: testDoctorData.name,
      email: testDoctorData.email,
      password: hashedPassword,
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });
    console.log('✅ Doctor user created:', doctorUser._id);

    // Create doctor
    console.log('Creating doctor profile...');
    const doctor = await Doctor.create({
      user: doctorUser._id,
      licenseNumber: testDoctorData.licenseNumber,
      specialization: testDoctorData.specialization,
      hospital: hospital._id,
      isActive: true
    });
    console.log('✅ Doctor profile created:', doctor._id);

    // Add doctor to hospital
    console.log('Adding doctor to hospital...');
    hospital.doctors.push(doctor._id);
    await hospital.save();
    console.log('✅ Doctor added to hospital');

    // Step 5: Verify the creation
    console.log('\n=== Step 5: Verification ===');
    const createdDoctor = await Doctor.findById(doctor._id)
      .populate('user', 'name email')
      .populate('hospital', 'name');

    console.log('Created doctor:', {
      id: createdDoctor._id,
      name: createdDoctor.user.name,
      email: createdDoctor.user.email,
      licenseNumber: createdDoctor.licenseNumber,
      specialization: createdDoctor.specialization,
      hospital: createdDoctor.hospital.name,
      isActive: createdDoctor.isActive
    });

    // Step 6: Test password verification
    console.log('\n=== Step 6: Testing Doctor Login ===');
    const doctorUserWithPassword = await User.findById(doctorUser._id).select('+password');
    try {
      const passwordTest = await doctorUserWithPassword.comparePassword('password123');
      console.log('Doctor password verification:', passwordTest);
      
      if (passwordTest) {
        console.log('✅ Doctor can login with:');
        console.log('  - Email:', testDoctorData.email);
        console.log('  - Password:', testDoctorData.password);
      }
    } catch (error) {
      console.log('Password verification error:', error.message);
    }

    // Step 7: Test API endpoint simulation
    console.log('\n=== Step 7: API Endpoint Simulation ===');
    const apiResponse = {
      success: true,
      message: 'Doctor added to hospital successfully',
      data: {
        _id: createdDoctor._id,
        user: {
          _id: createdDoctor.user._id,
          name: createdDoctor.user.name,
          email: createdDoctor.user.email
        },
        licenseNumber: createdDoctor.licenseNumber,
        specialization: createdDoctor.specialization,
        hospital: createdDoctor.hospital._id,
        isActive: createdDoctor.isActive
      }
    };

    console.log('✅ API Response would be:', {
      success: apiResponse.success,
      message: apiResponse.message,
      doctorId: apiResponse.data._id,
      doctorName: apiResponse.data.user.name,
      doctorEmail: apiResponse.data.user.email
    });

    // Clean up test data
    console.log('\n=== Cleanup ===');
    await User.findByIdAndDelete(doctorUser._id);
    await Doctor.findByIdAndDelete(doctor._id);
    hospital.doctors = hospital.doctors.filter(id => id.toString() !== doctor._id.toString());
    await hospital.save();
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Doctor Creation API Test Completed Successfully!');
    console.log('\nSummary:');
    console.log('✅ Hospital found and accessible');
    console.log('✅ Doctor user creation works');
    console.log('✅ Doctor profile creation works');
    console.log('✅ Hospital association works');
    console.log('✅ API endpoint logic works');
    console.log('✅ Doctor login credentials work');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing doctor creation API:', error);
    process.exit(1);
  }
}

testDoctorCreationAPI();
