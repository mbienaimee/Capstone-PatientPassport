const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBettyWilliams() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Patient Passport database
    console.log('🔍 Searching for Betty Williams in Patient Passport...\n');
    
    const user = await mongoose.connection.db.collection('users').findOne({ 
      name: /betty williams/i 
    });
    
    if (user) {
      console.log('============================================================');
      console.log('✅ FOUND Betty Williams in Patient Passport!');
      console.log('============================================================\n');
      console.log('📋 Patient Passport Details:');
      console.log('   User ID:', user._id);
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   National ID:', user.nationalId || 'Not set');
      console.log('   Date of Birth:', user.dateOfBirth);
      console.log('   Gender:', user.gender);
      console.log('\n============================================================\n');
    } else {
      console.log('❌ Betty Williams NOT FOUND in Patient Passport database\n');
      
      // Search for similar names
      console.log('🔍 Searching for similar names...');
      const bettyUsers = await mongoose.connection.db.collection('users').find({ 
        name: /betty/i 
      }).toArray();
      console.log(`Found ${bettyUsers.length} users with "Betty" in name:`);
      bettyUsers.forEach(u => console.log(`   - ${u.name} (ID: ${u._id})`));
      
      const williamsUsers = await mongoose.connection.db.collection('users').find({ 
        name: /williams/i 
      }).toArray();
      console.log(`\nFound ${williamsUsers.length} users with "Williams" in name:`);
      williamsUsers.forEach(u => console.log(`   - ${u.name} (ID: ${u._id})`));
    }

    // Check OpenMRS database
    console.log('\n🔍 Checking OpenMRS database for Betty Williams...\n');
    
    const connection = await mysql.createConnection({
      host: process.env.HOSPITAL_1_DB_HOST || 'localhost',
      port: parseInt(process.env.HOSPITAL_1_DB_PORT || '3306'),
      user: process.env.HOSPITAL_1_DB_USER,
      password: process.env.HOSPITAL_1_DB_PASSWORD,
      database: process.env.HOSPITAL_1_DB_NAME || 'openmrs'
    });

    const [persons] = await connection.execute(`
      SELECT 
        p.person_id,
        pn.given_name,
        pn.middle_name,
        pn.family_name,
        CONCAT(pn.given_name, ' ', COALESCE(pn.family_name, '')) as full_name,
        p.gender,
        p.birthdate,
        pi.identifier
      FROM person p
      LEFT JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
      LEFT JOIN patient_identifier pi ON p.person_id = pi.patient_id AND pi.voided = 0 AND pi.preferred = 1
      WHERE p.voided = 0
        AND (pn.given_name LIKE '%Betty%' OR pn.family_name LIKE '%Williams%')
      ORDER BY p.person_id
    `);

    if (persons.length > 0) {
      console.log('============================================================');
      console.log(`✅ FOUND ${persons.length} matching patient(s) in OpenMRS:`);
      console.log('============================================================\n');
      
      persons.forEach((person, index) => {
        console.log(`${index + 1}. ${person.full_name}`);
        console.log(`   Person ID: ${person.person_id}`);
        console.log(`   Given Name: "${person.given_name}"`);
        console.log(`   Middle Name: "${person.middle_name || 'None'}"`);
        console.log(`   Family Name: "${person.family_name}"`);
        console.log(`   OpenMRS ID: ${person.identifier}`);
        console.log(`   Gender: ${person.gender}`);
        console.log(`   Birthdate: ${person.birthdate}\n`);
      });

      // Check observations for Betty Williams (person_id = 7)
      const bettyPerson = persons.find(p => p.person_id === 7);
      if (bettyPerson) {
        const [observations] = await connection.execute(`
          SELECT COUNT(*) as count
          FROM obs o
          WHERE o.person_id = 7 AND o.voided = 0
        `);
        
        console.log('📊 Observations for Betty Williams (Person ID 7):');
        console.log(`   Total Observations: ${observations[0].count}`);
        
        if (observations[0].count > 0) {
          const [recentObs] = await connection.execute(`
            SELECT 
              o.obs_id,
              o.obs_datetime,
              cn.name as concept_name,
              o.value_text,
              o.value_numeric,
              o.date_created
            FROM obs o
            LEFT JOIN concept_name cn ON o.concept_id = cn.concept_id 
              AND cn.locale = 'en' 
              AND cn.voided = 0
              AND cn.locale_preferred = 1
            WHERE o.person_id = 7 AND o.voided = 0
            ORDER BY o.date_created DESC
            LIMIT 5
          `);
          
          console.log('\n📋 Recent Observations (last 5):');
          recentObs.forEach((obs, idx) => {
            console.log(`   ${idx + 1}. ${obs.concept_name}`);
            console.log(`      Date: ${obs.obs_datetime}`);
            console.log(`      Created: ${obs.date_created}`);
            console.log(`      Value: ${obs.value_text || obs.value_numeric || 'N/A'}\n`);
          });
        }
      }
    } else {
      console.log('❌ No matching patients found in OpenMRS');
    }

    await connection.end();
    
    // Name matching verification
    if (user && persons.length > 0) {
      const bettyOpenMRS = persons.find(p => p.person_id === 7);
      if (bettyOpenMRS) {
        console.log('\n============================================================');
        console.log('🔄 Automatic Sync Verification:');
        console.log('============================================================\n');
        
        const openMRSName = bettyOpenMRS.full_name.trim();
        const passportName = user.name.trim();
        
        console.log(`✅ OpenMRS Patient Name: "${openMRSName}"`);
        console.log(`✅ Patient Passport Name: "${passportName}"`);
        
        if (openMRSName.toLowerCase() === passportName.toLowerCase()) {
          console.log('✅ PERFECT MATCH! Names are identical');
          console.log('✅ Sync will match by name and sync observations');
        } else {
          console.log('⚠️  Names are NOT identical - checking if they match...');
          const nameRegex = new RegExp(openMRSName, 'i');
          if (nameRegex.test(passportName) || passportName.toLowerCase().includes(openMRSName.toLowerCase())) {
            console.log('✅ Names match (case-insensitive) - sync should work');
          } else {
            console.log('❌ Names do NOT match - sync will NOT work');
            console.log('💡 Update Patient Passport name to match OpenMRS exactly');
          }
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBettyWilliams();
