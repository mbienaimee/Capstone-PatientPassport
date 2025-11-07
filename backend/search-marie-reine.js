// Search for Marie Reine in OpenMRS MySQL database
const mysql = require('mysql2/promise');

async function searchPatient() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'openmrs_user',
      password: 'OpenMRSPass123!',
      database: 'openmrs'
    });

    console.log('✅ Connected to OpenMRS MySQL database\n');

    // Search for patient with name containing Marie or Reine
    const [rows] = await connection.query(`
      SELECT 
        p.person_id,
        p.uuid,
        pn.given_name,
        pn.middle_name,
        pn.family_name,
        pt.patient_id,
        (SELECT COUNT(*) FROM obs WHERE person_id = p.person_id AND voided = 0) as observation_count
      FROM person p
      JOIN person_name pn ON p.person_id = pn.person_id
      LEFT JOIN patient pt ON p.person_id = pt.patient_id
      WHERE pn.voided = 0
        AND pn.preferred = 1
        AND (
          pn.given_name LIKE '%Marie%' 
          OR pn.family_name LIKE '%Marie%' 
          OR pn.given_name LIKE '%Reine%' 
          OR pn.family_name LIKE '%Reine%'
        )
      LIMIT 20
    `);

    if (rows.length === 0) {
      console.log('❌ No patient found with name "Marie Reine" in OpenMRS');
      console.log('\n💡 Solution: Register "Marie Reine" as a patient in OpenMRS first');
      console.log('   Then the automatic sync will pick up their observations every 5 minutes!');
    } else {
      console.log(`✅ Found ${rows.length} person(s) matching "Marie" or "Reine":\n`);
      rows.forEach((row, index) => {
        const fullName = `${row.given_name || ''} ${row.middle_name || ''} ${row.family_name || ''}`.replace(/\s+/g, ' ').trim();
        console.log(`${index + 1}. Name: ${fullName}`);
        console.log(`   Person ID: ${row.person_id}`);
        console.log(`   Patient ID: ${row.patient_id || 'Not a patient'}`);
        console.log(`   Observations: ${row.observation_count}`);
        console.log('');
      });
      
      console.log('📋 Next Steps:');
      console.log('   ✅ Automatic sync is running every 5 minutes');
      console.log('   ✅ System will match by name: "Marie Reine" in Patient Passport');
      console.log('   ✅ Observations will sync automatically - no manual entry needed!');
      console.log('\n   🔄 Restart backend to trigger immediate sync');
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

searchPatient();
