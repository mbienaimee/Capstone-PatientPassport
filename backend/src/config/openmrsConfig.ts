/**
 * OpenMRS Database Configuration
 * 
 * Configure connections to multiple OpenMRS databases across different hospitals
 * 
 * SETUP INSTRUCTIONS:
 * ====================
 * 
 * 1. For each hospital running OpenMRS, add a configuration entry
 * 2. Get the hospitalId from your Patient Passport MongoDB database
 * 3. Provide the MySQL/MariaDB connection details for each OpenMRS instance
 * 4. Ensure network connectivity between Patient Passport backend and OpenMRS databases
 * 
 * SECURITY NOTES:
 * ===============
 * - Use environment variables for sensitive credentials
 * - Create a dedicated read-only MySQL user for sync operations
 * - Use secure connections (SSL) in production
 * - Implement IP whitelisting on OpenMRS databases
 */

export interface OpenMRSHospitalConfig {
  hospitalId: string;        // Patient Passport Hospital MongoDB ID
  hospitalName: string;       // Hospital name for logging
  host: string;              // OpenMRS database host
  port: number;              // MySQL port (default: 3306)
  database: string;          // OpenMRS database name (usually 'openmrs')
  user: string;              // MySQL username (read-only recommended)
  password: string;          // MySQL password
  enabled: boolean;          // Enable/disable this hospital
}

/**
 * Load OpenMRS configurations from environment or default config
 */
export const getOpenMRSConfigurations = (): OpenMRSHospitalConfig[] => {
  // Try to load from environment variable first
  if (process.env.OPENMRS_CONFIGS) {
    try {
      return JSON.parse(process.env.OPENMRS_CONFIGS);
    } catch (error) {
      console.error('Failed to parse OPENMRS_CONFIGS:', error);
    }
  }

  // Only return configurations that are explicitly enabled in .env
  const configs: OpenMRSHospitalConfig[] = [];

  // Hospital 1
  if (process.env.HOSPITAL_1_ENABLED === 'true' && process.env.HOSPITAL_1_ID) {
    configs.push({
      hospitalId: process.env.HOSPITAL_1_ID,
      hospitalName: process.env.HOSPITAL_1_NAME || 'Hospital 1',
      host: process.env.HOSPITAL_1_DB_HOST || 'localhost',
      port: parseInt(process.env.HOSPITAL_1_DB_PORT || '3306'),
      database: process.env.HOSPITAL_1_DB_NAME || 'openmrs',
      user: process.env.HOSPITAL_1_DB_USER || 'openmrs_readonly',
      password: process.env.HOSPITAL_1_DB_PASSWORD || '',
      enabled: true
    });
  }

  // Hospital 2
  if (process.env.HOSPITAL_2_ENABLED === 'true' && process.env.HOSPITAL_2_ID) {
    configs.push({
      hospitalId: process.env.HOSPITAL_2_ID,
      hospitalName: process.env.HOSPITAL_2_NAME || 'Hospital 2',
      host: process.env.HOSPITAL_2_DB_HOST || 'localhost',
      port: parseInt(process.env.HOSPITAL_2_DB_PORT || '3306'),
      database: process.env.HOSPITAL_2_DB_NAME || 'openmrs',
      user: process.env.HOSPITAL_2_DB_USER || 'openmrs_readonly',
      password: process.env.HOSPITAL_2_DB_PASSWORD || '',
      enabled: true
    });
  }

  // Hospital 3
  if (process.env.HOSPITAL_3_ENABLED === 'true' && process.env.HOSPITAL_3_ID) {
    configs.push({
      hospitalId: process.env.HOSPITAL_3_ID,
      hospitalName: process.env.HOSPITAL_3_NAME || 'Hospital 3',
      host: process.env.HOSPITAL_3_DB_HOST || 'localhost',
      port: parseInt(process.env.HOSPITAL_3_DB_PORT || '3306'),
      database: process.env.HOSPITAL_3_DB_NAME || 'openmrs',
      user: process.env.HOSPITAL_3_DB_USER || 'openmrs_readonly',
      password: process.env.HOSPITAL_3_DB_PASSWORD || '',
      enabled: true
    });
  }

  return configs;
};

/**
 * Sync Configuration
 */
export const syncConfig = {
  // Automatic sync interval (in seconds) - default 10 seconds for near real-time sync
  autoSyncInterval: parseInt(process.env.OPENMRS_SYNC_INTERVAL_SECONDS || process.env.OPENMRS_SYNC_INTERVAL || '10'),

  // Enable automatic sync on server start.
  // Defaults to enabled in development for easier local testing, or can be
  // explicitly controlled via OPENMRS_AUTO_START_SYNC env var in production.
  autoStartSync: process.env.OPENMRS_AUTO_START_SYNC === 'true' || process.env.NODE_ENV === 'development',

  // Maximum records to fetch per sync
  maxRecordsPerSync: parseInt(process.env.OPENMRS_MAX_RECORDS || '1000'),

  // Connection pool size
  connectionPoolSize: parseInt(process.env.OPENMRS_POOL_SIZE || '10'),

  // Sync timeout (in seconds)
  syncTimeout: parseInt(process.env.OPENMRS_SYNC_TIMEOUT || '300'),

  // Enable detailed logging
  enableDetailedLogs: process.env.OPENMRS_DETAILED_LOGS === 'true'
};

/**
 * Database Schema Mapping Configuration
 * 
 * Maps OpenMRS concepts to Patient Passport record types
 */
export const conceptMapping = {
  // Keywords that indicate a diagnosis/condition
  diagnosis: ['DIAGNOSIS', 'CONDITION', 'DISEASE', 'PROBLEM', 'DISORDER', 'SYNDROME'],

  // Keywords that indicate a medication
  medication: ['MEDICATION', 'DRUG', 'PRESCRIPTION', 'MEDICINE', 'TREATMENT'],

  // Keywords that indicate a test/lab result
  test: ['TEST', 'LAB', 'RESULT', 'INVESTIGATION', 'EXAM', 'SCAN', 'X-RAY', 'ULTRASOUND'],

  // Keywords that indicate a visit/encounter
  visit: ['VISIT', 'ENCOUNTER', 'ADMISSION', 'CONSULTATION', 'APPOINTMENT'],

  // Vital signs
  vitals: ['VITAL', 'WEIGHT', 'HEIGHT', 'TEMPERATURE', 'BLOOD PRESSURE', 'PULSE', 'OXYGEN']
};

/**
 * Patient Identifier Mapping
 * 
 * Maps OpenMRS patient identifier types to Patient Passport national ID
 */
export const patientIdentifierMapping = {
  // OpenMRS identifier type names that contain national ID
  nationalIdPatterns: [
    'NATIONAL ID',
    'NATIONAL_ID',
    'NID',
    'CITIZEN ID',
    'NATIONAL IDENTIFICATION'
  ]
};

export default {
  getOpenMRSConfigurations,
  syncConfig,
  conceptMapping,
  patientIdentifierMapping
};
