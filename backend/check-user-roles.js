/**
 * Script to check if a user has both Patient and Doctor records
 * This helps diagnose role confusion issues
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: Boolean
}, { collection: 'users' });

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nationalId: String
}, { collection: 'patients' });

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  licenseNumber: String
}, { collection: 'doctors' });

const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);

async function checkUserRoles() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Total users: ${users.length}\n`);

    // Check each user for Patient/Doctor records
    for (const user of users) {
      const patientRecord = await Patient.findOne({ user: user._id });
      const doctorRecord = await Doctor.findOne({ user: user._id });

      const hasPatient = !!patientRecord;
      const hasDoctor = !!doctorRecord;

      // Flag users with role mismatches or dual records
      if (hasPatient && hasDoctor) {
        console.log('⚠️  ISSUE: User has BOTH Patient and Doctor records!');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role in User table: ${user.role}`);
        console.log(`   Patient ID: ${patientRecord._id}`);
        console.log(`   Patient National ID: ${patientRecord.nationalId}`);
        console.log(`   Doctor ID: ${doctorRecord._id}`);
        console.log(`   Doctor License: ${doctorRecord.licenseNumber}`);
        console.log('   🔧 FIX: This user should have only ONE role!\n');
      } else if (hasPatient && user.role !== 'patient') {
        console.log('⚠️  MISMATCH: User has Patient record but role is NOT "patient"');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role in User table: ${user.role} (should be: patient)`);
        console.log(`   Patient ID: ${patientRecord._id}`);
        console.log(`   Patient National ID: ${patientRecord.nationalId}\n`);
      } else if (hasDoctor && user.role !== 'doctor') {
        console.log('⚠️  MISMATCH: User has Doctor record but role is NOT "doctor"');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role in User table: ${user.role} (should be: doctor)`);
        console.log(`   Doctor ID: ${doctorRecord._id}`);
        console.log(`   Doctor License: ${doctorRecord.licenseNumber}\n`);
      } else if (!hasPatient && !hasDoctor && (user.role === 'patient' || user.role === 'doctor')) {
        console.log('⚠️  ORPHAN: User has patient/doctor role but NO record');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}\n`);
      } else {
        // Correct setup
        console.log(`✅ OK: ${user.email} (${user.role}) - Record matches role`);
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    
    const usersWithBothRecords = await Promise.all(
      users.map(async (user) => {
        const hasPatient = await Patient.findOne({ user: user._id });
        const hasDoctor = await Doctor.findOne({ user: user._id });
        return hasPatient && hasDoctor ? user : null;
      })
    );
    const dualRecordUsers = usersWithBothRecords.filter(u => u !== null);

    console.log(`Total users: ${users.length}`);
    console.log(`Users with BOTH Patient & Doctor records: ${dualRecordUsers.length}`);
    
    if (dualRecordUsers.length > 0) {
      console.log('\n🚨 ACTION REQUIRED: Remove duplicate records for:');
      dualRecordUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    }

    console.log('\n✅ Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUserRoles();
