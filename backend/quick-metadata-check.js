/**
 * Quick Check - Verify OpenMRS Metadata in Medical Records
 * This script only connects to MongoDB to check if records have OpenMRS metadata
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;

async function main() {
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

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

    console.log('\n\n💡 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Records: ${allRecords.length}`);
    console.log(`Records with OpenMRS metadata: ${recordsWithOpenMRS.length} (${Math.round(recordsWithOpenMRS.length / allRecords.length * 100)}%)`);
    console.log(`Records without OpenMRS metadata: ${recordsWithoutOpenMRS.length} (${Math.round(recordsWithoutOpenMRS.length / allRecords.length * 100)}%)`);
    console.log(`\nThe OpenMRS metadata enhancement is ${recordsWithOpenMRS.length > 0 ? '✅ WORKING' : '⏳ WAITING FOR NEXT SYNC'}`);

    if (recordsWithOpenMRS.length === 0) {
      console.log(`\n💡 Note: The backend server is now running with the new code.`);
      console.log(`   New records synced from OpenMRS will include full metadata.`);
      console.log(`   Wait for the next 5-minute sync cycle to see the enhancement in action!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
    process.exit(0);
  }
}

main();
