import mysql from 'mysql2/promise';
import { storeOpenMRSObservation } from './openmrsIntegrationService';

// DBObservation interface removed - using inline type from query results

class DirectDBSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncId: number = 0;
  private isRunning = false;
  private connection: mysql.Connection | null = null;

  private readonly DB_CONFIG = {
    host: process.env.OPENMRS_DB_HOST || 'localhost',
    port: parseInt(process.env.OPENMRS_DB_PORT || '3306'),
    user: process.env.OPENMRS_DB_USER || 'openmrs_user',
    password: process.env.OPENMRS_DB_PASSWORD || 'OpenMRSPass123!',
    database: process.env.OPENMRS_DB_NAME || 'openmrs'
  };

  // Sync interval: configurable via env var (in seconds), default 10 seconds for near real-time sync
  private readonly SYNC_INTERVAL_MS = (parseInt(process.env.OPENMRS_SYNC_INTERVAL_SECONDS || '10')) * 1000;

  /**
   * Start the scheduled sync service
   */
  async start() {
    if (this.isRunning) {
      console.log('⏰ Direct DB sync service is already running');
      return;
    }

    try {
      // Test database connection
      await this.connect();
      
      console.log('🚀 Starting direct database OpenMRS observation sync service');
      console.log(`   Sync interval: ${this.SYNC_INTERVAL_MS / 1000} seconds`);
      console.log(`   Database: ${this.DB_CONFIG.host}:${this.DB_CONFIG.port}/${this.DB_CONFIG.database}`);

      // Get the latest observation ID as starting point
      await this.initializeLastSyncId();

      // Run immediately on startup
      await this.syncObservations();

      // Then run on schedule
      this.syncInterval = setInterval(() => {
        this.syncObservations();
      }, this.SYNC_INTERVAL_MS);

      this.isRunning = true;
    } catch (error: any) {
      if (error.message.includes('localhost not accessible')) {
        console.log('ℹ️  Direct DB sync disabled in production');
        console.log('   OpenMRS database access requires network configuration');
        console.log('   Using REST API sync as fallback ✓');
      } else {
        console.error('❌ Failed to start direct DB sync service:', error.message);
        console.log('   Falling back to REST API sync only');
      }
    }
  }

  /**
   * Connect to OpenMRS database
   */
  private async connect() {
    // Skip if running in Docker/production and host is localhost
    if (this.DB_CONFIG.host === 'localhost' && process.env.NODE_ENV === 'production') {
      throw new Error('Direct database access not available in production (localhost not accessible from Docker)');
    }
    
    if (!this.connection) {
      this.connection = await mysql.createConnection(this.DB_CONFIG);
    }
    return this.connection;
  }

  /**
   * Initialize the last synced observation ID
   */
  private async initializeLastSyncId() {
    try {
      const conn = await this.connect();
      // Start from 24 hours ago instead of current max
      const [rows] = await conn.query<any[]>(`
        SELECT COALESCE(MIN(obs_id), 0) as start_id 
        FROM obs 
        WHERE voided = 0 
          AND obs_datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      
      this.lastSyncId = rows[0]?.start_id - 1 || 0; // Start from one before the oldest in last 24h
      console.log(`   Starting from observation ID: ${this.lastSyncId} (syncing last 24 hours)`);
    } catch (error: any) {
      console.error('Error initializing sync ID:', error.message);
      this.lastSyncId = 0;
    }
  }

  /**
   * Stop the scheduled sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('🛑 Direct DB sync service stopped');
    }
    if (this.connection) {
      this.connection.end();
      this.connection = null;
    }
  }

  /**
   * Sync observations from OpenMRS database
   * OPTIMIZED: Batch fetch provider and location data in single query to reduce DB calls
   */
  private async syncObservations() {
    const startTime = Date.now();
    try {
      console.log(`\n🔄 [${new Date().toISOString()}] Syncing observations from OpenMRS database...`);

      const conn = await this.connect();
      
      // OPTIMIZED: Single query with JOINs to fetch provider and location data upfront
      const [observations] = await conn.query<any[]>(`
        SELECT 
          o.obs_id,
          o.person_id,
          o.encounter_id,
          o.location_id,
          CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) as patient_name,
          cn.name as concept_name,
          o.value_text,
          o.value_numeric,
          cn2.name as value_coded_name,
          o.obs_datetime,
          o.comments,
          -- Provider data (preferred method)
          CONCAT_WS(' ', ep_pn.given_name, ep_pn.middle_name, ep_pn.family_name) as provider_name,
          ep_p.identifier as provider_identifier,
          -- Fallback provider from encounter creator
          CONCAT_WS(' ', ec_pn.given_name, ec_pn.middle_name, ec_pn.family_name) as creator_name,
          ec_u.username as creator_username,
          -- Location data
          e_location.name as encounter_location_name,
          o_location.name as obs_location_name
        FROM obs o
        JOIN person_name pn ON o.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
        JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
        LEFT JOIN concept_name cn2 ON o.value_coded = cn2.concept_id AND cn2.locale = 'en' AND cn2.concept_name_type = 'FULLY_SPECIFIED'
        -- Provider from encounter_provider (preferred)
        LEFT JOIN encounter_provider ep ON o.encounter_id = ep.encounter_id AND ep.voided = 0
        LEFT JOIN provider ep_p ON ep.provider_id = ep_p.provider_id AND ep_p.retired = 0
        LEFT JOIN person_name ep_pn ON ep_p.person_id = ep_pn.person_id AND ep_pn.voided = 0 AND ep_pn.preferred = 1
        -- Provider from encounter creator (fallback)
        LEFT JOIN encounter e ON o.encounter_id = e.encounter_id AND e.voided = 0
        LEFT JOIN users ec_u ON e.creator = ec_u.user_id
        LEFT JOIN person_name ec_pn ON ec_u.person_id = ec_pn.person_id AND ec_pn.voided = 0 AND ec_pn.preferred = 1
        -- Location from encounter
        LEFT JOIN location e_location ON e.location_id = e_location.location_id AND e_location.retired = 0
        -- Location from observation
        LEFT JOIN location o_location ON o.location_id = o_location.location_id AND o_location.retired = 0
        WHERE o.obs_id > ?
          AND o.voided = 0
        ORDER BY o.obs_id ASC
        LIMIT 100
      `, [this.lastSyncId]);

      if (observations.length === 0) {
        console.log('   ✓ No new observations to sync');
        return;
      }

      console.log(`   Found ${observations.length} new observation(s)`);

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      // OPTIMIZED: Process observations in parallel batches for better performance
      const batchSize = 10; // Process 10 observations in parallel
      const batches = [];
      for (let i = 0; i < observations.length; i += batchSize) {
        batches.push(observations.slice(i, i + batchSize));
      }

      // Process each batch in parallel
      for (const batch of batches) {
        const batchPromises = batch.map(async (obs: any) => {
          try {
            const patientName = obs.patient_name?.trim() || '';
          const conceptName = obs.concept_name;
          
            // OPTIMIZED: Use pre-fetched provider and location data from JOINs
          let providerName = 'Unknown Doctor';
            
            // Priority 1: Provider from encounter_provider (preferred)
            if (obs.provider_name && obs.provider_name.trim()) {
              providerName = obs.provider_name.trim().replace(/\s+/g, ' ');
            } else if (obs.provider_identifier && obs.provider_identifier.trim()) {
              providerName = obs.provider_identifier.trim();
            } 
            // Priority 2: Provider from encounter creator (fallback)
            else if (obs.creator_name && obs.creator_name.trim()) {
              providerName = obs.creator_name.trim().replace(/\s+/g, ' ');
            } else if (obs.creator_username && obs.creator_username.trim()) {
              providerName = obs.creator_username.trim();
            }
            
            // Location: Prefer encounter location, fallback to observation location
            let locationName = obs.encounter_location_name || 
                              obs.obs_location_name || 
                              'Unknown Hospital';
            
            // Determine the observation value
            let observationValue = obs.value_text || 
                                 (obs.value_numeric !== null ? String(obs.value_numeric) : '') ||
                                 obs.value_coded_name ||
                                 '';

            // FILTER OUT test results, measurements, vitals, and encounter notes - only sync actual diagnoses
            const isTestOrMeasurement = /\b(test|rapid test|lab|laboratory|screening|examination|x-ray|ultrasound|scan|blood work|serum|arterial|oxygen|saturation|pulse|weight|height|temperature|blood pressure|heart rate|bmi|vitals|encounter note|text of|note|observation|measurement)\b/i.test(conceptName);
            
            // Skip this observation if it's not a real diagnosis
            if (isTestOrMeasurement) {
              console.log(`   ⏭️  Skipped (not a diagnosis): ${conceptName}`);
              const obsId = obs.obs_id;
              if (obsId > this.lastSyncId) {
                this.lastSyncId = obsId;
              }
              return { success: true, obsId, conceptName: `[Skipped] ${conceptName}`, patientName, providerName, locationName, skipped: true };
            }

            // Check if it's a diagnosis or medication based on concept name
            const isDiagnosis = conceptName.toLowerCase().includes('diagnosis') || 
                              conceptName.toLowerCase().includes('condition') ||
                              conceptName.toLowerCase().includes('disease') ||
                              conceptName.toLowerCase().includes('malaria') ||
                              conceptName.toLowerCase().includes('smear') ||
                              conceptName.toLowerCase().includes('fever') ||
                              conceptName.toLowerCase().includes('pain');
            
            const isMedication = conceptName.toLowerCase().includes('medication') ||
                                conceptName.toLowerCase().includes('drug') ||
                                conceptName.toLowerCase().includes('treatment') ||
                                conceptName.toLowerCase().includes('prescription');

            let observationType: 'diagnosis' | 'medication' = 'diagnosis';
            let observationData: any = {
              obs_id: obs.obs_id,
              encounter_id: obs.encounter_id,
              location_id: obs.location_id
            };

            if (isDiagnosis) {
              observationType = 'diagnosis';
              observationData.diagnosis = conceptName;
              observationData.details = observationValue;
              observationData.date = obs.obs_datetime;
              if (obs.comments) {
                observationData.details = `${observationData.details}. ${obs.comments}`;
              }
            } else if (isMedication) {
              observationType = 'medication';
              observationData.medicationName = conceptName;
              observationData.dosage = observationValue;
              observationData.details = obs.comments || '';
              observationData.date = obs.obs_datetime;
            } else {
              // Generic observation - treat as diagnosis
              observationType = 'diagnosis';
              observationData.diagnosis = conceptName;
              observationData.details = observationValue;
              observationData.date = obs.obs_datetime;
            }

            // Store in Patient Passport database with actual provider and location
            await storeOpenMRSObservation(
              patientName,
              observationType,
              observationData,
              providerName,
              locationName
            );
            
            // Update last synced ID (use max to handle parallel processing)
            const obsId = obs.obs_id;
            if (obsId > this.lastSyncId) {
              this.lastSyncId = obsId;
            }
            
            return { success: true, obsId, conceptName, patientName, providerName, locationName };
          } catch (error: any) {
            return { success: false, obsId: obs.obs_id, error: error.message };
          }
        });

        // Wait for batch to complete
        const results = await Promise.all(batchPromises);
        
        // Process results
        for (const result of results) {
          if (result.success) {
            if ((result as any).skipped) {
              skippedCount++;
              // Don't count skipped as successful syncs
              continue;
            }
            successCount++;
            // Only log first few to reduce console noise
            if (successCount <= 5) {
              console.log(`   ✓ Synced: ${result.conceptName} for patient ${result.patientName} (ID: ${result.obsId})`);
              console.log(`      Provider: "${result.providerName}" | Location: "${result.locationName}"`);
            }
          } else {
          errorCount++;
            console.error(`   ✗ Error syncing observation ${result.obsId}:`, result.error);
          }
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n📊 DB Sync complete: ${successCount} successful, ${skippedCount} skipped, ${errorCount} errors (${duration}s)`);
      console.log(`   Last synced observation ID: ${this.lastSyncId}`);
    } catch (error: any) {
      console.error('❌ Error during direct DB sync:', error.message);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
    }
  }

  /**
   * Manual trigger for immediate sync
   */
  async syncNow(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      await this.syncObservations();
      return { success: true, message: 'DB sync completed successfully' };
    } catch (error: any) {
      return { success: false, message: `DB sync failed: ${error.message}` };
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncId: this.lastSyncId,
      intervalMs: this.SYNC_INTERVAL_MS,
      database: `${this.DB_CONFIG.host}:${this.DB_CONFIG.port}/${this.DB_CONFIG.database}`
    };
  }
}

// Export singleton instance
export const directDBSyncService = new DirectDBSyncService();
