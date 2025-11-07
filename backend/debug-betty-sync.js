const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugSync() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Connect to OpenMRS MySQL
    const connection = await mysql.createConnection({
      host: process.env.HOSPITAL_1_DB_HOST || 'localhost',
      port: parseInt(process.env.HOSPITAL_1_DB_PORT || '3306'),
      user: process.env.HOSPITAL_1_DB_USER,
      password: process.env.HOSPITAL_1_DB_PASSWORD,
      database: process.env.HOSPITAL_1_DB_NAME || 'openmrs'
    });
    console.log('✅ Connected to OpenMRS MySQL\n');

    // Get Betty Williams from OpenMRS (person_id = 7)
    const [persons] = await connection.execute(`
      SELECT 
        pn.given_name,
        pn.family_name,
        pn.middle_name,
        pi.identifier as national_id
      FROM person_name pn
      JOIN person p ON pn.person_id = p.person_id
      LEFT JOIN patient_identifier pi ON pi.patient_id = p.person_id
      LEFT JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
        AND pit.name LIKE '%National%ID%'
        AND pi.voided = 0
      WHERE pn.person_id = 7
        AND pn.voided = 0
        AND pn.preferred = 1
      LIMIT 1
    `);

    if (persons.length === 0) {
      console.log('❌ Person 7 (Betty Williams) not found in OpenMRS');
      process.exit(1);
    }

    const row = persons[0];
    const givenName = row.given_name || '';
    const middleName = row.middle_name || '';
    const familyName = row.family_name || '';
    const nationalId = row.national_id;
    
    const fullName = `${givenName} ${middleName} ${familyName}`.replace(/\s+/g, ' ').trim();

    console.log('📋 OpenMRS Data for Person ID 7:');
    console.log('   Given Name:', givenName);
    console.log('   Middle Name:', middleName || 'None');
    console.log('   Family Name:', familyName);
    console.log('   Full Name:', fullName);
    console.log('   National ID:', nationalId || 'Not set');
    console.log('');

    // Now replicate the exact matching logic from openmrsSyncService.ts
    console.log('🔍 Step-by-step Patient Matching:\n');

    // Step 1: Try National ID
    if (nationalId) {
      console.log(`Step 1: Trying National ID match: "${nationalId}"`);
      const patientByNationalId = await mongoose.connection.db.collection('patients').findOne({ 
        nationalId: nationalId 
      });
      if (patientByNationalId) {
        console.log('   ✅ FOUND by National ID!', patientByNationalId._id);
        const user = await mongoose.connection.db.collection('users').findOne({ 
          _id: patientByNationalId.user 
        });
        console.log('   User:', user.name, user.role);
        await connection.end();
        await mongoose.disconnect();
        return;
      } else {
        console.log('   ❌ Not found by National ID');
      }
    } else {
      console.log('Step 1: Skipping National ID (not available)');
    }
    console.log('');

    // Step 2: Try exact name match
    console.log(`Step 2: Trying exact name match: "^${fullName}$" (case-insensitive)`);
    const regex1 = new RegExp(`^${fullName}$`, 'i');
    console.log('   Regex pattern:', regex1);
    
    const userExact = await mongoose.connection.db.collection('users').findOne({
      name: regex1,
      role: 'patient'
    });
    
    if (userExact) {
      console.log('   ✅ FOUND user by exact name!');
      console.log('   User ID:', userExact._id);
      console.log('   User Name:', userExact.name);
      console.log('   User Role:', userExact.role);
      
      const patient = await mongoose.connection.db.collection('patients').findOne({ 
        user: userExact._id 
      });
      
      if (patient) {
        console.log('   ✅ FOUND patient record!', patient._id);
      } else {
        console.log('   ❌ User found but NO patient record!');
      }
      await connection.end();
      await mongoose.disconnect();
      return;
    } else {
      console.log('   ❌ Not found by exact name');
      
      // Let's see what users exist
      console.log('\n   🔍 Checking what users exist with similar names...');
      const allPatientUsers = await mongoose.connection.db.collection('users').find({
        role: 'patient'
      }).toArray();
      
      console.log(`   Total patient users: ${allPatientUsers.length}`);
      allPatientUsers.forEach(u => {
        const matches = regex1.test(u.name);
        console.log(`      ${matches ? '✅' : '❌'} "${u.name}" (ID: ${u._id})`);
      });
    }
    console.log('');

    // Step 3: Try partial match
    console.log(`Step 3: Trying partial match: "${givenName}.*${familyName}" (case-insensitive)`);
    const namePattern = `${givenName}.*${familyName}`;
    const regex2 = new RegExp(namePattern, 'i');
    console.log('   Regex pattern:', regex2);
    
    const userPartial = await mongoose.connection.db.collection('users').findOne({
      name: regex2,
      role: 'patient'
    });
    
    if (userPartial) {
      console.log('   ✅ FOUND user by partial match!');
      console.log('   User ID:', userPartial._id);
      console.log('   User Name:', userPartial.name);
      
      const patient = await mongoose.connection.db.collection('patients').findOne({ 
        user: userPartial._id 
      });
      
      if (patient) {
        console.log('   ✅ FOUND patient record!', patient._id);
      } else {
        console.log('   ❌ User found but NO patient record!');
      }
      await connection.end();
      await mongoose.disconnect();
      return;
    } else {
      console.log('   ❌ Not found by partial match');
    }
    console.log('');

    // Step 4: Try family name only
    console.log(`Step 4: Trying family name only: "${familyName}" (case-insensitive)`);
    const regex3 = new RegExp(familyName, 'i');
    console.log('   Regex pattern:', regex3);
    
    const userFamily = await mongoose.connection.db.collection('users').findOne({
      name: regex3,
      role: 'patient'
    });
    
    if (userFamily) {
      console.log('   ✅ FOUND user by family name!');
      console.log('   User ID:', userFamily._id);
      console.log('   User Name:', userFamily.name);
      
      const patient = await mongoose.connection.db.collection('patients').findOne({ 
        user: userFamily._id 
      });
      
      if (patient) {
        console.log('   ✅ FOUND patient record!', patient._id);
      } else {
        console.log('   ❌ User found but NO patient record!');
      }
    } else {
      console.log('   ❌ Not found by family name');
    }
    console.log('');

    console.log('❌ CONCLUSION: Patient matching FAILED at all steps!');
    console.log('\n💡 This is why sync keeps saying "Patient not found"');

    await connection.end();
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugSync();
