import axios from 'axios';
import { storeOpenMRSObservation } from './openmrsIntegrationService';

interface OpenMRSObservation {
  uuid: string;
  display: string;
  concept: {
    uuid: string;
    display: string;
  };
  person: {
    uuid: string;
    display: string;
  };
  obsDatetime: string;
  value: any;
  comment?: string;
}

class ScheduledSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date = new Date(Date.now() - 24 * 60 * 60 * 1000); // Start from 24 hours ago
  private isRunning = false;

  private readonly OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs';
  private readonly OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
  private readonly OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Start the scheduled sync service
   */
  start() {
    if (this.isRunning) {
      console.log('⏰ Scheduled sync service is already running');
      return;
    }

    console.log('🚀 Starting scheduled OpenMRS observation sync service');
    console.log(`   Sync interval: ${this.SYNC_INTERVAL_MS / 1000} seconds`);
    console.log(`   OpenMRS URL: ${this.OPENMRS_BASE_URL}`);

    // Run immediately on startup
    this.syncObservations();

    // Then run on schedule
    this.syncInterval = setInterval(() => {
      this.syncObservations();
    }, this.SYNC_INTERVAL_MS);

    this.isRunning = true;
  }

  /**
   * Stop the scheduled sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('🛑 Scheduled sync service stopped');
    }
  }

  /**
   * Sync observations from OpenMRS
   */
  private async syncObservations() {
    try {
      console.log(`\n🔄 [${new Date().toISOString()}] Syncing observations from OpenMRS...`);

      // Format date for OpenMRS API (ISO format without milliseconds)
      const fromDate = this.lastSyncTime.toISOString().split('.')[0];
      
      // Fetch observations created/updated since last sync
      const response = await axios.get(
        `${this.OPENMRS_BASE_URL}/ws/rest/v1/obs`,
        {
          params: {
            fromdate: fromDate,
            limit: 100,
            v: 'full'
          },
          auth: {
            username: this.OPENMRS_USERNAME,
            password: this.OPENMRS_PASSWORD
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const observations: OpenMRSObservation[] = response.data.results || [];
      
      if (observations.length === 0) {
        console.log('   ✓ No new observations to sync');
        return;
      }

      console.log(`   Found ${observations.length} new observation(s)`);

      let successCount = 0;
      let errorCount = 0;

      // Process each observation
      for (const obs of observations) {
        try {
          // Extract patient name from display
          const patientName = obs.person.display.replace(/\s*\(.*?\)/g, '').trim();

          // Determine observation type and value
          const conceptName = obs.concept.display;
          
          // Check if it's a diagnosis or medication based on concept name
          const isDiagnosis = conceptName.toLowerCase().includes('diagnosis') || 
                            conceptName.toLowerCase().includes('condition') ||
                            conceptName.toLowerCase().includes('disease') ||
                            conceptName.toLowerCase().includes('malaria') ||
                            conceptName.toLowerCase().includes('smear');
          
          const isMedication = conceptName.toLowerCase().includes('medication') ||
                              conceptName.toLowerCase().includes('drug') ||
                              conceptName.toLowerCase().includes('treatment');

          let observationType: 'diagnosis' | 'medication' = 'diagnosis';
          let observationData: any = {};

          if (isDiagnosis) {
            observationType = 'diagnosis';
            observationData = {
              diagnosis: conceptName,
              details: typeof obs.value === 'object' ? obs.value.display : String(obs.value || ''),
              date: obs.obsDatetime
            };
            if (obs.comment) {
              observationData.details = `${observationData.details}. ${obs.comment}`;
            }
          } else if (isMedication) {
            observationType = 'medication';
            observationData = {
              medicationName: conceptName,
              dosage: typeof obs.value === 'object' ? obs.value.display : String(obs.value || ''),
              details: obs.comment || '',
              date: obs.obsDatetime
            };
          } else {
            // Generic observation - treat as diagnosis
            observationType = 'diagnosis';
            observationData = {
              diagnosis: conceptName,
              details: typeof obs.value === 'object' ? obs.value.display : String(obs.value || ''),
              date: obs.obsDatetime
            };
          }

          // Store in Patient Passport database
          await storeOpenMRSObservation(
            patientName,
            observationType,
            observationData,
            'SYNC-SERVICE', // Default doctor license for synced observations
            'OpenMRS Hospital' // Default hospital name
          );
          
          successCount++;
          console.log(`   ✓ Synced: ${conceptName} for patient ${patientName}`);
        } catch (error: any) {
          errorCount++;
          console.error(`   ✗ Error syncing observation ${obs.uuid}:`, error.message);
        }
      }

      // Update last sync time
      this.lastSyncTime = new Date();

      console.log(`\n📊 Sync complete: ${successCount} successful, ${errorCount} errors`);
    } catch (error: any) {
      console.error('❌ Error during scheduled sync:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.status, error.response.statusText);
      }
    }
  }

  /**
   * Manual trigger for immediate sync
   */
  async syncNow(): Promise<{ success: boolean; message: string }> {
    try {
      await this.syncObservations();
      return { success: true, message: 'Sync completed successfully' };
    } catch (error: any) {
      return { success: false, message: `Sync failed: ${error.message}` };
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      intervalMs: this.SYNC_INTERVAL_MS,
      openmrsUrl: this.OPENMRS_BASE_URL
    };
  }
}

// Export singleton instance
export const scheduledSyncService = new ScheduledSyncService();
