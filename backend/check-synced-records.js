require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkSyncedObservations() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { 
    strict: false, 
    collection: 'medicalrecords' 
  }));

  // Check total count
  const total = await MedicalRecord.countDocuments();
  console.log(`\n📊 Total MedicalRecords: ${total}`);

  // Check Betty Williams records
  const bettyRecords = await MedicalRecord.find({
    'data.hospital': { $regex: /OpenMRS/i }
  }).sort({ createdAt: -1 }).limit(20);

  console.log(`\n📋 Recent OpenMRS Synced Records for Betty Williams:`);
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Found: ${bettyRecords.length} records\n`);

  bettyRecords.forEach((record, i) => {
    console.log(`${i + 1}. [${record._id}]`);
    console.log(`   Type: ${record.recordType}`);
    console.log(`   Diagnosis: ${record.data?.diagnosis || 'N/A'}`);
    console.log(`   Details: ${record.data?.details || 'N/A'}`);
    console.log(`   Date: ${record.data?.date || record.createdAt}`);
    console.log(`   OpenMRS ID: ${record.data?.openmrsData?.obsId || 'N/A'}`);
    console.log('');
  });

  // Check for most recent sync
  const mostRecent = await MedicalRecord.findOne({
    'data.hospital': { $regex: /OpenMRS/i }
  }).sort({ createdAt: -1 });

  if (mostRecent) {
    console.log('\n🕐 Most Recent Sync:');
    console.log(`   Created: ${mostRecent.createdAt}`);
    console.log(`   OpenMRS ID: ${mostRecent.data?.openmrsData?.obsId || 'N/A'}`);
  }

  await mongoose.connection.close();
}

checkSyncedObservations().catch(console.error);
