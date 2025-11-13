require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const patientSchema = new mongoose.Schema({}, { strict: false });
const patientPassportSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);
const PatientPassport = mongoose.model('PatientPassport', patientPassportSchema);

async function checkBettyPassport() {
  try {
    console.log('✅ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Betty Williams
    const user = await User.findOne({ name: /Betty Williams/i });
    if (!user) {
      console.log('❌ Betty Williams user not found');
      return;
    }

    console.log(`👤 Betty Williams User: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);

    // Find patient document
    const patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      console.log('❌ Betty Williams patient document not found');
      return;
    }

    console.log(`📋 Betty Williams Patient: ${patient._id}\n`);

    // Find PatientPassport document
    const passport = await PatientPassport.findOne({ patient: patient._id });
    
    if (!passport) {
      console.log('❌ No PatientPassport document found for Betty Williams');
      console.log('   This means the API will fall through to the legacy data path');
      console.log('   which should include MedicalRecord collection\n');
    } else {
      console.log(`✅ Found PatientPassport document: ${passport._id}`);
      console.log(`\n📊 PatientPassport Medical Data:`);
      console.log(`   Medical Conditions: ${passport.medicalInfo?.medicalConditions?.length || 0}`);
      console.log(`   Current Medications: ${passport.medicalInfo?.currentMedications?.length || 0}`);
      console.log(`   Test Results: ${passport.testResults?.length || 0}`);
      console.log(`   Hospital Visits: ${passport.hospitalVisits?.length || 0}`);
      console.log(`   Allergies: ${passport.medicalInfo?.allergies?.length || 0}`);
      
      console.log(`\n🔍 Full medicalInfo object:`);
      console.log(JSON.stringify(passport.medicalInfo, null, 2));
      
      console.log(`\n🔍 Full testResults array:`);
      console.log(JSON.stringify(passport.testResults, null, 2));
      
      console.log(`\n🔍 Full hospitalVisits array:`);
      console.log(JSON.stringify(passport.hospitalVisits, null, 2));
    }

    console.log('\n✅ Disconnected from MongoDB');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkBettyPassport();
