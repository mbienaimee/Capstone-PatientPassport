const mysql = require('mysql2/promise');

async function checkTodaysObservations() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  console.log('🔍 Checking for today\'s observations in OpenMRS...\n');
  console.log('Current date/time:', new Date().toISOString());
  console.log('');

  // Check observations from today
  const [todayObs] = await connection.query(`
    SELECT 
      o.obs_id,
      o.person_id,
      CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) as patient_name,
      cn.name as concept_name,
      o.value_text,
      o.value_numeric,
      cn2.name as value_coded_name,
      o.obs_datetime,
      o.date_created
    FROM obs o
    JOIN person_name pn ON o.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
    JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
    LEFT JOIN concept_name cn2 ON o.value_coded = cn2.concept_id AND cn2.locale = 'en' AND cn2.concept_name_type = 'FULLY_SPECIFIED'
    WHERE DATE(o.obs_datetime) = CURDATE()
      AND o.voided = 0
    ORDER BY o.obs_datetime DESC
    LIMIT 20
  `);

  console.log(`📊 Found ${todayObs.length} observations from TODAY (${new Date().toISOString().split('T')[0]}):\n`);

  if (todayObs.length > 0) {
    todayObs.forEach((obs, index) => {
      console.log(`${index + 1}. Observation ID: ${obs.obs_id}`);
      console.log(`   Patient: ${obs.patient_name}`);
      console.log(`   Concept: ${obs.concept_name}`);
      console.log(`   Value: ${obs.value_text || obs.value_numeric || obs.value_coded_name || 'N/A'}`);
      console.log(`   Observation Date: ${obs.obs_datetime}`);
      console.log(`   Created: ${obs.date_created}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No observations found for today!');
    console.log('');
    
    // Check the most recent observations
    const [recentObs] = await connection.query(`
      SELECT 
        o.obs_id,
        CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) as patient_name,
        cn.name as concept_name,
        o.obs_datetime,
        DATEDIFF(CURDATE(), DATE(o.obs_datetime)) as days_ago
      FROM obs o
      JOIN person_name pn ON o.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
      JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
      WHERE o.voided = 0
      ORDER BY o.obs_datetime DESC
      LIMIT 5
    `);

    console.log('📅 Most recent observations:');
    recentObs.forEach((obs, index) => {
      console.log(`${index + 1}. ${obs.patient_name} - ${obs.concept_name}`);
      console.log(`   Date: ${obs.obs_datetime} (${obs.days_ago} days ago)`);
    });
  }

  // Check observations from last 24 hours
  console.log('\n⏰ Observations from last 24 hours:');
  const [last24h] = await connection.query(`
    SELECT COUNT(*) as count
    FROM obs
    WHERE obs_datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND voided = 0
  `);

  console.log(`   Count: ${last24h[0].count}`);

  await connection.end();
}

checkTodaysObservations().catch(console.error);
