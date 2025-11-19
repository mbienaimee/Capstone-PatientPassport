/**
 * Script to reset patient password
 * Usage: node reset-patient-password.js <nationalId> <newPassword>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  password: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: Boolean
}, { collection: 'users' });

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nationalId: String,
  name: String
}, { collection: 'patients' });

const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);

async function resetPatientPassword() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('\n📋 USAGE:');
      console.log('   node reset-patient-password.js <nationalId> <newPassword>');
      console.log('\n📋 EXAMPLE:');
      console.log('   node reset-patient-password.js 1234567891012345 NewPassword123');
      console.log('\n📋 OR run without arguments to see all patients:');
      console.log('   node reset-patient-password.js list\n');
      process.exit(0);
    }

    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // List all patients if 'list' argument
    if (args[0] === 'list') {
      console.log('📋 ALL PATIENTS:\n');
      const patients = await Patient.find({}).populate('user');
      
      if (patients.length === 0) {
        console.log('   No patients found.');
      } else {
        patients.forEach((patient, index) => {
          console.log(`${index + 1}. National ID: ${patient.nationalId}`);
          console.log(`   Name: ${patient.user?.name || 'Unknown'}`);
          console.log(`   Email: ${patient.user?.email || 'Unknown'}`);
          console.log(`   Active: ${patient.user?.isActive ? 'Yes' : 'No'}`);
          console.log(`   Email Verified: ${patient.user?.isEmailVerified ? 'Yes' : 'No'}`);
          console.log('');
        });
      }
      
      process.exit(0);
    }

    const nationalId = args[0];
    const newPassword = args[1];

    if (!nationalId || !newPassword) {
      console.log('❌ Error: Both nationalId and newPassword are required');
      console.log('   Usage: node reset-patient-password.js <nationalId> <newPassword>');
      process.exit(1);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      console.log('❌ Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    console.log(`🔍 Searching for patient with National ID: ${nationalId}`);
    
    const patient = await Patient.findOne({ nationalId }).populate('user');
    
    if (!patient) {
      console.log(`❌ No patient found with National ID: ${nationalId}`);
      console.log('\n💡 TIP: Run "node reset-patient-password.js list" to see all patients');
      process.exit(1);
    }

    if (!patient.user) {
      console.log(`❌ Patient found but has no associated user account`);
      process.exit(1);
    }

    console.log(`✅ Found patient:`);
    console.log(`   Name: ${patient.user.name}`);
    console.log(`   Email: ${patient.user.email}`);
    console.log(`   Current Role: ${patient.user.role}`);
    console.log(`   Account Active: ${patient.user.isActive ? 'Yes' : 'No'}`);
    console.log(`   Email Verified: ${patient.user.isEmailVerified ? 'Yes' : 'No'}`);
    
    console.log('\n🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log('💾 Updating password in database...');
    patient.user.password = hashedPassword;
    
    // Also ensure email is verified for patient login
    if (!patient.user.isEmailVerified) {
      console.log('✅ Marking email as verified...');
      patient.user.isEmailVerified = true;
    }
    
    await patient.user.save();
    
    console.log('\n✅ PASSWORD RESET SUCCESSFUL!');
    console.log('\n📝 You can now login with:');
    console.log(`   National ID: ${nationalId}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   Email: ${patient.user.email}`);
    console.log('\n🔒 Keep this password secure!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

resetPatientPassword();
