package org.openmrs.module.patientpassportcore.api;

import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.User;
import org.openmrs.api.OpenmrsService;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.openmrs.module.patientpassportcore.model.PatientPassportRecord;

import java.util.List;

/**
 * Enhanced service interface for Patient Passport Core functionality
 * Supports cross-hospital patient record sharing and management
 */
public interface PatientPassportCoreService extends OpenmrsService {
	
	// === CORE PATIENT MANAGEMENT ===
	
	/**
	 * Generate or retrieve universal patient ID
	 * @param patient the patient
	 * @return the universal patient identifier
	 */
	PatientIdentifier generateUniversalPatientId(Patient patient);
	
	/**
	 * Find patient by universal ID across all hospitals
	 * @param universalId the universal patient ID
	 * @return the patient or null if not found
	 */
	Patient findPatientByUniversalId(String universalId);
	
	/**
	 * Register patient with central Patient Passport registry
	 * @param patient the patient
	 * @param universalId the universal ID
	 * @return true if successful
	 */
	boolean registerPatientWithCentralRegistry(Patient patient, String universalId);
	
	/**
	 * Update patient record in Patient Passport system
	 * @param patient the patient
	 * @param updateData the updated data
	 * @return true if successful
	 */
	boolean updatePatientInPassport(Patient patient, String updateData);
	
	// === CROSS-HOSPITAL ACCESS ===
	
	/**
	 * Search for patient across all hospitals in the network
	 * @param searchCriteria search criteria (name, national ID, etc.)
	 * @return list of matching patients from all hospitals
	 */
	List<PatientPassportRecord> searchPatientAcrossHospitals(String searchCriteria);
	
	/**
	 * Get patient's complete medical history from all hospitals
	 * @param universalId the universal patient ID
	 * @return complete medical history
	 */
	String getCompleteMedicalHistory(String universalId);
	
	/**
	 * Share patient record with another hospital
	 * @param universalId the universal patient ID
	 * @param targetHospitalId the target hospital ID
	 * @param sharingReason the reason for sharing
	 * @return true if successful
	 */
	boolean sharePatientRecord(String universalId, String targetHospitalId, String sharingReason);
	
	/**
	 * Get list of hospitals that have access to patient record
	 * @param universalId the universal patient ID
	 * @return list of hospital IDs
	 */
	List<String> getAccessibleHospitals(String universalId);
	
	// === EMERGENCY ACCESS ===
	
	/**
	 * Perform emergency override access
	 * @param user the user requesting access
	 * @param patient the patient
	 * @param justification the justification for override
	 * @return the emergency override record
	 */
	EmergencyOverride performEmergencyOverride(User user, Patient patient, String justification);
	
	/**
	 * Check if user has emergency access privileges
	 * @param user the user
	 * @return true if user has emergency access
	 */
	boolean hasEmergencyAccess(User user);
	
	// === AUDIT AND LOGGING ===
	
	/**
	 * Log patient data access
	 * @param user the user accessing data
	 * @param patient the patient
	 * @param accessType the type of access (regular, emergency, cross-hospital)
	 * @param details additional details
	 */
	void logPatientDataAccess(User user, Patient patient, String accessType, String details);
	
	/**
	 * Get audit logs for a patient
	 * @param patient the patient
	 * @return list of audit logs
	 */
	List<AuditLog> getAuditLogsForPatient(Patient patient);
	
	/**
	 * Get emergency override logs
	 * @return list of emergency overrides
	 */
	List<EmergencyOverride> getEmergencyOverrideLogs();
	
	/**
	 * Get cross-hospital access logs
	 * @param universalId the universal patient ID
	 * @return list of cross-hospital access records
	 */
	List<AuditLog> getCrossHospitalAccessLogs(String universalId);
	
	// === MEDICAL RECORD MANAGEMENT ===
	
	/**
	 * Add medical encounter to Patient Passport
	 * @param patient the patient
	 * @param encounterData the encounter data
	 * @param doctorId the doctor ID
	 * @return true if successful
	 */
	boolean addMedicalEncounter(Patient patient, String encounterData, String doctorId);
	
	/**
	 * Update medical record in Patient Passport
	 * @param universalId the universal patient ID
	 * @param recordId the record ID
	 * @param updateData the updated data
	 * @return true if successful
	 */
	boolean updateMedicalRecord(String universalId, String recordId, String updateData);
	
	/**
	 * Get patient's medical records from Patient Passport
	 * @param universalId the universal patient ID
	 * @return medical records data
	 */
	String getPatientMedicalRecords(String universalId);
	
	/**
	 * Sync patient's OpenMRS encounters to Patient Passport
	 * @param patient the patient
	 * @return number of encounters synced
	 */
	int syncPatientEncounters(Patient patient);
	
	// === SYSTEM MANAGEMENT ===
	
	/**
	 * Get universal patient identifier type
	 * @return the identifier type
	 */
	PatientIdentifierType getUniversalPatientIdentifierType();
	
	/**
	 * Get insurance number identifier type
	 * @return the identifier type
	 */
	PatientIdentifierType getInsuranceNumberIdentifierType();
	
	/**
	 * Get universal patient ID for a patient
	 * @param patient the patient
	 * @return the universal ID or null if not found
	 */
	PatientIdentifier getUniversalPatientId(Patient patient);
	
	/**
	 * Get passport status for a patient
	 * @param patient the patient
	 * @return the status (ACTIVE, PENDING, NOT_CREATED, UNKNOWN)
	 */
	String getPassportStatus(Patient patient);
	
	/**
	 * Check if patient exists in Patient Passport system
	 * @param universalId the universal ID
	 * @return true if exists
	 */
	boolean checkPatientExistsInPassport(String universalId);
	
	/**
	 * Sync patient data to Patient Passport system
	 * @param patientUuid the patient UUID
	 * @param patientData the patient data in JSON format
	 */
	void syncPatientToPassport(String patientUuid, String patientData);
	
	/**
	 * Get total patient count
	 * @return total number of patients
	 */
	int getTotalPatientCount();
	
	/**
	 * Get synced patient count
	 * @return number of synced patients
	 */
	int getSyncedPatientCount();
	
	/**
	 * Sync all patients to Patient Passport system
	 */
	void syncAllPatients();
	
	/**
	 * Get system statistics
	 * @return system statistics
	 */
	String getSystemStatistics();
	
	// === HOSPITAL NETWORK MANAGEMENT ===
	
	/**
	 * Register hospital in the Patient Passport network
	 * @param hospitalData the hospital data
	 * @return true if successful
	 */
	boolean registerHospitalInNetwork(String hospitalData);
	
	/**
	 * Get list of hospitals in the network
	 * @return list of hospital information
	 */
	List<String> getNetworkHospitals();
	
	/**
	 * Update hospital information in the network
	 * @param hospitalId the hospital ID
	 * @param updateData the updated data
	 * @return true if successful
	 */
	boolean updateHospitalInNetwork(String hospitalId, String updateData);
}