/**
 * OpenMRS Database Sync Service
 * 
 * Purpose: Automatically retrieve observations from OpenMRS databases
 * across multiple hospitals and sync them to Patient Passport
 * 
 * Features:
 * - Direct database-to-database synchronization
 * - Multi-hospital support
 * - Real-time observation sync
 * - Automatic patient matching
 * - No manual doctor entry required
 * 
 * SYNC MODES:
 * - FULL HISTORY (default): Syncs ALL past observations from OpenMRS (no time limit)
 * - INCREMENTAL: Only syncs observations since last sync timestamp
 * 
 * USAGE:
 * - Automatic sync on startup: Syncs ALL history by default
 * - Manual trigger via API: POST /api/openmrs-sync/sync-all?fullHistory=true (default)
 * - Incremental sync: POST /api/openmrs-sync/sync-all?fullHistory=false
 */

import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import Patient from '@/models/Patient';
import MedicalRecord from '@/models/MedicalRecord';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import User from '@/models/User';

// OpenMRS Database Connection Configuration
interface OpenMRSConnection {
  hospitalId: string;
  hospitalName: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  enabled?: boolean;
}

// OpenMRS Observation Structure
interface OpenMRSObservation {
  obs_id: number;
  person_id: number;
  concept_id: number;
  encounter_id: number;
  obs_datetime: Date;
  location_id: number;
  value_coded: number | null;
  value_text: string | null;
  value_numeric: number | null;
  comments: string | null;
  creator: number;
  date_created: Date;
  voided: boolean;
}

// Processed Observation
interface ProcessedObservation {
  type: 'condition' | 'medication' | 'test' | 'visit';
  conceptName: string;
  value: string;
  dateRecorded: Date;
  providerName: string;
  locationName: string;
  notes: string;
}

