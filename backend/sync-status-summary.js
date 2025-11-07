const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function showSummary() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');

    // Count all patients
    const totalPatients = await Patient.countDocuments();
    console.log(`📊 Total Patients in Patient Passport: ${totalPatients}`);

    // Count patients with medical records
    const patientsWithRecords = await MedicalRecord.distinct('patientId');
    console.log(`✅ Patients with Medical Records: ${patientsWithRecords.length}`);

    // Total medical records
    const totalRecords = await MedicalRecord.countDocuments();
    console.log(`📋 Total Medical Records Synced: ${totalRecords}`);

    console.log(`\n============================================================`);
    console.log(`📈 PATIENTS WITH SYNCED RECORDS:`);
    console.log(`============================================================\n`);

    for (const patientId of patientsWithRecords) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        const user = await User.findById(patient.user);
        const recordCount = await MedicalRecord.countDocuments({ patientId: patientId.toString() });
        if (user) {
          console.log(`✅ ${user.name} (${patient.nationalId}): ${recordCount} records`);
        } else {
          console.log(`✅ Patient ${patient.nationalId}: ${recordCount} records (user not found)`);
        }
      }
    }

    console.log(`\n============================================================`);
    console.log(`🎉 SYNC STATUS`);
    console.log(`============================================================`);
    
    if (patientsWithRecords.length > 1) {
      console.log(`\n✅ SUCCESS! Multi-patient sync is working!`);
      console.log(`   ${patientsWithRecords.length} patients have synced observations`);
    } else if (patientsWithRecords.length === 1) {
      console.log(`\n⚠️ Only 1 patient syncing. Auto-registration may still be processing...`);
      console.log(`   Wait for next sync cycle (every 5 minutes)`);
    } else {
      console.log(`\n❌ No patients synced yet`);
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showSummary();
