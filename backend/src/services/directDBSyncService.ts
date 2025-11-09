import mysql from 'mysql2/promise';
import { storeOpenMRSObservation } from './openmrsIntegrationService';

interface DBObservation {
  obs_id: number;
  person_id: number;
  patient_name: string;
  concept_name: string;
  value_text: string | null;
  value_numeric: number | null;
  value_coded_name: string | null;
  obs_datetime: Date;
  comments: string | null;
}

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

  // Sync interval: configurable via env var (in seconds), default 30 seconds
  private readonly SYNC_INTERVAL_MS = (parseInt(process.env.OPENMRS_SYNC_INTERVAL_SECONDS || '30')) * 1000;

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
      console.error('❌ Failed to start direct DB sync service:', error.message);
      console.log('   Falling back to REST API sync only');
    }
  }

  /**
   * Connect to OpenMRS database
   */
  private async connect() {
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
   */
  private async syncObservations() {
    try {
      console.log(`\n🔄 [${new Date().toISOString()}] Syncing observations from OpenMRS database...`);

      const conn = await this.connect();
      
      // Query new observations since last sync
      const [observations] = await conn.query<any[]>(`
        SELECT 
          o.obs_id,
          o.person_id,
          CONCAT_WS(' ', pn.given_name, pn.middle_name, pn.family_name) as patient_name,
          cn.name as concept_name,
          o.value_text,
          o.value_numeric,
          cn2.name as value_coded_name,
          o.obs_datetime,
          o.comments
        FROM obs o
        JOIN person_name pn ON o.person_id = pn.person_id AND pn.voided = 0 AND pn.preferred = 1
        JOIN concept_name cn ON o.concept_id = cn.concept_id AND cn.locale = 'en' AND cn.concept_name_type = 'FULLY_SPECIFIED'
        LEFT JOIN concept_name cn2 ON o.value_coded = cn2.concept_id AND cn2.locale = 'en' AND cn2.concept_name_type = 'FULLY_SPECIFIED'
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

      // Process each observation
      for (const obs of observations as DBObservation[]) {
        try {
          const patientName = obs.patient_name.trim();
          const conceptName = obs.concept_name;
          
          // Determine the observation value
          let observationValue = obs.value_text || 
                               (obs.value_numeric !== null ? String(obs.value_numeric) : '') ||
                               obs.value_coded_name ||
                               '';

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
          let observationData: any = {};

          if (isDiagnosis) {
            observationType = 'diagnosis';
            observationData = {
              diagnosis: conceptName,
              details: observationValue,
              date: obs.obs_datetime
            };
            if (obs.comments) {
              observationData.details = `${observationData.details}. ${obs.comments}`;
            }
          } else if (isMedication) {
            observationType = 'medication';
            observationData = {
              medicationName: conceptName,
              dosage: observationValue,
              details: obs.comments || '',
              date: obs.obs_datetime
            };
          } else {
            // Generic observation - treat as diagnosis
            observationType = 'diagnosis';
            observationData = {
              diagnosis: conceptName,
              details: observationValue,
              date: obs.obs_datetime
            };
          }

          // Store in Patient Passport database
          await storeOpenMRSObservation(
            patientName,
            observationType,
            observationData,
            'DB-SYNC-SERVICE', // Default doctor license for DB synced observations
            'OpenMRS Hospital' // Default hospital name
          );
          
          successCount++;
          this.lastSyncId = obs.obs_id; // Update last synced ID
          console.log(`   ✓ Synced: ${conceptName} for patient ${patientName} (ID: ${obs.obs_id})`);
        } catch (error: any) {
          errorCount++;
          console.error(`   ✗ Error syncing observation ${obs.obs_id}:`, error.message);
        }
      }

      console.log(`\n📊 DB Sync complete: ${successCount} successful, ${errorCount} errors`);
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
