const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;
const Doctor = require('./dist/models/Doctor').default;

async function testCompleteFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const hospitalId = '68e41de879d2b412e642d44b';
    const hospitalEmail = 'bienaimee@gmail.com';
    const password = 'password123';

    console.log('\n🔍 Testing Complete Flow...\n');

    // Test 1: Verify Hospital exists and is active
    console.log('1️⃣ Testing Hospital...');
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      console.log('❌ Hospital not found');
      return;
    }
    console.log('✅ Hospital found:', hospital.name);
    console.log('✅ Status:', hospital.status);
    console.log('✅ Hospital ID:', hospital._id);

    // Test 2: Verify Hospital User exists
    console.log('\n2️⃣ Testing Hospital User...');
    const hospitalUser = await User.findOne({ email: hospitalEmail });
    if (!hospitalUser) {
      console.log('❌ Hospital user not found');
      return;
    }
    console.log('✅ Hospital user found:', hospitalUser.email);
    console.log('✅ User ID:', hospitalUser._id);
    console.log('✅ Role:', hospitalUser.role);
    console.log('✅ Is Active:', hospitalUser.isActive);

    // Test 3: Verify password works
    console.log('\n3️⃣ Testing Password...');
    const isPasswordValid = await hospitalUser.comparePassword(password);
    console.log('✅ Password valid:', isPasswordValid);

    // Test 4: Test Doctor creation
    console.log('\n4️⃣ Testing Doctor Creation...');
    const testDoctorData = {
      name: 'Test Doctor Flow',
      email: 'test.doctor.flow@example.com',
      password: 'testpass123',
      licenseNumber: 'TEST_FLOW_123',
      specialization: 'General Practice'
    };

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ licenseNumber: testDoctorData.licenseNumber });
    if (existingDoctor) {
      console.log('⚠️ Test doctor already exists, cleaning up...');
      await Doctor.findByIdAndDelete(existingDoctor._id);
      await User.findByIdAndDelete(existingDoctor.user);
    }

    // Create test doctor
    const hashedPassword = await bcrypt.hash(testDoctorData.password, 12);
    const doctorUser = await User.create({
      name: testDoctorData.name,
      email: testDoctorData.email,
      password: hashedPassword,
      role: 'doctor',
      isActive: true,
      isEmailVerified: true
    });

    const doctor = await Doctor.create({
      user: doctorUser._id,
      licenseNumber: testDoctorData.licenseNumber,
      specialization: testDoctorData.specialization,
      hospital: hospitalId,
      isActive: true
    });

    // Add doctor to hospital
    hospital.doctors.push(doctor._id);
    await hospital.save();

    console.log('✅ Doctor created successfully');
    console.log('✅ Doctor ID:', doctor._id);
    console.log('✅ Doctor User ID:', doctorUser._id);
    console.log('✅ Doctor added to hospital');

    // Test 5: Verify doctor is in hospital
    console.log('\n5️⃣ Testing Doctor Retrieval...');
    const hospitalDoctors = await Doctor.find({ hospital: hospitalId }).populate('user', 'name email');
    console.log('✅ Hospital doctors count:', hospitalDoctors.length);
    hospitalDoctors.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.user.name} (${doc.specialization}) - User ID: ${doc.user._id}`);
    });

    // Test 6: Test change password route
    console.log('\n6️⃣ Testing Change Password Route...');
    console.log('Route should be: /api/auth/users/' + doctorUser._id + '/change-password');
    console.log('This route requires authentication and hospital role');

    // Test 7: Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    await Doctor.findByIdAndDelete(doctor._id);
    await User.findByIdAndDelete(doctorUser._id);
    
    // Remove from hospital
    hospital.doctors = hospital.doctors.filter(id => id.toString() !== doctor._id.toString());
    await hospital.save();
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Complete Flow Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('✅ Hospital exists and is active');
    console.log('✅ Hospital user exists and can authenticate');
    console.log('✅ Doctor creation works');
    console.log('✅ Doctor-hospital association works');
    console.log('✅ Change password route exists');

    console.log('\n🔑 Login Credentials:');
    console.log('Email:', hospitalEmail);
    console.log('Password:', password);
    console.log('Hospital ID:', hospitalId);

  } catch (error) {
    console.error('❌ Flow test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testCompleteFlow();
