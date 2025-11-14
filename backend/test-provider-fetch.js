/**
 * Test script to debug provider fetching from OpenMRS
 * This will help identify why provider is showing as "Unknown Doctor"
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testProviderFetch() {
  let connection = null;
  
  try {
    // Get OpenMRS connection details from environment
    const openmrsConfig = {
      host: process.env.OPENMRS_HOST || 'localhost',
      port: parseInt(process.env.OPENMRS_PORT || '3306'),
      user: process.env.OPENMRS_USER || 'openmrs',
      password: process.env.OPENMRS_PASSWORD || 'openmrs',
      database: process.env.OPENMRS_DATABASE || 'openmrs'
    };

    console.log('🔌 Connecting to OpenMRS database...');
    console.log(`   Host: ${openmrsConfig.host}:${openmrsConfig.port}`);
    console.log(`   Database: ${openmrsConfig.database}`);
    
    connection = await mysql.createConnection(openmrsConfig);
    console.log('✅ Connected to OpenMRS database\n');

    // Get a recent observation with encounter_id
    console.log('📋 Fetching recent observations with encounter_id...\n');
    const [observations] = await connection.query(`
      SELECT 
        o.obs_id,
        o.person_id,
        o.encounter_id,
        o.location_id,
        o.creator,
        o.obs_datetime,
        cn.name as concept_name
      FROM obs o
      JOIN concept_name cn ON o.concept_id = cn.concept_id 
        AND cn.locale = 'en' 
        AND cn.concept_name_type = 'FULLY_SPECIFIED'
      WHERE o.voided = 0
        AND o.encounter_id IS NOT NULL
      ORDER BY o.obs_id DESC
      LIMIT 5
    `);

    if (observations.length === 0) {
      console.log('⚠️ No observations found with encounter_id');
      return;
    }

    console.log(`Found ${observations.length} recent observation(s):\n`);

    for (const obs of observations) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Observation ID: ${obs.obs_id}`);
      console.log(`Concept: ${obs.concept_name}`);
      console.log(`Encounter ID: ${obs.encounter_id}`);
      console.log(`Location ID: ${obs.location_id}`);
      console.log(`Creator (user_id): ${obs.creator}`);
      console.log(`Date: ${obs.obs_datetime}\n`);

      // Test 1: Check if encounter exists
      const [encounters] = await connection.query(`
        SELECT encounter_id, encounter_type, encounter_datetime, location_id
        FROM encounter
        WHERE encounter_id = ?
          AND voided = 0
      `, [obs.encounter_id]);

      if (encounters.length === 0) {
        console.log('❌ Encounter not found in encounter table!');
        continue;
      }

      const encounter = encounters[0];
      console.log(`✅ Encounter found:`);
      console.log(`   - Type: ${encounter.encounter_type}`);
      console.log(`   - Date: ${encounter.encounter_datetime}`);
      console.log(`   - Location ID: ${encounter.location_id}\n`);

      // Test 2: Get location name
      if (encounter.location_id) {
        const [locations] = await connection.query(`
          SELECT name
          FROM location
          WHERE location_id = ?
            AND retired = 0
        `, [encounter.location_id]);

        if (locations.length > 0) {
          console.log(`✅ Location: "${locations[0].name}"\n`);
        } else {
          console.log(`⚠️ Location not found for location_id: ${encounter.location_id}\n`);
        }
      }

      // Test 3: Get provider from encounter_provider
      const [providers] = await connection.query(`
        SELECT 
          p.provider_id,
          pn.given_name,
          pn.family_name,
          pn.middle_name,
          p.identifier,
          er.name as role_name
        FROM encounter_provider ep
        JOIN provider p ON ep.provider_id = p.provider_id AND p.retired = 0
        JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
        LEFT JOIN encounter_role er ON ep.encounter_role_id = er.encounter_role_id
        WHERE ep.encounter_id = ?
          AND ep.voided = 0
        ORDER BY 
          CASE WHEN er.name = 'Clinician' THEN 1 ELSE 2 END,
          ep.date_created DESC
      `, [obs.encounter_id]);

      if (providers.length === 0) {
        console.log('❌ No provider found in encounter_provider table!');
        console.log('   Checking if encounter_provider table has any data...\n');
        
        // Check if table exists and has data
        const [tableCheck] = await connection.query(`
          SELECT COUNT(*) as count
          FROM encounter_provider
          WHERE encounter_id = ?
        `, [obs.encounter_id]);
        
        console.log(`   Total rows in encounter_provider for this encounter: ${tableCheck[0].count}`);
        
        // Check all providers for this encounter (including voided)
        const [allProviders] = await connection.query(`
          SELECT 
            ep.encounter_provider_id,
            ep.voided,
            ep.provider_id,
            p.identifier
          FROM encounter_provider ep
          JOIN provider p ON ep.provider_id = p.provider_id
          WHERE ep.encounter_id = ?
        `, [obs.encounter_id]);
        
        if (allProviders.length > 0) {
          console.log(`   Found ${allProviders.length} provider(s) (including voided):`);
          allProviders.forEach((p) => {
            console.log(`     - Provider ID: ${p.provider_id}, Identifier: ${p.identifier}, Voided: ${p.voided}`);
          });
        }
      } else {
        console.log(`✅ Found ${providers.length} provider(s):\n`);
        providers.forEach((provider, index) => {
          const givenName = (provider.given_name || '').trim();
          const middleName = (provider.middle_name || '').trim();
          const familyName = (provider.family_name || '').trim();
          
          let fullName = '';
          if (givenName && familyName) {
            fullName = middleName ? `${givenName} ${middleName} ${familyName}` : `${givenName} ${familyName}`;
          } else if (givenName) {
            fullName = givenName;
          } else if (familyName) {
            fullName = familyName;
          } else {
            fullName = provider.identifier || 'Unknown';
          }
          
          console.log(`   Provider ${index + 1}:`);
          console.log(`     - Name: "${fullName}"`);
          console.log(`     - Provider ID: ${provider.provider_id}`);
          console.log(`     - Identifier: ${provider.identifier || 'N/A'}`);
          console.log(`     - Role: ${provider.role_name || 'N/A'}`);
          console.log(`     - Given: "${givenName}"`);
          console.log(`     - Middle: "${middleName}"`);
          console.log(`     - Family: "${familyName}"\n`);
        });
      }

      // Test 4: Fallback to creator
      console.log('🔍 Checking creator (user_id) as fallback...');
      const [creators] = await connection.query(`
        SELECT 
          u.user_id,
          u.username,
          pn.given_name,
          pn.family_name,
          pn.middle_name,
          p.identifier
        FROM users u
        LEFT JOIN person_name pn ON u.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
        LEFT JOIN provider p ON u.person_id = p.person_id AND p.retired = 0
        WHERE u.user_id = ?
      `, [obs.creator]);

      if (creators.length > 0) {
        const creator = creators[0];
        const givenName = (creator.given_name || '').trim();
        const middleName = (creator.middle_name || '').trim();
        const familyName = (creator.family_name || '').trim();
        
        let fullName = '';
        if (givenName && familyName) {
          fullName = middleName ? `${givenName} ${middleName} ${familyName}` : `${givenName} ${familyName}`;
        } else if (givenName) {
          fullName = givenName;
        } else if (familyName) {
          fullName = familyName;
        } else {
          fullName = creator.username || 'Unknown';
        }
        
        console.log(`✅ Creator found:`);
        console.log(`   - Username: ${creator.username}`);
        console.log(`   - Name: "${fullName}"`);
        console.log(`   - Provider Identifier: ${creator.identifier || 'N/A'}\n`);
      } else {
        console.log(`⚠️ Creator (user_id: ${obs.creator}) not found\n`);
      }

      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Run the test
testProviderFetch().catch(console.error);

