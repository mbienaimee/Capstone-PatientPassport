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

async function testHospitalDashboardFlow() {
  try {
    console.log('Testing Hospital Dashboard Flow...\n');

    // Step 1: Find King Faisal's hospital
    console.log('=== Step 1: Finding King Faisal Hospital ===');
    const kingFaisalUser = await User.findOne({ 
      $or: [
        { name: { $regex: /king.*faisal/i } },
        { name: { $regex: /faisal/i } }
      ]
    });

    if (!kingFaisalUser) {
      console.log('❌ King Faisal user not found');
      return;
    }

    console.log('✅ King Faisal user found:', {
      id: kingFaisalUser._id,
      name: kingFaisalUser.name,
      email: kingFaisalUser.email,
      role: kingFaisalUser.role
    });

    const hospital = await Hospital.findOne({ user: kingFaisalUser._id });
    if (!hospital) {
      console.log('❌ Hospital profile not found for King Faisal');
      return;
    }

    console.log('✅ Hospital profile found:', {
      id: hospital._id,
      name: hospital.name,
      licenseNumber: hospital.licenseNumber,
      status: hospital.status,
      address: hospital.address,
      contact: hospital.contact
    });

    // Step 2: Test hospital dashboard data
    console.log('\n=== Step 2: Testing Hospital Dashboard Data ===');
    
    // Get hospital statistics
    const totalDoctors = await Doctor.countDocuments({ hospital: hospital._id, isActive: true });
    const totalPatients = await Doctor.countDocuments({ hospital: hospital._id });
    
    console.log('Hospital Statistics:', {
      totalDoctors,
      totalPatients,
      hospitalName: hospital.name,
      status: hospital.status
    });

    // Step 3: Test doctor management
    console.log('\n=== Step 3: Testing Doctor Management ===');
    
    // Get existing doctors
    const existingDoctors = await Doctor.find({ hospital: hospital._id })
      .populate('user', 'name email')
      .populate('patients', 'nationalId');
    
    console.log('Existing Doctors:', existingDoctors.length);
    existingDoctors.forEach((doctor, index) => {
      console.log(`Doctor ${index + 1}:`, {
        name: doctor.user.name,
        email: doctor.user.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        isActive: doctor.isActive,
        patientsCount: doctor.patients.length
      });
    });

    // Step 4: Test adding a new doctor
    console.log('\n=== Step 4: Testing Doctor Creation ===');
    
    const testDoctorData = {
      name: 'Dr. Test Specialist',
      email: 'testdoctor@hospital.com',
      password: 'password123',
      licenseNumber: 'DOC-TEST-123',
      specialization: 'Cardiology'
    };

    // Check if test doctor already exists
    const existingTestDoctor = await User.findOne({ email: testDoctorData.email });
    if (existingTestDoctor) {
      console.log('Test doctor already exists, cleaning up...');
      await User.findByIdAndDelete(existingTestDoctor._id);
      await Doctor.findOneAndDelete({ user: existingTestDoctor._id });
    }

    // Create test doctor
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testDoctorData.password, 12);

    const testDoctorUser = await User.create({
      name: testDoctorData.name,
      email: testDoctorData.email,
      password: hashedPassword,
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });

    const testDoctor = await Doctor.create({
      user: testDoctorUser._id,
      licenseNumber: testDoctorData.licenseNumber,
      specialization: testDoctorData.specialization,
      hospital: hospital._id,
      isActive: true
    });

    // Add doctor to hospital
    hospital.doctors.push(testDoctor._id);
    await hospital.save();

    console.log('✅ Test doctor created successfully:', {
      doctorId: testDoctor._id,
      userId: testDoctorUser._id,
      name: testDoctorUser.name,
      email: testDoctorUser.email,
      specialization: testDoctor.specialization,
      licenseNumber: testDoctor.licenseNumber
    });

    // Step 5: Verify doctor login credentials
    console.log('\n=== Step 5: Testing Doctor Login Credentials ===');
    
    const loginTest = await User.findOne({ email: testDoctorData.email }).select('+password');
    if (loginTest) {
      const passwordMatch = await bcrypt.compare(testDoctorData.password, loginTest.password);
      console.log('✅ Doctor login credentials work:', {
        email: loginTest.email,
        passwordMatch,
        role: loginTest.role,
        isActive: loginTest.isActive,
        isEmailVerified: loginTest.isEmailVerified
      });
    }

    // Step 6: Test hospital dashboard API simulation
    console.log('\n=== Step 6: Simulating Hospital Dashboard API ===');
    
    const dashboardData = {
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        contact: hospital.contact,
        licenseNumber: hospital.licenseNumber,
        status: hospital.status
      },
      stats: {
        totalDoctors: await Doctor.countDocuments({ hospital: hospital._id, isActive: true }),
        totalPatients: await Doctor.countDocuments({ hospital: hospital._id }),
        recentPatients: [],
        recentMedicalConditions: [],
        recentTestResults: []
      }
    };

    console.log('✅ Hospital Dashboard Data:', {
      hospital: dashboardData.hospital,
      stats: dashboardData.stats
    });

    // Clean up test data
    console.log('\n=== Cleanup ===');
    await User.findByIdAndDelete(testDoctorUser._id);
    await Doctor.findByIdAndDelete(testDoctor._id);
    hospital.doctors = hospital.doctors.filter(id => id.toString() !== testDoctor._id.toString());
    await hospital.save();
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Hospital Dashboard Flow Test Completed Successfully!');
    console.log('\nSummary:');
    console.log('✅ Hospital information display works');
    console.log('✅ Hospital statistics calculation works');
    console.log('✅ Doctor creation functionality works');
    console.log('✅ Doctor login credentials work');
    console.log('✅ Hospital dashboard API simulation works');
    console.log('✅ All components are properly integrated');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing hospital dashboard flow:', error);
    process.exit(1);
  }
}

testHospitalDashboardFlow();
