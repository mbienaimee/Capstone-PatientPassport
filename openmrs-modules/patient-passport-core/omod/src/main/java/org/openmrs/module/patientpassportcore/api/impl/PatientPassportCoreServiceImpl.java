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
import java.util.ArrayList;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import org.json.JSONObject;
import org.json.JSONArray;

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
			// Get API configuration
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			// Create patient data for API
			String patientData = createPatientPassportData(patient, universalId);
			
			// Make HTTP call to Patient Passport API
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients").openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			// Send patient data
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = patientData.getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200 || responseCode == 201) {
				log.info("Successfully registered patient " + patient.getUuid() + " with universal ID " + universalId + " to Patient Passport API");
				return true;
			} else {
				log.error("Failed to register patient with Patient Passport API. Response code: " + responseCode);
				return false;
			}
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

	@Override
	public PatientIdentifier getUniversalPatientId(Patient patient) {
		PatientIdentifierType universalIdType = getUniversalPatientIdentifierType();
		
		for (PatientIdentifier identifier : patient.getIdentifiers()) {
			if (identifier.getIdentifierType().equals(universalIdType)) {
				return identifier;
			}
		}
		
		return null;
	}

	@Override
	public String getPassportStatus(Patient patient) {
		PatientIdentifier universalId = getUniversalPatientId(patient);
		if (universalId == null) {
			return "NOT_CREATED";
		}
		
		// Check if patient exists in Patient Passport system
		try {
			boolean existsInPassport = checkPatientExistsInPassport(universalId.getIdentifier());
			return existsInPassport ? "ACTIVE" : "PENDING";
		} catch (Exception e) {
			log.error("Error checking passport status", e);
			return "UNKNOWN";
		}
	}

	@Override
	public boolean checkPatientExistsInPassport(String universalId) {
		try {
			// TODO: Implement HTTP call to Patient Passport API
			// This would check if the patient exists in the external system
			log.info("Checking if patient with universal ID " + universalId + " exists in passport system");
			return true; // Placeholder
		} catch (Exception e) {
			log.error("Error checking patient in passport system", e);
			return false;
		}
	}

	@Override
	public void syncPatientToPassport(String patientUuid, String patientData) {
		try {
			// TODO: Implement HTTP call to Patient Passport API
			// This would sync patient data to the external system
			log.info("Syncing patient " + patientUuid + " to passport system with data: " + patientData);
		} catch (Exception e) {
			log.error("Error syncing patient to passport", e);
			throw new APIException("Failed to sync patient to passport: " + e.getMessage());
		}
	}

	@Override
	public int getTotalPatientCount() {
		return dao.getTotalPatientCount();
	}

	@Override
	public int getSyncedPatientCount() {
		return dao.getSyncedPatientCount();
	}

	@Override
	public void syncAllPatients() {
		try {
			List<Patient> patients = Context.getPatientService().getAllPatients();
			for (Patient patient : patients) {
				PatientIdentifier universalId = getUniversalPatientId(patient);
				if (universalId != null) {
					String patientData = createPatientPassportData(patient, universalId);
					syncPatientToPassport(patient.getUuid(), patientData);
				}
			}
		} catch (Exception e) {
			log.error("Error syncing all patients", e);
			throw new APIException("Failed to sync all patients: " + e.getMessage());
		}
	}

	private String createPatientPassportData(Patient patient, PatientIdentifier universalId) {
		StringBuilder data = new StringBuilder();
		data.append("{");
		data.append("\"universalId\":\"").append(universalId.getIdentifier()).append("\",");
		data.append("\"openmrsId\":\"").append(patient.getUuid()).append("\",");
		data.append("\"firstName\":\"").append(patient.getGivenName()).append("\",");
		data.append("\"lastName\":\"").append(patient.getFamilyName()).append("\",");
		data.append("\"gender\":\"").append(patient.getGender()).append("\",");
		data.append("\"birthDate\":\"").append(patient.getBirthdate()).append("\",");
		
		// Get phone number attribute
		String phone = "";
		if (patient.getAttribute("Phone Number") != null) {
			phone = patient.getAttribute("Phone Number").getValue();
		}
		data.append("\"phone\":\"").append(phone).append("\",");
		
		// Get email attribute
		String email = "";
		if (patient.getAttribute("Email") != null) {
			email = patient.getAttribute("Email").getValue();
		}
		data.append("\"email\":\"").append(email).append("\",");
		
		// Get address
		String address = "";
		if (patient.getPersonAddress() != null) {
			address = patient.getPersonAddress().getAddressString();
		}
		data.append("\"address\":\"").append(address).append("\",");
		data.append("\"registrationDate\":\"").append(new Date()).append("\"");
		data.append("}");
		
		return data.toString();
	}
	
	// === CROSS-HOSPITAL ACCESS METHODS ===
	
	@Override
	public List<PatientPassportRecord> searchPatientAcrossHospitals(String searchCriteria) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients/search?q=" + searchCriteria).openConnection();
			connection.setRequestMethod("GET");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					response.append(line);
				}
				reader.close();
				
				return parsePatientSearchResponse(response.toString());
			}
		} catch (Exception e) {
			log.error("Error searching patients across hospitals", e);
		}
		return new ArrayList<>();
	}
	
	@Override
	public String getCompleteMedicalHistory(String universalId) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients/" + universalId + "/complete-history").openConnection();
			connection.setRequestMethod("GET");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					response.append(line);
				}
				reader.close();
				return response.toString();
			}
		} catch (Exception e) {
			log.error("Error getting complete medical history for patient " + universalId, e);
		}
		return "{}";
	}
	
	@Override
	public boolean sharePatientRecord(String universalId, String targetHospitalId, String sharingReason) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			JSONObject shareData = new JSONObject();
			shareData.put("universalId", universalId);
			shareData.put("targetHospitalId", targetHospitalId);
			shareData.put("sharingReason", sharingReason);
			shareData.put("sharedBy", Context.getAuthenticatedUser().getUserId());
			shareData.put("shareDate", new Date());
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients/share").openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = shareData.toString().getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200 || responseCode == 201) {
				log.info("Successfully shared patient " + universalId + " with hospital " + targetHospitalId);
				return true;
			}
		} catch (Exception e) {
			log.error("Error sharing patient record", e);
		}
		return false;
	}
	
	@Override
	public List<String> getAccessibleHospitals(String universalId) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients/" + universalId + "/accessible-hospitals").openConnection();
			connection.setRequestMethod("GET");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					response.append(line);
				}
				reader.close();
				
				JSONArray hospitals = new JSONArray(response.toString());
				List<String> hospitalList = new ArrayList<>();
				for (int i = 0; i < hospitals.length(); i++) {
					hospitalList.add(hospitals.getString(i));
				}
				return hospitalList;
			}
		} catch (Exception e) {
			log.error("Error getting accessible hospitals for patient " + universalId, e);
		}
		return new ArrayList<>();
	}
	
	@Override
	public boolean addMedicalEncounter(Patient patient, String encounterData, String doctorId) {
		try {
			PatientIdentifier universalId = getUniversalPatientId(patient);
			if (universalId == null) {
				universalId = generateUniversalPatientId(patient);
			}
			
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			JSONObject encounter = new JSONObject(encounterData);
			encounter.put("universalId", universalId.getIdentifier());
			encounter.put("doctorId", doctorId);
			encounter.put("hospitalId", Context.getAdministrationService().getGlobalProperty("patientpassportcore.hospital.id", ""));
			encounter.put("encounterDate", new Date());
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/medical-encounters").openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = encounter.toString().getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200 || responseCode == 201) {
				log.info("Successfully added medical encounter for patient " + universalId.getIdentifier());
				return true;
			}
		} catch (Exception e) {
			log.error("Error adding medical encounter", e);
		}
		return false;
	}
	
	@Override
	public boolean updateMedicalRecord(String universalId, String recordId, String updateData) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			JSONObject update = new JSONObject(updateData);
			update.put("updatedBy", Context.getAuthenticatedUser().getUserId());
			update.put("updateDate", new Date());
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/medical-records/" + recordId).openConnection();
			connection.setRequestMethod("PUT");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = update.toString().getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				log.info("Successfully updated medical record " + recordId + " for patient " + universalId);
				return true;
			}
		} catch (Exception e) {
			log.error("Error updating medical record", e);
		}
		return false;
	}
	
	@Override
	public String getPatientMedicalRecords(String universalId) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients/" + universalId + "/medical-records").openConnection();
			connection.setRequestMethod("GET");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					response.append(line);
				}
				reader.close();
				return response.toString();
			}
		} catch (Exception e) {
			log.error("Error getting medical records for patient " + universalId, e);
		}
		return "{}";
	}
	
	@Override
	public int syncPatientEncounters(Patient patient) {
		try {
			PatientIdentifier universalId = getUniversalPatientId(patient);
			if (universalId == null) {
				universalId = generateUniversalPatientId(patient);
			}
			
			List<Encounter> encounters = Context.getEncounterService().getEncountersByPatient(patient);
			int syncedCount = 0;
			
			for (Encounter encounter : encounters) {
				String encounterData = createEncounterData(encounter);
				if (addMedicalEncounter(patient, encounterData, encounter.getProvider().getIdentifier())) {
					syncedCount++;
				}
			}
			
			log.info("Synced " + syncedCount + " encounters for patient " + universalId.getIdentifier());
			return syncedCount;
		} catch (Exception e) {
			log.error("Error syncing patient encounters", e);
			return 0;
		}
	}
	
	@Override
	public String getSystemStatistics() {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/statistics").openConnection();
			connection.setRequestMethod("GET");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					response.append(line);
				}
				reader.close();
				return response.toString();
			}
		} catch (Exception e) {
			log.error("Error getting system statistics", e);
		}
		return "{}";
	}
	
	@Override
	public boolean registerHospitalInNetwork(String hospitalData) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/hospitals/register").openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = hospitalData.getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200 || responseCode == 201) {
				log.info("Successfully registered hospital in network");
				return true;
			}
		} catch (Exception e) {
			log.error("Error registering hospital in network", e);
		}
		return false;
	}
	
	@Override
	public List<String> getNetworkHospitals() {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/hospitals").openConnection();
			connection.setRequestMethod("GET");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;
				while ((line = reader.readLine()) != null) {
					response.append(line);
				}
				reader.close();
				
				JSONArray hospitals = new JSONArray(response.toString());
				List<String> hospitalList = new ArrayList<>();
				for (int i = 0; i < hospitals.length(); i++) {
					hospitalList.add(hospitals.getJSONObject(i).toString());
				}
				return hospitalList;
			}
		} catch (Exception e) {
			log.error("Error getting network hospitals", e);
		}
		return new ArrayList<>();
	}
	
	@Override
	public boolean updateHospitalInNetwork(String hospitalId, String updateData) {
		try {
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/hospitals/" + hospitalId).openConnection();
			connection.setRequestMethod("PUT");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = updateData.getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				log.info("Successfully updated hospital " + hospitalId + " in network");
				return true;
			}
		} catch (Exception e) {
			log.error("Error updating hospital in network", e);
		}
		return false;
	}
	
	@Override
	public List<AuditLog> getCrossHospitalAccessLogs(String universalId) {
		return new ArrayList<>();
	}
	
	@Override
	public boolean hasEmergencyAccess(User user) {
		return user.hasRole("Emergency Doctor") || user.hasRole("Emergency Nurse") || user.hasRole("System Administrator");
	}
	
	@Override
	public boolean updatePatientInPassport(Patient patient, String updateData) {
		try {
			PatientIdentifier universalId = getUniversalPatientId(patient);
			if (universalId == null) {
				universalId = generateUniversalPatientId(patient);
			}
			
			String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url", "http://localhost:3000/api");
			String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key", "");
			
			HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl + "/patients/" + universalId.getIdentifier()).openConnection();
			connection.setRequestMethod("PUT");
			connection.setRequestProperty("Content-Type", "application/json");
			connection.setRequestProperty("Authorization", "Bearer " + apiKey);
			connection.setDoOutput(true);
			
			try (OutputStream os = connection.getOutputStream()) {
				byte[] input = updateData.getBytes("utf-8");
				os.write(input, 0, input.length);
			}
			
			int responseCode = connection.getResponseCode();
			if (responseCode == 200) {
				log.info("Successfully updated patient " + universalId.getIdentifier() + " in passport");
				return true;
			}
		} catch (Exception e) {
			log.error("Error updating patient in passport", e);
		}
		return false;
	}
	
	// Helper methods
	private List<PatientPassportRecord> parsePatientSearchResponse(String jsonResponse) {
		List<PatientPassportRecord> records = new ArrayList<>();
		try {
			JSONArray patients = new JSONArray(jsonResponse);
			for (int i = 0; i < patients.length(); i++) {
				JSONObject patient = patients.getJSONObject(i);
				PatientPassportRecord record = new PatientPassportRecord();
				record.setUniversalId(patient.getString("universalId"));
				record.setPatientName(patient.getString("name"));
				record.setNationalId(patient.optString("nationalId", ""));
				record.setHospitalId(patient.optString("hospitalId", ""));
				record.setHospitalName(patient.optString("hospitalName", ""));
				record.setPassportStatus(patient.optString("status", "ACTIVE"));
				records.add(record);
			}
		} catch (Exception e) {
			log.error("Error parsing patient search response", e);
		}
		return records;
	}
	
	private String createEncounterData(Encounter encounter) {
		JSONObject encounterData = new JSONObject();
		encounterData.put("encounterId", encounter.getEncounterId());
		encounterData.put("encounterType", encounter.getEncounterType().getName());
		encounterData.put("encounterDate", encounter.getEncounterDatetime());
		encounterData.put("location", encounter.getLocation().getName());
		encounterData.put("provider", encounter.getProvider().getPersonName().getFullName());
		
		JSONArray observations = new JSONArray();
		for (Obs obs : encounter.getObs()) {
			JSONObject observation = new JSONObject();
			observation.put("concept", obs.getConcept().getName().getName());
			observation.put("value", obs.getValueAsString());
			observation.put("dateCreated", obs.getDateCreated());
			observations.put(observation);
		}
		encounterData.put("observations", observations);
		
		return encounterData.toString();
	}
}

