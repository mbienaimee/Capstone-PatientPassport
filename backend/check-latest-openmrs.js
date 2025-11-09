const mysql = require('mysql2/promise');

async function checkLatestObservations() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  try {
    console.log('📊 Checking latest OpenMRS observations...\n');
    
    // Get the highest observation ID
    const [maxId] = await connection.execute(`
      SELECT MAX(obs_id) as max_id FROM obs
    `);
    console.log(`Highest observation ID in OpenMRS: ${maxId[0].max_id}`);
    
    // Get last 10 observations
    const [rows] = await connection.execute(`
      SELECT 
        o.obs_id,
        o.obs_datetime,
        cn.name as concept_name,
        o.value_text,
        o.value_numeric,
        o.comments,
        CONCAT(pn.given_name, ' ', pn.family_name) as patient_name
      FROM obs o
      LEFT JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.locale_preferred = 1
      LEFT JOIN person_name pn ON o.person_id = pn.person_id AND pn.preferred = 1
      WHERE o.voided = 0
      ORDER BY o.obs_id DESC
      LIMIT 10
    `);

    console.log(`\nLast 10 observations in OpenMRS:\n`);
    rows.forEach(row => {
      console.log(`ID: ${row.obs_id}`);
      console.log(`  Patient: ${row.patient_name}`);
      console.log(`  Concept: ${row.concept_name}`);
      console.log(`  Value: ${row.value_text || row.value_numeric || 'N/A'}`);
      console.log(`  Comments: ${row.comments || 'None'}`);
      console.log(`  DateTime: ${row.obs_datetime}`);
      console.log('');
    });

    // Check Betty Williams specifically
    const [bettyObs] = await connection.execute(`
      SELECT 
        o.obs_id,
        o.obs_datetime,
        cn.name as concept_name,
        o.value_text,
        o.value_numeric,
        o.comments
      FROM obs o
      LEFT JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.locale_preferred = 1
      LEFT JOIN person_name pn ON o.person_id = pn.person_id AND pn.preferred = 1
      WHERE o.voided = 0
        AND pn.given_name = 'Betty'
        AND pn.family_name = 'Williams'
      ORDER BY o.obs_id DESC
      LIMIT 20
    `);

    console.log(`\n📋 Betty Williams - Last 20 observations:\n`);
    console.log(`Total found: ${bettyObs.length}\n`);
    bettyObs.forEach(row => {
      console.log(`ID: ${row.obs_id} - ${row.concept_name}: ${row.value_text || row.value_numeric || 'N/A'}`);
      console.log(`  DateTime: ${row.obs_datetime}`);
    });

  } finally {
    await connection.end();
  }
}

checkLatestObservations().catch(console.error);
