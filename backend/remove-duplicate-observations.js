/**
 * Remove duplicate OpenMRS observations
 * 
 * Keeps only the FIRST observation for each unique obsId
 * Deletes all subsequent duplicates
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

async function removeDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const medicalRecordsCollection = db.collection('medicalrecords');

    // Find all records with OpenMRS obsId
    console.log('🔍 Finding all OpenMRS observations...');
    const allRecords = await medicalRecordsCollection
      .find({ 'openmrsData.obsId': { $exists: true, $ne: null } })
      .sort({ createdAt: 1 }) // Sort by creation time (oldest first)
      .toArray();

    console.log(`📊 Found ${allRecords.length} OpenMRS observations\n`);

    // Group by patientId + obsId to find duplicates
    const recordsByObsId = new Map();
    
    allRecords.forEach(record => {
      const obsId = record.openmrsData.obsId;
      const patientId = record.patientId.toString();
      const key = `${patientId}_${obsId}`;
      
      if (!recordsByObsId.has(key)) {
        recordsByObsId.set(key, []);
      }
      recordsByObsId.get(key).push(record);
    });

    // Find duplicates
    const duplicateGroups = [];
    recordsByObsId.forEach((records, key) => {
      if (records.length > 1) {
        duplicateGroups.push({ key, records });
      }
    });

    console.log(`🔍 Found ${duplicateGroups.length} groups with duplicates\n`);

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates found! Database is clean.');
      await mongoose.disconnect();
      process.exit(0);
    }

    let totalDeleted = 0;
    let totalKept = 0;

    for (const group of duplicateGroups) {
      const { key, records } = group;
      const [patientId, obsId] = key.split('_');
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ObsID: ${obsId} | Patient: ${patientId}`);
      console.log(`   Total records: ${records.length}`);
      console.log(`${'='.repeat(60)}`);

      // Keep the FIRST (oldest) record
      const keepRecord = records[0];
      const duplicates = records.slice(1);

      console.log(`\n✅ KEEPING (oldest):`);
      console.log(`   ID: ${keepRecord._id}`);
      console.log(`   Created: ${keepRecord.createdAt}`);
      console.log(`   Diagnosis: ${keepRecord.data.diagnosis || keepRecord.data.name || keepRecord.data.medicationName}`);
      console.log(`   Notes: "${keepRecord.data.notes?.substring(0, 50)}..."`);

      console.log(`\n❌ DELETING ${duplicates.length} duplicate(s):`);
      for (const dup of duplicates) {
        console.log(`   - ID: ${dup._id} | Created: ${dup.createdAt}`);
        
        await medicalRecordsCollection.deleteOne({ _id: dup._id });
        totalDeleted++;
      }

      totalKept++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total duplicate groups processed: ${duplicateGroups.length}`);
    console.log(`✅ Records kept (first/oldest): ${totalKept}`);
    console.log(`❌ Duplicate records deleted: ${totalDeleted}`);
    console.log(`💾 Total records now: ${totalKept} (was ${allRecords.length})`);
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
    process.exit(1);
  }
}

// Run the cleanup
removeDuplicates();
