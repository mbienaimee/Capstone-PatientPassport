const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

async function verifyCompleteSync() {
  console.log('\n🔍 COMPLETE SYNC VERIFICATION\n');
  console.log('═'.repeat(60));
  
  // Connect to OpenMRS database
  const openmrsConnection = await mysql.createConnection({
    host: 'localhost',
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  // Connect to MongoDB
  await mongoose.connect('mongodb+srv://bienaimee:fHe1P0xjaPPi0GSD@cluster0.fslpg5p.mongodb.net/patient-passport?retryWrites=true&w=majority&appName=Cluster0');

  console.log('\n✅ Database connections established\n');

  // Check OpenMRS observations
  console.log('📊 OPENMRS DATABASE (MySQL)');
  console.log('─'.repeat(60));
  
  const [totalObs] = await openmrsConnection.execute(
    'SELECT COUNT(*) as count FROM obs'
  );
  console.log(`Total observations: ${totalObs[0].count}`);

  const [recentObs] = await openmrsConnection.execute(`
    SELECT 
      o.obs_id,
      p.given_name,
      p.family_name,
      cn.name as concept_name,
      o.value_text,
      o.obs_datetime,
      DATE(o.obs_datetime) as obs_date
    FROM obs o
    JOIN person_name p ON o.person_id = p.person_id
    JOIN concept_name cn ON o.concept_id = cn.concept_id
    WHERE DATE(o.obs_datetime) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    AND p.given_name = 'Betty'
    ORDER BY o.obs_datetime DESC
    LIMIT 10
  `);

  console.log(`\nRecent observations (last 7 days): ${recentObs.length}`);
  if (recentObs.length > 0) {
    console.log('\nLatest observations:');
    recentObs.slice(0, 3).forEach((obs, i) => {
      console.log(`   ${i+1}. [ID:${obs.obs_id}] ${obs.given_name} ${obs.family_name}`);
      console.log(`      ${obs.concept_name} - ${obs.obs_date}`);
    });
  }

  // Check MongoDB MedicalRecords
  console.log('\n\n📊 PATIENT PASSPORT DATABASE (MongoDB)');
  console.log('─'.repeat(60));

  const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');
  
  const totalRecords = await MedicalRecord.countDocuments();
  console.log(`Total MedicalRecords: ${totalRecords}`);

  // Find OpenMRS synced records
  const openmrsRecords = await MedicalRecord.find({
    'openmrsData': { $exists: true }
  }).sort({ createdAt: -1 }).limit(10);

  console.log(`OpenMRS-synced records: ${openmrsRecords.length}`);

  if (openmrsRecords.length > 0) {
    console.log('\n✅ LATEST SYNCED RECORDS:');
    openmrsRecords.slice(0, 5).forEach((record, i) => {
      console.log(`\n   ${i+1}. Record ID: ${record._id}`);
      console.log(`      Type: ${record.type || 'N/A'}`);
      console.log(`      Diagnosis: ${record.data?.diagnosis || record.data?.name || 'N/A'}`);
      console.log(`      Details: ${record.data?.details || 'N/A'}`);
      console.log(`      Hospital: ${record.data?.hospital || 'N/A'}`);
      console.log(`      OpenMRS Obs ID: ${record.openmrsData?.obsId || 'N/A'}`);
      console.log(`      Created: ${record.createdAt || 'N/A'}`);
    });
  }

  // Find Betty Williams patient
  const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
  const betty = await Patient.findOne({ name: /Betty Williams/i });

  if (betty) {
    console.log('\n\n📊 BETTY WILLIAMS PATIENT DATA');
    console.log('─'.repeat(60));
    console.log(`Patient ID: ${betty._id}`);
    console.log(`Name: ${betty.name}`);
    
    const bettyRecords = await MedicalRecord.find({
      patientId: betty._id.toString()
    }).sort({ createdAt: -1 });

    console.log(`\nTotal medical records: ${bettyRecords.length}`);

    const bettyOpenMRSRecords = bettyRecords.filter(r => r.openmrsData);
    console.log(`OpenMRS-synced records: ${bettyOpenMRSRecords.length}`);

    if (bettyOpenMRSRecords.length > 0) {
      console.log('\n✅ Betty\'s OpenMRS Records:');
      bettyOpenMRSRecords.slice(0, 5).forEach((record, i) => {
        console.log(`   ${i+1}. ${record.data?.diagnosis || record.data?.name || 'Unknown'}`);
        console.log(`      Date: ${record.data?.date || record.createdAt}`);
        console.log(`      OpenMRS ID: ${record.openmrsData?.obsId}`);
      });
    }
  }

  // Summary
  console.log('\n\n📈 SYNC STATUS SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✓ OpenMRS observations available: ${recentObs.length} (last 7 days)`);
  console.log(`✓ MedicalRecords with OpenMRS data: ${openmrsRecords.length}`);
  console.log(`✓ Sync pipeline: ${openmrsRecords.length > 0 ? '✅ WORKING' : '❌ NOT WORKING'}`);
  
  if (betty) {
    const bettyOpenMRSCount = (await MedicalRecord.find({
      patientId: betty._id.toString(),
      'openmrsData': { $exists: true }
    })).length;
    console.log(`✓ Betty Williams synced records: ${bettyOpenMRSCount}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Verification complete!\n');

  await openmrsConnection.end();
  await mongoose.connection.close();
  process.exit(0);
}

verifyCompleteSync().catch(console.error);
