package org.openmrs.module.patientpassport.service.impl;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.*;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportDataService;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Service implementation for SENDING data from OpenMRS TO Patient Passport
 * Data Flow: OpenMRS → Patient Passport (ONE WAY)
 * Doctors add data in OpenMRS, it automatically flows to Passport
 */
public class PatientPassportDataServiceImpl implements PatientPassportDataService {
    
    private static final Log log = LogFactory.getLog(PatientPassportDataServiceImpl.class);
    
    private static final String PASSPORT_API_BASE_URL = "https://patientpassport-api.azurewebsites.net/api";
    
    private final RestTemplate restTemplate;
    
    public PatientPassportDataServiceImpl() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Send observation (diagnosis or medication) from OpenMRS TO Patient Passport
     * This is called when a doctor adds data in OpenMRS
     */
    @Override
    public boolean sendObservationToPassport(Patient patient, Obs obs, String observationType) {
        
        // CRITICAL FIX: Ensure we have OpenMRS Context
        if (!Context.isSessionOpen()) {
            log.warn("⚠️ No OpenMRS session - opening one now");
            try {
                Context.openSession();
            } catch (Exception e) {
                log.error("❌ Failed to open OpenMRS session", e);
                return false;
            }
        }
        
        try {
            log.info("📤 ===========================================");
            log.info("📤 Sending " + observationType + " to Patient Passport");
            log.info("📤 Patient ID: " + patient.getPatientId());
            log.info("📤 Observation ID: " + obs.getObsId());
            log.info("📤 Concept: " + (obs.getConcept() != null ? obs.getConcept().getName().getName() : "NULL"));
            
            // Get patient name - CRITICAL FIELD
            String patientName = getPatientFullName(patient);
            log.info("   👤 Patient Name: [" + (patientName != null ? patientName : "NULL") + "]");
            
            if (patientName == null || patientName.trim().isEmpty()) {
                log.error("❌ FATAL: No name found for patient " + patient.getPatientId());
                log.error("   PersonName object: " + patient.getPersonName());
                if (patient.getPersonName() != null) {
                    log.error("   Given: " + patient.getPersonName().getGivenName());
                    log.error("   Family: " + patient.getPersonName().getFamilyName());
                    log.error("   Middle: " + patient.getPersonName().getMiddleName());
                }
                return false;
            }
            
            // Get hospital name from location - CRITICAL FIELD
            String hospitalName = "Unknown Hospital"; // Default
            if (obs.getLocation() != null && obs.getLocation().getName() != null) {
                hospitalName = obs.getLocation().getName();
            }
            log.info("   🏥 Hospital Name: [" + hospitalName + "]");
            
            // Get doctor license number - CRITICAL FIELD
            String doctorLicense = "OPENMRS_PROVIDER"; // Default fallback
            if (obs.getCreator() != null) {
                if (obs.getCreator().getUsername() != null && !obs.getCreator().getUsername().isEmpty()) {
                    doctorLicense = obs.getCreator().getUsername();
                    log.info("   👨‍⚕️ Using creator username: " + doctorLicense);
                } else if (obs.getCreator().getPerson() != null && obs.getCreator().getPerson().getPersonName() != null) {
                    String creatorName = obs.getCreator().getPerson().getPersonName().getFullName();
                    if (creatorName != null && !creatorName.isEmpty()) {
                        doctorLicense = creatorName.replaceAll("\\s+", "_");
                        log.info("   👨‍⚕️ Using creator name: " + doctorLicense);
                    }
                }
            }
            log.info("   👨‍⚕️ Doctor License: [" + doctorLicense + "]");
            
            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("patientName", patientName);
            requestBody.put("observationType", observationType);
            requestBody.put("doctorLicenseNumber", doctorLicense);
            requestBody.put("hospitalName", hospitalName);
            
            // Build observation data - CRITICAL: MUST NOT BE EMPTY!
            Map<String, Object> observationData = new HashMap<>();
            
            log.info("   📊 Building observation data for type: " + observationType);
            
            if ("diagnosis".equals(observationType)) {
                // Diagnosis data - TRY MULTIPLE SOURCES
                String diagnosisValue = null;
                
                // Try 1: valueText
                if (obs.getValueText() != null && !obs.getValueText().trim().isEmpty()) {
                    diagnosisValue = obs.getValueText().trim();
                    log.info("   ✅ Got diagnosis from valueText: " + diagnosisValue);
                }
                
                // Try 2: valueCoded
                if (diagnosisValue == null && obs.getValueCoded() != null) {
                    try {
                        diagnosisValue = obs.getValueCoded().getName().getName();
                        log.info("   ✅ Got diagnosis from valueCoded: " + diagnosisValue);
                    } catch (Exception e) {
                        log.warn("   ⚠️ Could not get valueCoded name: " + e.getMessage());
                    }
                }
                
                // Try 3: concept name (ALWAYS AVAILABLE)
                if (diagnosisValue == null && obs.getConcept() != null) {
                    try {
                        diagnosisValue = obs.getConcept().getName().getName();
                        log.info("   ✅ Got diagnosis from concept name: " + diagnosisValue);
                    } catch (Exception e) {
                        log.warn("   ⚠️ Could not get concept name: " + e.getMessage());
                    }
                }
                
                // Try 4: LAST RESORT - use concept display string
                if (diagnosisValue == null && obs.getConcept() != null) {
                    try {
                        diagnosisValue = obs.getConcept().getDisplayString();
                        log.info("   ✅ Got diagnosis from concept display: " + diagnosisValue);
                    } catch (Exception e) {
                        log.warn("   ⚠️ Could not get concept display: " + e.getMessage());
                    }
                }
                
                // CRITICAL: Never send null diagnosis
                if (diagnosisValue == null || diagnosisValue.trim().isEmpty()) {
                    log.error("❌ FATAL: Cannot determine diagnosis value for observation " + obs.getObsId());
                    log.error("   Concept: " + (obs.getConcept() != null ? obs.getConcept().getName().getName() : "NULL"));
                    log.error("   ValueText: " + obs.getValueText());
                    log.error("   ValueCoded: " + (obs.getValueCoded() != null ? "EXISTS" : "NULL"));
                    log.error("   ⚠️ USING FALLBACK VALUE");
                    diagnosisValue = "Observation recorded in OpenMRS";
                }
                
                observationData.put("diagnosis", diagnosisValue);
                observationData.put("details", obs.getComment() != null ? obs.getComment() : "Auto-synced from OpenMRS");
                observationData.put("status", "active");
                observationData.put("date", obs.getObsDatetime() != null ? obs.getObsDatetime() : new Date());
                
                log.info("   📊 Diagnosis built: " + diagnosisValue);
                
            } else if ("medication".equals(observationType)) {
                // Medication data - TRY MULTIPLE SOURCES
                String medicationName = null;
                
                // Try 1: valueText
                if (obs.getValueText() != null && !obs.getValueText().trim().isEmpty()) {
                    medicationName = obs.getValueText().trim();
                    log.info("   ✅ Got medication from valueText: " + medicationName);
                }
                
                // Try 2: valueDrug
                if (medicationName == null && obs.getValueDrug() != null) {
                    try {
                        medicationName = obs.getValueDrug().getName();
                        log.info("   ✅ Got medication from valueDrug: " + medicationName);
                    } catch (Exception e) {
                        log.warn("   ⚠️ Could not get valueDrug name: " + e.getMessage());
                    }
                }
                
                // Try 3: concept name (ALWAYS AVAILABLE)
                if (medicationName == null && obs.getConcept() != null) {
                    try {
                        medicationName = obs.getConcept().getName().getName();
                        log.info("   ✅ Got medication from concept name: " + medicationName);
                    } catch (Exception e) {
                        log.warn("   ⚠️ Could not get concept name: " + e.getMessage());
                    }
                }
                
                // Try 4: LAST RESORT - use concept display string
                if (medicationName == null && obs.getConcept() != null) {
                    try {
                        medicationName = obs.getConcept().getDisplayString();
                        log.info("   ✅ Got medication from concept display: " + medicationName);
                    } catch (Exception e) {
                        log.warn("   ⚠️ Could not get concept display: " + e.getMessage());
                    }
                }
                
                // CRITICAL: Never send null medication name
                if (medicationName == null || medicationName.trim().isEmpty()) {
                    log.error("❌ FATAL: Cannot determine medication name for observation " + obs.getObsId());
                    log.error("   ⚠️ USING FALLBACK VALUE");
                    medicationName = "Medication recorded in OpenMRS";
                }
                
                observationData.put("medicationName", medicationName);
                observationData.put("dosage", extractDosage(obs));
                observationData.put("frequency", "As prescribed");
                observationData.put("status", "active");
                observationData.put("startDate", obs.getObsDatetime() != null ? obs.getObsDatetime() : new Date());
                
                log.info("   📊 Medication built: " + medicationName);
                
            } else {
                // For all other observation types (finding, test, impression, etc.)
                String observationValue = obs.getValueText();
                if (observationValue == null && obs.getValueCoded() != null) {
                    observationValue = obs.getValueCoded().getName().getName();
                }
                
                // If still null, use concept name
                if (observationValue == null && obs.getConcept() != null) {
                    observationValue = obs.getConcept().getName().getName();
                }
                
                observationData.put("observationType", observationType);
                observationData.put("value", observationValue != null ? observationValue : "No value recorded");
                observationData.put("conceptName", obs.getConcept() != null ? obs.getConcept().getName().getName() : "Unknown");
                observationData.put("details", obs.getComment() != null ? obs.getComment() : "");
                observationData.put("date", obs.getObsDatetime());
            }
            
            log.info("   📊 Observation Data built: " + observationData.toString());
            log.info("   📊 Data size: " + observationData.size() + " fields");
            
            requestBody.put("observationData", observationData);
            
            // Validate all required fields before sending
            log.info("🔍 Validating required fields...");
            boolean isValid = true;
            
            if (patientName == null || patientName.trim().isEmpty()) {
                log.error("❌ VALIDATION FAILED: patientName is null or empty: [" + patientName + "]");
                isValid = false;
            } else {
                log.info("   ✅ patientName: " + patientName);
            }
            
            if (hospitalName == null || hospitalName.trim().isEmpty()) {
                log.error("❌ VALIDATION FAILED: hospitalName is null or empty: [" + hospitalName + "]");
                isValid = false;
            } else {
                log.info("   ✅ hospitalName: " + hospitalName);
            }
            
            if (doctorLicense == null || doctorLicense.trim().isEmpty()) {
                log.error("❌ VALIDATION FAILED: doctorLicense is null or empty: [" + doctorLicense + "]");
                isValid = false;
            } else {
                log.info("   ✅ doctorLicense: " + doctorLicense);
            }
            
            if (observationType == null || observationType.trim().isEmpty()) {
                log.error("❌ VALIDATION FAILED: observationType is null or empty: [" + observationType + "]");
                isValid = false;
            } else {
                log.info("   ✅ observationType: " + observationType);
            }
            
            if (observationData == null || observationData.isEmpty()) {
                log.error("❌ VALIDATION FAILED: observationData is null or empty");
                isValid = false;
            } else {
                log.info("   ✅ observationData: " + observationData.size() + " fields");
            }
            
            if (!isValid) {
                log.error("❌ Request validation failed. Not sending to Patient Passport.");
                return false;
            }
            
            log.info("✅ All validations passed!");
            log.info("📦 Full request body: " + requestBody.toString());
            
            // Send to Passport API
            String url = PASSPORT_API_BASE_URL + "/openmrs/observation/store";
            log.info("📡 Sending to: " + url);
            log.info("📦 Patient: " + patientName + ", Hospital: " + hospitalName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                log.info("✅ Successfully sent " + observationType + " to Patient Passport");
                return true;
            } else {
                log.warn("⚠️ Unexpected response: " + response.getStatusCode());
                return false;
            }
            
        } catch (HttpClientErrorException e) {
            log.error("❌ Error sending to Patient Passport API: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("❌ Error sending observation to Patient Passport", e);
            return false;
        }
    }
    
    /**
     * Sync patient mapping with passport system
     */
    @Override
    public boolean syncPatientMapping(Patient patient) {
        try {
            String patientName = getPatientFullName(patient);
            if (patientName == null || patientName.isEmpty()) {
                log.warn("Cannot sync patient without name");
                return false;
            }
            
            String url = PASSPORT_API_BASE_URL + "/openmrs/patient/sync";
            
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("patientName", patientName);
            requestBody.put("openmrsPatientUuid", patient.getUuid());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("✅ Successfully synced patient mapping for: " + patientName);
                return true;
            }
            return false;
            
        } catch (Exception e) {
            log.error("Error syncing patient mapping", e);
            return false;
        }
    }
    
    /**
     * Get patient full name (family name + given name)
     */
    private String getPatientFullName(Patient patient) {
        PersonName personName = patient.getPersonName();
        if (personName != null) {
            String fullName = "";
            if (personName.getGivenName() != null) {
                fullName += personName.getGivenName();
            }
            if (personName.getMiddleName() != null) {
                fullName += " " + personName.getMiddleName();
            }
            if (personName.getFamilyName() != null) {
                fullName += " " + personName.getFamilyName();
            }
            return fullName.trim();
        }
        return null;
    }
    
    /**
     * Extract dosage from observation
     */
    private String extractDosage(Obs obs) {
        // Try to extract dosage from comment or value
        if (obs.getComment() != null && obs.getComment().contains("dosage")) {
            return obs.getComment();
        }
        if (obs.getValueNumeric() != null) {
            return obs.getValueNumeric().toString();
        }
        return "As prescribed";
    }
}
