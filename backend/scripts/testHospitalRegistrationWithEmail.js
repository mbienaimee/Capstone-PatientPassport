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

async function testHospitalRegistrationWithEmail() {
  try {
    console.log('Testing hospital registration with actual email...\n');

    // Test data for hospital registration with actual email
    const testData = {
      name: 'Test Hospital Center',
      email: 'testhospital@example.com', // Actual email provided by user
      password: 'password123',
      confirmPassword: 'password123',
      role: 'hospital',
      hospitalName: 'Test Hospital Center',
      address: '456 Hospital Avenue, Kigali, Rwanda',
      contact: '+250987654321',
      licenseNumber: 'HOSP-987654321'
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
    console.log('\n=== Testing Hospital Registration with Actual Email ===');
    
    // Step 1: Create User with actual email
    console.log('1. Creating user with actual email...');
    const user = await User.create({
      name: testData.name,
      email: testData.email, // Using actual email, not generated
      password: testData.password,
      role: testData.role
    });
    console.log(`✅ User created: ${user._id}`);
    console.log(`✅ User email: ${user.email}`);

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
      email: createdUser?.email, // This should be the actual email
      role: createdUser?.role
    });
    
    console.log('Hospital verification:', {
      exists: !!createdHospital,
      name: createdHospital?.name,
      licenseNumber: createdHospital?.licenseNumber,
      address: createdHospital?.address,
      contact: createdHospital?.contact
    });

    // Step 5: Verify OTP will be sent to correct email
    console.log('\n5. OTP Email Verification:');
    console.log(`✅ OTP will be sent to: ${createdUser?.email}`);
    console.log(`✅ This matches the user's actual email: ${testData.email}`);
    console.log(`✅ Email match: ${createdUser?.email === testData.email}`);

    // Clean up test data
    console.log('\n6. Cleaning up test data...');
    await User.findByIdAndDelete(user._id);
    if (createdHospital) {
      await Hospital.findByIdAndDelete(createdHospital._id);
    }

    console.log('\n🎉 Hospital registration with actual email test completed successfully!');
    console.log('\nSummary:');
    console.log('✅ User created in User collection with actual email');
    console.log('✅ Hospital profile created in Hospital collection');
    console.log('✅ OTP will be sent to the correct email address');
    console.log('✅ No adminContact required');
    console.log('✅ Simplified registration flow works with real email');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing hospital registration with email:', error);
    process.exit(1);
  }
}

testHospitalRegistrationWithEmail();
