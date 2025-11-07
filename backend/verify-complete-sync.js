const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const OPENMRS_DB_HOST = process.env.HOSPITAL_1_DB_HOST || 'localhost';
const OPENMRS_DB_PORT = parseInt(process.env.HOSPITAL_1_DB_PORT || '3306');
const OPENMRS_DB_NAME = process.env.HOSPITAL_1_DB_NAME || 'openmrs';
const OPENMRS_DB_USER = process.env.HOSPITAL_1_DB_USER;
const OPENMRS_DB_PASS = process.env.HOSPITAL_1_DB_PASSWORD;

async function checkCompleteSyncStatus() {
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

    // Get all patients from OpenMRS with observation counts
    const [openmrsPatients] = await mysqlConnection.query(`
      SELECT 
        p.person_id,
        pn.given_name,
        pn.family_name,
        pn.middle_name,
        pi.identifier as national_id,
        COUNT(DISTINCT o.obs_id) as observation_count
      FROM person p
      JOIN person_name pn ON pn.person_id = p.person_id AND pn.voided = 0 AND pn.preferred = 1
      LEFT JOIN patient_identifier pi ON pi.patient_id = p.person_id AND pi.voided = 0
      LEFT JOIN obs o ON o.person_id = p.person_id AND o.voided = 0
      WHERE p.voided = 0
      GROUP BY p.person_id, pn.given_name, pn.family_name, pn.middle_name, pi.identifier
      HAVING observation_count > 0
      ORDER BY observation_count DESC
    `);

    console.log('============================================================');
    console.log('📊 ALL PATIENTS IN OPENMRS WITH OBSERVATIONS');
    console.log('============================================================\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');

    let totalInOpenMRS = openmrsPatients.length;
    let totalRegisteredInPassport = 0;
    let totalWithSyncedRecords = 0;
    let totalObservationsInOpenMRS = 0;
    let totalSyncedRecords = 0;

    const notRegisteredPatients = [];

    for (const openmrsPatient of openmrsPatients) {
      const givenName = openmrsPatient.given_name || '';
      const middleName = openmrsPatient.middle_name || '';
      const familyName = openmrsPatient.family_name || '';
      const fullName = `${givenName} ${middleName} ${familyName}`.replace(/\s+/g, ' ').trim();
      const obsCount = parseInt(openmrsPatient.observation_count);
      totalObservationsInOpenMRS += obsCount;

      console.log(`${openmrsPatients.indexOf(openmrsPatient) + 1}. ${fullName}`);
      console.log(`   OpenMRS Person ID: ${openmrsPatient.person_id}`);
      console.log(`   National ID: ${openmrsPatient.national_id || 'Not set'}`);
      console.log(`   📊 Observations in OpenMRS: ${obsCount}`);

      // Check if registered in Patient Passport
      let user = await User.findOne({
        name: { $regex: new RegExp(`^${fullName}$`, 'i') },
        role: 'patient'
      });

      // Try partial match if exact match not found
      if (!user && givenName && familyName) {
        const namePattern = `${givenName}.*${familyName}`;
        user = await User.findOne({
          name: { $regex: new RegExp(namePattern, 'i') },
          role: 'patient'
        });
      }

      if (user) {
        totalRegisteredInPassport++;
        console.log(`   ✅ Registered in Patient Passport: ${user.name}`);
        
        const patient = await Patient.findOne({ user: user._id });
        if (patient) {
          console.log(`   ✅ Patient Record ID: ${patient._id}`);
          
          // Check synced medical records
          const syncedRecords = await MedicalRecord.countDocuments({
            patientId: patient._id.toString()
          });
          
          console.log(`   📋 Synced Medical Records: ${syncedRecords}`);
          totalSyncedRecords += syncedRecords;
          
          if (syncedRecords > 0) {
            totalWithSyncedRecords++;
            console.log(`   ✅ STATUS: SYNCING ✓`);
          } else {
            console.log(`   ⚠️ STATUS: REGISTERED BUT NO RECORDS SYNCED YET`);
            console.log(`   💡 Wait for next sync cycle (every 5 minutes)`);
          }
        }
      } else {
        notRegisteredPatients.push({
          fullName,
          personId: openmrsPatient.person_id,
          nationalId: openmrsPatient.national_id,
          obsCount
        });
        console.log(`   ❌ NOT registered in Patient Passport`);
        console.log(`   💡 Must register "${fullName}" to enable sync`);
      }
      
      console.log('');
    }

    console.log('============================================================');
    console.log('📈 SUMMARY');
    console.log('============================================================\n');
    console.log(`Total Patients in OpenMRS (with observations): ${totalInOpenMRS}`);
    console.log(`Total Registered in Patient Passport: ${totalRegisteredInPassport}`);
    console.log(`Total with Synced Records: ${totalWithSyncedRecords}`);
    console.log(`\nTotal Observations in OpenMRS: ${totalObservationsInOpenMRS}`);
    console.log(`Total Synced Medical Records: ${totalSyncedRecords}`);
    
    const syncPercentage = totalObservationsInOpenMRS > 0 
      ? ((totalSyncedRecords / totalObservationsInOpenMRS) * 100).toFixed(2)
      : 0;
    console.log(`Sync Coverage: ${syncPercentage}%`);

    console.log('\n============================================================');
    console.log('💡 ACTION REQUIRED');
    console.log('============================================================\n');
    
    if (notRegisteredPatients.length > 0) {
      console.log(`⚠️ ${notRegisteredPatients.length} patient(s) need to be registered in Patient Passport:\n`);
      notRegisteredPatients.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.fullName}`);
        console.log(`      - OpenMRS Person ID: ${p.personId}`);
        console.log(`      - National ID: ${p.nationalId || 'Not set'}`);
        console.log(`      - Observations waiting: ${p.obsCount}`);
        console.log('');
      });
      console.log('   📝 Once registered, observations will sync automatically every 5 minutes');
    } else {
      console.log(`✅ All OpenMRS patients are registered in Patient Passport!`);
      console.log(`   Observations are syncing automatically every 5 minutes`);
    }

    console.log('\n============================================================');
    console.log('🔄 HOW SYNC WORKS');
    console.log('============================================================\n');
    console.log('1. Backend automatically checks OpenMRS every 5 minutes');
    console.log('2. Fetches new observations for ALL patients');
    console.log('3. Matches observations to patients by name');
    console.log('4. Only syncs observations for patients registered in Patient Passport');
    console.log('5. Skips duplicate observations automatically');
    console.log('\n💡 To sync a patient: Register them in Patient Passport using their exact OpenMRS name');

    await mysqlConnection.end();
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCompleteSyncStatus();
