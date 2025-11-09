/**
 * Check Betty Williams' patient document and medicalHistory array
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkPatientDocument() {
  console.log('\n🔍 ===================================');
  console.log('🔍 PATIENT DOCUMENT INVESTIGATION');
  console.log('🔍 ===================================\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('CapstonePassportSystem');

    // Find Betty Williams user
    const user = await db.collection('users').findOne({
      email: 'm.bienaimee@alustudent.com'
    });

    if (!user) {
      console.log('❌ Betty Williams not found!');
      return;
    }

    console.log(`✅ User: ${user.firstName} ${user.lastName}`);
    console.log(`   User ID: ${user._id}\n`);

    // Get patient document
    const patient = await db.collection('patients').findOne({
      user: user._id
    });

    if (!patient) {
      console.log('❌ Patient document not found!');
      return;
    }

    console.log(`✅ Patient Document:`);
    console.log(`   Patient ID: ${patient._id}`);
    console.log(`   Medical History Array Length: ${patient.medicalHistory ? patient.medicalHistory.length : 0}`);
    console.log(`   Medications Array Length: ${patient.medications ? patient.medications.length : 0}`);
    console.log(`   Test Results Array Length: ${patient.testResults ? patient.testResults.length : 0}`);
    console.log(`   Hospital Visits Array Length: ${patient.hospitalVisits ? patient.hospitalVisits.length : 0}`);
    console.log('');

    // Show sample medical history IDs
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      console.log(`📋 Medical History IDs (first 10):`);
      patient.medicalHistory.slice(0, 10).forEach((id, idx) => {
        console.log(`   ${idx + 1}. ${id}`);
      });
      console.log('');
    }

    // Count matching medical conditions
    const conditionsCount = await db.collection('medicalconditions')
      .countDocuments({ patient: patient._id });

    console.log(`📊 COMPARISON:`);
    console.log(`   Medical Conditions in DB: ${conditionsCount}`);
    console.log(`   Medical History Array Length: ${patient.medicalHistory ? patient.medicalHistory.length : 0}`);
    console.log('');

    if (conditionsCount !== (patient.medicalHistory || []).length) {
      console.log(`⚠️  MISMATCH DETECTED!`);
      console.log(`   The patient.medicalHistory array has ${(patient.medicalHistory || []).length} IDs`);
      console.log(`   But there are ${conditionsCount} medical conditions in the database`);
      console.log(`   This means the array is out of sync!\n`);

      // Show conditions not in medicalHistory
      const allConditions = await db.collection('medicalconditions')
        .find({ patient: patient._id })
        .sort({ diagnosed: -1 })
        .toArray();

      const medHistoryIds = (patient.medicalHistory || []).map(id => id.toString());
      const missingConditions = allConditions.filter(cond => 
        !medHistoryIds.includes(cond._id.toString())
      );

      if (missingConditions.length > 0) {
        console.log(`❌ Conditions NOT in medicalHistory array: ${missingConditions.length}`);
        missingConditions.slice(0, 5).forEach((cond, idx) => {
          console.log(`   ${idx + 1}. ${cond.name} - ${cond.details}`);
          console.log(`      ID: ${cond._id}`);
          console.log(`      Date: ${new Date(cond.diagnosed).toLocaleString()}`);
        });
        console.log('');
      }

      // Fix suggestion
      console.log('🔧 FIX REQUIRED:');
      console.log('   The patient.medicalHistory array needs to be updated to include all medical conditions');
      console.log('   This happens because the sync service is creating conditions but the array is not being updated');
      console.log('');
    } else {
      console.log(`✅ SYNC OK: medicalHistory array matches database conditions count`);
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
checkPatientDocument().catch(console.error);
