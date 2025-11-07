const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const OPENMRS_DB_HOST = process.env.HOSPITAL_1_DB_HOST || 'localhost';
const OPENMRS_DB_PORT = parseInt(process.env.HOSPITAL_1_DB_PORT || '3306');
const OPENMRS_DB_NAME = process.env.HOSPITAL_1_DB_NAME || 'openmrs';
const OPENMRS_DB_USER = process.env.HOSPITAL_1_DB_USER;
const OPENMRS_DB_PASS = process.env.HOSPITAL_1_DB_PASSWORD;

async function verifyLatestObservations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Connect to OpenMRS MySQL
    const mysqlConnection = await mysql.createConnection({
      host: OPENMRS_DB_HOST,
      port: OPENMRS_DB_PORT,
      database: OPENMRS_DB_NAME,
      user: OPENMRS_DB_USER,
      password: OPENMRS_DB_PASS
    });
    console.log('✅ Connected to OpenMRS MySQL\n');

    // Get Betty Williams' latest observations from OpenMRS
    console.log('============================================================');
    console.log('📊 BETTY WILLIAMS - LATEST OPENMRS OBSERVATIONS');
    console.log('============================================================\n');

    const [observations] = await mysqlConnection.query(`
      SELECT 
        o.obs_id,
        o.person_id,
        o.obs_datetime,
        o.date_created,
        o.value_text,
        o.value_numeric,
        cn.name as concept_name,
        cn2.name as value_concept_name,
        CONCAT(pn.given_name, ' ', pn.family_name) as creator_name
      FROM obs o
      JOIN person p ON o.person_id = p.person_id
      JOIN person_name pn_patient ON p.person_id = pn_patient.person_id AND pn_patient.voided = 0 AND pn_patient.preferred = 1
      JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
      LEFT JOIN concept_name cn2 ON o.value_coded = cn2.concept_id AND cn2.locale = 'en' AND cn2.concept_name_type = 'FULLY_SPECIFIED'
      LEFT JOIN users u ON o.creator = u.user_id
      LEFT JOIN person_name pn ON u.person_id = pn.person_id AND pn.voided = 0
      WHERE pn_patient.given_name = 'Betty' 
        AND pn_patient.family_name = 'Williams'
        AND o.voided = 0
      ORDER BY o.date_created DESC
      LIMIT 10
    `);

    console.log(`Found ${observations.length} latest observations:\n`);
    
    observations.forEach((obs, idx) => {
      console.log(`${idx + 1}. Observation ID: ${obs.obs_id}`);
      console.log(`   Concept: ${obs.concept_name}`);
      console.log(`   Value Text: ${obs.value_text || 'N/A'}`);
      console.log(`   Value Numeric: ${obs.value_numeric || 'N/A'}`);
      console.log(`   Value Concept: ${obs.value_concept_name || 'N/A'}`);
      console.log(`   Created: ${obs.date_created}`);
      console.log(`   Creator: ${obs.creator_name}`);
      console.log('');
    });

    // Check sync timestamp
    const SyncStatus = mongoose.model('SyncStatus', new mongoose.Schema({}, { strict: false }), 'sync_timestamps');
    const lastSync = await SyncStatus.findOne({ hospitalId: process.env.HOSPITAL_1_ID });
    
    console.log('============================================================');
    console.log('🔄 SYNC STATUS');
    console.log('============================================================\n');
    
    if (lastSync) {
      console.log(`Last Sync Time: ${lastSync.lastSync}`);
      console.log(`Hospital ID: ${lastSync.hospitalId}`);
      
      // Check if new observations are after last sync
      const lastSyncDate = new Date(lastSync.lastSync);
      const newObservations = observations.filter(obs => new Date(obs.date_created) > lastSyncDate);
      
      console.log(`\nObservations since last sync: ${newObservations.length}`);
      
      if (newObservations.length > 0) {
        console.log('\n⚠️ NEW OBSERVATIONS NOT YET SYNCED:');
        newObservations.forEach(obs => {
          console.log(`   - ${obs.concept_name}: ${obs.value_text || obs.value_concept_name || obs.value_numeric}`);
        });
        console.log('\n💡 These will sync in the next cycle (every 5 minutes)');
      } else {
        console.log('\n✅ All observations have been synced');
      }
    } else {
      console.log('❌ No sync history found');
    }

    // Check Patient Passport medical records
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    const bettyUser = await User.findOne({ name: /Betty Williams/i, role: 'patient' });
    if (bettyUser) {
      const bettyPatient = await Patient.findOne({ user: bettyUser._id });
      if (bettyPatient) {
        const records = await MedicalRecord.find({ 
          patientId: bettyPatient._id.toString() 
        }).sort({ createdAt: -1 }).limit(5);

        console.log('\n============================================================');
        console.log('📋 PATIENT PASSPORT - 5 MOST RECENT RECORDS');
        console.log('============================================================\n');

        records.forEach((record, idx) => {
          console.log(`${idx + 1}. ${record.type.toUpperCase()}`);
          console.log(`   ID: ${record._id}`);
          console.log(`   Created: ${record.createdAt}`);
          if (record.data.name) console.log(`   Name: ${record.data.name}`);
          if (record.data.testName) console.log(`   Test: ${record.data.testName}`);
          if (record.data.medicationName) console.log(`   Medication: ${record.data.medicationName}`);
          if (record.data.details) console.log(`   Details: ${record.data.details.substring(0, 80)}...`);
          console.log('');
        });

        console.log(`Total records in Patient Passport: ${await MedicalRecord.countDocuments({ patientId: bettyPatient._id.toString() })}`);
      }
    }

    console.log('\n============================================================');
    console.log('💡 NEXT STEPS');
    console.log('============================================================\n');
    console.log('1. Backend server is running and syncing every 5 minutes');
    console.log('2. New observations will be synced automatically');
    console.log('3. Trigger manual sync or wait for next cycle');

    await mysqlConnection.end();
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyLatestObservations();