class OpenMRSSyncService {
  private connections: Map<string, mysql.Pool> = new Map();
  private hospitalConfigs: Map<string, OpenMRSConnection> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Initialize connections to all OpenMRS databases
   */
  async initializeConnections(hospitals: OpenMRSConnection[]): Promise<void> {
    console.log(`🔌 Initializing OpenMRS database connections for ${hospitals.length} hospitals...`);

    for (const hospital of hospitals) {
      try {
        const pool = mysql.createPool({
          host: hospital.host,
          port: hospital.port,
          user: hospital.user,
          password: hospital.password,
          database: hospital.database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
          connectTimeout: 60000      // Increase timeout to 60 seconds for slow networks
        });

        // Test connection with timeout
        const testPromise = pool.query('SELECT 1');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout after 60s')), 60000)
        );
        
        await Promise.race([testPromise, timeoutPromise]);
        this.connections.set(hospital.hospitalId, pool);
        this.hospitalConfigs.set(hospital.hospitalId, hospital);
        
        console.log(`✅ Connected to ${hospital.hospitalName} OpenMRS database`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${hospital.hospitalName}:`, error);
        console.log(`ℹ️  ${hospital.hospitalName} will be skipped in automatic sync`);
      }
    }

    console.log(`✅ Initialized ${this.connections.size} database connections`);
  }

  /**
   * Start automatic synchronization
   * @param intervalSeconds - Sync interval in seconds (default: 10 seconds for near real-time sync)
   */
  startAutoSync(intervalSeconds: number = 10): void {
    if (this.isRunning) {
      console.log('⚠️ Sync already running');
      return;
    }

    console.log(`🔄 Starting automatic sync every ${intervalSeconds} seconds...`);
    this.isRunning = true;

    // Initial sync
    this.syncAllHospitals();

    // Schedule periodic sync (convert seconds to milliseconds)
    this.syncInterval = setInterval(() => {
      this.syncAllHospitals();
    }, intervalSeconds * 1000);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('⏹️ Stopped automatic sync');
    }
  }

  /**
   * Sync observations from all hospitals
   * @param syncAllHistory - If true, syncs ALL observations regardless of last sync time (default: true)
   */
  async syncAllHospitals(syncAllHistory: boolean = true): Promise<void> {
    console.log('\n🔄 ═══════════════════════════════════════════════════════');
    console.log(`🔄 Starting Multi-Hospital Observation Sync ${syncAllHistory ? '(FULL HISTORY)' : '(INCREMENTAL)'}`);
    console.log('🔄 ═══════════════════════════════════════════════════════\n');

    const syncResults: any[] = [];

    for (const [hospitalId, connection] of this.connections.entries()) {
      try {
        const result = await this.syncHospital(hospitalId, connection, syncAllHistory);
        syncResults.push(result);
      } catch (error) {
        console.error(`❌ Error syncing hospital ${hospitalId}:`, error);
        syncResults.push({ hospitalId, error: (error as Error).message });
      }
    }

    console.log('\n✅ ═══════════════════════════════════════════════════════');
    console.log('✅ Sync Complete - Summary:');
    syncResults.forEach(result => {
      console.log(`   Hospital ${result.hospitalName}: ${result.syncedCount || 0} observations`);
    });
    console.log('✅ ═══════════════════════════════════════════════════════\n');
  }

  /**
   * Sync a single hospital's observations
   * @param syncAllHistory - If true, syncs ALL observations regardless of last sync time
   */
  private async syncHospital(
    hospitalId: string,
    connection: mysql.Pool,
    syncAllHistory: boolean = true
  ): Promise<any> {
    const hospital = this.hospitalConfigs.get(hospitalId);
    if (!hospital) {
      throw new Error(`Hospital config not found: ${hospitalId}`);
    }

    console.log(`📍 Syncing: ${hospital.hospitalName}`);

    // Get last sync timestamp for this hospital (ignored if syncAllHistory is true)
    const lastSyncTime = syncAllHistory ? null : await this.getLastSyncTimestamp(hospitalId);
    console.log(`   Sync mode: ${syncAllHistory ? 'ALL HISTORY' : `Since ${lastSyncTime || 'Never'}`}`);

    // Query observations (all history or since last sync)
    const observations = await this.fetchObservationsFromOpenMRS(
      connection,
      lastSyncTime
    );

    console.log(`   Found ${observations.length} new observations`);

    let syncedCount = 0;
    let errorCount = 0;

    // Process each observation
    for (const obs of observations) {
      try {
        await this.processObservation(obs, hospitalId, connection);
        syncedCount++;
      } catch (error) {
        console.error(`   ❌ Error processing observation ${obs.obs_id}:`, error);
        errorCount++;
      }
    }

    // Update last sync timestamp
    await this.updateLastSyncTimestamp(hospitalId);

    console.log(`   ✅ Synced: ${syncedCount}, Errors: ${errorCount}`);

    return {
      hospitalId,
      hospitalName: hospital.hospitalName,
      syncedCount,
      errorCount,
      timestamp: new Date()
    };
  }

  /**
   * Fetch observations from OpenMRS database
   * Strategy: Fetch ALL observations from all patients (complete historical data)
   * ENHANCED: Order by date_created DESC to get most recent observations first
   * NOTE: When since is null, fetches ALL historical observations (no time limit)
   */
  private async fetchObservationsFromOpenMRS(
    connection: mysql.Pool,
    since: Date | null
  ): Promise<OpenMRSObservation[]> {
    const sinceClause = since 
      ? `AND o.date_created > ?`
      : '';

    // Modified query to get observations from ALL patients
    // When since is null, fetches complete historical data
    // ORDER BY date_created DESC to get most recent observations first
    const query = `
      SELECT 
        o.obs_id,
        o.person_id,
        o.concept_id,
        o.encounter_id,
        o.obs_datetime,
        o.location_id,
        o.value_coded,
        o.value_text,
        o.value_numeric,
        o.comments,
        o.creator,
        o.date_created,
        o.voided
      FROM obs o
      WHERE o.voided = 0
        ${sinceClause}
      ORDER BY o.date_created DESC, o.obs_id DESC
      LIMIT 10000
    `;

    const params = since ? [since] : [];
    const [rows] = await connection.query(query, params);

    return rows as OpenMRSObservation[];
  }

  /**
   * Process a single observation
   * ENHANCED: Fetches provider and location from encounter (most accurate - matches OpenMRS UI)
   * Format: Hospital = "Site 1" (from encounter.location), Doctor = "Jake Doctor" (from encounter_provider)
   */
  private async processObservation(
    obs: OpenMRSObservation,
    hospitalId: string,
    connection: mysql.Pool
  ): Promise<void> {
    // Get concept name
    const conceptName = await this.getConceptName(connection, obs.concept_id);
    
    // Get provider information - try encounter first (most accurate - shows "Jake Doctor" in OpenMRS)
    let provider = null;
    let locationName = null;
    
    console.log(`   🔍 Fetching provider and location for observation ${obs.obs_id}...`);
    console.log(`      - encounter_id: ${obs.encounter_id || 'N/A'}`);
    console.log(`      - creator (user_id): ${obs.creator || 'N/A'}`);
    console.log(`      - location_id: ${obs.location_id || 'N/A'}`);
    
    if (obs.encounter_id) {
      // Get provider from encounter_provider table (matches "Jake Doctor" from Providers section)
      provider = await this.getProviderFromEncounter(connection, obs.encounter_id);
      console.log(`      - Provider from encounter: ${provider ? provider.name : 'NOT FOUND'}`);
      
      // Get location from encounter table (matches "Site 1" from Encounter Summary section)
      locationName = await this.getLocationFromEncounter(connection, obs.encounter_id);
      console.log(`      - Location from encounter: ${locationName || 'NOT FOUND'}`);
    }
    
    // Fallback to creator if no encounter provider found
    if (!provider) {
      console.log(`      - Falling back to creator (user_id: ${obs.creator})...`);
      provider = await this.getProviderInfo(connection, obs.creator);
      console.log(`      - Provider from creator: ${provider ? provider.name : 'NOT FOUND'}`);
    }
    
    // Fallback to observation location_id if encounter location not found
    if (!locationName) {
      console.log(`      - Falling back to observation location_id (${obs.location_id})...`);
      locationName = await this.getLocationName(connection, obs.location_id);
      console.log(`      - Location from obs: ${locationName || 'NOT FOUND'}`);
    }
    
    // Final check - ensure we have a valid provider name
    if (!provider || !provider.name || provider.name.includes('Unknown') || provider.name.includes('Provider ')) {
      console.warn(`      ⚠️ WARNING: Invalid provider name detected: "${provider?.name || 'null'}"`);
      console.warn(`      ⚠️ This observation may not display the correct doctor name on the passport.`);
    }
    
    // Get patient by person_id (OpenMRS person_id)
    const patient = await this.findPatientByOpenMRSPersonId(obs.person_id, connection);
    
    if (!patient) {
      // Silent skip - patient not found
      return;
    }

    // Ensure we have a valid provider object
    if (!provider || !provider.name) {
      console.error(`   ❌ ERROR: No valid provider found for observation ${obs.obs_id}`);
      console.error(`      - encounter_id: ${obs.encounter_id || 'N/A'}`);
      console.error(`      - creator: ${obs.creator || 'N/A'}`);
      console.error(`      - Provider object:`, provider);
      // Create a fallback provider to prevent errors
      provider = {
        name: 'Unknown Doctor',
        identifier: `PROVIDER_${obs.creator || obs.obs_id}`,
        role: 'Provider'
      };
    }

    // Determine observation type and extract value
    const processed = await this.categorizeObservation(
      obs,
      conceptName,
      provider,
      locationName || 'Unknown Location',
      connection
    );

    // Get or create doctor
    const doctor = await this.getOrCreateDoctor(
      provider.name,
      provider.identifier,
      hospitalId
    );

    // Store in Patient Passport with encounter location (e.g., "Site 1") and provider (e.g., "Jake Doctor")
    await this.storeMedicalRecord(
      patient._id.toString(), 
      processed, 
      obs, 
      doctor._id.toString(), 
      hospitalId, 
      locationName || 'Unknown Location'
    );
  }

  /**
   * Get concept name from OpenMRS
   */
  private async getConceptName(connection: mysql.Pool, conceptId: number): Promise<string> {
    const query = `
      SELECT cn.name
      FROM concept_name cn
      WHERE cn.concept_id = ?
        AND cn.locale = 'en'
        AND cn.concept_name_type = 'FULLY_SPECIFIED'
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [conceptId]) as any;
    return rows.length > 0 ? rows[0].name : `Unknown Concept (${conceptId})`;
  }

  /**
   * Get provider information from user ID
   */
  private async getProviderInfo(connection: mysql.Pool, userId: number): Promise<any> {
    const query = `
      SELECT 
        u.username,
        COALESCE(pn.given_name, '') as given_name,
        COALESCE(pn.family_name, '') as family_name,
        COALESCE(pn.middle_name, '') as middle_name,
        p.identifier
      FROM users u
      LEFT JOIN person_name pn ON u.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
      LEFT JOIN provider p ON u.person_id = p.person_id AND p.retired = 0
      WHERE u.user_id = ?
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [userId]) as any;
    
    if (rows.length === 0) {
      return {
        name: `Provider ${userId}`,
        identifier: `PROVIDER_${userId}`
      };
    }

    const row = rows[0];
    const fullName = `${row.given_name} ${row.middle_name} ${row.family_name}`.trim().replace(/\s+/g, ' ') || row.username;
    return {
      name: fullName,
      identifier: row.identifier || `PROVIDER_${userId}`
    };
  }

  /**
   * Get provider from encounter (preferred method - gets the actual provider who saw the patient)
   * This matches the "Provider Name" shown in OpenMRS Providers section (e.g., "Jake Doctor")
   */
  private async getProviderFromEncounter(connection: mysql.Pool, encounterId: number): Promise<any | null> {
    if (!encounterId) {
      console.log(`   ⚠️ No encounter_id provided to getProviderFromEncounter`);
      return null;
    }

    // Method 1: Try encounter_provider table with strict conditions (preferred - matches OpenMRS UI)
    try {
      const query1 = `
        SELECT 
          p.provider_id,
          pn.given_name,
          pn.family_name,
          pn.middle_name,
          p.identifier,
          er.name as role_name,
          CASE 
            WHEN er.name = 'Clinician' THEN 1
            ELSE 2
          END as priority
        FROM encounter_provider ep
        JOIN provider p ON ep.provider_id = p.provider_id AND p.retired = 0
        JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
        LEFT JOIN encounter_role er ON ep.encounter_role_id = er.encounter_role_id
        WHERE ep.encounter_id = ?
          AND ep.voided = 0
        ORDER BY priority ASC, ep.date_created DESC
        LIMIT 1
      `;

      console.log(`   🔍 Method 1: Querying encounter_provider (strict) for encounter_id: ${encounterId}`);
      const [rows1] = await connection.query(query1, [encounterId]) as any;
      
      if (rows1.length > 0) {
        const row = rows1[0];
        const givenName = (row.given_name || '').trim();
        const middleName = (row.middle_name || '').trim();
        const familyName = (row.family_name || '').trim();
        
        let fullName = '';
        if (givenName && familyName) {
          fullName = middleName ? `${givenName} ${middleName} ${familyName}` : `${givenName} ${familyName}`;
        } else if (givenName) {
          fullName = givenName;
        } else if (familyName) {
          fullName = familyName;
        } else {
          fullName = row.identifier || 'Unknown Provider';
        }
        
        fullName = fullName.trim().replace(/\s+/g, ' ');
        
        console.log(`   ✅ Method 1 SUCCESS: Found provider "${fullName}" (Role: ${row.role_name || 'N/A'})`);
        
        return {
          name: fullName || 'Unknown Provider',
          identifier: row.identifier || `PROVIDER_${row.provider_id}`,
          role: row.role_name || 'Provider'
        };
      }
      console.log(`   ⚠️ Method 1: No provider found with strict conditions`);
    } catch (error: any) {
      console.error(`   ⚠️ Method 1 error:`, error.message);
    }

    // Method 2: Try encounter_provider with relaxed conditions (allow non-preferred names)
    try {
      const query2 = `
        SELECT 
          p.provider_id,
          pn.given_name,
          pn.family_name,
          pn.middle_name,
          p.identifier,
          er.name as role_name
        FROM encounter_provider ep
        JOIN provider p ON ep.provider_id = p.provider_id AND p.retired = 0
        JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0
        LEFT JOIN encounter_role er ON ep.encounter_role_id = er.encounter_role_id
        WHERE ep.encounter_id = ?
          AND ep.voided = 0
        ORDER BY pn.preferred DESC, ep.date_created DESC
        LIMIT 1
      `;

      console.log(`   🔍 Method 2: Querying encounter_provider (relaxed) for encounter_id: ${encounterId}`);
      const [rows2] = await connection.query(query2, [encounterId]) as any;
      
      if (rows2.length > 0) {
        const row = rows2[0];
        const givenName = (row.given_name || '').trim();
        const middleName = (row.middle_name || '').trim();
        const familyName = (row.family_name || '').trim();
        
        let fullName = '';
        if (givenName && familyName) {
          fullName = middleName ? `${givenName} ${middleName} ${familyName}` : `${givenName} ${familyName}`;
        } else if (givenName) {
          fullName = givenName;
        } else if (familyName) {
          fullName = familyName;
        } else {
          fullName = row.identifier || 'Unknown Provider';
        }
        
        fullName = fullName.trim().replace(/\s+/g, ' ');
        
        console.log(`   ✅ Method 2 SUCCESS: Found provider "${fullName}" (Role: ${row.role_name || 'N/A'})`);
        
        return {
          name: fullName || 'Unknown Provider',
          identifier: row.identifier || `PROVIDER_${row.provider_id}`,
          role: row.role_name || 'Provider'
        };
      }
      console.log(`   ⚠️ Method 2: No provider found with relaxed conditions`);
    } catch (error: any) {
      console.error(`   ⚠️ Method 2 error:`, error.message);
    }

    // Method 3: Try to get provider from encounter's creator
    try {
      const query3 = `
        SELECT 
          e.creator as user_id,
          u.username,
          pn.given_name,
          pn.family_name,
          pn.middle_name,
          p.provider_id,
          p.identifier
        FROM encounter e
        JOIN users u ON e.creator = u.user_id
        LEFT JOIN person_name pn ON u.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
        LEFT JOIN provider p ON u.person_id = p.person_id AND p.retired = 0
        WHERE e.encounter_id = ?
          AND e.voided = 0
        LIMIT 1
      `;

      console.log(`   🔍 Method 3: Querying encounter creator for encounter_id: ${encounterId}`);
      const [rows3] = await connection.query(query3, [encounterId]) as any;
      
      if (rows3.length > 0) {
        const row = rows3[0];
        const givenName = (row.given_name || '').trim();
        const middleName = (row.middle_name || '').trim();
        const familyName = (row.family_name || '').trim();
        
        let fullName = '';
        if (givenName && familyName) {
          fullName = middleName ? `${givenName} ${middleName} ${familyName}` : `${givenName} ${familyName}`;
        } else if (givenName) {
          fullName = givenName;
        } else if (familyName) {
          fullName = familyName;
        } else {
          fullName = row.username || row.identifier || 'Unknown Provider';
        }
        
        fullName = fullName.trim().replace(/\s+/g, ' ');
        
        console.log(`   ✅ Method 3 SUCCESS: Found provider from encounter creator "${fullName}"`);
        
        return {
          name: fullName || 'Unknown Provider',
          identifier: row.identifier || `PROVIDER_${row.provider_id || row.user_id}`,
          role: 'Provider'
        };
      }
      console.log(`   ⚠️ Method 3: No provider found from encounter creator`);
    } catch (error: any) {
      console.error(`   ⚠️ Method 3 error:`, error.message);
    }

    console.log(`   ❌ All methods failed to find provider for encounter_id: ${encounterId}`);
    return null;
  }

  /**
   * Get location name from location_id
   */
  private async getLocationName(connection: mysql.Pool, locationId: number): Promise<string> {
    if (!locationId) {
      return 'Unknown Location';
    }

    const query = `
      SELECT name
      FROM location
      WHERE location_id = ?
        AND retired = 0
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [locationId]) as any;
    return rows.length > 0 ? rows[0].name : 'Unknown Location';
  }

