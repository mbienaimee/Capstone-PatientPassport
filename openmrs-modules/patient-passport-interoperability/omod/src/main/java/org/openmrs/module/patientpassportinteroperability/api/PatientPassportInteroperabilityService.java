package org.openmrs.module.patientpassportinteroperability.api;

import org.openmrs.Patient;
import org.openmrs.module.patientpassportinteroperability.model.ConsentToken;
import org.openmrs.module.patientpassportinteroperability.model.FederatedPatientData;

import java.util.List;

/**
 * Service interface for Patient Passport Interoperability functionality
 */
public interface PatientPassportInteroperabilityService {
	
	/**
	 * Verify consent token
	 * @param universalId the universal patient ID
	 * @param token the consent token
	 * @return true if token is valid
	 */
	boolean verifyConsentToken(String universalId, String token);
	
	/**
	 * Generate consent token
	 * @param universalId the universal patient ID
	 * @param durationMinutes duration in minutes
	 * @return the generated token
	 */
	ConsentToken generateConsentToken(String universalId, int durationMinutes);
	
	/**
	 * Get hospitals with patient records
	 * @param universalId the universal patient ID
	 * @return list of hospital IDs
	 */
	List<String> getHospitalsWithPatientRecords(String universalId);
	
	/**
	 * Retrieve federated patient data
	 * @param universalId the universal patient ID
	 * @param token the consent token
	 * @return consolidated patient data
	 */
	FederatedPatientData retrieveFederatedPatientData(String universalId, String token);
	
	/**
	 * Retrieve FHIR data from hospital
	 * @param hospitalId the hospital ID
	 * @param universalId the universal patient ID
	 * @param accessToken the access token
	 * @return FHIR patient data
	 */
	String retrieveFHIRDataFromHospital(String hospitalId, String universalId, String accessToken);
	
	/**
	 * Register hospital with central registry
	 * @param hospitalId the hospital ID
	 * @param hospitalName the hospital name
	 * @param fhirEndpoint the FHIR endpoint URL
	 * @param apiKey the API key
	 * @return true if successful
	 */
	boolean registerHospitalWithCentralRegistry(String hospitalId, String hospitalName, String fhirEndpoint, String apiKey);
	
	/**
	 * Get consent token by ID
	 * @param tokenId the token ID
	 * @return the consent token
	 */
	ConsentToken getConsentTokenById(String tokenId);
	
	/**
	 * Revoke consent token
	 * @param tokenId the token ID
	 * @return true if successful
	 */
	boolean revokeConsentToken(String tokenId);
}

