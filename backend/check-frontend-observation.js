const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

async function checkObservation() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const medicalRecordsCollection = db.collection('medicalrecords');

    // Find the specific observation showing in frontend
    const observationId = '691b3480c0298e0c14f140bf';
    const record = await medicalRecordsCollection.findOne({
      _id: new mongoose.Types.ObjectId(observationId)
    });

    if (record) {
      console.log('📋 Observation from frontend console:\n');
      console.log(`   ID: ${record._id}`);
      console.log(`   Created: ${record.createdAt}`);
      console.log(`   Diagnosis: ${record.data.diagnosis || record.data.name}`);
      console.log(`   Details: "${record.data.details}"`);
      console.log(`   Notes: "${record.data.notes}"`);
      console.log(`   OpenMRS ObsID: ${record.openmrsData?.obsId}`);
    } else {
      console.log('❌ Observation not found');
    }

    // Get patient's latest observations
    console.log('\n\n📊 All observations for patient (sorted by date):\n');
    const allRecords = await medicalRecordsCollection
      .find({ type: 'condition', 'openmrsData.obsId': { $exists: true } })
      .sort({ 'data.diagnosed': -1 })
      .toArray();

    allRecords.forEach((rec, index) => {
      console.log(`${index + 1}. ObsID ${rec.openmrsData?.obsId} - Created: ${rec.createdAt}`);
      console.log(`   Notes: "${rec.data.notes}"`);
      console.log(`   Is showing in frontend: ${rec._id.toString() === observationId ? '✅ YES' : '❌ NO'}\n`);
    });

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkObservation();
