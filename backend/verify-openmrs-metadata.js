/**
 * Verify OpenMRS Metadata in Medical Records
 * This script checks if the latest medical records have OpenMRS metadata attached
 */

require('dotenv').config();
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;

// OpenMRS MySQL Connection
const openmrsConfig = {
  host: process.env.OPENMRS_DB_HOST || 'localhost',
  port: parseInt(process.env.OPENMRS_DB_PORT || '3306'),
  user: process.env.OPENMRS_DB_USER || 'openmrs_user',
  password: process.env.OPENMRS_DB_PASSWORD || 'openmrs_password',
  database: process.env.OPENMRS_DB_NAME || 'openmrs'
};

async function main() {
  let mongoConnection, mysqlConnection;

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Connect to OpenMRS MySQL
    console.log('🔌 Connecting to OpenMRS MySQL...');
    mysqlConnection = await mysql.createConnection(openmrsConfig);
    console.log('✅ Connected to OpenMRS MySQL\n');

    // Import models
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }));
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Find Betty Williams
    const bettyUser = await User.findOne({ 
      name: { $regex: /Betty Williams/i },
      role: 'patient'
    });

    if (!bettyUser) {
      console.log('❌ Betty Williams user not found');
      return;
    }

    const bettyPatient = await Patient.findOne({ user: bettyUser._id });
    if (!bettyPatient) {
      console.log('❌ Betty Williams patient record not found');
      return;
    }

    console.log('👤 BETTY WILLIAMS - PATIENT INFORMATION');
    console.log('='.repeat(60));
    console.log(`Patient ID: ${bettyPatient._id}`);
    console.log(`National ID: ${bettyPatient.nationalId}`);
    console.log(`Email: ${bettyUser.email}\n`);

    // Get all medical records for Betty
    const allRecords = await MedicalRecord.find({ 
      patientId: bettyPatient._id.toString() 
    }).sort({ createdAt: -1 });

    console.log(`📊 TOTAL MEDICAL RECORDS: ${allRecords.length}`);
    console.log('='.repeat(60));

    // Check how many have OpenMRS metadata
    const recordsWithOpenMRS = allRecords.filter(record => record.openmrsData && record.openmrsData.obsId);
    const recordsWithoutOpenMRS = allRecords.filter(record => !record.openmrsData || !record.openmrsData.obsId);

    console.log(`\n📈 OPENMRS METADATA STATUS:`);
    console.log(`   ✅ Records WITH OpenMRS metadata: ${recordsWithOpenMRS.length}`);
    console.log(`   ❌ Records WITHOUT OpenMRS metadata: ${recordsWithoutOpenMRS.length}\n`);

    // Show 5 most recent records with full details
    console.log('🔝 5 MOST RECENT RECORDS (with full OpenMRS details)');
    console.log('='.repeat(60));

    const recentFive = allRecords.slice(0, 5);

    for (let i = 0; i < recentFive.length; i++) {
      const record = recentFive[i];
      console.log(`\n${i + 1}. ${record.type.toUpperCase()} - ${record.data.name || record.data.medicationName || record.data.testName || 'Visit'}`);
      console.log(`   Record ID: ${record._id}`);
      console.log(`   Created At: ${new Date(record.createdAt).toLocaleString()}`);
      
      if (record.openmrsData && record.openmrsData.obsId) {
        console.log(`   \n   📋 OpenMRS Metadata:`);
        console.log(`      ├─ Observation ID: ${record.openmrsData.obsId}`);
        console.log(`      ├─ Concept ID: ${record.openmrsData.conceptId}`);
        console.log(`      ├─ Person ID: ${record.openmrsData.personId}`);
        console.log(`      ├─ Observation Date/Time: ${new Date(record.openmrsData.obsDatetime).toLocaleString()}`);
        console.log(`      ├─ Date Created in OpenMRS: ${new Date(record.openmrsData.dateCreated).toLocaleString()}`);
        console.log(`      ├─ Creator: ${record.openmrsData.creatorName || 'Unknown'}`);
        console.log(`      ├─ Location/Hospital: ${record.openmrsData.locationName || 'Unknown'}`);
        console.log(`      ├─ Encounter ID: ${record.openmrsData.encounterUuid || 'N/A'}`);
        console.log(`      └─ Value Type: ${record.openmrsData.valueType || 'N/A'}`);
      } else {
        console.log(`   ⚠️  No OpenMRS metadata (manually created or old record)`);
      }
      
      console.log(`\n   📝 Record Data:`);
      console.log(`      Name: ${record.data.name || record.data.medicationName || record.data.testName || 'N/A'}`);
      console.log(`      Details: ${record.data.details || record.data.result || record.data.reason || 'N/A'}`);
      console.log(`      Diagnosed/Date: ${record.data.diagnosed || record.data.testDate || record.data.visitDate || 'N/A'}`);
      
      if (record.data.procedure) {
        console.log(`      Procedure/Notes: ${record.data.procedure}`);
      }
    }

    // Show the latest Malaria observations specifically
    console.log('\n\n🦟 MALARIA OBSERVATIONS (OpenMRS sync check)');
    console.log('='.repeat(60));

    const malariaRecords = allRecords.filter(record => 
      (record.data.name && record.data.name.toLowerCase().includes('malaria'))
    );

    console.log(`Found ${malariaRecords.length} Malaria-related records:\n`);

    for (const record of malariaRecords) {
      console.log(`📌 ${record.data.name}`);
      console.log(`   Treatment/Value: ${record.data.details || 'N/A'}`);
      console.log(`   Created in Patient Passport: ${new Date(record.createdAt).toLocaleString()}`);
      
      if (record.openmrsData && record.openmrsData.obsId) {
        console.log(`   OpenMRS Observation ID: ${record.openmrsData.obsId}`);
        console.log(`   Created in OpenMRS: ${new Date(record.openmrsData.dateCreated).toLocaleString()}`);
        console.log(`   Creator: ${record.openmrsData.creatorName}`);
        console.log(`   ✅ Has OpenMRS metadata`);
      } else {
        console.log(`   ❌ No OpenMRS metadata`);
      }
      console.log('');
    }

    // Check if the latest OpenMRS observations are synced
    console.log('\n\n🔄 CHECKING LATEST OPENMRS OBSERVATIONS');
    console.log('='.repeat(60));

    const [obsRows] = await mysqlConnection.query(`
      SELECT 
        o.obs_id,
        o.person_id,
        o.obs_datetime,
        o.date_created,
        o.value_text,
        o.value_numeric,
        cn.name as concept_name,
        CONCAT(pn.given_name, ' ', pn.family_name) as creator_name
      FROM obs o
      JOIN person p ON o.person_id = p.person_id
      JOIN person_name pn_patient ON p.person_id = pn_patient.person_id
      LEFT JOIN concept_name cn ON o.concept_id = cn.concept_id 
        AND cn.locale = 'en' 
        AND cn.concept_name_type = 'FULLY_SPECIFIED'
      LEFT JOIN users u ON o.creator = u.user_id
      LEFT JOIN person_name pn ON u.person_id = pn.person_id 
        AND pn.voided = 0 
        AND pn.preferred = 1
      WHERE pn_patient.given_name = 'Betty' 
        AND pn_patient.family_name = 'Williams'
        AND pn_patient.voided = 0
        AND o.voided = 0
      ORDER BY o.date_created DESC
      LIMIT 10
    `);

    console.log(`\nFound ${obsRows.length} latest OpenMRS observations for Betty Williams:`);

    for (let i = 0; i < obsRows.length; i++) {
      const obs = obsRows[i];
      console.log(`\n${i + 1}. OpenMRS Obs #${obs.obs_id}: ${obs.concept_name}`);
      console.log(`   Value: ${obs.value_text || obs.value_numeric || 'N/A'}`);
      console.log(`   Created in OpenMRS: ${new Date(obs.date_created).toLocaleString()}`);
      console.log(`   Creator: ${obs.creator_name || 'Unknown'}`);
      
      // Check if this observation is in Patient Passport
      const matchingRecord = allRecords.find(record => 
        record.openmrsData && record.openmrsData.obsId === obs.obs_id
      );
      
      if (matchingRecord) {
        console.log(`   ✅ SYNCED to Patient Passport (Record ID: ${matchingRecord._id})`);
      } else {
        console.log(`   ⚠️  NOT YET SYNCED (will sync in next cycle)`);
      }
    }

    console.log('\n\n💡 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Records: ${allRecords.length}`);
    console.log(`Records with OpenMRS metadata: ${recordsWithOpenMRS.length} (${Math.round(recordsWithOpenMRS.length / allRecords.length * 100)}%)`);
    console.log(`Records without OpenMRS metadata: ${recordsWithoutOpenMRS.length} (${Math.round(recordsWithoutOpenMRS.length / allRecords.length * 100)}%)`);
    console.log(`\nThe OpenMRS metadata enhancement is ${recordsWithOpenMRS.length > 0 ? '✅ WORKING' : '❌ NOT YET ACTIVE'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    if (mongoConnection) await mongoose.connection.close();
    console.log('\n👋 Connections closed');
    process.exit(0);
  }
}

main();
