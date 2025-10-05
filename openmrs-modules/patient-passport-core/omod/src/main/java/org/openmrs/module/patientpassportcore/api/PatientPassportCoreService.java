package org.openmrs.module.patientpassportcore.api;

import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.User;
import org.openmrs.api.OpenmrsService;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.openmrs.module.patientpassportcore.model.AuditLog;

import java.util.List;

/**
 * The service interface for Patient Passport Core functionality
 */
public interface PatientPassportCoreService extends OpenmrsService {
	
	/**
	 * Generate or retrieve universal patient ID
	 * @param patient the patient
	 * @return the universal patient identifier
	 */
	PatientIdentifier generateUniversalPatientId(Patient patient);
	
	/**
	 * Find patient by universal ID
	 * @param universalId the universal patient ID
	 * @return the patient or null if not found
	 */
	Patient findPatientByUniversalId(String universalId);
	
	/**
	 * Register patient with central registry
	 * @param patient the patient
	 * @param universalId the universal ID
	 * @return true if successful
	 */
	boolean registerPatientWithCentralRegistry(Patient patient, String universalId);
	
	/**
	 * Perform emergency override access
	 * @param user the user requesting access
	 * @param patient the patient
	 * @param justification the justification for override
	 * @return the emergency override record
	 */
	EmergencyOverride performEmergencyOverride(User user, Patient patient, String justification);
	
	/**
	 * Log patient data access
	 * @param user the user accessing data
	 * @param patient the patient
	 * @param accessType the type of access (regular, emergency)
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
	 * Get universal patient identifier type
	 * @return the identifier type
	 */
	PatientIdentifierType getUniversalPatientIdentifierType();
	
	/**
	 * Get insurance number identifier type
	 * @return the identifier type
	 */
	PatientIdentifierType getInsuranceNumberIdentifierType();
}

