/**
 * Fix existing observation notes to use actual OpenMRS values instead of hardcoded messages
 * 
 * This script updates all MedicalRecords that have:
 * - notes: "Added from OpenMRS - Hospital: ..."
 * 
 * And replaces them with the actual observation values from the details field
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

async function fixObservationNotes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Access the MedicalRecord collection directly
    const db = mongoose.connection.db;
    const medicalRecordsCollection = db.collection('medicalrecords');

    // Find all records with hardcoded notes
    console.log('\n🔍 Finding records with hardcoded notes...');
    const recordsToFix = await medicalRecordsCollection.find({
      'data.notes': { $regex: /^Added from OpenMRS - Hospital:/ }
    }).toArray();

    console.log(`📊 Found ${recordsToFix.length} records to fix\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const record of recordsToFix) {
      const recordId = record._id;
      const oldNotes = record.data.notes;
      
      // Build new notes from details, value, or comment
      let newNotes = '';
      
      // Priority 1: Use details if it's not empty and not the same as diagnosis
      if (record.data.details && 
          record.data.details !== record.data.diagnosis &&
          record.data.details !== record.data.name &&
          !record.data.details.startsWith('Result:') &&
          !record.data.details.startsWith('Auto-synced')) {
        newNotes = record.data.details;
      }
      
      // Priority 2: Check openmrsData for value
      if (!newNotes && record.openmrsData) {
        if (record.openmrsData.valueText) {
          newNotes = record.openmrsData.valueText;
        } else if (record.openmrsData.valueCoded) {
          newNotes = record.openmrsData.valueCoded;
        }
      }
      
      // If we have new notes that are different from old hardcoded message
      if (newNotes && newNotes !== oldNotes) {
        console.log(`\n📝 Updating Record ID: ${recordId}`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Diagnosis: ${record.data.diagnosis || record.data.name || record.data.medicationName}`);
        console.log(`   Old notes: "${oldNotes}"`);
        console.log(`   New notes: "${newNotes}"`);
        
        await medicalRecordsCollection.updateOne(
          { _id: recordId },
          { 
            $set: { 
              'data.notes': newNotes 
            } 
          }
        );
        
        updatedCount++;
      } else {
        console.log(`\n⏭️  Skipping Record ID: ${recordId} - No better notes available`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Diagnosis: ${record.data.diagnosis || record.data.name || record.data.medicationName}`);
        console.log(`   Details: ${record.data.details || 'N/A'}`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total records found: ${recordsToFix.length}`);
    console.log(`✅ Records updated: ${updatedCount}`);
    console.log(`⏭️  Records skipped: ${skippedCount}`);
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing observation notes:', error);
    process.exit(1);
  }
}

// Run the migration
fixObservationNotes();
