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

async function fixDoctorPasswordHashing() {
  try {
    console.log('🔧 Fixing doctor password hashing issue...\n');

    // Find the specific doctor that was just created
    const doctorEmail = 'm36391038@gmail.com';
    const doctorPassword = 'Umurerwa123!';

    console.log('Looking for doctor with email:', doctorEmail);
    
    const doctorUser = await User.findOne({ email: doctorEmail, role: 'doctor' });
    
    if (!doctorUser) {
      console.log('❌ Doctor user not found');
      return;
    }

    console.log('Found doctor user:', {
      id: doctorUser._id,
      name: doctorUser.name,
      email: doctorUser.email,
      role: doctorUser.role,
      isEmailVerified: doctorUser.isEmailVerified
    });

    // Test current password (it should fail because it's double-hashed)
    console.log('\nTesting current password...');
    const currentPasswordValid = await doctorUser.comparePassword(doctorPassword);
    console.log('Current password valid:', currentPasswordValid);

    if (!currentPasswordValid) {
      console.log('✅ Confirmed: Password is double-hashed, fixing...');
      
      // Fix the password by setting it to the plain text and letting the pre-save middleware hash it properly
      doctorUser.password = doctorPassword;
      await doctorUser.save();
      
      console.log('✅ Password fixed! Testing again...');
      
      // Test the fixed password
      const fixedPasswordValid = await doctorUser.comparePassword(doctorPassword);
      console.log('Fixed password valid:', fixedPasswordValid);
      
      if (fixedPasswordValid) {
        console.log('🎉 Password fix successful!');
      } else {
        console.log('❌ Password fix failed');
      }
    } else {
      console.log('✅ Password is already working correctly');
    }

    // Also check if there are other doctors with similar issues
    console.log('\n=== Checking all doctors for password issues ===');
    const allDoctors = await User.find({ role: 'doctor' });
    console.log(`Found ${allDoctors.length} doctors`);

    for (const doctor of allDoctors) {
      console.log(`\nChecking doctor: ${doctor.name} (${doctor.email})`);
      
      // We can't test passwords without knowing them, but we can check if they were created recently
      // and might have the double-hashing issue
      const createdAt = new Date(doctor.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      
      console.log(`- Created: ${createdAt.toISOString()}`);
      console.log(`- Hours since creation: ${hoursSinceCreation.toFixed(2)}`);
      
      if (hoursSinceCreation < 24) {
        console.log('⚠️  This doctor was created recently and might have password issues');
        console.log('   If login fails, the password needs to be reset');
      } else {
        console.log('✅ This doctor was created more than 24 hours ago, likely fine');
      }
    }

    console.log('\n🎉 Doctor password fix completed!');
    console.log('✅ The doctor should now be able to login with the correct password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing doctor password:', error);
    process.exit(1);
  }
}

fixDoctorPasswordHashing();
