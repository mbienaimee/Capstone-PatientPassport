/**
 * Deep Database Investigation - Check ALL collections for Betty Williams data
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function deepInvestigation() {
  console.log('\n🔍 ===================================');
  console.log('🔍 DEEP DATABASE INVESTIGATION');
  console.log('🔍 ===================================\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('CapstonePassportSystem');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available Collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');

    // Find Betty Williams
    const patient = await db.collection('users').findOne({
      email: 'm.bienaimee@alustudent.com'
    });

    if (!patient) {
      console.log('❌ Betty Williams not found!');
      return;
    }

    const patientId = patient._id.toString();
    console.log(`✅ Patient ID: ${patientId}\n`);

    // Check each collection for Betty's data
    console.log('🔍 Searching for data in each collection...\n');

    // Check diagnoses collection
    const diagnoses = await db.collection('diagnoses')
      .find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .toArray();
    console.log(`📋 diagnoses collection: ${diagnoses.length} records`);
    if (diagnoses.length > 0) {
      console.log('   First 3 diagnoses:');
      diagnoses.slice(0, 3).forEach((diag, idx) => {
        console.log(`   ${idx + 1}. ${diag.diagnosis || 'N/A'} - ${diag.details || 'N/A'}`);
        console.log(`      Created: ${diag.createdAt}`);
        console.log(`      ID: ${diag._id}`);
      });
    }
    console.log('');

    // Check medicalrecords collection
    const medicalRecords = await db.collection('medicalrecords')
      .find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .toArray();
    console.log(`📋 medicalrecords collection: ${medicalRecords.length} records`);
    if (medicalRecords.length > 0) {
      console.log('   First 3 medical records:');
      medicalRecords.slice(0, 3).forEach((record, idx) => {
        console.log(`   ${idx + 1}. Hospital: ${record.hospitalName || 'N/A'}`);
        console.log(`      Doctor: ${record.doctorName || 'N/A'}`);
        console.log(`      Diagnoses: ${record.diagnosis?.length || 0}`);
        console.log(`      Created: ${record.createdAt}`);
      });
    }
    console.log('');

    // Check medications collection
    const medications = await db.collection('medications')
      .find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .toArray();
    console.log(`📋 medications collection: ${medications.length} records\n`);

    // Count today's records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDiagnoses = diagnoses.filter(d => new Date(d.createdAt) >= today).length;
    console.log(`📅 Records Created Today (Nov 7, 2025):`);
    console.log(`   - diagnoses: ${todayDiagnoses}`);
    console.log(`   - medicalrecords: ${medicalRecords.filter(r => new Date(r.createdAt) >= today).length}`);
    console.log('');

    // Show all diagnosis details if found
    if (diagnoses.length > 0) {
      console.log('\n🔬 ===================================');
      console.log('🔬 ALL DIAGNOSES FOR BETTY WILLIAMS');
      console.log('🔬 ===================================\n');

      diagnoses.forEach((diag, index) => {
        const createdDate = new Date(diag.createdAt);
        const isToday = createdDate >= today;
        
        console.log(`${index + 1}. ${isToday ? '🆕' : '📅'} ${diag.diagnosis || 'N/A'}`);
        console.log(`   Details: ${diag.details || 'N/A'}`);
        console.log(`   Date: ${diag.date ? new Date(diag.date).toLocaleString() : 'N/A'}`);
        console.log(`   Created: ${createdDate.toLocaleString()}`);
        console.log(`   Hospital: ${diag.hospitalName || 'N/A'}`);
        console.log(`   Doctor: ${diag.doctorName || 'N/A'}`);
        console.log('');
      });
    }

    // Check for specific observations
    console.log('\n✅ ===================================');
    console.log('✅ VERIFICATION OF NEW OBSERVATIONS');
    console.log('✅ ===================================\n');

    const expectedObservations = [
      { value: 'Parctt 300mg', type: 'Malaria smear impression' },
      { value: 'paract 300mh', type: 'Malaria smear impression' },
      { value: 'paraaa 500mg', type: 'Malaria smear impression' },
      { value: 'hgjgjhgj 200mh', type: 'Malaria smear impression' }
    ];

    expectedObservations.forEach(obs => {
      const found = diagnoses.some(diag => 
        diag.details?.toLowerCase().includes(obs.value.toLowerCase())
      );

      if (found) {
        console.log(`✅ FOUND: "${obs.value}" (${obs.type})`);
      } else {
        console.log(`❌ NOT FOUND: "${obs.value}" (${obs.type})`);
      }
    });

    // Final Summary
    console.log('\n\n📊 ===================================');
    console.log('📊 SYNC STATUS SUMMARY');
    console.log('📊 ===================================\n');

    console.log(`✅ Total Diagnoses: ${diagnoses.length}`);
    console.log(`✅ Diagnoses Created Today: ${todayDiagnoses}`);
    console.log(`✅ Total Medical Records: ${medicalRecords.length}`);
    console.log(`✅ Total Medications: ${medications.length}`);

    if (diagnoses.length >= 9) {
      console.log('\n🎉 SUCCESS! All observations from OpenMRS are synced!');
      console.log('   The sync is working correctly and dynamically.');
    } else if (diagnoses.length > 0) {
      console.log(`\n⚠️  PARTIAL: ${diagnoses.length} observations found, expected 9+`);
    } else {
      console.log('\n❌ NO DATA: No diagnoses found for Betty Williams');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

// Run deep investigation
deepInvestigation().catch(console.error);
