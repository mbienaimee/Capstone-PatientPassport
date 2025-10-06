const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hospital = require('./dist/models/Hospital').default;
const Doctor = require('./dist/models/Doctor').default;

async function testHospitalRoute() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const hospitalId = '68e41de879d2b412e642d44b';
    
    // Test 1: Check if hospital exists
    console.log('\n🔍 Testing hospital lookup...');
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      console.log('❌ Hospital not found with ID:', hospitalId);
      return;
    }
    
    console.log('✅ Hospital found:');
    console.log('  - ID:', hospital._id);
    console.log('  - Name:', hospital.name);
    console.log('  - Status:', hospital.status);
    console.log('  - Doctors count:', hospital.doctors.length);

    // Test 2: Check if we can get doctors
    console.log('\n🔍 Testing doctors lookup...');
    const doctors = await Doctor.find({ hospital: hospitalId }).populate('user', 'name email');
    console.log('✅ Doctors found:', doctors.length);
    doctors.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.user.name} (${doctor.specialization})`);
    });

    // Test 3: Test creating a doctor (simulation)
    console.log('\n🔍 Testing doctor creation simulation...');
    const testDoctorData = {
      name: 'Test Doctor',
      email: 'test@example.com',
      licenseNumber: 'TEST123',
      specialization: 'General Practice'
    };
    
    console.log('✅ Doctor data prepared:', testDoctorData);
    console.log('✅ Hospital can accept doctors:', hospital.status === 'active');

  } catch (error) {
    console.error('❌ Error testing hospital route:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testHospitalRoute();
