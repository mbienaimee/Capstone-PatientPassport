/**
 * Script to update existing MedicalRecord entries with provider and location information
 * from openmrsData if they're missing in the data object
 * 
 * This ensures that existing records have:
 * - Doctor name (e.g., "Jake Doctor") from openmrsData.creatorName
 * - Hospital name (e.g., "Site 1") from openmrsData.locationName
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/patient-passport';

async function updateRecords() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get MedicalRecord model
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');

    // Find all MedicalRecords that have openmrsData but missing or empty doctor/hospital in data
    // Also update records with placeholder values like "DB Sync Service" or "OpenMRS Hospital"
    const records = await MedicalRecord.find({
      'openmrsData': { $exists: true, $ne: null },
      $or: [
        { 'data.doctor': { $exists: false } },
        { 'data.hospital': { $exists: false } },
        { 'data.doctor': null },
        { 'data.hospital': null },
        { 'data.doctor': '' },
        { 'data.hospital': '' },
        { 'data.doctor': 'Unknown Doctor' },
        { 'data.hospital': 'Unknown Hospital' },
        { 'data.doctor': { $regex: /DB.*SYNC|SYNC.*SERVICE/i } },
        { 'data.hospital': { $regex: /OpenMRS.*Hospital/i } }
      ]
    });

    console.log(`📊 Found ${records.length} records to check/update\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Update doctor if missing, unknown, or placeholder - use creatorName from openmrsData
        const currentDoctor = record.data?.doctor || '';
        const openmrsDoctor = record.openmrsData?.creatorName || '';
        const isPlaceholderDoctor = /DB.*SYNC|SYNC.*SERVICE|Unknown Doctor/i.test(currentDoctor);
        
        if ((!currentDoctor || isPlaceholderDoctor) && openmrsDoctor && !openmrsDoctor.includes('SYNC') && !openmrsDoctor.includes('SERVICE')) {
          updates['data.doctor'] = openmrsDoctor;
          if (record.type === 'condition') {
            updates['data.diagnosedBy'] = openmrsDoctor;
          } else if (record.type === 'medication') {
            updates['data.prescribedBy'] = openmrsDoctor;
          }
          needsUpdate = true;
        }

        // Update hospital if missing, unknown, or placeholder - use locationName from openmrsData
        const currentHospital = record.data?.hospital || '';
        const openmrsHospital = record.openmrsData?.locationName || '';
        const isPlaceholderHospital = /OpenMRS.*Hospital|Unknown Hospital/i.test(currentHospital);
        
        if ((!currentHospital || isPlaceholderHospital) && openmrsHospital && !openmrsHospital.includes('OpenMRS Hospital')) {
          updates['data.hospital'] = openmrsHospital;
          needsUpdate = true;
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

    console.log(`\n📊 Update Summary:`);
    console.log(`   - Updated: ${updatedCount} records`);
    console.log(`   - Skipped: ${skippedCount} records (already have data)`);
    console.log(`   - Errors: ${errorCount} records`);
    console.log(`   - Total: ${records.length} records\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

updateRecords();

