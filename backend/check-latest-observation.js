const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

async function checkLatestObservation() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const medicalRecordsCollection = db.collection('medicalrecords');

    // Get the latest observation
    const latestRecords = await medicalRecordsCollection
      .find({ type: 'condition' })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log('📋 Latest 5 observations:\n');
    latestRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Record ID: ${record._id}`);
      console.log(`   Created: ${record.createdAt}`);
      console.log(`   Diagnosis: ${record.data.diagnosis || record.data.name}`);
      console.log(`   Details: "${record.data.details}"`);
      console.log(`   Notes: "${record.data.notes}"`);
      console.log(`   OpenMRS ObsID: ${record.openmrsData?.obsId}`);
    });

    await mongoose.disconnect();
    console.log('\n\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLatestObservation();
