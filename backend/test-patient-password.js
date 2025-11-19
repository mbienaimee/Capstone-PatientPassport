/**
 * Script to test patient password
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

async function testPassword() {
  try {
    const nationalId = '1234567891012345';
    const testPassword = 'Patient123';

    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Searching for patient with National ID: ${nationalId}`);
    
    const patient = await Patient.findOne({ nationalId }).populate('user');
    
    if (!patient || !patient.user) {
      console.log(`❌ Patient not found`);
      process.exit(1);
    }

    console.log(`✅ Found patient:`);
    console.log(`   Name: ${patient.user.name}`);
    console.log(`   Email: ${patient.user.email}`);
    console.log(`   Role: ${patient.user.role}`);
    console.log(`   Has Password: ${!!patient.user.password}`);
    console.log(`   Password Hash (first 20 chars): ${patient.user.password?.substring(0, 20)}...`);
    
    console.log(`\n🔐 Testing password: "${testPassword}"`);
    
    const isMatch = await bcrypt.compare(testPassword, patient.user.password);
    
    if (isMatch) {
      console.log(`✅ PASSWORD MATCHES! ✅`);
      console.log(`\n✅ You can login with:`);
      console.log(`   National ID: ${nationalId}`);
      console.log(`   Password: ${testPassword}`);
    } else {
      console.log(`❌ PASSWORD DOES NOT MATCH!`);
      console.log(`\n🔧 Resetting password to: "${testPassword}"`);
      
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      patient.user.password = hashedPassword;
      await patient.user.save();
      
      console.log(`✅ Password has been reset!`);
      console.log(`\n✅ You can now login with:`);
      console.log(`   National ID: ${nationalId}`);
      console.log(`   Password: ${testPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testPassword();
