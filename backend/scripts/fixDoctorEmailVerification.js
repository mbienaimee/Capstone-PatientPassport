const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Doctor = require('../dist/models/Doctor').default;

async function fixDoctorEmailVerification() {
  try {
    console.log('Fixing doctor email verification...\n');

    // Find all doctor users
    const doctorUsers = await User.find({ role: 'doctor' });
    console.log(`Found ${doctorUsers.length} doctor users`);

    if (doctorUsers.length === 0) {
      console.log('No doctors found in the database');
      return;
    }

    // Check current status
    console.log('\n=== Current Doctor Status ===');
    doctorUsers.forEach((user, index) => {
      console.log(`Doctor ${index + 1}:`);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Is Email Verified:', user.isEmailVerified);
      console.log('- Is Active:', user.isActive);
      console.log('- Email Verification Token:', user.emailVerificationToken);
      console.log('');
    });

    // Fix unverified doctors
    const unverifiedDoctors = doctorUsers.filter(user => !user.isEmailVerified);
    console.log(`\n=== Fixing ${unverifiedDoctors.length} Unverified Doctors ===`);

    for (const user of unverifiedDoctors) {
      console.log(`Fixing: ${user.name} (${user.email})`);
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
      console.log(`✅ Fixed: ${user.name}`);
    }

    // Verify the fix
    console.log('\n=== Verification ===');
    const updatedDoctors = await User.find({ role: 'doctor' });
    console.log('All doctors after fix:');
    updatedDoctors.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Verified: ${user.isEmailVerified}`);
    });

    // Check doctor profiles
    console.log('\n=== Doctor Profiles ===');
    const doctors = await Doctor.find().populate('user', 'name email').populate('hospital', 'name');
    console.log(`Found ${doctors.length} doctor profiles`);
    doctors.forEach((doctor, index) => {
      console.log(`Doctor ${index + 1}:`);
      console.log('- Name:', doctor.user.name);
      console.log('- Email:', doctor.user.email);
      console.log('- License:', doctor.licenseNumber);
      console.log('- Specialization:', doctor.specialization);
      console.log('- Hospital:', doctor.hospital?.name || 'No hospital');
      console.log('- Is Active:', doctor.isActive);
      console.log('');
    });

    console.log('\n🎉 Doctor email verification fix completed!');
    console.log('✅ All doctors can now login directly without email verification');
    console.log('✅ No OTP verification required for doctor login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing doctor email verification:', error);
    process.exit(1);
  }
}

fixDoctorEmailVerification();
