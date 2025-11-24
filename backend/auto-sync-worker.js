/**
 * Automatic OpenMRS Sync Worker
 * 
 * This script runs continuously in the background and syncs observations
 * from OpenMRS to Patient Passport automatically every 30 seconds.
 * 
 * Usage: node auto-sync-worker.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';
const SYNC_INTERVAL_MS = 30000; // 30 seconds

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
  createdBy: String,
  openmrsData: Object,
  syncDate: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medicalrecords');

const patientSchema = new mongoose.Schema({}, { strict: false });
const Patient = mongoose.model('Patient', patientSchema, 'patients');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

let systemUser = null;
let lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Start from 24 hours ago

async function initializeSystemUser() {
  try {
    systemUser = await User.findOne({ email: 'system@openmrs.sync' });
    if (!systemUser) {
      console.log('🔧 Creating system user for OpenMRS sync...');
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
  } catch (error) {
    console.error('❌ Failed to initialize system user:', error.message);
  }
}

async function syncObservations() {
  let mysqlConnection;
  
  try {
    // Connect to OpenMRS MySQL
    mysqlConnection = await mysql.createConnection(openmrsConfig);

    // Get observations since last sync
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
      WHERE o.date_created >= ?
      AND o.voided = 0
      ORDER BY o.date_created DESC
      LIMIT 100
    `, [lastSyncTime]);

    if (observations.length === 0) {
      console.log(`🔄 [${new Date().toLocaleTimeString()}] No new observations to sync`);
      return;
    }

    console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Found ${observations.length} new observation(s) from OpenMRS\n`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const obs of observations) {
      // Find patient in our system
      const patient = await Patient.findOne({
        'openmrsData.uuid': obs.person_uuid
      });

      if (!patient) {
        console.log(`   ⚠️  Patient not found (UUID: ${obs.person_uuid}) - skipping obs ${obs.obs_id}`);
        skippedCount++;
        continue;
      }

      // Check if already synced
      const existing = await MedicalRecord.findOne({
        'openmrsData.obsId': obs.obs_id
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Create medical record
      const medicalRecord = new MedicalRecord({
        patientId: patient._id.toString(),
        type: 'condition',
        createdBy: systemUser._id.toString(),
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
      console.log(`   ✅ Synced obs ${obs.obs_id} for patient ${patient._id}`);
      syncedCount++;
    }

    if (syncedCount > 0) {
      console.log(`\n✅ Sync Summary: ${syncedCount} synced, ${skippedCount} skipped\n`);
    }

    // Update last sync time
    lastSyncTime = new Date();

  } catch (error) {
    console.error(`❌ [${new Date().toLocaleTimeString()}] Sync error:`, error.message);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

async function startAutoSync() {
  console.log('\n🚀 ═══════════════════════════════════════════════════════');
  console.log('🚀 Starting Automatic OpenMRS Sync Worker');
  console.log('🚀 ═══════════════════════════════════════════════════════\n');
  
  try {
    // Connect to MongoDB
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Initialize system user
    await initializeSystemUser();

    console.log(`⏰ Sync interval: ${SYNC_INTERVAL_MS / 1000} seconds`);
    console.log(`🔗 OpenMRS: ${openmrsConfig.host}:${openmrsConfig.port}`);
    console.log(`📦 Database: ${openmrsConfig.database}\n`);
    console.log('🔄 Starting automatic sync loop...\n');

    // Run initial sync
    await syncObservations();

    // Schedule periodic sync
    setInterval(async () => {
      await syncObservations();
    }, SYNC_INTERVAL_MS);

    console.log('✅ Auto-sync worker is running! Press Ctrl+C to stop.\n');

  } catch (error) {
    console.error('\n❌ Failed to start auto-sync worker:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down auto-sync worker...');
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down auto-sync worker...');
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
});

// Start the worker
startAutoSync();
