/**
 * Verify All Patients Sync Status
 * 
 * This script verifies that observations are being synced for ALL patients
 * in the Patient Passport database, not just one patient.
 * 
 * Usage: node verify-all-patients-sync.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/patient-passport';
const DB_NAME = MONGODB_URI.split('/').pop().split('?')[0] || 'patient-passport';

async function verifyAllPatientsSync() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔍 Verifying Observation Sync for ALL Patients');
    console.log('═'.repeat(80));
    console.log('Connecting to MongoDB...\n');
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get all patients
    const users = await db.collection('users').find({ role: 'patient' }).toArray();
    const patients = await db.collection('patients').find({}).toArray();
    
    console.log(`📊 Found ${users.length} patients in database\n`);
    
    // Create patient map
    const patientMap = new Map();
    for (const patient of patients) {
      if (patient.user) {
        patientMap.set(patient.user.toString(), patient);
      }
    }
    
    // Statistics
    let patientsWithConditions = 0;
    let patientsWithMedications = 0;
    let patientsWithRecords = 0;
    let patientsWithOpenMRSSync = 0;
    let patientsWithoutObservations = 0;
    
    const patientStats = [];
    
    console.log('Checking observations for each patient...\n');
    console.log('═'.repeat(80));
    
    for (const user of users) {
      const patient = patientMap.get(user._id.toString());
      if (!patient) continue;
      
      const patientId = patient._id.toString();
      const patientName = user.name || 'Unknown';
      
      // Count observations
      const conditionsCount = await db.collection('medicalconditions').countDocuments({ patient: patientId });
      const medicationsCount = await db.collection('medications').countDocuments({ patient: patientId });
      const recordsCount = await db.collection('medicalrecords').countDocuments({ patientId: patientId });
      const openmrsConditionsCount = await db.collection('medicalconditions').countDocuments({ 
        patient: patientId,
        notes: { $regex: /OpenMRS/i }
      });
      const openmrsMedicationsCount = await db.collection('medications').countDocuments({ 
        patient: patientId,
        notes: { $regex: /OpenMRS/i }
      });
      const openmrsRecordsCount = await db.collection('medicalrecords').countDocuments({ 
        patientId: patientId,
        'openmrsData.obsId': { $exists: true }
      });
      
      const totalObservations = conditionsCount + medicationsCount + recordsCount;
      const totalOpenMRSObservations = openmrsConditionsCount + openmrsMedicationsCount + openmrsRecordsCount;
      
      if (conditionsCount > 0) patientsWithConditions++;
      if (medicationsCount > 0) patientsWithMedications++;
      if (recordsCount > 0) patientsWithRecords++;
      if (totalOpenMRSObservations > 0) patientsWithOpenMRSSync++;
      if (totalObservations === 0) patientsWithoutObservations++;
      
      patientStats.push({
        name: patientName,
        nationalId: patient.nationalId || 'N/A',
        conditions: conditionsCount,
        medications: medicationsCount,
        records: recordsCount,
        total: totalObservations,
        openmrsTotal: totalOpenMRSObservations,
        hasOpenMRSSync: totalOpenMRSObservations > 0
      });
    }
    
    // Sort by total observations (descending)
    patientStats.sort((a, b) => b.total - a.total);
    
    // Display results
    console.log('📋 Patient Observation Summary:\n');
    
    patientStats.forEach((stat, index) => {
      const syncStatus = stat.hasOpenMRSSync ? '✅' : '⚠️';
      console.log(`${index + 1}. ${syncStatus} ${stat.name}`);
      console.log(`   National ID: ${stat.nationalId}`);
      console.log(`   Medical Conditions: ${stat.conditions}`);
      console.log(`   Medications: ${stat.medications}`);
      console.log(`   Medical Records: ${stat.records}`);
      console.log(`   Total Observations: ${stat.total}`);
      if (stat.hasOpenMRSSync) {
        console.log(`   ✅ OpenMRS Synced: ${stat.openmrsTotal} observations`);
      } else if (stat.total > 0) {
        console.log(`   ⚠️  No OpenMRS sync (${stat.total} observations from other sources)`);
      } else {
        console.log(`   ⚠️  No observations yet`);
      }
      console.log('');
    });
    
    // Overall Statistics
    console.log('═'.repeat(80));
    console.log('📊 Overall Statistics');
    console.log('═'.repeat(80));
    console.log(`Total Patients: ${users.length}`);
    console.log(`Patients with Medical Conditions: ${patientsWithConditions}`);
    console.log(`Patients with Medications: ${patientsWithMedications}`);
    console.log(`Patients with Medical Records: ${patientsWithRecords}`);
    console.log(`Patients with OpenMRS Sync: ${patientsWithOpenMRSSync}`);
    console.log(`Patients without Observations: ${patientsWithoutObservations}`);
    
    const syncPercentage = users.length > 0 
      ? ((patientsWithOpenMRSSync / users.length) * 100).toFixed(1)
      : 0;
    
    console.log(`\nOpenMRS Sync Coverage: ${syncPercentage}%`);
    
    if (patientsWithOpenMRSSync === 0 && users.length > 0) {
      console.log('\n⚠️  WARNING: No patients have OpenMRS synced observations!');
      console.log('   Possible reasons:');
      console.log('   1. Sync services may not be running');
      console.log('   2. No observations recorded in OpenMRS yet');
      console.log('   3. Patient names may not match between systems');
      console.log('   4. OpenMRS module may not be configured correctly');
    } else if (patientsWithOpenMRSSync > 0) {
      console.log(`\n✅ ${patientsWithOpenMRSSync} patient(s) have observations synced from OpenMRS`);
    }
    
    // Recent sync activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const recentConditions = await db.collection('medicalconditions').countDocuments({ 
      createdAt: { $gte: yesterday },
      notes: { $regex: /OpenMRS/i }
    });
    const recentMedications = await db.collection('medications').countDocuments({ 
      createdAt: { $gte: yesterday },
      notes: { $regex: /OpenMRS/i }
    });
    const recentRecords = await db.collection('medicalrecords').countDocuments({ 
      createdAt: { $gte: yesterday },
      'openmrsData.obsId': { $exists: true }
    });
    
    console.log('\n═'.repeat(80));
    console.log('🕐 Recent Sync Activity (Last 24 Hours)');
    console.log('═'.repeat(80));
    console.log(`OpenMRS Synced Observations: ${recentConditions + recentMedications + recentRecords}`);
    console.log(`   - Medical Conditions: ${recentConditions}`);
    console.log(`   - Medications: ${recentMedications}`);
    console.log(`   - Medical Records: ${recentRecords}`);
    
    if (recentConditions + recentMedications + recentRecords === 0) {
      console.log('\n⚠️  No recent sync activity detected');
      console.log('   This could mean:');
      console.log('   1. No new observations were recorded in OpenMRS');
      console.log('   2. Sync services may need to be restarted');
      console.log('   3. Check server logs for sync activity');
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyAllPatientsSync();

