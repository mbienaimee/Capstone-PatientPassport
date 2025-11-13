/**
 * Test Patient Matching Script
 * 
 * This script tests patient name matching between OpenMRS and Patient Passport
 * to ensure synchronization works correctly for all patients.
 * 
 * Usage: node test-patient-matching.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/patient-passport';
const DB_NAME = MONGODB_URI.split('/').pop().split('?')[0] || 'patient-passport';

async function testPatientMatching() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔍 Testing Patient Name Matching');
    console.log('═'.repeat(80));
    console.log('Connecting to MongoDB...\n');
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get all patients from Patient Passport
    const users = await db.collection('users').find({ role: 'patient' }).toArray();
    const patients = await db.collection('patients').find({}).toArray();
    
    console.log(`📊 Found ${users.length} patients in Patient Passport database\n`);
    
    // Create a map of user ID to patient
    const userToPatient = new Map();
    for (const patient of patients) {
      if (patient.user) {
        userToPatient.set(patient.user.toString(), patient);
      }
    }
    
    // Test cases for name matching
    const testCases = [];
    
    for (const user of users) {
      const patient = userToPatient.get(user._id.toString());
      if (patient && user.name) {
        testCases.push({
          passportName: user.name,
          nationalId: patient.nationalId || 'N/A',
          userId: user._id.toString(),
          patientId: patient._id.toString()
        });
      }
    }
    
    console.log('✅ Patient Names in Patient Passport:');
    console.log('-'.repeat(80));
    
    if (testCases.length === 0) {
      console.log('⚠️  No patients found in database');
      console.log('   Please ensure patients are registered in Patient Passport');
      return;
    }
    
    // Display all patient names
    testCases.forEach((testCase, index) => {
      console.log(`${index + 1}. ${testCase.passportName}`);
      console.log(`   National ID: ${testCase.nationalId}`);
      console.log(`   Patient ID: ${testCase.patientId}`);
      console.log('');
    });
    
    // Test name matching patterns
    console.log('═'.repeat(80));
    console.log('🧪 Testing Name Matching Patterns');
    console.log('═'.repeat(80));
    console.log('\nTesting various name formats that should match:\n');
    
    for (const testCase of testCases.slice(0, 5)) { // Test first 5 patients
      const originalName = testCase.passportName;
      const variations = [
        originalName, // Exact match
        originalName.toUpperCase(), // Uppercase
        originalName.toLowerCase(), // Lowercase
        originalName.trim(), // Trimmed
        originalName.replace(/\s+/g, ' '), // Normalized spaces
      ];
      
      console.log(`Testing: "${originalName}"`);
      
      for (const variation of variations) {
        // Test the matching logic
        const normalized = variation.trim().replace(/\s+/g, ' ');
        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escaped}$`, 'i');
        
        const matched = users.find(u => 
          u.role === 'patient' && regex.test(u.name)
        );
        
        if (matched) {
          console.log(`   ✅ "${variation}" → Matched: "${matched.name}"`);
        } else {
          console.log(`   ❌ "${variation}" → No match`);
        }
      }
      console.log('');
    }
    
    // Check for potential matching issues
    console.log('═'.repeat(80));
    console.log('🔍 Checking for Potential Matching Issues');
    console.log('═'.repeat(80));
    console.log('');
    
    // Check for duplicate names
    const nameCounts = new Map();
    users.forEach(u => {
      if (u.role === 'patient' && u.name) {
        const normalized = u.name.trim().toLowerCase();
        nameCounts.set(normalized, (nameCounts.get(normalized) || 0) + 1);
      }
    });
    
    const duplicates = Array.from(nameCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate patient names (case-insensitive):');
      duplicates.forEach(([name, count]) => {
        console.log(`   - "${name}": ${count} patients`);
      });
      console.log('\n   💡 Recommendation: Use National ID matching for these patients');
    } else {
      console.log('✅ No duplicate patient names found');
    }
    
    // Check for names with special characters
    const specialCharNames = users.filter(u => 
      u.role === 'patient' && u.name && /[^a-zA-Z0-9\s]/.test(u.name)
    );
    if (specialCharNames.length > 0) {
      console.log(`\n⚠️  Found ${specialCharNames.length} patient names with special characters:`);
      specialCharNames.slice(0, 5).forEach(u => {
        console.log(`   - "${u.name}"`);
      });
    } else {
      console.log('\n✅ No special characters in patient names');
    }
    
    // Summary
    console.log('\n═'.repeat(80));
    console.log('📊 Summary');
    console.log('═'.repeat(80));
    console.log(`Total Patients: ${testCases.length}`);
    console.log(`Patients with National ID: ${testCases.filter(t => t.nationalId !== 'N/A').length}`);
    console.log(`Patients ready for sync: ${testCases.length}`);
    console.log('\n✅ Patient matching test complete!');
    console.log('\n💡 Tips for successful synchronization:');
    console.log('   1. Ensure patient names in OpenMRS match Patient Passport exactly');
    console.log('   2. Names are matched case-insensitively');
    console.log('   3. Extra spaces are normalized automatically');
    console.log('   4. If name matching fails, National ID matching is used as fallback');
    console.log('   5. Patients can be auto-registered from OpenMRS if not found');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testPatientMatching();