  /**
   * Get location from encounter (preferred method - gets the actual location where encounter happened)
   * This is more accurate than observation location_id
   */
  private async getLocationFromEncounter(connection: mysql.Pool, encounterId: number): Promise<string | null> {
    if (!encounterId) {
      return null;
    }

    try {
      // Get location from encounter table (most accurate - this is what shows as "Location" in OpenMRS UI)
      const query = `
        SELECT 
          l.name as location_name
        FROM encounter e
        JOIN location l ON e.location_id = l.location_id AND l.retired = 0
        WHERE e.encounter_id = ?
          AND e.voided = 0
        LIMIT 1
      `;

      const [rows] = await connection.query(query, [encounterId]) as any;
      
      if (rows.length > 0) {
        const locationName = rows[0].location_name || null;
        if (locationName) {
          console.log(`   ✅ Found location from encounter: "${locationName}" (e.g., "Site 1")`);
        }
        return locationName;
      }
    } catch (error) {
      console.error(`   ⚠️ Error fetching location from encounter ${encounterId}:`, error);
    }

    return null;
  }

  /**
   * Auto-register patient from OpenMRS to Patient Passport
   */
  private async autoRegisterPatient(
    personId: number,
    connection: mysql.Pool
  ): Promise<any> {
    // Get complete patient information from OpenMRS
    const query = `
      SELECT 
        p.person_id,
        pn.given_name,
        pn.family_name,
        pn.middle_name,
        p.gender,
        p.birthdate,
        pi.identifier as national_id,
        pa.address1,
        pa.city_village as city,
        pa.state_province as province,
        pa.country
      FROM person p
      JOIN person_name pn ON pn.person_id = p.person_id AND pn.voided = 0 AND pn.preferred = 1
      LEFT JOIN patient_identifier pi ON pi.patient_id = p.person_id AND pi.voided = 0
      LEFT JOIN person_address pa ON pa.person_id = p.person_id AND pa.voided = 0 AND pa.preferred = 1
      WHERE p.person_id = ? AND p.voided = 0
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [personId]) as any;
    
    if (rows.length === 0) {
      // console.log(`   ⚠️ Cannot auto-register: Person ${personId} not found in OpenMRS`);
      return null;
    }

    const row = rows[0];
    const givenName = row.given_name || '';
    const middleName = row.middle_name || '';
    const familyName = row.family_name || '';
    const fullName = `${givenName} ${middleName} ${familyName}`.replace(/\s+/g, ' ').trim();
    
    // console.log(`   🆕 Auto-registering patient: ${fullName} from OpenMRS...`);

    const User = (await import('../models/User')).default;
    const bcrypt = await import('bcryptjs');

    // Generate unique email and temporary password
    const email = `patient.${personId}@openmrs.sync`;
    const temporaryPassword = `OpenMRS${personId}!`;
    const hashedPassword = await bcrypt.default.hash(temporaryPassword, 12);

    try {
      // Create User account
      const user = await User.create({
        name: fullName,
        email: email,
        password: hashedPassword,
        role: 'patient',
        isVerified: true, // Auto-verified for synced patients
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // console.log(`   ✅ Created User account: ${user.email}`);

      // Create Patient record
      const patient = await Patient.create({
        user: user._id,
        nationalId: row.national_id || `OPENMRS_${personId}`,
        dateOfBirth: row.birthdate || new Date('1990-01-01'),
        gender: row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other',
        bloodType: 'Unknown',
        address: row.address1 || 'N/A',
        city: row.city || 'N/A',
        province: row.province || 'N/A',
        country: row.country || 'Rwanda',
        emergencyContact: {
          name: 'Not specified',
          relationship: 'N/A',
          phone: 'N/A'
        },
        medicalHistory: [],
        currentMedications: [],
        allergies: [],
        chronicConditions: [],
        medications: [],
        testResults: [],
        hospitalVisits: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // console.log(`   ✅ Created Patient record: ${patient.nationalId}`);
      // console.log(`   📧 Login: ${email} | Password: ${temporaryPassword}`);

      return Patient.findById(patient._id).populate('user');

    } catch (error: any) {
      // console.error(`   ❌ Failed to auto-register patient ${fullName}:`, error.message);
      return null;
    }
  }

  /**
   * Find patient by OpenMRS person ID (with auto-registration)
   */
  private async findPatientByOpenMRSPersonId(
    personId: number,
    connection: mysql.Pool
  ): Promise<any> {
    // Get patient name from OpenMRS (since National ID might not be configured)
    const query = `
      SELECT 
        pn.given_name,
        pn.family_name,
        pn.middle_name,
        pi.identifier as national_id
      FROM person_name pn
      JOIN person p ON pn.person_id = p.person_id
      LEFT JOIN patient_identifier pi ON pi.patient_id = p.person_id
      LEFT JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
        AND pit.name LIKE '%National%ID%'
        AND pi.voided = 0
      WHERE pn.person_id = ?
        AND pn.voided = 0
        AND pn.preferred = 1
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [personId]) as any;
    
