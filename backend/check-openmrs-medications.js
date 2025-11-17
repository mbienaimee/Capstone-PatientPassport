const mysql = require('mysql2/promise');
require('dotenv').config();

const checkOpenMRSMedications = async () => {
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

    // Check for medication observations
    const [medObs] = await connection.execute(`
      SELECT 
        o.obs_id,
        o.person_id,
        cn.name as concept_name,
        o.value_text,
        o.value_numeric,
        o.obs_datetime,
        o.date_created,
        p.given_name,
        p.family_name
      FROM obs o
      INNER JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en'
      INNER JOIN person_name p ON o.person_id = p.person_id
      WHERE cn.name LIKE '%medication%' 
         OR cn.name LIKE '%drug%'
         OR cn.name LIKE '%prescription%'
         OR cn.name LIKE '%treatment%'
      ORDER BY o.obs_datetime DESC
      LIMIT 20
    `);

    console.log(`📊 Found ${medObs.length} medication-related observations\n`);
    
    if (medObs.length > 0) {
      medObs.forEach((obs, idx) => {
        console.log(`--- MEDICATION ${idx + 1} ---`);
        console.log('Patient:', `${obs.given_name} ${obs.family_name}`);
        console.log('Concept:', obs.concept_name);
        console.log('Value Text:', obs.value_text || 'N/A');
        console.log('Value Numeric:', obs.value_numeric || 'N/A');
        console.log('Date:', obs.obs_datetime);
        console.log('');
      });
    } else {
      console.log('❌ NO medication observations found in OpenMRS\n');
      console.log('This is why medications are not syncing!\n');
    }

    // Check what concept types exist
    console.log('\n📋 CHECKING ALL CONCEPT TYPES:\n');
    const [concepts] = await connection.execute(`
      SELECT DISTINCT cn.name
      FROM obs o
      INNER JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en'
      ORDER BY cn.name
      LIMIT 50
    `);

    console.log('Available concepts in OpenMRS:');
    concepts.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name}`);
    });

    await connection.end();
    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

checkOpenMRSMedications();
