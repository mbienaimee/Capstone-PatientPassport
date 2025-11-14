require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRecentObservations() {
  const conn = await mysql.createConnection({
    host: process.env.OPENMRS_DB_HOST || 'localhost',
    port: parseInt(process.env.OPENMRS_DB_PORT || '3306'),
    user: process.env.OPENMRS_DB_USER || 'openmrs_user',
    password: process.env.OPENMRS_DB_PASSWORD || 'OpenMRSPass123!',
    database: process.env.OPENMRS_DB_NAME || 'openmrs'
  });

  const [rows] = await conn.query(`
    SELECT 
      o.obs_id,
      CONCAT_WS(' ', pn.given_name, pn.family_name) as patient,
      cn.name as concept,
      o.value_text,
      o.value_numeric,
      cn2.name as value_coded,
      o.obs_datetime
    FROM obs o
    JOIN person_name pn ON o.person_id = pn.person_id AND pn.preferred = 1 AND pn.voided = 0
    JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
    LEFT JOIN concept_name cn2 ON o.value_coded = cn2.concept_id AND cn2.locale = 'en' AND cn2.concept_name_type = 'FULLY_SPECIFIED'
    WHERE o.voided = 0 
      AND o.obs_datetime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ORDER BY o.obs_datetime DESC
    LIMIT 30
  `);

  console.log('\n📋 Recent OpenMRS Observations (Last 7 Days):');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Total: ${rows.length} observations\n`);

  rows.forEach((r, i) => {
    const value = r.value_text || (r.value_numeric !== null ? r.value_numeric : '') || r.value_coded || 'N/A';
    console.log(`${i + 1}. [ID:${r.obs_id}]`);
    console.log(`   Patient: ${r.patient}`);
    console.log(`   Concept: ${r.concept}`);
    console.log(`   Value: ${value}`);
    console.log(`   Date: ${new Date(r.obs_datetime).toLocaleString()}`);
    console.log('');
  });

  await conn.end();
}

checkRecentObservations().catch(console.error);