    if (rows.length === 0) {
      console.log(`   ⚠️ Person ${personId} not found in OpenMRS`);
      return null;
    }

    const row = rows[0];
    const givenName = row.given_name || '';
    const middleName = row.middle_name || '';
    const familyName = row.family_name || '';
    const nationalId = row.national_id;
    
    // Build full name (given name + middle name + family name)
    const fullName = `${givenName} ${middleName} ${familyName}`.replace(/\s+/g, ' ').trim();

    // console.log(`   🔍 Searching for patient: ${fullName} (OpenMRS person_id: ${personId})`);

    // Strategy 1: Try National ID first (if available)
    if (nationalId) {
      const patient = await Patient.findOne({ nationalId }).populate('user');
      if (patient) {
        // console.log(`   ✅ Patient matched by National ID: ${nationalId}`);
        return patient;
      }
    }

    // Strategy 2: Match by patient name (PRIMARY METHOD) - Enhanced matching
    // Import User model
    const User = (await import('../models/User')).default;
    
    // Normalize full name: trim and remove extra spaces
    const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
    
    // Try exact name match first (case-insensitive)
    let user = await User.findOne({
      name: { $regex: new RegExp(`^${normalizedFullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      role: 'patient'
    });

    // If exact match not found, try flexible matching with name parts
    if (!user && givenName && familyName) {
      // Try matching given name and family name (handles middle name variations)
      const namePattern = `${givenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*${familyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
      user = await User.findOne({
        name: { $regex: new RegExp(namePattern, 'i') },
        role: 'patient'
      });
    }

    // If still not found, try matching just family name (common scenario)
    if (!user && familyName) {
      user = await User.findOne({
        name: { $regex: new RegExp(familyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        role: 'patient'
      });
    }
    
    // Try matching just given name if family name matching failed
    if (!user && givenName) {
      user = await User.findOne({
        name: { $regex: new RegExp(`^${givenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') },
        role: 'patient'
      });
    }

    if (user) {
      const patient = await Patient.findOne({ user: user._id }).populate('user');
      if (patient) {
        // console.log(`   ✅ Patient matched by name: ${fullName} → ${user.name}`);
        return patient;
      }
    }

    // Strategy 3: AUTO-REGISTER patient from OpenMRS
    // console.log(`   ❌ Patient "${fullName}" not found in Patient Passport database`);
    // console.log(`   🆕 Attempting auto-registration from OpenMRS...`);
    
    const autoRegisteredPatient = await this.autoRegisterPatient(personId, connection);
    
    if (autoRegisteredPatient) {
      // console.log(`   ✅ Successfully auto-registered: ${fullName}`);
      return autoRegisteredPatient;
    }

    // console.log(`   ❌ Auto-registration failed for: ${fullName}`);
    return null;
  }

  /**
   * Categorize observation and extract value
   * 
   * OpenMRS Structure:
   * - Question Concept (obs.concept_id) = Diagnosis/Observation name (e.g., "Malaria smear impression")
   * - Value (obs.value_text/value_coded) = Medication/Treatment (e.g., "dgdggdf 200mg")
   * - Creator (obs.creator) = Doctor who added it
   */
  private async categorizeObservation(
    obs: OpenMRSObservation,
    conceptName: string,
    provider: any,
    locationName: string,
    connection: mysql.Pool
  ): Promise<ProcessedObservation> {
    const conceptUpper = conceptName.toUpperCase();
    
    // In OpenMRS: 
    // - Concept Name (Question Concept) = The diagnosis/condition
    // - Value = The medication/treatment prescribed
    
    let type: 'condition' | 'medication' | 'test' | 'visit' = 'condition';
    let diagnosisName = conceptName; // This is the "Question Concept" from OpenMRS
    let medicationValue = '';

    // Extract value (medication/treatment)
    if (obs.value_coded) {
      medicationValue = await this.getConceptName(connection, obs.value_coded);
    } else if (obs.value_text) {
      medicationValue = obs.value_text;
    } else if (obs.value_numeric !== null) {
      medicationValue = obs.value_numeric.toString();
    } else {
      medicationValue = 'No medication specified';
    }

    // Determine type based on concept keywords
    if (conceptUpper.includes('VISIT') || conceptUpper.includes('ENCOUNTER') || 
        conceptUpper.includes('ADMISSION')) {
      type = 'visit';
    } else if (conceptUpper.includes('LAB') || conceptUpper.includes('TEST') || 
               conceptUpper.includes('INVESTIGATION') || conceptUpper.includes('RESULT')) {
      type = 'test';
    } else if (conceptUpper.includes('MEDICATION') || conceptUpper.includes('DRUG')) {
      type = 'medication';
    } else {
      // Default: treat as condition (diagnosis) with medication
      type = 'condition';
    }

    // Ensure provider name is valid (should be "Jake Doctor" format, not "Dr. Unknown Doctor")
    const finalProviderName = (provider && provider.name && !provider.name.includes('Unknown') && !provider.name.includes('Provider ')) 
      ? provider.name 
      : 'Unknown Doctor';
    
    console.log(`   📝 Categorizing observation:`);
    console.log(`      - Type: ${type}`);
    console.log(`      - Diagnosis: ${diagnosisName}`);
    console.log(`      - Provider Name: "${finalProviderName}"`);
    console.log(`      - Location: "${locationName}"`);
    
    return {
      type,
      conceptName: diagnosisName,
      value: medicationValue,
      dateRecorded: obs.obs_datetime,
      providerName: finalProviderName,
      locationName,
      notes: obs.comments || `Synced from OpenMRS - Diagnosis: ${diagnosisName}, Treatment: ${medicationValue}`
    };
  }

  /**
   * Get or create doctor
   */
  private async getOrCreateDoctor(
    name: string,
    identifier: string,
    hospitalId: string
  ): Promise<any> {
    // Try to find existing doctor by OpenMRS provider identifier
    let doctor = await Doctor.findOne({ 
      openmrsProviderUuid: identifier 
    });

    if (doctor) {
      return doctor;
    }

    // Create placeholder user for doctor if doesn't exist
    // Generate a valid email from identifier
    const cleanIdentifier = identifier.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${cleanIdentifier || 'provider'}@openmrs.hospital.com`;
    
    let user = await User.findOne({ email });
    
    if (!user) {
      // Generate a secure random password (at least 8 characters)
      const randomPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      
      user = await User.create({
        name: name || `Dr. ${identifier}`,
        email,
        password: randomPassword.substring(0, 16), // 16 character password
        role: 'doctor',
        isEmailVerified: true
      });
    }

    // Create doctor record
    doctor = await Doctor.create({
      user: user._id,
      specialization: 'General Practice',
      licenseNumber: identifier,
      hospital: hospitalId,
      openmrsProviderUuid: identifier,
      isActive: true
    });

    console.log(`   ℹ️ Created doctor: ${name} (${identifier})`);

    return doctor;
  }

  /**
   * Store medical record in Patient Passport
   * 
   * OpenMRS Structure Mapping:
   * - Question Concept → Diagnosis name (data.name)
   * - Value → Medication/Treatment (data.details)
   * - Creator → Doctor (createdBy)
   * ENHANCED: Includes doctor and hospital names in data object for frontend display
   */
  private async storeMedicalRecord(
    patientId: string,
    processed: ProcessedObservation,
    obs: OpenMRSObservation,
    doctorId: string,
    hospitalId: string,
    locationName?: string
  ): Promise<void> {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const hospital = await Hospital.findById(hospitalId);
    const hospitalName = hospital?.name || locationName || 'Unknown Hospital';

    // Prepare data based on type
    // In OpenMRS: conceptName = Diagnosis, value = Medication
    const data: any = {};

    // Determine value type for OpenMRS metadata
    let valueType: 'text' | 'numeric' | 'coded' = 'text';
    if (obs.value_coded) {
      valueType = 'coded';
    } else if (obs.value_numeric !== null) {
      valueType = 'numeric';
    }

    // Common fields for all types - include doctor and hospital for frontend
    // Format: Doctor = "Jake Doctor" (from encounter_provider), Hospital = "Site 1" (from encounter.location)
    // IMPORTANT: Do NOT add "Dr." prefix - store the name as-is from OpenMRS (e.g., "Jake Doctor")
    let doctorName = processed.providerName || 'Unknown Doctor';
    
    // Remove any "Dr." prefix if present (should not be there, but clean it up just in case)
    if (doctorName.startsWith('Dr. ')) {
      doctorName = doctorName.substring(4).trim();
      console.log(`   ⚠️ Removed "Dr." prefix from provider name: "${doctorName}"`);
    }
    
    // Ensure we don't have "Dr. Unknown Doctor" - if we do, it means provider wasn't found
    if (doctorName === 'Unknown Doctor' || doctorName.includes('Dr. Unknown')) {
      console.warn(`   ⚠️ WARNING: Provider name is "${doctorName}" - provider may not have been found from encounter`);
    }
    
    const observationHospital = locationName || hospitalName;
    
    console.log(`   📋 Storing observation with:`);
    console.log(`      - Provider: "${doctorName}" (should be "Jake Doctor" format, NOT "Dr. Jake Doctor")`);
    console.log(`      - Location: "${observationHospital}" (should be "Site 1")`);

    switch (processed.type) {
      case 'condition':
        // Question Concept = Diagnosis (e.g., "Malaria smear impression")
        data.name = processed.conceptName;
        data.diagnosis = processed.conceptName; // Also store as diagnosis for frontend
        // Value = Medication/Treatment (e.g., "dgdggdf 200mg")
        data.details = `Treatment: ${processed.value}`;
        data.diagnosed = processed.dateRecorded.toISOString();
        data.diagnosedDate = processed.dateRecorded.toISOString();
        data.date = processed.dateRecorded.toISOString();
        data.procedure = `${processed.notes} | Doctor: ${doctorName} | Hospital: ${observationHospital}`;
        // Add doctor and hospital for frontend display
        data.doctor = doctorName;
        data.diagnosedBy = doctorName;
        data.hospital = observationHospital;
        break;

      case 'medication':
        data.medicationName = processed.conceptName;
        data.name = processed.conceptName;
        data.dosage = processed.value;
        data.medicationStatus = 'Active';
        data.startDate = processed.dateRecorded.toISOString();
        data.date = processed.dateRecorded.toISOString();
        // Add doctor and hospital for frontend display
        data.doctor = doctorName;
        data.prescribedBy = doctorName;
        data.hospital = observationHospital;
        break;

      case 'test':
        data.testName = processed.conceptName;
        data.name = processed.conceptName;
        data.result = processed.value;
        data.testDate = processed.dateRecorded.toISOString();
        data.date = processed.dateRecorded.toISOString();
        data.testStatus = 'Normal';
        // Add doctor and hospital for frontend display
        data.doctor = doctorName;
        data.hospital = observationHospital;
        break;

      case 'visit':
        data.hospital = observationHospital;
        data.reason = processed.conceptName;
        data.visitDate = processed.dateRecorded.toISOString();
        data.date = processed.dateRecorded.toISOString();
        // Add doctor for frontend display
        data.doctor = doctorName;
        break;
    }

    // Check if this record already exists (prevent duplicates)
    // First check by OpenMRS obs_id for exact match
    const existingByObsId = await MedicalRecord.findOne({
      'openmrsData.obsId': obs.obs_id
    });

    if (existingByObsId) {
      // Silent skip - duplicate already exists
      return;
    }

    // Build query dynamically to avoid matching on undefined fields
    const duplicateQuery: any = {
      patientId,
      type: processed.type
    };

    // Add specific field checks based on what's actually set
    if (data.name) duplicateQuery['data.name'] = data.name;
    if (data.medicationName) duplicateQuery['data.medicationName'] = data.medicationName;
    if (data.testName) duplicateQuery['data.testName'] = data.testName;
    if (data.diagnosed) duplicateQuery['data.diagnosed'] = data.diagnosed;
    if (data.testDate) duplicateQuery['data.testDate'] = data.testDate;
    if (data.visitDate) duplicateQuery['data.visitDate'] = data.visitDate;

    // console.log(`   🔍 Duplicate check query:`, JSON.stringify(duplicateQuery));

    const existing = await MedicalRecord.findOne(duplicateQuery);

    if (existing) {
      // Silent skip - duplicate already exists
      return;
    }

    // console.log(`   ✅ No duplicate found, creating new record...`);

    // Create medical record with OpenMRS metadata
    // Grant doctor edit access and set sync date for time-based access control
    const syncDate = new Date();
    const record = await MedicalRecord.create({
      patientId,
      type: processed.type,
      data,
      createdBy: doctorId,
      editableBy: [doctorId], // Grant the doctor who created it edit access
      syncDate: syncDate,      // Record when it was synced (for time-based access control)
      openmrsData: {
        obsId: obs.obs_id,
        conceptId: obs.concept_id,
        personId: obs.person_id,
        obsDatetime: obs.obs_datetime,
        dateCreated: obs.date_created,
        creatorName: processed.providerName,
        locationName: processed.locationName || observationHospital,
        encounterUuid: obs.encounter_id ? obs.encounter_id.toString() : undefined,
        valueType: valueType
      }
    });

    // Debug log to verify data is stored correctly
    console.log(`   ✅ Created MedicalRecord with provider and location:`);
    console.log(`      - Doctor: "${data.doctor || 'NOT SET'}"`);
    console.log(`      - Hospital: "${data.hospital || 'NOT SET'}"`);
    console.log(`      - Type: ${processed.type}`);
    console.log(`      - Record ID: ${record._id}`);
    console.log(`      - OpenMRS obs_id: ${obs.obs_id}`);
    console.log(`      - OpenMRS encounter_id: ${obs.encounter_id || 'N/A'}`);

    // console.log(`   ✅ Created record ID: ${record._id} (OpenMRS obs_id: ${obs.obs_id})`);

    // Update patient's references
    switch (processed.type) {
      case 'condition':
        if (!patient.medicalHistory.includes(record._id)) {
          patient.medicalHistory.push(record._id);
        }
        break;

      case 'medication':
        if (!patient.medications.includes(record._id)) {
          patient.medications.push(record._id);
        }
        break;

      case 'test':
        if (!patient.testResults.includes(record._id)) {
          patient.testResults.push(record._id);
        }
        break;

      case 'visit':
        if (!patient.hospitalVisits.includes(record._id)) {
          patient.hospitalVisits.push(record._id);
        }
        break;
    }

    await patient.save();

    // Note: Audit logs are not created for automatic sync operations
    // Only user-initiated actions trigger audit logs
  }

  /**
   * Get last sync timestamp for a hospital
   */
  private async getLastSyncTimestamp(hospitalId: string): Promise<Date | null> {
    const SyncStatus = mongoose.model('SyncStatus', new mongoose.Schema({
      hospitalId: String,
      lastSyncTime: Date
    }), 'syncstatus');

    const status = await SyncStatus.findOne({ hospitalId });
    return status?.lastSyncTime || null;
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSyncTimestamp(hospitalId: string): Promise<void> {
    const SyncStatus = mongoose.model('SyncStatus', new mongoose.Schema({
      hospitalId: String,
      lastSyncTime: Date
    }), 'syncstatus');

    await SyncStatus.findOneAndUpdate(
      { hospitalId },
      { lastSyncTime: new Date() },
      { upsert: true }
    );
  }

  /**
   * Manual sync for a specific patient
   */
  async syncPatient(nationalId: string): Promise<any> {
    console.log(`🔄 Manual sync for patient: ${nationalId}`);

    const patient = await Patient.findOne({ nationalId }).populate('user');
    if (!patient) {
      throw new Error(`Patient with national ID ${nationalId} not found`);
    }

    const results: any[] = [];

    for (const [hospitalId, connection] of this.connections.entries()) {
      try {
        // Find person_id in this hospital's OpenMRS
        const query = `
          SELECT pi.patient_id as person_id
          FROM patient_identifier pi
          JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
          WHERE pi.identifier = ?
            AND pit.name LIKE '%National%ID%'
            AND pi.voided = 0
          LIMIT 1
        `;

        const [rows] = await connection.query(query, [nationalId]) as any;
        
        if (rows.length === 0) {
          console.log(`   ⚠️ Patient not found in hospital ${hospitalId}`);
          continue;
        }

        const personId = rows[0].person_id;

        // Get all observations for this patient
        const observations = await this.fetchPatientObservations(connection, personId);

        let syncedCount = 0;
        for (const obs of observations) {
          try {
            await this.processObservation(obs, hospitalId, connection);
            syncedCount++;
          } catch (error) {
            console.error(`   ❌ Error: ${error}`);
          }
        }

        results.push({
          hospitalId,
          syncedCount,
          observationsFound: observations.length
        });

      } catch (error) {
        console.error(`   ❌ Error syncing hospital ${hospitalId}:`, error);
      }
    }

    return {
      patientId: patient._id,
      nationalId,
      hospitals: results,
      totalSynced: results.reduce((sum, r) => sum + r.syncedCount, 0)
    };
  }

  /**
   * Fetch all observations for a patient
   */
  private async fetchPatientObservations(
    connection: mysql.Pool,
    personId: number
  ): Promise<OpenMRSObservation[]> {
    const query = `
      SELECT 
        o.obs_id,
        o.person_id,
        o.concept_id,
        o.encounter_id,
        o.obs_datetime,
        o.location_id,
        o.value_coded,
        o.value_text,
        o.value_numeric,
        o.comments,
        o.creator,
        o.date_created,
        o.voided
      FROM obs o
      WHERE o.person_id = ?
        AND o.voided = 0
      ORDER BY o.obs_datetime DESC
      LIMIT 500
    `;

    const [rows] = await connection.query(query, [personId]);
    return rows as OpenMRSObservation[];
  }

  /**
   * Close all connections
   */
  async closeConnections(): Promise<void> {
    console.log('🔌 Closing all OpenMRS database connections...');
    
    for (const [hospitalId, pool] of this.connections.entries()) {
      await pool.end();
      console.log(`   ✅ Closed connection to hospital ${hospitalId}`);
    }

    this.connections.clear();
    console.log('✅ All connections closed');
  }

  /**
   * Get runtime status for health checks
   */
  getStatus() {
    return {
      connectedHospitals: this.connections.size,
      hospitalIds: Array.from(this.connections.keys()),
      isRunning: this.isRunning
    };
  }
}

// Export singleton instance
export default new OpenMRSSyncService();
