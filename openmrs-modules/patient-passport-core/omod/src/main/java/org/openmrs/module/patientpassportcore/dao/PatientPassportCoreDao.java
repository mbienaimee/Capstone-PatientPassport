package org.openmrs.module.patientpassportcore.dao;

import org.openmrs.Patient;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;

import java.util.List;

/**
 * Data access object for Patient Passport Core
 */
public interface PatientPassportCoreDao {
	
	/**
	 * Save emergency override record
	 * @param emergencyOverride the emergency override to save
	 * @return the saved emergency override
	 */
	EmergencyOverride saveEmergencyOverride(EmergencyOverride emergencyOverride);
	
	/**
	 * Save audit log record
	 * @param auditLog the audit log to save
	 * @return the saved audit log
	 */
	AuditLog saveAuditLog(AuditLog auditLog);
	
	/**
	 * Get audit logs for a specific patient
	 * @param patient the patient
	 * @return list of audit logs
	 */
	List<AuditLog> getAuditLogsForPatient(Patient patient);
	
	/**
	 * Get all emergency override logs
	 * @return list of emergency overrides
	 */
	List<EmergencyOverride> getEmergencyOverrideLogs();
	
	/**
	 * Get emergency overrides for a specific patient
	 * @param patient the patient
	 * @return list of emergency overrides
	 */
	List<EmergencyOverride> getEmergencyOverridesForPatient(Patient patient);
	
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
}

