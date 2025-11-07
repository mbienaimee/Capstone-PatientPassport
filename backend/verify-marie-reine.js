// Deep verification of Marie Reine in OpenMRS
const mysql = require('mysql2/promise');

async function verifyMarieReine() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'openmrs_user',
    password: 'OpenMRSPass123!',
    database: 'openmrs'
  });

  console.log('🔍 Deep Research: Marie Reine in OpenMRS\n');
  console.log('='.repeat(60));

  // 1. Find Marie Reine's complete information
  const [persons] = await conn.query(`
    SELECT 
      p.person_id,
      p.uuid,
      p.gender,
      p.birthdate,
      pn.given_name,
      pn.middle_name,
      pn.family_name,
      pn.preferred,
      pt.patient_id
    FROM person p
    JOIN person_name pn ON p.person_id = pn.person_id
    LEFT JOIN patient pt ON p.person_id = pt.patient_id
    WHERE pn.voided = 0
      AND (
        (pn.given_name = 'Marie' AND pn.family_name = 'Reine')
        OR (pn.given_name LIKE '%Marie%' AND pn.family_name LIKE '%Reine%')
      )
  `);

  if (persons.length === 0) {
    console.log('❌ Marie Reine not found with exact match');
    console.log('   Searching with broader criteria...\n');
    
    const [broader] = await conn.query(`
      SELECT 
        p.person_id,
        pn.given_name,
        pn.family_name,
        pt.patient_id
      FROM person p
      JOIN person_name pn ON p.person_id = pn.person_id
      LEFT JOIN patient pt ON p.person_id = pt.patient_id
      WHERE pn.voided = 0
        AND (pn.given_name LIKE '%Marie%' OR pn.family_name LIKE '%Reine%')
      LIMIT 5
    `);
    
    broader.forEach(r => {
      console.log(`   Found: ${r.given_name} ${r.family_name} (person_id: ${r.person_id}, patient_id: ${r.patient_id})`);
    });
  } else {
    const marie = persons[0];
    const fullName = `${marie.given_name || ''} ${marie.middle_name || ''} ${marie.family_name || ''}`.replace(/\s+/g, ' ').trim();
    
    console.log('✅ FOUND Marie Reine!\n');
    console.log('📋 OpenMRS Details:');
    console.log(`   Full Name: "${fullName}"`);
    console.log(`   Given Name: "${marie.given_name}"`);
    console.log(`   Middle Name: "${marie.middle_name || 'None'}"`);
    console.log(`   Family Name: "${marie.family_name}"`);
    console.log(`   Person ID: ${marie.person_id}`);
    console.log(`   Patient ID: ${marie.patient_id || 'Not registered as patient'}`);
    console.log(`   Gender: ${marie.gender}`);
    console.log(`   Birthdate: ${marie.birthdate}`);
    console.log(`   Preferred Name: ${marie.preferred ? 'Yes' : 'No'}`);

    // 2. Check for National ID
    const [identifiers] = await conn.query(`
      SELECT 
        pi.identifier,
        pit.name as identifier_type
      FROM patient_identifier pi
      JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
      WHERE pi.patient_id = ?
        AND pi.voided = 0
    `, [marie.person_id]);

    console.log('\n📋 Identifiers:');
    if (identifiers.length === 0) {
      console.log('   ⚠️ No identifiers found (No National ID)');
      console.log('   ✅ System will match by NAME only');
    } else {
      identifiers.forEach(id => {
        console.log(`   ${id.identifier_type}: ${id.identifier}`);
      });
    }

    // 3. Count observations
    const [obsCount] = await conn.query(`
      SELECT COUNT(*) as count
      FROM obs
      WHERE person_id = ?
        AND voided = 0
    `, [marie.person_id]);

    console.log(`\n📊 Observations: ${obsCount[0].count} total`);

    // 4. Check recent observations
    if (obsCount[0].count > 0) {
      const [recentObs] = await conn.query(`
        SELECT 
          o.obs_id,
          o.obs_datetime,
          c.name as concept_name,
          o.value_numeric,
          o.value_text
        FROM obs o
        LEFT JOIN concept_name c ON o.concept_id = c.concept_id
          AND c.locale = 'en'
          AND c.concept_name_type = 'FULLY_SPECIFIED'
        WHERE o.person_id = ?
          AND o.voided = 0
        ORDER BY o.obs_datetime DESC
        LIMIT 5
      `, [marie.person_id]);

      console.log('\n📋 Recent Observations (last 5):');
      recentObs.forEach((obs, i) => {
        console.log(`   ${i+1}. ${obs.concept_name || 'Unknown'}`);
        console.log(`      Date: ${obs.obs_datetime}`);
        console.log(`      Value: ${obs.value_numeric || obs.value_text || 'N/A'}`);
      });
    }

    // 5. Verify name format for matching
    console.log('\n' + '='.repeat(60));
    console.log('🔄 Automatic Sync Verification:');
    console.log('='.repeat(60));
    console.log(`\n✅ OpenMRS Patient Name: "${fullName}"`);
    console.log('✅ Patient Passport Name: "Marie Reine"');
    
    if (fullName.toLowerCase() === 'marie reine') {
      console.log('✅ PERFECT MATCH! Names are identical');
      console.log(`✅ Sync will match by name and sync ${obsCount[0].count} observations`);
    } else {
      console.log(`⚠️ Name mismatch detected!`);
      console.log(`   OpenMRS: "${fullName}"`);
      console.log(`   Patient Passport: "Marie Reine"`);
      console.log(`   📝 Recommendation: Update Patient Passport name to "${fullName}"`);
    }
  }

  await conn.end();
}

verifyMarieReine().catch(console.error);
