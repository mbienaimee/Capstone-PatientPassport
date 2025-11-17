const mysql = require('mysql2/promise');
require('dotenv').config();

const checkPatientObservations = async () => {
  let connection;
  try {
    console.log('\n🔍 Connecting to OpenMRS database...\n');
    
    connection = await mysql.createConnection({
      host: process.env.OPENMRS_DB_HOST,
      user: process.env.OPENMRS_DB_USER,
      password: process.env.OPENMRS_DB_PASSWORD,
      database: process.env.OPENMRS_DB_NAME,
      port: parseInt(process.env.OPENMRS_DB_PORT || '3306')
    });

    console.log('✅ Connected to OpenMRS\n');

    // Get recent observations for a specific patient
    const [obs] = await connection.execute(`
      SELECT 
        o.obs_id,
        o.person_id,
        cn.name as concept_name,
        o.value_text,
        o.value_coded,
        vcn.name as value_coded_name,
        o.obs_datetime,
        pn.given_name,
        pn.family_name,
        o.comments
      FROM obs o
      INNER JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en'
      LEFT JOIN concept_name vcn ON o.value_coded = vcn.concept_id AND vcn.locale = 'en'
      INNER JOIN person_name pn ON o.person_id = pn.person_id
      WHERE o.voided = 0
      ORDER BY o.obs_datetime DESC
      LIMIT 30
    `);

    console.log(`📊 Found ${obs.length} recent observations\n`);
    
    const diagnosisObs = [];
    const medicationObs = [];
    const otherObs = [];

    obs.forEach(ob => {
      const conceptLower = ob.concept_name.toLowerCase();
      
      if (conceptLower.includes('diagnosis') || 
          conceptLower.includes('condition') || 
          conceptLower.includes('malaria') ||
          conceptLower.includes('smear') ||
          conceptLower.includes('disease')) {
        diagnosisObs.push(ob);
      } else if (conceptLower.includes('medication') ||
                 conceptLower.includes('drug') ||
                 conceptLower.includes('treatment') ||
                 conceptLower.includes('prescription')) {
        medicationObs.push(ob);
      } else {
        otherObs.push(ob);
      }
    });

    console.log(`\n📋 DIAGNOSIS OBSERVATIONS (${diagnosisObs.length}):\n`);
    diagnosisObs.slice(0, 5).forEach((ob, idx) => {
      console.log(`${idx + 1}. ${ob.concept_name}`);
      console.log(`   Patient: ${ob.given_name} ${ob.family_name}`);
      console.log(`   Value: ${ob.value_coded_name || ob.value_text || 'N/A'}`);
      console.log(`   Date: ${ob.obs_datetime}`);
      console.log('');
    });

    console.log(`\n💊 MEDICATION OBSERVATIONS (${medicationObs.length}):\n`);
    if (medicationObs.length === 0) {
      console.log('❌ NO MEDICATION OBSERVATIONS FOUND!\n');
      console.log('This is why medications are not syncing to Patient Passport.\n');
      console.log('OpenMRS does not have any medication records for these patients.\n');
    } else {
      medicationObs.forEach((ob, idx) => {
        console.log(`${idx + 1}. ${ob.concept_name}`);
        console.log(`   Patient: ${ob.given_name} ${ob.family_name}`);
        console.log(`   Value: ${ob.value_coded_name || ob.value_text || 'N/A'}`);
        console.log(`   Date: ${ob.obs_datetime}`);
        console.log('');
      });
    }

    console.log(`\n📋 OTHER OBSERVATIONS (${otherObs.length}):\n`);
    console.log('(Showing first 10 - these might include medications with different names)\n');
    otherObs.slice(0, 10).forEach((ob, idx) => {
      console.log(`${idx + 1}. ${ob.concept_name}`);
      console.log(`   Patient: ${ob.given_name} ${ob.family_name}`);
      console.log(`   Value: ${ob.value_coded_name || ob.value_text || 'N/A'}`);
      console.log('');
    });

    await connection.end();
    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (connection) await connection.end();
    process.exit(1);
  }
};

checkPatientObservations();
