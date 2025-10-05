package org.openmrs.module.patientpassportcore.api.impl;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.User;
import org.openmrs.api.APIException;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassportcore.api.PatientPassportCoreService;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.openmrs.module.patientpassportcore.dao.PatientPassportCoreDao;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of PatientPassportCoreService
 */
@Transactional
public class PatientPassportCoreServiceImpl implements PatientPassportCoreService {
	
	protected final Log log = LogFactory.getLog(this.getClass());
	
	private PatientPassportCoreDao dao;
	
	public void setDao(PatientPassportCoreDao dao) {
		this.dao = dao;
	}
	
	@Override
	public PatientIdentifier generateUniversalPatientId(Patient patient) {
		PatientService patientService = Context.getPatientService();
		PatientIdentifierType universalIdType = getUniversalPatientIdentifierType();
		
		// Check if patient already has universal ID
		for (PatientIdentifier identifier : patient.getIdentifiers()) {
			if (identifier.getIdentifierType().equals(universalIdType)) {
				return identifier;
			}
		}
		
		// Generate new universal ID
		String universalId = "PP" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
		
		// Ensure uniqueness
		while (findPatientByUniversalId(universalId) != null) {
			universalId = "PP" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
		}
		
		PatientIdentifier identifier = new PatientIdentifier();
		identifier.setIdentifier(universalId);
		identifier.setIdentifierType(universalIdType);
		identifier.setLocation(Context.getLocationService().getDefaultLocation());
		identifier.setPreferred(true);
		
		patient.addIdentifier(identifier);
		patientService.savePatient(patient);
		
		// Register with central registry
		registerPatientWithCentralRegistry(patient, universalId);
		
		// Log the creation
		logPatientDataAccess(Context.getAuthenticatedUser(), patient, "regular", "Universal ID generated");
		
		return identifier;
	}
	
	@Override
	public Patient findPatientByUniversalId(String universalId) {
		PatientService patientService = Context.getPatientService();
		PatientIdentifierType universalIdType = getUniversalPatientIdentifierType();
		
		List<PatientIdentifier> identifiers = patientService.getPatientIdentifiers(universalId, 
			List.of(universalIdType), null, null, true);
		
		if (!identifiers.isEmpty()) {
			return identifiers.get(0).getPatient();
		}
		
		return null;
	}
	
	@Override
	public boolean registerPatientWithCentralRegistry(Patient patient, String universalId) {
		try {
			// TODO: Implement HTTP call to central registry
			// This would be a REST API call to register the patient
			log.info("Registering patient " + patient.getUuid() + " with universal ID " + universalId + " to central registry");
			return true;
		} catch (Exception e) {
			log.error("Failed to register patient with central registry", e);
			return false;
		}
	}
	
	@Override
	public EmergencyOverride performEmergencyOverride(User user, Patient patient, String justification) {
		// Check if user has emergency override role
		if (!user.hasRole("Emergency Doctor") && !user.hasRole("Emergency Nurse")) {
			throw new APIException("User does not have permission for emergency override");
		}
		
		EmergencyOverride override = new EmergencyOverride(user, patient, justification);
		override.setIpAddress(getCurrentIpAddress());
		override.setUserAgent(getCurrentUserAgent());
		
		dao.saveEmergencyOverride(override);
		
		// Log the emergency access
		logPatientDataAccess(user, patient, "emergency", "Emergency override: " + justification);
		
		return override;
	}
	
	@Override
	public void logPatientDataAccess(User user, Patient patient, String accessType, String details) {
		AuditLog auditLog = new AuditLog(user, patient, accessType, "view", details);
		auditLog.setIpAddress(getCurrentIpAddress());
		auditLog.setUserAgent(getCurrentUserAgent());
		
		dao.saveAuditLog(auditLog);
	}
	
	@Override
	public List<AuditLog> getAuditLogsForPatient(Patient patient) {
		return dao.getAuditLogsForPatient(patient);
	}
	
	@Override
	public List<EmergencyOverride> getEmergencyOverrideLogs() {
		return dao.getEmergencyOverrideLogs();
	}
	
	@Override
	public PatientIdentifierType getUniversalPatientIdentifierType() {
		PatientService patientService = Context.getPatientService();
		PatientIdentifierType universalIdType = patientService.getPatientIdentifierTypeByName("Patient Passport ID");
		
		if (universalIdType == null) {
			// Create the identifier type if it doesn't exist
			universalIdType = new PatientIdentifierType();
			universalIdType.setName("Patient Passport ID");
			universalIdType.setDescription("Universal patient identifier for federated access");
			universalIdType.setFormat("PP{12}");
			universalIdType.setRequired(false);
			universalIdType.setCheckDigit(false);
			universalIdType.setValidator("org.openmrs.module.patientpassportcore.validator.PatientPassportIdValidator");
			
			patientService.savePatientIdentifierType(universalIdType);
		}
		
		return universalIdType;
	}
	
	@Override
	public PatientIdentifierType getInsuranceNumberIdentifierType() {
		PatientService patientService = Context.getPatientService();
		PatientIdentifierType insuranceType = patientService.getPatientIdentifierTypeByName("Insurance Number");
		
		if (insuranceType == null) {
			// Create the identifier type if it doesn't exist
			insuranceType = new PatientIdentifierType();
			insuranceType.setName("Insurance Number");
			insuranceType.setDescription("Patient insurance number for identification");
			insuranceType.setFormat("INS{10}");
			insuranceType.setRequired(false);
			insuranceType.setCheckDigit(false);
			
			patientService.savePatientIdentifierType(insuranceType);
		}
		
		return insuranceType;
	}
	
	private String getCurrentIpAddress() {
		// TODO: Implement IP address extraction from request context
		return "127.0.0.1";
	}
	
	private String getCurrentUserAgent() {
		// TODO: Implement user agent extraction from request context
		return "OpenMRS-PatientPassport/1.0";
	}
}

