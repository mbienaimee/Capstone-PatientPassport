/**
 * Quick Database Verification Script
 * This script checks if your database has patients and their passports
 * Run: node verify-ussd-data.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Simple schemas for verification (no need for full models)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { collection: 'users' });

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nationalId: String,
  dateOfBirth: Date,
  gender: String
}, { collection: 'patients' });

const passportSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  personalInfo: {
    fullName: String,
    nationalId: String,
    email: String
  },
  isActive: Boolean
}, { collection: 'patientpassports' });

const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);
const PatientPassport = mongoose.model('PatientPassport', passportSchema);

async function verifyData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Users
    console.log('👥 CHECKING USERS:');
    const users = await User.find({ role: 'patient' }).limit(5);
    console.log(`   Found ${users.length} patient users`);
    if (users.length > 0) {
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name} - ${user.email}`);
      });
    }
    console.log('');

    // Check Patients
    console.log('🏥 CHECKING PATIENTS:');
    const patients = await Patient.find().populate('user').limit(5);
    console.log(`   Found ${patients.length} patients`);
    if (patients.length > 0) {
      patients.forEach((patient, i) => {
        console.log(`   ${i + 1}. National ID: ${patient.nationalId}`);
        console.log(`      User: ${patient.user?.name || 'Not found'} (${patient.user?.email || 'N/A'})`);
      });
    }
    console.log('');

    // Check Passports
    console.log('📄 CHECKING PATIENT PASSPORTS:');
    const passports = await PatientPassport.find({ isActive: true })
      .populate({
        path: 'patient',
        populate: { path: 'user' }
      })
      .limit(5);
    console.log(`   Found ${passports.length} active passports`);
    if (passports.length > 0) {
      passports.forEach((passport, i) => {
        console.log(`   ${i + 1}. ${passport.personalInfo?.fullName || 'Unknown'}`);
        console.log(`      National ID: ${passport.personalInfo?.nationalId || 'N/A'}`);
        console.log(`      Email: ${passport.personalInfo?.email || 'N/A'}`);
      });
    }
    console.log('');

    // Test USSD scenarios
    console.log('🧪 TESTING USSD SCENARIOS:');
    console.log('');
    
    if (patients.length > 0) {
      const testPatient = patients[0];
      const testNationalId = testPatient.nationalId;
      
      console.log('   Scenario 1: Search by National ID');
      console.log(`   Looking for National ID: ${testNationalId}`);
      
      // Simulate USSD search
      const foundPatient = await Patient.findOne({ nationalId: testNationalId })
        .populate('user', 'name email phone')
        .lean();
      
      if (foundPatient) {
        console.log('   ✅ Patient found!');
        console.log(`      Name: ${foundPatient.user?.name}`);
        console.log(`      Email: ${foundPatient.user?.email}`);
        
        // Try to get passport
        const foundPassport = await PatientPassport.findOne({ 
          patient: foundPatient._id, 
          isActive: true 
        });
        
        if (foundPassport) {
          console.log('   ✅ Passport found!');
          console.log(`      Full Name: ${foundPassport.personalInfo?.fullName}`);
          console.log(`      Blood Type: ${foundPassport.personalInfo?.bloodType || 'N/A'}`);
        } else {
          console.log('   ❌ Passport NOT found for this patient');
          console.log('   → This patient needs a passport created');
        }
      } else {
        console.log('   ❌ Patient NOT found');
      }
      console.log('');

      // Test email search
      if (foundPatient?.user?.email) {
        const testEmail = foundPatient.user.email;
        console.log('   Scenario 2: Search by Email');
        console.log(`   Looking for Email: ${testEmail}`);
        
        const emailRegex = new RegExp(`^${testEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const foundUser = await User.findOne({ email: emailRegex }).lean();
        
        if (foundUser) {
          console.log('   ✅ User found by email!');
          const patientByEmail = await Patient.findOne({ user: foundUser._id })
            .populate('user', 'name email phone')
            .lean();
          
          if (patientByEmail) {
            console.log('   ✅ Patient found!');
            console.log(`      National ID: ${patientByEmail.nationalId}`);
          } else {
            console.log('   ❌ Patient NOT found for this user');
          }
        } else {
          console.log('   ❌ User NOT found by email');
        }
      }
      console.log('');
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total Users (patients): ${await User.countDocuments({ role: 'patient' })}`);
    console.log(`   Total Patients: ${await Patient.countDocuments()}`);
    console.log(`   Total Active Passports: ${await PatientPassport.countDocuments({ isActive: true })}`);
    console.log('');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    const patientCount = await Patient.countDocuments();
    const passportCount = await PatientPassport.countDocuments({ isActive: true });
    
    if (patientCount === 0) {
      console.log('   ⚠️  No patients found in database');
      console.log('   → Create patient records first');
    } else if (passportCount === 0) {
      console.log('   ⚠️  Patients exist but no passports found');
      console.log('   → Create patient passports for USSD to work');
    } else if (passportCount < patientCount) {
      console.log(`   ⚠️  Some patients (${patientCount - passportCount}) don't have passports`);
      console.log('   → Create passports for remaining patients');
    } else {
      console.log('   ✅ All patients have passports - USSD should work!');
    }
    console.log('');

    // Test data for USSD
    if (patients.length > 0) {
      console.log('🎯 TEST DATA FOR USSD:');
      console.log('   Use these values to test USSD:');
      console.log('');
      patients.forEach((patient, i) => {
        if (i < 3) { // Show first 3
          console.log(`   Test ${i + 1}:`);
          console.log(`   National ID: ${patient.nationalId}`);
          console.log(`   Email: ${patient.user?.email || 'N/A'}`);
          console.log(`   USSD: Dial *384*40767# → 1 → 1 → ${patient.nationalId}`);
          console.log('');
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run verification
verifyData();
