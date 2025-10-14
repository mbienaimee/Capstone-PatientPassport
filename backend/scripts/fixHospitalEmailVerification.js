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

async function fixHospitalEmailVerification() {
  try {
    console.log('Fixing hospital email verification...\n');

    // Find King Faisal's hospital user
    const kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    });

    if (!kingFaisalUser) {
      console.log('❌ King Faisal hospital user not found');
      return;
    }

    console.log('Before fix:');
    console.log('- Name:', kingFaisalUser.name);
    console.log('- Email:', kingFaisalUser.email);
    console.log('- Is Email Verified:', kingFaisalUser.isEmailVerified);
    console.log('- Email Verification Token:', kingFaisalUser.emailVerificationToken);

    // Update the user to be email verified
    kingFaisalUser.isEmailVerified = true;
    kingFaisalUser.emailVerificationToken = null;
    kingFaisalUser.emailVerificationExpires = null;
    await kingFaisalUser.save();

    console.log('\nAfter fix:');
    console.log('- Name:', kingFaisalUser.name);
    console.log('- Email:', kingFaisalUser.email);
    console.log('- Is Email Verified:', kingFaisalUser.isEmailVerified);
    console.log('- Email Verification Token:', kingFaisalUser.emailVerificationToken);

    // Also fix any other unverified hospital users
    console.log('\n=== Fixing All Unverified Hospital Users ===');
    const unverifiedHospitals = await User.find({ 
      role: 'hospital', 
      isEmailVerified: false 
    });

    console.log(`Found ${unverifiedHospitals.length} unverified hospital users`);

    for (const user of unverifiedHospitals) {
      console.log(`Fixing: ${user.name} (${user.email})`);
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
      console.log(`✅ Fixed: ${user.name}`);
    }

    // Verify the fix
    console.log('\n=== Verification ===');
    const updatedKingFaisal = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    });

    if (updatedKingFaisal) {
      console.log('King Faisal verification status:');
      console.log('- Is Email Verified:', updatedKingFaisal.isEmailVerified);
      console.log('- Email Verification Token:', updatedKingFaisal.emailVerificationToken);
      console.log('- Updated At:', updatedKingFaisal.updatedAt);
    }

    // Check all hospital users after fix
    const allHospitalUsers = await User.find({ role: 'hospital' });
    console.log('\nAll hospital users after fix:');
    allHospitalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Verified: ${user.isEmailVerified}`);
    });

    console.log('\n🎉 Hospital email verification fix completed!');
    console.log('✅ King Faisal can now login directly to hospital dashboard');
    console.log('✅ No OTP verification required for hospital login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing hospital email verification:', error);
    process.exit(1);
  }
}

fixHospitalEmailVerification();
