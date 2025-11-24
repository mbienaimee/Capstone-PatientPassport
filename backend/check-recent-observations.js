require('dotenv').config();
const mongoose = require('mongoose');
const MedicalRecord = require('./dist/models/MedicalRecord').default;

const checkRecentObservations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get observations from last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentObservations = await MedicalRecord.find({
      createdAt: { $gte: yesterday }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('createdBy', 'name email role');

    console.log(`📊 Recent observations (last 24 hours): ${recentObservations.length}\n`);

    if (recentObservations.length === 0) {
      console.log('⚠️  No observations found in last 24 hours');
      console.log('\nChecking all observations...\n');
      
      const allObservations = await MedicalRecord.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('createdBy', 'name email role');
      
      console.log(`Total observations in database: ${await MedicalRecord.countDocuments()}`);
      console.log(`\nMost recent 10 observations:`);
      
      allObservations.forEach((obs, index) => {
        console.log(`\n${index + 1}. Type: ${obs.type}`);
        console.log(`   Created: ${obs.createdAt}`);
        console.log(`   Patient ID: ${obs.patientId}`);
        console.log(`   Synced: ${obs.syncDate || 'Not synced'}`);
        console.log(`   Data keys: ${Object.keys(obs.data || {}).join(', ')}`);
      });
    } else {
      console.log('Recent observations:');
      recentObservations.forEach((obs, index) => {
        console.log(`\n${index + 1}. Type: ${obs.type}`);
        console.log(`   Created: ${obs.createdAt}`);
        console.log(`   Patient ID: ${obs.patientId}`);
        console.log(`   Hospital: ${obs.hospital || 'Not set'}`);
        console.log(`   Doctor: ${obs.createdBy?.name || 'System'}`);
        console.log(`   Synced: ${obs.syncDate || 'Not synced'}`);
        if (obs.type === 'condition') {
          console.log(`   Diagnosis: ${obs.data?.diagnosis || 'N/A'}`);
        } else if (obs.type === 'medication') {
          console.log(`   Medication: ${obs.data?.name || obs.data?.medicationName || 'N/A'}`);
        }
      });
    }

    // Check if observations are being synced from OpenMRS
    console.log('\n\n📡 Checking OpenMRS sync status...');
    const syncedObservations = await MedicalRecord.find({
      syncDate: { $exists: true }
    }).sort({ syncDate: -1 }).limit(5);
    
    console.log(`Total synced observations: ${await MedicalRecord.countDocuments({ syncDate: { $exists: true } })}`);
    
    if (syncedObservations.length > 0) {
      console.log('\nMost recent synced observations:');
      syncedObservations.forEach((obs, index) => {
        console.log(`${index + 1}. ${obs.type} - Synced: ${obs.syncDate}`);
      });
    } else {
      console.log('❌ No synced observations found - OpenMRS sync may not be working');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkRecentObservations();
