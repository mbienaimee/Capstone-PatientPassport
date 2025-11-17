const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

async function showCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    
    console.log('📚 All Collections in Database:\n');
    console.log('='.repeat(60));
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      console.log(`📁 ${collectionName.padEnd(30)} - ${count} documents`);
    }
    
    console.log('='.repeat(60));
    
    // Check specifically for observations/medical records
    console.log('\n🔍 Observation Storage Details:\n');
    
    const medicalRecordsCollection = db.collection('medicalrecords');
    const medicalRecordsCount = await medicalRecordsCollection.countDocuments();
    const openmrsRecordsCount = await medicalRecordsCollection.countDocuments({
      'openmrsData.obsId': { $exists: true }
    });
    
    console.log(`📊 medicalrecords collection:`);
    console.log(`   Total records: ${medicalRecordsCount}`);
    console.log(`   OpenMRS observations: ${openmrsRecordsCount}`);
    
    // Show sample structure
    const sampleRecord = await medicalRecordsCollection.findOne({
      'openmrsData.obsId': { $exists: true }
    });
    
    if (sampleRecord) {
      console.log('\n📋 Sample OpenMRS Observation Structure:');
      console.log(JSON.stringify({
        _id: sampleRecord._id,
        type: sampleRecord.type,
        data: {
          diagnosis: sampleRecord.data.diagnosis || sampleRecord.data.name,
          notes: sampleRecord.data.notes,
          hospital: sampleRecord.data.hospital,
          doctor: sampleRecord.data.doctor
        },
        openmrsData: {
          obsId: sampleRecord.openmrsData.obsId,
          conceptId: sampleRecord.openmrsData.conceptId,
          locationName: sampleRecord.openmrsData.locationName,
          creatorName: sampleRecord.openmrsData.creatorName
        },
        createdAt: sampleRecord.createdAt
      }, null, 2));
    }
    
    // Check by type
    const conditionsCount = await medicalRecordsCollection.countDocuments({ type: 'condition' });
    const medicationsCount = await medicalRecordsCollection.countDocuments({ type: 'medication' });
    const testsCount = await medicalRecordsCollection.countDocuments({ type: 'test' });
    const visitsCount = await medicalRecordsCollection.countDocuments({ type: 'visit' });
    
    console.log('\n📈 Records by Type:');
    console.log(`   Conditions:  ${conditionsCount}`);
    console.log(`   Medications: ${medicationsCount}`);
    console.log(`   Tests:       ${testsCount}`);
    console.log(`   Visits:      ${visitsCount}`);

    await mongoose.disconnect();
    console.log('\n\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showCollections();
