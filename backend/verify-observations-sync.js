/**
 * Verification Script: Check Observations in Patient Passport Database
 * 
 * This script verifies that observations from OpenMRS are properly synced
 * and stored in the Patient Passport database.
 * 
 * Usage: node verify-observations-sync.js [patientName]
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models using require for CommonJS compatibility
const Patient = require('./dist/models/Patient').default || require('./src/models/Patient').default;
const MedicalCondition = require('./dist/models/MedicalCondition').default || require('./src/models/MedicalCondition').default;
const Medication = require('./dist/models/Medication').default || require('./src/models/Medication').default;
const MedicalRecord = require('./dist/models/MedicalRecord').default || require('./src/models/MedicalRecord').default;
const User = require('./dist/models/User').default || require('./src/models/User').default;

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/patient-passport';

async function verifyObservations(patientName = null) {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all patients or specific patient
    let patients;
    if (patientName) {
      const user = await User.findOne({ 
        name: { $regex: new RegExp(`^${patientName}$`, 'i') },
        role: 'patient'
      });
      
      if (!user) {
        console.log(`❌ Patient "${patientName}" not found`);
        process.exit(1);
      }
      
      patients = await Patient.find({ user: user._id }).populate('user', 'name email');
    } else {
      patients = await Patient.find().populate('user', 'name email').limit(10);
    }

    console.log(`📊 Found ${patients.length} patient(s) to check\n`);
    console.log('═'.repeat(80));

    for (const patient of patients) {
      const patientName = patient.user?.name || 'Unknown';
      console.log(`\n👤 Patient: ${patientName}`);
      console.log(`   National ID: ${patient.nationalId}`);
      console.log(`   Patient ID: ${patient._id}`);
      console.log('-'.repeat(80));

      // Check Medical Conditions (Diagnoses)
      const conditions = await MedicalCondition.find({ patient: patient._id })
        .populate('doctor', 'licenseNumber')
        .populate('hospital', 'name')
        .sort({ diagnosed: -1 })
        .limit(20);

      console.log(`\n📋 Medical Conditions (Diagnoses): ${conditions.length}`);
      if (conditions.length > 0) {
        conditions.forEach((cond, index) => {
          console.log(`   ${index + 1}. ${cond.name}`);
          console.log(`      Details: ${cond.details || 'N/A'}`);
          console.log(`      Diagnosed: ${cond.diagnosed ? new Date(cond.diagnosed).toLocaleString() : 'N/A'}`);
          console.log(`      Status: ${cond.status || 'N/A'}`);
          console.log(`      Doctor: ${cond.doctor?.licenseNumber || 'N/A'}`);
          console.log(`      Hospital: ${cond.hospital?.name || 'N/A'}`);
          console.log(`      Created: ${cond.createdAt ? new Date(cond.createdAt).toLocaleString() : 'N/A'}`);
          if (cond.notes && cond.notes.includes('OpenMRS')) {
            console.log(`      ✅ Synced from OpenMRS`);
          }
          console.log('');
        });
      } else {
        console.log('   ⚠️  No medical conditions found');
      }

      // Check Medications
      const medications = await Medication.find({ patient: patient._id })
        .populate('doctor', 'licenseNumber')
        .populate('hospital', 'name')
        .sort({ startDate: -1 })
        .limit(20);

      console.log(`\n💊 Medications: ${medications.length}`);
      if (medications.length > 0) {
        medications.forEach((med, index) => {
          console.log(`   ${index + 1}. ${med.name}`);
          console.log(`      Dosage: ${med.dosage || 'N/A'}`);
          console.log(`      Frequency: ${med.frequency || 'N/A'}`);
          console.log(`      Start Date: ${med.startDate ? new Date(med.startDate).toLocaleString() : 'N/A'}`);
          console.log(`      Status: ${med.status || 'N/A'}`);
          console.log(`      Doctor: ${med.doctor?.licenseNumber || 'N/A'}`);
          console.log(`      Hospital: ${med.hospital?.name || 'N/A'}`);
          console.log(`      Created: ${med.createdAt ? new Date(med.createdAt).toLocaleString() : 'N/A'}`);
          if (med.notes && med.notes.includes('OpenMRS')) {
            console.log(`      ✅ Synced from OpenMRS`);
          }
          console.log('');
        });
      } else {
        console.log('   ⚠️  No medications found');
      }

      // Check Medical Records (from OpenMRS Sync Service)
      const medicalRecords = await MedicalRecord.find({ patientId: patient._id.toString() })
        .sort({ createdAt: -1 })
        .limit(20);

      console.log(`\n📝 Medical Records (from OpenMRS Sync): ${medicalRecords.length}`);
      if (medicalRecords.length > 0) {
        medicalRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. Type: ${record.type}`);
          if (record.type === 'condition') {
            console.log(`      Diagnosis: ${record.data.name || 'N/A'}`);
            console.log(`      Details: ${record.data.details || 'N/A'}`);
          } else if (record.type === 'medication') {
            console.log(`      Medication: ${record.data.medicationName || 'N/A'}`);
            console.log(`      Dosage: ${record.data.dosage || 'N/A'}`);
          }
          if (record.openmrsData) {
            console.log(`      ✅ OpenMRS Data:`);
            console.log(`         Obs ID: ${record.openmrsData.obsId || 'N/A'}`);
            console.log(`         Concept ID: ${record.openmrsData.conceptId || 'N/A'}`);
            console.log(`         Person ID: ${record.openmrsData.personId || 'N/A'}`);
            console.log(`         Obs DateTime: ${record.openmrsData.obsDatetime ? new Date(record.openmrsData.obsDatetime).toLocaleString() : 'N/A'}`);
            console.log(`         Creator: ${record.openmrsData.creatorName || 'N/A'}`);
            console.log(`         Location: ${record.openmrsData.locationName || 'N/A'}`);
          }
          console.log(`      Created: ${record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️  No medical records found');
      }

      // Summary
      const totalObservations = conditions.length + medications.length + medicalRecords.length;
      console.log(`\n📊 Summary for ${patientName}:`);
      console.log(`   Total Observations: ${totalObservations}`);
      console.log(`   - Medical Conditions: ${conditions.length}`);
      console.log(`   - Medications: ${medications.length}`);
      console.log(`   - Medical Records: ${medicalRecords.length}`);
      console.log('═'.repeat(80));
    }

    // Overall Statistics
    console.log('\n\n📈 OVERALL STATISTICS');
    console.log('═'.repeat(80));
    
    const totalConditions = await MedicalCondition.countDocuments();
    const totalMedications = await Medication.countDocuments();
    const totalMedicalRecords = await MedicalRecord.countDocuments();
    const openmrsSyncedRecords = await MedicalRecord.countDocuments({ 'openmrsData.obsId': { $exists: true } });
    const openmrsSyncedConditions = await MedicalCondition.countDocuments({ notes: { $regex: /OpenMRS/i } });
    const openmrsSyncedMedications = await Medication.countDocuments({ notes: { $regex: /OpenMRS/i } });

    console.log(`Total Medical Conditions: ${totalConditions}`);
    console.log(`   - Synced from OpenMRS: ${openmrsSyncedConditions}`);
    console.log(`Total Medications: ${totalMedications}`);
    console.log(`   - Synced from OpenMRS: ${openmrsSyncedMedications}`);
    console.log(`Total Medical Records: ${totalMedicalRecords}`);
    console.log(`   - With OpenMRS Data: ${openmrsSyncedRecords}`);
    console.log(`\n✅ Total Observations Synced from OpenMRS: ${openmrsSyncedConditions + openmrsSyncedMedications + openmrsSyncedRecords}`);

    // Recent observations (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentConditions = await MedicalCondition.countDocuments({ createdAt: { $gte: yesterday } });
    const recentMedications = await Medication.countDocuments({ createdAt: { $gte: yesterday } });
    const recentRecords = await MedicalRecord.countDocuments({ createdAt: { $gte: yesterday } });

    console.log(`\n🕐 Observations in Last 24 Hours:`);
    console.log(`   - Medical Conditions: ${recentConditions}`);
    console.log(`   - Medications: ${recentMedications}`);
    console.log(`   - Medical Records: ${recentRecords}`);
    console.log(`   - Total: ${recentConditions + recentMedications + recentRecords}`);

    await mongoose.disconnect();
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get patient name from command line
const patientName = process.argv[2] || null;

if (patientName) {
  console.log(`🔍 Checking observations for patient: ${patientName}\n`);
} else {
  console.log('🔍 Checking observations for all patients (limited to 10)\n');
}

verifyObservations(patientName);

