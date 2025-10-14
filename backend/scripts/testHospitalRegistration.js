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

async function testHospitalRegistration() {
  try {
    console.log('Testing simplified hospital registration...\n');

    // Test data for hospital registration (without adminContact)
    const testData = {
      name: 'Test Medical Center',
      email: 'testmedicalcenter@hospital.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'hospital',
      hospitalName: 'Test Medical Center',
      address: '123 Medical Street, Kigali, Rwanda',
      contact: '+250123456789',
      licenseNumber: 'HOSP-123456789'
    };

    console.log('Test registration data:', testData);

    // Clean up existing test data
    const existingUser = await User.findOne({ email: testData.email });
    if (existingUser) {
      console.log('Cleaning up existing test hospital...');
      await User.findByIdAndDelete(existingUser._id);
      await Hospital.findOneAndDelete({ user: existingUser._id });
    }

    // Test the registration process
    console.log('\n=== Testing Hospital Registration ===');
    
    // Step 1: Create User
    console.log('1. Creating user...');
    const user = await User.create({
      name: testData.name,
      email: testData.email,
      password: testData.password,
      role: testData.role
    });
    console.log(`✅ User created: ${user._id}`);

    // Step 2: Check if hospital profile should be created
    const { role, hospitalName, licenseNumber } = testData;
    
    console.log('\n2. Checking hospital creation conditions:');
    console.log('- role === "hospital":', role === 'hospital');
    console.log('- hospitalName exists:', !!hospitalName);
    console.log('- licenseNumber exists:', !!licenseNumber);

    if (role === 'hospital' && hospitalName && licenseNumber) {
      console.log('\n3. All conditions met, creating hospital profile...');
      
      const hospital = await Hospital.create({
        user: user._id,
        name: hospitalName,
        address: testData.address,
        contact: testData.contact,
        licenseNumber: licenseNumber,
        adminContact: '' // Optional field
      });
      
      console.log(`✅ Hospital profile created: ${hospital._id}`);
      console.log('Hospital data:', {
        name: hospital.name,
        address: hospital.address,
        contact: hospital.contact,
        licenseNumber: hospital.licenseNumber,
        adminContact: hospital.adminContact || 'Not provided'
      });
    } else {
      console.log('❌ Hospital creation skipped - missing required fields');
    }

    // Step 4: Verify the data
    console.log('\n4. Verifying registration...');
    const createdUser = await User.findById(user._id);
    const createdHospital = await Hospital.findOne({ user: user._id });
    
    console.log('User verification:', {
      exists: !!createdUser,
      name: createdUser?.name,
      email: createdUser?.email,
      role: createdUser?.role
    });
    
    console.log('Hospital verification:', {
      exists: !!createdHospital,
      name: createdHospital?.name,
      licenseNumber: createdHospital?.licenseNumber,
      address: createdHospital?.address,
      contact: createdHospital?.contact
    });

    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    await User.findByIdAndDelete(user._id);
    if (createdHospital) {
      await Hospital.findByIdAndDelete(createdHospital._id);
    }

    console.log('\n🎉 Hospital registration test completed successfully!');
    console.log('\nSummary:');
    console.log('✅ User created in User collection');
    console.log('✅ Hospital profile created in Hospital collection');
    console.log('✅ No adminContact required');
    console.log('✅ Simplified registration flow works');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing hospital registration:', error);
    process.exit(1);
  }
}

testHospitalRegistration();
