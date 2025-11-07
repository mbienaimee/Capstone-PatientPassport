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
          keepAliveInitialDelay: 0
        });

        // Test connection
        await pool.query('SELECT 1');
        this.connections.set(hospital.hospitalId, pool);
        
        console.log(`✅ Connected to ${hospital.hospitalName} OpenMRS database`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${hospital.hospitalName}:`, error);
      }
    }

    console.log(`✅ Initialized ${this.connections.size} database connections`);
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('⚠️ Sync already running');
      return;
    }

    console.log(`🔄 Starting automatic sync every ${intervalMinutes} minutes...`);
    this.isRunning = true;

    // Initial sync
    this.syncAllHospitals();

    // Schedule periodic sync
    this.syncInterval = setInterval(() => {
      this.syncAllHospitals();
    }, intervalMinutes * 60 * 1000);
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
   */
  async syncAllHospitals(): Promise<void> {
    console.log('\n🔄 ═══════════════════════════════════════════════════════');
    console.log('🔄 Starting Multi-Hospital Observation Sync');
    console.log('🔄 ═══════════════════════════════════════════════════════\n');

    const syncResults: any[] = [];

    for (const [hospitalId, connection] of this.connections.entries()) {
      try {
        const result = await this.syncHospital(hospitalId, connection);
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
   * Sync observations from a single hospital
   */
  private async syncHospital(hospitalId: string, connection: mysql.Pool): Promise<any> {
    console.log(`\n🏥 Syncing hospital: ${hospitalId}`);

    // Get hospital from Patient Passport database
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new Error(`Hospital ${hospitalId} not found in Patient Passport database`);
    }

    // Get last sync timestamp for this hospital
    const lastSyncTime = await this.getLastSyncTimestamp(hospitalId);
    console.log(`   Last sync: ${lastSyncTime || 'Never'}`);

    // Query new/updated observations
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
      hospitalName: hospital.name,
      syncedCount,
      errorCount,
      timestamp: new Date()
    };
  }

  /**
   * Fetch observations from OpenMRS database
   * Strategy: Fetch observations from multiple patients (not just one patient's old data)
   */
  private async fetchObservationsFromOpenMRS(
    connection: mysql.Pool,
    since: Date | null
  ): Promise<OpenMRSObservation[]> {
    const sinceClause = since 
      ? `AND o.date_created > ?`
      : '';

    // Modified query to get observations from ALL patients more evenly
    // Uses a subquery to limit observations per patient
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
      ORDER BY o.person_id ASC, o.date_created ASC
      LIMIT 5000
    `;

    const params = since ? [since] : [];
    const [rows] = await connection.query(query, params);

    return rows as OpenMRSObservation[];
  }

  /**
   * Process a single observation
   */
  private async processObservation(
    obs: OpenMRSObservation,
    hospitalId: string,
    connection: mysql.Pool
  ): Promise<void> {
    // Get concept name
    const conceptName = await this.getConceptName(connection, obs.concept_id);
    
    // Get provider information
    const provider = await this.getProviderInfo(connection, obs.creator);
    
    // Get location name
    const locationName = await this.getLocationName(connection, obs.location_id);
    
    // Get patient by person_id (OpenMRS person_id)
    const patient = await this.findPatientByOpenMRSPersonId(obs.person_id, connection);
    
    if (!patient) {
      console.log(`   ⚠️ Patient not found for person_id ${obs.person_id}, skipping...`);
      return;
    }

    // Determine observation type and extract value
    const processed = await this.categorizeObservation(
      obs,
      conceptName,
      provider,
      locationName,
      connection
    );

    // Get or create doctor
    const doctor = await this.getOrCreateDoctor(
      provider.name,
      provider.identifier,
      hospitalId
    );

    // Store in Patient Passport
    await this.storeMedicalRecord(patient._id.toString(), processed, obs, doctor._id.toString(), hospitalId);

    console.log(`   ✅ Synced: ${conceptName} for patient ${patient.nationalId}`);
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
   * Get provider information
   */
  private async getProviderInfo(connection: mysql.Pool, userId: number): Promise<any> {
    const query = `
      SELECT 
        u.username,
        COALESCE(pn.given_name, '') as given_name,
        COALESCE(pn.family_name, '') as family_name,
        p.identifier
      FROM users u
      LEFT JOIN person_name pn ON u.person_id = pn.person_id AND pn.voided = 0
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
    return {
      name: `${row.given_name} ${row.family_name}`.trim() || row.username,
      identifier: row.identifier || `PROVIDER_${userId}`
    };
  }

  /**
   * Get location name
   */
  private async getLocationName(connection: mysql.Pool, locationId: number): Promise<string> {
    const query = `
      SELECT name
      FROM location
      WHERE location_id = ?
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [locationId]) as any;
    return rows.length > 0 ? rows[0].name : 'Unknown Location';
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
      console.log(`   ⚠️ Cannot auto-register: Person ${personId} not found in OpenMRS`);
      return null;
    }

    const row = rows[0];
    const givenName = row.given_name || '';
    const middleName = row.middle_name || '';
    const familyName = row.family_name || '';
    const fullName = `${givenName} ${middleName} ${familyName}`.replace(/\s+/g, ' ').trim();
    
    console.log(`   🆕 Auto-registering patient: ${fullName} from OpenMRS...`);

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

      console.log(`   ✅ Created User account: ${user.email}`);

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

      console.log(`   ✅ Created Patient record: ${patient.nationalId}`);
      console.log(`   📧 Login: ${email} | Password: ${temporaryPassword}`);

      return Patient.findById(patient._id).populate('user');

    } catch (error: any) {
      console.error(`   ❌ Failed to auto-register patient ${fullName}:`, error.message);
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

    console.log(`   🔍 Searching for patient: ${fullName} (OpenMRS person_id: ${personId})`);

    // Strategy 1: Try National ID first (if available)
    if (nationalId) {
      const patient = await Patient.findOne({ nationalId }).populate('user');
      if (patient) {
        console.log(`   ✅ Patient matched by National ID: ${nationalId}`);
        return patient;
      }
    }

    // Strategy 2: Match by patient name (PRIMARY METHOD)
    // Import User model
    const User = (await import('../models/User')).default;
    
    // Try exact name match first
    let user = await User.findOne({
      name: { $regex: new RegExp(`^${fullName}$`, 'i') },
      role: 'patient'
    });

    // If exact match not found, try partial match
    if (!user) {
      // Try matching given name and family name
      const namePattern = `${givenName}.*${familyName}`;
      user = await User.findOne({
        name: { $regex: new RegExp(namePattern, 'i') },
        role: 'patient'
      });
    }

    // If still not found, try matching just family name (common scenario)
    if (!user && familyName) {
      user = await User.findOne({
        name: { $regex: new RegExp(familyName, 'i') },
        role: 'patient'
      });
    }

    if (user) {
      const patient = await Patient.findOne({ user: user._id }).populate('user');
      if (patient) {
        console.log(`   ✅ Patient matched by name: ${fullName} → ${user.name}`);
        return patient;
      }
    }

    // Strategy 3: AUTO-REGISTER patient from OpenMRS
    console.log(`   ❌ Patient "${fullName}" not found in Patient Passport database`);
    console.log(`   🆕 Attempting auto-registration from OpenMRS...`);
    
    const autoRegisteredPatient = await this.autoRegisterPatient(personId, connection);
    
    if (autoRegisteredPatient) {
      console.log(`   ✅ Successfully auto-registered: ${fullName}`);
      return autoRegisteredPatient;
    }

    console.log(`   ❌ Auto-registration failed for: ${fullName}`);
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

    return {
      type,
      conceptName: diagnosisName,
      value: medicationValue,
      dateRecorded: obs.obs_datetime,
      providerName: provider.name,
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
   */
  private async storeMedicalRecord(
    patientId: string,
    processed: ProcessedObservation,
    obs: OpenMRSObservation,
    doctorId: string,
    hospitalId: string
  ): Promise<void> {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const hospital = await Hospital.findById(hospitalId);

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

    switch (processed.type) {
      case 'condition':
        // Question Concept = Diagnosis (e.g., "Malaria smear impression")
        data.name = processed.conceptName;
        // Value = Medication/Treatment (e.g., "dgdggdf 200mg")
        data.details = `Treatment: ${processed.value}`;
        data.diagnosed = processed.dateRecorded.toISOString();
        data.procedure = `${processed.notes} | Doctor: ${processed.providerName} | Hospital: ${hospital?.name || 'Unknown'}`;
        break;

      case 'medication':
        data.medicationName = processed.conceptName;
        data.dosage = processed.value;
        data.medicationStatus = 'Active';
        break;

      case 'test':
        data.testName = processed.conceptName;
        data.result = processed.value;
        data.testDate = processed.dateRecorded.toISOString();
        data.testStatus = 'Normal';
        break;

      case 'visit':
        data.hospital = hospital?.name || 'Unknown Hospital';
        data.reason = processed.conceptName;
        data.visitDate = processed.dateRecorded.toISOString();
        break;
    }

    // Check if this record already exists (prevent duplicates)
    // First check by OpenMRS obs_id for exact match
    const existingByObsId = await MedicalRecord.findOne({
      'openmrsData.obsId': obs.obs_id
    });

    if (existingByObsId) {
      console.log(`   ⚠️ Record already exists (OpenMRS obs_id: ${obs.obs_id}, Record ID: ${existingByObsId._id}), skipping duplicate`);
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

    console.log(`   🔍 Duplicate check query:`, JSON.stringify(duplicateQuery));

    const existing = await MedicalRecord.findOne(duplicateQuery);

    if (existing) {
      console.log(`   ⚠️ Record already exists (ID: ${existing._id}), skipping duplicate`);
      return;
    }

    console.log(`   ✅ No duplicate found, creating new record...`);

    // Create medical record with OpenMRS metadata
    const record = await MedicalRecord.create({
      patientId,
      type: processed.type,
      data,
      createdBy: doctorId,
      openmrsData: {
        obsId: obs.obs_id,
        conceptId: obs.concept_id,
        personId: obs.person_id,
        obsDatetime: obs.obs_datetime,
        dateCreated: obs.date_created,
        creatorName: processed.providerName,
        locationName: processed.locationName,
        encounterUuid: obs.encounter_id ? obs.encounter_id.toString() : undefined,
        valueType: valueType
      }
    });

    console.log(`   ✅ Created record ID: ${record._id} (OpenMRS obs_id: ${obs.obs_id})`);

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
}

// Export singleton instance
export default new OpenMRSSyncService();
