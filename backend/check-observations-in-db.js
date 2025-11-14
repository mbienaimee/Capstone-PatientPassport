/**
 * Simple Script to Check Observations in Patient Passport Database
 * 
 * This script directly queries MongoDB to check if observations from OpenMRS
 * are properly stored in the Patient Passport database.
 * 
 * Usage: node check-observations-in-db.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/patient-passport';
const DB_NAME = MONGODB_URI.split('/').pop().split('?')[0] || 'patient-passport';

async function checkObservations() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    
    // Check Medical Conditions
    console.log('═'.repeat(80));
    console.log('📋 MEDICAL CONDITIONS (Diagnoses)');
    console.log('═'.repeat(80));
    
    const conditions = await db.collection('medicalconditions').find({}).limit(10).toArray();
    console.log(`\nTotal Medical Conditions: ${await db.collection('medicalconditions').countDocuments()}`);
    console.log(`Showing first ${conditions.length} conditions:\n`);
    
    for (const cond of conditions) {
      console.log(`- ${cond.name || 'N/A'}`);
      console.log(`  Details: ${cond.details || 'N/A'}`);
      console.log(`  Diagnosed: ${cond.diagnosed ? new Date(cond.diagnosed).toLocaleString() : 'N/A'}`);
      console.log(`  Status: ${cond.status || 'N/A'}`);
      if (cond.notes && cond.notes.includes('OpenMRS')) {
        console.log(`  ✅ Synced from OpenMRS`);
      }
      console.log(`  Created: ${cond.createdAt ? new Date(cond.createdAt).toLocaleString() : 'N/A'}`);
      console.log('');
    }
    
    // Check Medications
    console.log('═'.repeat(80));
    console.log('💊 MEDICATIONS');
    console.log('═'.repeat(80));
    
    const medications = await db.collection('medications').find({}).limit(10).toArray();
    console.log(`\nTotal Medications: ${await db.collection('medications').countDocuments()}`);
    console.log(`Showing first ${medications.length} medications:\n`);
    
    for (const med of medications) {
      console.log(`- ${med.name || 'N/A'}`);
      console.log(`  Dosage: ${med.dosage || 'N/A'}`);
      console.log(`  Frequency: ${med.frequency || 'N/A'}`);
      console.log(`  Start Date: ${med.startDate ? new Date(med.startDate).toLocaleString() : 'N/A'}`);
      console.log(`  Status: ${med.status || 'N/A'}`);
      if (med.notes && med.notes.includes('OpenMRS')) {
        console.log(`  ✅ Synced from OpenMRS`);
      }
      console.log(`  Created: ${med.createdAt ? new Date(med.createdAt).toLocaleString() : 'N/A'}`);
      console.log('');
    }
    
    // Check Medical Records (from OpenMRS Sync Service)
    console.log('═'.repeat(80));
    console.log('📝 MEDICAL RECORDS (from OpenMRS Sync Service)');
    console.log('═'.repeat(80));
    
    const records = await db.collection('medicalrecords').find({}).limit(10).toArray();
    const totalRecords = await db.collection('medicalrecords').countDocuments();
    const openmrsRecords = await db.collection('medicalrecords').countDocuments({ 'openmrsData.obsId': { $exists: true } });
    
    console.log(`\nTotal Medical Records: ${totalRecords}`);
    console.log(`Records with OpenMRS Data: ${openmrsRecords}`);
    console.log(`Showing first ${records.length} records:\n`);
    
    for (const record of records) {
      console.log(`- Type: ${record.type || 'N/A'}`);
      if (record.type === 'condition') {
        console.log(`  Diagnosis: ${record.data?.name || 'N/A'}`);
        console.log(`  Details: ${record.data?.details || 'N/A'}`);
      } else if (record.type === 'medication') {
        console.log(`  Medication: ${record.data?.medicationName || 'N/A'}`);
        console.log(`  Dosage: ${record.data?.dosage || 'N/A'}`);
      }
      if (record.openmrsData) {
        console.log(`  ✅ OpenMRS Data:`);
        console.log(`     Obs ID: ${record.openmrsData.obsId || 'N/A'}`);
        console.log(`     Concept ID: ${record.openmrsData.conceptId || 'N/A'}`);
        console.log(`     Person ID: ${record.openmrsData.personId || 'N/A'}`);
        console.log(`     Creator: ${record.openmrsData.creatorName || 'N/A'}`);
        console.log(`     Location: ${record.openmrsData.locationName || 'N/A'}`);
      }
      console.log(`  Created: ${record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}`);
      console.log('');
    }
    
    // Summary Statistics
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY STATISTICS');
    console.log('═'.repeat(80));
    
    const totalConditions = await db.collection('medicalconditions').countDocuments();
    const totalMedications = await db.collection('medications').countDocuments();
    const openmrsConditions = await db.collection('medicalconditions').countDocuments({ notes: { $regex: /OpenMRS/i } });
    const openmrsMedications = await db.collection('medications').countDocuments({ notes: { $regex: /OpenMRS/i } });
    
    console.log(`\nTotal Medical Conditions: ${totalConditions}`);
    console.log(`  - Synced from OpenMRS: ${openmrsConditions}`);
    console.log(`Total Medications: ${totalMedications}`);
    console.log(`  - Synced from OpenMRS: ${openmrsMedications}`);
    console.log(`Total Medical Records: ${totalRecords}`);
    console.log(`  - With OpenMRS Data: ${openmrsRecords}`);
    console.log(`\n✅ Total Observations Synced from OpenMRS: ${openmrsConditions + openmrsMedications + openmrsRecords}`);
    
    // Recent observations (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentConditions = await db.collection('medicalconditions').countDocuments({ createdAt: { $gte: yesterday } });
    const recentMedications = await db.collection('medications').countDocuments({ createdAt: { $gte: yesterday } });
    const recentRecords = await db.collection('medicalrecords').countDocuments({ createdAt: { $gte: yesterday } });
    
    console.log(`\n🕐 Observations in Last 24 Hours:`);
    console.log(`   - Medical Conditions: ${recentConditions}`);
    console.log(`   - Medications: ${recentMedications}`);
    console.log(`   - Medical Records: ${recentRecords}`);
    console.log(`   - Total: ${recentConditions + recentMedications + recentRecords}`);
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkObservations();


