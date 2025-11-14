/**
 * Script to fix existing MedicalRecord entries by fetching provider and location
 * directly from OpenMRS database using encounter_id
 * 
 * This will update records that have placeholder values like "DB Sync Service" or "OpenMRS Hospital"
 * with the actual provider name (e.g., "Jake Doctor") and location (e.g., "Site 1")
 */

require('dotenv').config();
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/patient-passport';

const OPENMRS_DB_CONFIG = {
  host: process.env.OPENMRS_DB_HOST || 'localhost',
  port: parseInt(process.env.OPENMRS_DB_PORT || '3306'),
  user: process.env.OPENMRS_DB_USER || 'openmrs_user',
  password: process.env.OPENMRS_DB_PASSWORD || 'OpenMRSPass123!',
  database: process.env.OPENMRS_DB_NAME || 'openmrs'
};

/**
 * Get provider from encounter
 */
async function getProviderFromEncounter(connection, encounterId) {
  if (!encounterId) return null;

  try {
    const [rows] = await connection.query(`
      SELECT 
        pn.given_name,
        pn.family_name,
        pn.middle_name,
        er.name as role_name
      FROM encounter_provider ep
      JOIN provider p ON ep.provider_id = p.provider_id AND p.retired = 0
      JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
      LEFT JOIN encounter_role er ON ep.encounter_role_id = er.encounter_role_id
      WHERE ep.encounter_id = ?
        AND ep.voided = 0
      ORDER BY 
        CASE WHEN er.name = 'Clinician' THEN 1 ELSE 2 END,
        ep.date_created DESC
      LIMIT 1
    `, [encounterId]);

    if (rows && rows.length > 0) {
      const provider = rows[0];
      const givenName = (provider.given_name || '').trim();
      const familyName = (provider.family_name || '').trim();
      const middleName = (provider.middle_name || '').trim();

      if (givenName && familyName) {
        return middleName ? `${givenName} ${middleName} ${familyName}` : `${givenName} ${familyName}`;
      } else if (givenName) {
        return givenName;
      } else if (familyName) {
        return familyName;
      }
    }
  } catch (error) {
    console.warn(`   ⚠️ Error fetching provider from encounter ${encounterId}:`, error.message);
  }

  return null;
}

/**
 * Get location from encounter
 */
async function getLocationFromEncounter(connection, encounterId) {
  if (!encounterId) return null;

  try {
    const [rows] = await connection.query(`
      SELECT l.name as location_name
      FROM encounter e
      JOIN location l ON e.location_id = l.location_id AND l.retired = 0
      WHERE e.encounter_id = ?
        AND e.voided = 0
      LIMIT 1
    `, [encounterId]);

    if (rows && rows.length > 0 && rows[0].location_name) {
      return rows[0].location_name;
    }
  } catch (error) {
    console.warn(`   ⚠️ Error fetching location from encounter ${encounterId}:`, error.message);
  }

  return null;
}

/**
 * Get encounter_id from obs_id
 */
async function getEncounterIdFromObs(connection, obsId) {
  try {
    const [rows] = await connection.query(`
      SELECT encounter_id
      FROM obs
      WHERE obs_id = ?
        AND voided = 0
      LIMIT 1
    `, [obsId]);

    if (rows && rows.length > 0) {
      return rows[0].encounter_id;
    }
  } catch (error) {
    console.warn(`   ⚠️ Error fetching encounter_id from obs ${obsId}:`, error.message);
  }

  return null;
}

