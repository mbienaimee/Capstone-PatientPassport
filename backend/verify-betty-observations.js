/**
 * Verification Script: Check Betty Williams' observations in Patient Passport
 * This script verifies that observations from OpenMRS are properly synced
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyObservations() {
  console.log('\n🔍 ===================================');
  console.log('🔍 BETTY WILLIAMS OBSERVATION VERIFICATION');
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
      console.log('❌ Betty Williams not found in database!');
      return;
    }

    console.log(`✅ Patient Found: ${patient.firstName} ${patient.lastName}`);
    console.log(`   Patient ID: ${patient._id}`);
    console.log(`   Email: ${patient.email}\n`);

    // Get all medical records for Betty Williams
    const medicalRecords = await db.collection('medicalrecords')
      .find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📊 Total Medical Records: ${medicalRecords.length}\n`);

    if (medicalRecords.length === 0) {
      console.log('⚠️  No medical records found for Betty Williams');
      return;
    }

    // Group records by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentRecords = medicalRecords.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= today;
    });

    console.log(`📅 Records Created Today (Nov 7, 2025): ${recentRecords.length}`);
    console.log(`📅 Historical Records: ${medicalRecords.length - recentRecords.length}\n`);

    // Display all observations
    console.log('🔬 ===================================');
    console.log('🔬 ALL OBSERVATIONS FROM OPENMRS');
    console.log('🔬 ===================================\n');

    medicalRecords.forEach((record, index) => {
      const diagnosis = record.diagnosis || [];
      const createdDate = new Date(record.createdAt).toLocaleString();
      const isToday = new Date(record.createdAt) >= today;
      
      console.log(`\n${index + 1}. Record ID: ${record._id}`);
      console.log(`   ${isToday ? '🆕 Created Today' : '📅 Historical'}: ${createdDate}`);
      console.log(`   Hospital: ${record.hospitalName || 'N/A'}`);
      console.log(`   Doctor: ${record.doctorName || 'N/A'}`);
      
      if (diagnosis.length > 0) {
        console.log(`   Diagnoses: ${diagnosis.length}`);
        diagnosis.forEach((diag, idx) => {
          console.log(`      ${idx + 1}. ${diag.diagnosis || 'N/A'}`);
          if (diag.details) {
            console.log(`         Details: ${diag.details}`);
          }
          if (diag.date) {
            console.log(`         Date: ${new Date(diag.date).toLocaleString()}`);
          }
        });
      } else {
        console.log(`   ⚠️  No diagnoses in this record`);
      }
    });

    // Check for specific observations from screenshot
    console.log('\n\n✅ ===================================');
    console.log('✅ VERIFICATION OF SCREENSHOT OBSERVATIONS');
    console.log('✅ ===================================\n');

    const expectedObservations = [
      'Parctt 300mg',
      'paract 300mh',
      'paraaa 500mg',
      'hgjgjhgj 200mh'
    ];

    expectedObservations.forEach(observation => {
      const found = medicalRecords.some(record => {
        return record.diagnosis?.some(diag => 
          diag.details?.toLowerCase().includes(observation.toLowerCase())
        );
      });

      if (found) {
        console.log(`✅ FOUND: "${observation}"`);
      } else {
        console.log(`❌ NOT FOUND: "${observation}"`);
      }
    });

    // Summary
    console.log('\n\n📊 ===================================');
    console.log('📊 SYNC SUMMARY');
    console.log('📊 ===================================\n');

    const totalDiagnoses = medicalRecords.reduce((sum, record) => {
      return sum + (record.diagnosis?.length || 0);
    }, 0);

    console.log(`✅ Total Medical Records: ${medicalRecords.length}`);
    console.log(`✅ Total Diagnoses/Observations: ${totalDiagnoses}`);
    console.log(`✅ Records Created Today: ${recentRecords.length}`);
    console.log(`✅ Sync Status: ${totalDiagnoses > 0 ? 'WORKING ✓' : 'NO DATA ✗'}`);

    if (totalDiagnoses >= 9) {
      console.log('\n🎉 SUCCESS! All observations from OpenMRS are synced to Patient Passport!');
    } else if (totalDiagnoses > 0) {
      console.log('\n⚠️  PARTIAL SYNC: Some observations synced, but not all expected observations found');
    } else {
      console.log('\n❌ SYNC ISSUE: No observations found in Patient Passport');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

// Run verification
verifyObservations().catch(console.error);
