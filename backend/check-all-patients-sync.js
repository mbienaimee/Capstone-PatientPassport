/**
 * Verify All Patients Sync Status
 * 
 * This script checks:
 * 1. All patients in Patient Passport
 * 2. All patients in OpenMRS
 * 3. Medical records synced for each patient
 */

const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllPatientsSync() {
  try {
    console.log('🔍 ═══════════════════════════════════════════════════════');
    console.log('🔍 Checking Sync Status for ALL Patients');
    console.log('🔍 ═══════════════════════════════════════════════════════\n');

    // Connect to MongoDB (Patient Passport)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Patient Passport MongoDB\n');

    // Connect to OpenMRS MySQL (using Hospital 1 config)
    const mysqlConnection = await mysql.createConnection({
      host: process.env.HOSPITAL_1_DB_HOST || 'localhost',
      port: parseInt(process.env.HOSPITAL_1_DB_PORT || '3306'),
      user: process.env.HOSPITAL_1_DB_USER || 'openmrs_user',
      password: process.env.HOSPITAL_1_DB_PASSWORD || 'OpenMRSPass123!',
      database: process.env.HOSPITAL_1_DB_NAME || 'openmrs'
    });
    console.log('✅ Connected to OpenMRS MySQL\n');

    // Import models
    const User = require('./src/models/User').default;
    const Patient = require('./src/models/Patient').default;
    const MedicalRecord = require('./src/models/MedicalRecord').default;

    // Get all patients from Patient Passport
    const patients = await Patient.find().populate('user');
    console.log(`📊 Total Patients in Patient Passport: ${patients.length}\n`);

    // Get all patients from OpenMRS
    const [openmrsPatients] = await mysqlConnection.query(`
      SELECT 
        p.person_id,
        pn.given_name,
        pn.middle_name,
        pn.family_name,
        pi.identifier,
        COUNT(DISTINCT o.obs_id) as observation_count
      FROM person p
      JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
      LEFT JOIN patient_identifier pi ON pi.patient_id = p.person_id AND pi.voided = 0
      LEFT JOIN obs o ON o.person_id = p.person_id AND o.voided = 0
      WHERE p.voided = 0
      GROUP BY p.person_id, pn.given_name, pn.middle_name, pn.family_name, pi.identifier
      ORDER BY pn.family_name, pn.given_name
    `);
    console.log(`📊 Total Patients in OpenMRS: ${openmrsPatients.length}\n`);

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 SYNC STATUS FOR EACH PATIENT:\n');
    console.log('═══════════════════════════════════════════════════════\n');

    let totalSynced = 0;
    let totalNotSynced = 0;

    // Check each OpenMRS patient
    for (const openmrsPatient of openmrsPatients) {
      const fullName = `${openmrsPatient.given_name || ''} ${openmrsPatient.middle_name || ''} ${openmrsPatient.family_name || ''}`.replace(/\s+/g, ' ').trim();
      
      console.log(`👤 OpenMRS Patient: ${fullName}`);
      console.log(`   Person ID: ${openmrsPatient.person_id}`);
      console.log(`   Identifier: ${openmrsPatient.identifier || 'N/A'}`);
      console.log(`   OpenMRS Observations: ${openmrsPatient.observation_count}`);

      // Try to find matching patient in Patient Passport
      let matchedPatient = null;

      // Strategy 1: Try by identifier (national ID)
      if (openmrsPatient.identifier) {
        matchedPatient = await Patient.findOne({ nationalId: openmrsPatient.identifier }).populate('user');
      }

      // Strategy 2: Try by name matching
      if (!matchedPatient) {
        const user = await User.findOne({
          name: { $regex: new RegExp(`^${fullName}$`, 'i') },
          role: 'patient'
        });
        if (user) {
          matchedPatient = await Patient.findOne({ user: user._id }).populate('user');
        }
      }

      // Strategy 3: Try partial name match (given + family)
      if (!matchedPatient && openmrsPatient.given_name && openmrsPatient.family_name) {
        const namePattern = `${openmrsPatient.given_name}.*${openmrsPatient.family_name}`;
        const user = await User.findOne({
          name: { $regex: new RegExp(namePattern, 'i') },
          role: 'patient'
        });
        if (user) {
          matchedPatient = await Patient.findOne({ user: user._id }).populate('user');
        }
      }

      if (matchedPatient) {
        // Count synced medical records
        const syncedRecords = await MedicalRecord.countDocuments({
          patientId: matchedPatient._id.toString()
        });

        console.log(`   ✅ MATCHED in Patient Passport: ${matchedPatient.user.name}`);
        console.log(`   Patient ID: ${matchedPatient._id}`);
        console.log(`   Synced Medical Records: ${syncedRecords}`);
        
        if (syncedRecords > 0) {
          console.log(`   🟢 STATUS: SYNCING (${syncedRecords}/${openmrsPatient.observation_count} records)`);
          totalSynced++;
        } else {
          console.log(`   🟡 STATUS: MATCHED BUT NO RECORDS SYNCED YET`);
          totalNotSynced++;
        }
      } else {
        console.log(`   ❌ NOT MATCHED in Patient Passport`);
        console.log(`   🔴 STATUS: NOT REGISTERED (Please register "${fullName}" in Patient Passport)`);
        totalNotSynced++;
      }

      console.log('');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`Total OpenMRS Patients: ${openmrsPatients.length}`);
    console.log(`Patients Syncing Records: ${totalSynced} 🟢`);
    console.log(`Patients Not Syncing: ${totalNotSynced} 🔴`);
    console.log(`\nSync Rate: ${((totalSynced / openmrsPatients.length) * 100).toFixed(1)}%`);
    
    if (totalNotSynced > 0) {
      console.log('\n⚠️ ACTION REQUIRED:');
      console.log(`   ${totalNotSynced} patient(s) need to be registered in Patient Passport`);
      console.log('   Once registered, their observations will automatically sync every 5 minutes.');
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Cleanup
    await mysqlConnection.end();
    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllPatientsSync();
