/**
 * Robust Auto-Sync Script
 * Automatically syncs OpenMRS observations every 10 seconds
 * Features:
 * - Auto-restart on failure
 * - Connection retry logic
 * - Error recovery
 * - Never stops syncing
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const SYNC_INTERVAL_MS = 10000; // 10 seconds
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://bienaimee:Bienaimee2005@cluster0.fslpg5p.mongodb.net/PatientPassport?retryWrites=true&w=majority';

// OpenMRS MySQL connection
const openmrsConfig = {
  host: process.env.OPENMRS_DB_HOST || '102.130.118.47',
  port: parseInt(process.env.OPENMRS_DB_PORT || '3306'),
  user: process.env.OPENMRS_DB_USER || 'openmrs',
  password: process.env.OPENMRS_DB_PASSWORD || 'Openmrs123',
  database: process.env.OPENMRS_DB_NAME || 'openmrs',
  connectTimeout: 30000,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
};

// Mongoose schemas
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

let syncCount = 0;
let successCount = 0;
let errorCount = 0;
let isRunning = true;
let mongoConnection = null;
let mysqlConnection = null;

// Connect to MongoDB with retry
async function connectMongoDB(retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      if (mongoConnection && mongoose.connection.readyState === 1) {
        return true;
      }
      
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000
      });
      
      mongoConnection = mongoose.connection;
      console.log('✅ MongoDB connected');
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  return false;
}

// Connect to OpenMRS MySQL with retry
async function connectOpenMRS(retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      if (mysqlConnection) {
        try {
          await mysqlConnection.ping();
          return mysqlConnection;
        } catch (pingError) {
          await mysqlConnection.end();
          mysqlConnection = null;
        }
      }

      mysqlConnection = await mysql.createConnection(openmrsConfig);
      console.log('✅ OpenMRS MySQL connected');
      return mysqlConnection;
    } catch (error) {
      console.error(`❌ OpenMRS connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  return null;
}

// Get or create system user
async function getSystemUser() {
  try {
    let systemUser = await User.findOne({ email: 'system@patientpassport.com' });
    if (!systemUser) {
      systemUser = await User.create({
        email: 'system@patientpassport.com',
        role: 'system',
        firstName: 'System',
        lastName: 'Sync'
      });
      console.log('✅ Created system user');
    }
    return systemUser._id.toString();
  } catch (error) {
    console.error('❌ Error getting system user:', error.message);
    return null;
  }
}

// Sync observations
async function syncObservations() {
  const startTime = Date.now();
  
  try {
    // Ensure connections
    const mongoOk = await connectMongoDB();
    if (!mongoOk) {
      throw new Error('MongoDB connection failed');
    }

    const mysql = await connectOpenMRS();
    if (!mysql) {
      throw new Error('OpenMRS connection failed');
    }

    const systemUserId = await getSystemUser();
    if (!systemUserId) {
      throw new Error('Failed to get system user');
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch observations from OpenMRS
    const [observations] = await mysql.query(`
      SELECT 
        o.obs_id,
        o.person_id,
        o.obs_datetime,
        o.value_text,
        o.value_numeric,
        o.comments,
        cn.name as concept_name,
        p.uuid as person_uuid,
        CONCAT(pn.given_name, ' ', pn.family_name) as patient_name,
        l.name as location_name,
        u.username as provider_name
      FROM obs o
      JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.concept_name_type = 'FULLY_SPECIFIED'
      JOIN person p ON o.person_id = p.person_id
      LEFT JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0
      LEFT JOIN location l ON o.location_id = l.location_id
      LEFT JOIN users u ON o.creator = u.user_id
      WHERE o.voided = 0
        AND o.obs_datetime >= ?
        AND o.obs_datetime < ?
      ORDER BY o.obs_datetime DESC
    `, [today, tomorrow]);

    let synced = 0;
    let skipped = 0;

    for (const obs of observations) {
      try {
        // Find patient by OpenMRS UUID (check both fields)
        let patient = await Patient.findOne({ 
          $or: [
            { openmrsUuid: obs.person_uuid },
            { 'openmrsData.uuid': obs.person_uuid }
          ]
        });
        
        if (!patient) {
          console.log(`⚠️  No patient found for UUID: ${obs.person_uuid}`);
          continue;
        }

        // Check if already synced
        const exists = await MedicalRecord.findOne({
          'openmrsData.obs_id': obs.obs_id
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Create medical record
        const value = obs.value_text || obs.value_numeric?.toString() || 'N/A';
        
        await MedicalRecord.create({
          patientId: patient._id.toString(),
          type: 'condition',
          createdBy: systemUserId,
          syncDate: new Date(),
          data: {
            diagnosis: obs.concept_name,
            details: value,
            notes: obs.comments || '',
            diagnosedBy: obs.provider_name || 'Super User',
            diagnosedDate: obs.obs_datetime,
            hospital: obs.location_name || 'Unknown Hospital',
            date: obs.obs_datetime,
            diagnosed: true,
            status: 'active',
            medications: []
          },
          openmrsData: {
            obs_id: obs.obs_id,
            person_id: obs.person_id,
            obs_datetime: obs.obs_datetime,
            concept_name: obs.concept_name,
            location_name: obs.location_name,
            provider_name: obs.provider_name
          }
        });

        synced++;
      } catch (recordError) {
        console.error(`⚠️  Error processing observation ${obs.obs_id}:`, recordError.message);
      }
    }

    const duration = Date.now() - startTime;
    syncCount++;
    successCount++;

    console.log(`✅ [${new Date().toLocaleTimeString()}] Sync #${syncCount} completed in ${duration}ms`);
    console.log(`   📊 Found: ${observations.length}, Synced: ${synced}, Skipped: ${skipped}`);
    console.log(`   📈 Success: ${successCount}, Errors: ${errorCount}`);

    return true;
  } catch (error) {
    errorCount++;
    console.error(`❌ [${new Date().toLocaleTimeString()}] Sync #${syncCount + 1} failed:`, error.message);
    return false;
  }
}

// Main sync loop
async function startSyncLoop() {
  console.log('🔄 Starting Robust Auto-Sync Loop');
  console.log(`⏱️  Sync interval: ${SYNC_INTERVAL_MS / 1000} seconds`);
  console.log(`🔄 Auto-restart: ENABLED`);
  console.log(`🔧 Connection retry: ${MAX_RETRIES} attempts\n`);

  while (isRunning) {
    await syncObservations();
    
    // Wait for next sync
    await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL_MS));
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down auto-sync...');
  console.log(`📊 Total syncs: ${syncCount}, Success: ${successCount}, Errors: ${errorCount}`);
  
  isRunning = false;
  
  if (mysqlConnection) {
    await mysqlConnection.end();
  }
  
  if (mongoConnection) {
    await mongoose.disconnect();
  }
  
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  console.log('🔄 Continuing sync loop...');
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  console.log('🔄 Continuing sync loop...');
});

// Start the sync loop
startSyncLoop().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
