/**
 * Check medicalconditions collection for Betty Williams
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkMedicalConditions() {
  console.log('\n🔍 ===================================');
  console.log('🔍 CHECK MEDICAL CONDITIONS');
  console.log('🔍 ===================================\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('CapstonePassportSystem');

    // Find Betty Williams
    const patient = await db.collection('users').findOne({
      email: 'm.bienaimee@alustudent.com'
    });

    if (!patient) {
      console.log('❌ Betty Williams not found!');
      return;
    }

    console.log(`✅ Patient: ${patient.firstName} ${patient.lastName}`);
    console.log(`   Patient ID: ${patient._id}\n`);

    // Get patient document
    const patientDoc = await db.collection('patients').findOne({
      user: patient._id
    });

    if (!patientDoc) {
      console.log('❌ Patient document not found!');
      return;
    }

    console.log(`✅ Patient Document ID: ${patientDoc._id}\n`);

    // Get ALL medical conditions
    const allConditions = await db.collection('medicalconditions')
      .find()
      .sort({ diagnosed: -1 })
      .toArray();

    console.log(`📋 Total Medical Conditions in database: ${allConditions.length}\n`);

    // Get medical conditions for Betty using patient document ID
    const conditions = await db.collection('medicalconditions')
      .find({ patient: patientDoc._id })
      .sort({ diagnosed: -1 })
      .toArray();

    console.log(`📋 Medical Conditions for Betty Williams: ${conditions.length}\n`);

    if (conditions.length === 0) {
      console.log('❌ No medical conditions found for Betty Williams');
      console.log('\n🔍 Searching with different criteria...\n');
      
      // Try searching by patient ObjectId as string
      const conditionsByString = await db.collection('medicalconditions')
        .find({ patient: patientDoc._id.toString() })
        .toArray();
      console.log(`   By string ID: ${conditionsByString.length} found`);
      
      // Show all patients in medical conditions to debug
      console.log('\n🔍 Sample of patient IDs in medicalconditions:');
      allConditions.slice(0, 10).forEach((cond, idx) => {
        console.log(`   ${idx + 1}. Patient: ${cond.patient} (${typeof cond.patient})`);
        console.log(`      Name: ${cond.name}`);
      });
      
      return;
    }

    // Display all conditions
    console.log('🔬 ===================================');
    console.log('🔬 ALL MEDICAL CONDITIONS');
    console.log('🔬 ===================================\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    conditions.forEach((cond, index) => {
      const diagnosedDate = new Date(cond.diagnosed);
      const isToday = diagnosedDate >= today;
      
      console.log(`${index + 1}. ${isToday ? '🆕' : '📅'} ${cond.name || 'N/A'}`);
      console.log(`   Details: ${cond.details || 'N/A'}`);
      console.log(`   Diagnosed: ${diagnosedDate.toLocaleString()}`);
      console.log(`   Status: ${cond.status || 'N/A'}`);
      console.log(`   Notes: ${cond.notes || 'N/A'}`);
      console.log(`   Doctor ID: ${cond.doctor}`);
      console.log(`   ID: ${cond._id}`);
      console.log('');
    });

    // Check for specific observations
    console.log('\n✅ ===================================');
    console.log('✅ VERIFICATION OF NEW OBSERVATIONS');
    console.log('✅ ===================================\n');

    const expectedObservations = [
      'Parctt 300mg',
      'paract 300mh',
      'paraaa 500mg',
      'hgjgjhgj 200mh'
    ];

    expectedObservations.forEach(obs => {
      const found = conditions.some(cond => 
        cond.details?.toLowerCase().includes(obs.toLowerCase())
      );

      if (found) {
        console.log(`✅ FOUND: "${obs}"`);
      } else {
        console.log(`❌ NOT FOUND: "${obs}"`);
      }
    });

    // Summary
    const todayConditions = conditions.filter(c => new Date(c.diagnosed) >= today).length;

    console.log('\n\n📊 ===================================');
    console.log('📊 FINAL SUMMARY');
    console.log('📊 ===================================\n');

    console.log(`✅ Total Medical Conditions: ${conditions.length}`);
    console.log(`✅ Conditions Created Today: ${todayConditions}`);
    console.log(`✅ Sync Status: ${conditions.length >= 9 ? 'WORKING ✓' : 'INCOMPLETE'}`);

    if (conditions.length >= 9) {
      console.log('\n🎉 SUCCESS! All observations from OpenMRS are synced!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

// Run check
checkMedicalConditions().catch(console.error);
