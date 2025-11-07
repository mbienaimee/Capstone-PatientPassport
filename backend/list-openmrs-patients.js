require('dotenv').config();
const mysql = require('mysql2/promise');

async function listAllPatients() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  const [rows] = await conn.query(`
    SELECT 
      pn.given_name,
      pn.middle_name,
      pn.family_name,
      p.person_id,
      (SELECT COUNT(*) FROM obs WHERE person_id = p.person_id AND voided = 0) as obs_count
    FROM person_name pn
    JOIN person p ON pn.person_id = p.person_id
    JOIN patient pt ON p.person_id = pt.patient_id
    WHERE pn.voided = 0 AND pn.preferred = 1
    ORDER BY pn.given_name
    LIMIT 20
  `);

  console.log('=== OpenMRS Patients ===\n');
  rows.forEach((r, i) => {
    const name = `${r.given_name || ''} ${r.middle_name || ''} ${r.family_name || ''}`.trim();
    console.log(`${i+1}. ${name}`);
    console.log(`   Person ID: ${r.person_id}, Observations: ${r.obs_count}\n`);
  });

  const marieExists = rows.find(r => 
    (r.given_name && r.given_name.toLowerCase().includes('marie')) ||
    (r.family_name && r.family_name.toLowerCase().includes('marie')) ||
    (r.given_name && r.given_name.toLowerCase().includes('reine')) ||
    (r.family_name && r.family_name.toLowerCase().includes('reine'))
  );

  if (marieExists) {
    console.log('✅ Found Marie Reine in OpenMRS!');
    console.log('   The automatic sync will match this patient by name.');
  } else {
    console.log('❌ Marie Reine not found in OpenMRS.');
    console.log('   Please register this patient in OpenMRS first.');
  }

  await conn.end();
}

listAllPatients().catch(console.error);
