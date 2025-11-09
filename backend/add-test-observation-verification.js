require('dotenv').config();
const mysql = require('mysql2/promise');

async function addTestObservation() {
  console.log('🧪 Adding test observation to OpenMRS...\n');
  
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  try {
    // Get Betty Williams (person_id = 7) - she has 133 observations
    const personId = 7;
    const patientName = 'Betty Williams';
    
    console.log(`📝 Adding observation for ${patientName} (person_id: ${personId})`);
    
    // Get concept ID for "Malarial smear"
    const [concepts] = await conn.query(`
      SELECT concept_id, name 
      FROM concept_name 
      WHERE name LIKE '%Malarial smear%' 
        AND concept_name_type = 'FULLY_SPECIFIED'
        AND locale = 'en'
      LIMIT 1
    `);
    
    if (concepts.length === 0) {
      console.log('❌ Concept "Malarial smear" not found in OpenMRS');
      console.log('   Available malaria-related concepts:');
      const [allConcepts] = await conn.query(`
        SELECT name 
        FROM concept_name 
        WHERE name LIKE '%malaria%' 
          AND concept_name_type = 'FULLY_SPECIFIED'
          AND locale = 'en'
        LIMIT 10
      `);
      allConcepts.forEach(c => console.log(`   - ${c.name}`));
      await conn.end();
      return;
    }

    const conceptId = concepts[0].concept_id;
    console.log(`   Using concept: ${concepts[0].name} (ID: ${conceptId})`);
    
    // Get encounter for this patient (use latest encounter)
    const [encounters] = await conn.query(`
      SELECT encounter_id 
      FROM encounter 
      WHERE patient_id = ? 
        AND voided = 0 
      ORDER BY encounter_datetime DESC 
      LIMIT 1
    `, [personId]);
    
    if (encounters.length === 0) {
      console.log('❌ No encounter found for patient');
      await conn.end();
      return;
    }
    
    const encounterId = encounters[0].encounter_id;
    console.log(`   Using encounter ID: ${encounterId}`);
    
    // Insert observation
    const obsDatetime = new Date();
    const [result] = await conn.query(`
      INSERT INTO obs (
        person_id,
        concept_id,
        encounter_id,
        obs_datetime,
        location_id,
        value_text,
        comments,
        creator,
        date_created,
        uuid,
        voided
      ) VALUES (?, ?, ?, ?, 1, ?, ?, 1, NOW(), UUID(), 0)
    `, [
      personId,
      conceptId,
      encounterId,
      obsDatetime,
      'Positive - Test observation',
      'Test observation added by sync verification script'
    ]);
    
    const newObsId = result.insertId;
    console.log(`\n✅ Test observation created successfully!`);
    console.log(`   Observation ID: ${newObsId}`);
    console.log(`   Patient: ${patientName}`);
    console.log(`   Concept: ${concepts[0].name}`);
    console.log(`   Value: Positive - Test observation`);
    console.log(`   DateTime: ${obsDatetime.toISOString()}`);
    
    console.log(`\n⏰ The sync service will pick this up in the next cycle (every 5 minutes)`);
    console.log(`   OR you can trigger immediate sync: POST http://localhost:5000/api/scheduled-sync/sync-now`);
    console.log(`\n💡 Watch the backend console for:`);
    console.log(`   ✓ Synced: ${concepts[0].name} for patient ${patientName}`);
    
  } catch (error) {
    console.error('❌ Error adding test observation:', error.message);
  } finally {
    await conn.end();
  }
}

addTestObservation();
