require('dotenv').config();
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

// MySQL connection for OpenMRS
const openmrsConfig = {
  host: process.env.OPENMRS_DB_HOST || '102.130.118.47',
  port: parseInt(process.env.OPENMRS_DB_PORT || '3306'),
  user: process.env.OPENMRS_DB_USER || 'openmrs',
  password: process.env.OPENMRS_DB_PASSWORD || 'Openmrs123',
  database: process.env.OPENMRS_DB_NAME || 'openmrs'
};

// MedicalRecord schema
const medicalRecordSchema = new mongoose.Schema({
  patientId: String,
  type: String,
  data: Object,
  createdBy: String,  // Added: Required field for validation
  openmrsData: Object,
  syncDate: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medicalrecords');

const patientSchema = new mongoose.Schema({}, { strict: false });
const Patient = mongoose.model('Patient', patientSchema, 'patients');

// User schema to get system user for createdBy
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function syncTodaysObservationDirectly() {
  let mysqlConnection;
  
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Connecting to OpenMRS MySQL...');
    mysqlConnection = await mysql.createConnection(openmrsConfig);
    console.log('✅ Connected to OpenMRS database\n');

    // Get or create a system user for createdBy field
    let systemUser = await User.findOne({ email: 'system@openmrs.sync' });
    if (!systemUser) {
      console.log('Creating system user for OpenMRS sync...');
      systemUser = await User.create({
        email: 'system@openmrs.sync',
        name: 'OpenMRS Sync Service',
        role: 'doctor',
        password: 'NOT_USED_' + Math.random().toString(36)
      });
      console.log(`✅ Created system user: ${systemUser._id}\n`);
    } else {
      console.log(`✅ Using existing system user: ${systemUser._id}\n`);
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📅 Fetching observations from today (${today.toDateString()})...\n`);

    // Query for today's observations
    const [observations] = await mysqlConnection.execute(`
      SELECT 
        o.obs_id,
        o.person_id,
        o.concept_id,
        o.encounter_id,
        o.obs_datetime,
        o.date_created,
        o.value_text,
        o.value_coded,
        cn.name as concept_name,
        cn2.name as value_name,
        p.uuid as person_uuid,
        l.name as location_name,
        CONCAT(pn.given_name, ' ', pn.family_name) as creator_name
      FROM obs o
      LEFT JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
      LEFT JOIN concept_name cn2 ON o.value_coded = cn2.concept_id AND cn2.locale = 'en' AND cn2.concept_name_type = 'FULLY_SPECIFIED'
      LEFT JOIN person p ON o.person_id = p.person_id
      LEFT JOIN encounter e ON o.encounter_id = e.encounter_id
      LEFT JOIN location l ON e.location_id = l.location_id
      LEFT JOIN users u ON o.creator = u.user_id
      LEFT JOIN person_name pn ON u.person_id = pn.person_id
      WHERE o.obs_datetime >= ? AND o.obs_datetime < ?
      AND o.voided = 0
      ORDER BY o.obs_datetime DESC
    `, [today, tomorrow]);

    console.log(`📊 Found ${observations.length} observation(s) from today in OpenMRS\n`);

    if (observations.length === 0) {
      console.log('❌ No observations found for today');
      return;
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const obs of observations) {
      console.log(`\n📋 Processing observation ${obs.obs_id}:`);
      console.log(`   Concept: ${obs.concept_name}`);
      console.log(`   Value: ${obs.value_name || obs.value_text || 'N/A'}`);
      console.log(`   Person UUID: ${obs.person_uuid}`);
      console.log(`   Date: ${obs.obs_datetime}`);

      // Find patient in our system
      const patient = await Patient.findOne({
        'openmrsData.uuid': obs.person_uuid
      });

      if (!patient) {
        console.log(`   ⚠️  Patient not found in our system (UUID: ${obs.person_uuid})`);
        skippedCount++;
        continue;
      }

      console.log(`   ✅ Found patient: ${patient._id}`);

      // Check if already synced
      const existing = await MedicalRecord.findOne({
        'openmrsData.obsId': obs.obs_id
      });

      if (existing) {
        console.log(`   ⚠️  Already synced (Record ID: ${existing._id})`);
        skippedCount++;
        continue;
      }

      // Create medical record
      const medicalRecord = new MedicalRecord({
        patientId: patient._id.toString(),
        type: 'condition',
        createdBy: systemUser._id.toString(),  // CRITICAL: Set createdBy for validation
        data: {
          name: obs.concept_name || 'Unknown',
          diagnosis: obs.concept_name || 'Unknown',
          details: obs.value_name || obs.value_text || '',
          diagnosed: obs.obs_datetime,
          diagnosedDate: obs.obs_datetime,
          date: obs.obs_datetime,
          doctor: obs.creator_name || 'Unknown Doctor',
          diagnosedBy: obs.creator_name || 'Unknown Doctor',
          hospital: obs.location_name || 'Unknown Hospital',
          notes: obs.value_name || obs.value_text || '',
          status: 'active',
          medications: []
        },
        openmrsData: {
          obsId: obs.obs_id,
          conceptId: obs.concept_id,
          personId: obs.person_id,
          obsDatetime: new Date(obs.obs_datetime),
          dateCreated: new Date(obs.date_created),
          creatorName: obs.creator_name || 'Unknown',
          locationName: obs.location_name || 'Unknown Hospital',
          encounterUuid: obs.encounter_id,
          valueType: obs.value_coded ? 'coded' : 'text'
        },
        syncDate: new Date()
      });

      await medicalRecord.save();
      console.log(`   ✅ Synced successfully! (Record ID: ${medicalRecord._id})`);
      syncedCount++;
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   📋 Total: ${observations.length}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('\n✅ Disconnected from MySQL');
    }
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

syncTodaysObservationDirectly();
