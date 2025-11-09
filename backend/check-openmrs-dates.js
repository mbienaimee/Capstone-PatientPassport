const mysql = require('mysql2/promise');

async function checkOpenMRSDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  try {
    console.log('📊 Checking OpenMRS observation dates...\n');
    
    const [rows] = await connection.execute(`
      SELECT 
        obs_id,
        concept_id,
        obs_datetime,
        DATE(obs_datetime) as obs_date,
        TIME(obs_datetime) as obs_time,
        NOW() as current_server_time
      FROM obs
      WHERE obs_id >= 5268
      ORDER BY obs_id DESC
      LIMIT 10
    `);

    console.log(`Found ${rows.length} recent observations:\n`);
    rows.forEach(row => {
      console.log(`ID: ${row.obs_id}`);
      console.log(`  obs_datetime: ${row.obs_datetime}`);
      console.log(`  obs_date: ${row.obs_date}`);
      console.log(`  obs_time: ${row.obs_time}`);
      console.log('');
    });

    console.log(`\nCurrent MySQL server time: ${rows[0].current_server_time}`);
    
  } finally {
    await connection.end();
  }
}

checkOpenMRSDates().catch(console.error);