async function fixRecords() {
  let mongoConnection = null;
  let mysqlConnection = null;

  try {
    console.log('🔌 Connecting to MongoDB...');
    mongoConnection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔌 Connecting to OpenMRS database...');
    mysqlConnection = await mysql.createConnection(OPENMRS_DB_CONFIG);
    console.log('✅ Connected to OpenMRS database\n');

    // Get MedicalRecord model
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');

    // Find records that need fixing (have placeholder values or missing data)
    const records = await MedicalRecord.find({
      'openmrsData': { $exists: true, $ne: null },
      $or: [
        { 'data.doctor': { $regex: /DB.*SYNC|SYNC.*SERVICE/i } },
        { 'data.hospital': { $regex: /OpenMRS.*Hospital/i } },
        { 'data.doctor': { $exists: false } },
        { 'data.hospital': { $exists: false } },
        { 'data.doctor': null },
        { 'data.hospital': null },
        { 'data.doctor': '' },
        { 'data.hospital': '' },
        { 'data.doctor': 'Unknown Doctor' },
        { 'data.hospital': 'Unknown Hospital' }
      ]
    });

    console.log(`📊 Found ${records.length} records to check/fix\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Get encounter_id from openmrsData or from obs_id
        let encounterId = null;
        if (record.openmrsData?.encounterUuid) {
          // Try to parse encounterUuid as encounter_id (it might be stored as string)
          const parsed = parseInt(record.openmrsData.encounterUuid);
          if (!isNaN(parsed)) {
            encounterId = parsed;
          }
        }
        
        // If no encounter_id from openmrsData, try to get it from obs_id
        if (!encounterId && record.openmrsData?.obsId) {
          encounterId = await getEncounterIdFromObs(mysqlConnection, record.openmrsData.obsId);
        }

        // Get provider from encounter if we have encounter_id
        const currentDoctor = record.data?.doctor || '';
        const isPlaceholderDoctor = /DB.*SYNC|SYNC.*SERVICE|Unknown Doctor/i.test(currentDoctor);
        
        if ((!currentDoctor || isPlaceholderDoctor) && encounterId) {
          const providerName = await getProviderFromEncounter(mysqlConnection, encounterId);
          if (providerName && !providerName.includes('SYNC') && !providerName.includes('SERVICE')) {
            updates['data.doctor'] = providerName;
            if (record.type === 'condition') {
              updates['data.diagnosedBy'] = providerName;
            } else if (record.type === 'medication') {
              updates['data.prescribedBy'] = providerName;
            }
            updates['openmrsData.creatorName'] = providerName;
            needsUpdate = true;
          }
        }

        // Get location from encounter if we have encounter_id
        const currentHospital = record.data?.hospital || '';
        const isPlaceholderHospital = /OpenMRS.*Hospital|Unknown Hospital/i.test(currentHospital);
        
        if ((!currentHospital || isPlaceholderHospital) && encounterId) {
          const locationName = await getLocationFromEncounter(mysqlConnection, encounterId);
          if (locationName && !locationName.includes('OpenMRS Hospital')) {
            updates['data.hospital'] = locationName;
            updates['openmrsData.locationName'] = locationName;
            needsUpdate = true;
          }
        }

        // Fallback: Use openmrsData if available and not placeholders
        if (!updates['data.doctor'] && isPlaceholderDoctor) {
          const openmrsDoctor = record.openmrsData?.creatorName || '';
          if (openmrsDoctor && !openmrsDoctor.includes('SYNC') && !openmrsDoctor.includes('SERVICE')) {
            updates['data.doctor'] = openmrsDoctor;
            if (record.type === 'condition') {
              updates['data.diagnosedBy'] = openmrsDoctor;
            } else if (record.type === 'medication') {
              updates['data.prescribedBy'] = openmrsDoctor;
            }
            needsUpdate = true;
          }
        }

        if (!updates['data.hospital'] && isPlaceholderHospital) {
          const openmrsHospital = record.openmrsData?.locationName || '';
          if (openmrsHospital && !openmrsHospital.includes('OpenMRS Hospital')) {
            updates['data.hospital'] = openmrsHospital;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await MedicalRecord.updateOne(
            { _id: record._id },
            { $set: updates }
          );
          updatedCount++;
          console.log(`✅ Updated record ${record._id.toString().substring(0, 8)}... (${record.type}):`);
          if (updates['data.doctor']) {
            console.log(`   - Doctor: "${updates['data.doctor']}"`);
          }
          if (updates['data.hospital']) {
            console.log(`   - Hospital: "${updates['data.hospital']}"`);
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error updating record ${record._id}:`, error.message);
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`   - Updated: ${updatedCount} records`);
    console.log(`   - Skipped: ${skippedCount} records (no changes needed)`);
    console.log(`   - Errors: ${errorCount} records`);
    console.log(`   - Total: ${records.length} records\n`);

    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    await mongoose.disconnect();
    console.log('✅ Disconnected from databases');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (mysqlConnection) {
      await mysqlConnection.end().catch(() => {});
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

fixRecords();


