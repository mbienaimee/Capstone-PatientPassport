package org.openmrs.module.patientpassport.api;

import org.openmrs.Obs;
import org.openmrs.Patient;
import org.openmrs.PersonName;
import org.openmrs.api.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;

/**
 * Service for syncing OpenMRS data to Patient Passport
 * Handles API communication and data transformation
 */
public class PatientPassportService {
    
    private static final Logger log = LoggerFactory.getLogger(PatientPassportService.class);
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    /**
     * Syncs an observation to the Patient Passport system
     */
    public void syncObservationToPassport(Obs observation, Patient patient) throws Exception {
        log.info("🚀 Starting Patient Passport sync for observation: {}", observation.getUuid());
        
        try {
            // Get configuration
            PatientPassportConfig config = new PatientPassportConfig();
            String apiUrl = config.getApiBaseUrl();
            
            if (apiUrl == null || apiUrl.trim().isEmpty()) {
                throw new Exception("Patient Passport API URL not configured");
            }
            
            // Build observation data
            String observationData = buildObservationJson(observation, patient);
            
            // Send to Patient Passport API (using OpenMRS integration endpoint)
            sendToPatientPassport(apiUrl + "/openmrs/observation/store", observationData);
            
            log.info("✅ Successfully synced observation to Patient Passport");
            
        } catch (Exception e) {
            log.error("❌ Failed to sync observation to Patient Passport: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Builds JSON payload for Patient Passport API (OpenMRS Integration Format)
     */
    private String buildObservationJson(Obs observation, Patient patient) {
        try {
            PersonName name = patient.getPersonName();
            String conceptName = observation.getConcept().getName().getName().toLowerCase();
            String observationType = determineObservationType(conceptName);
            String observationValue = getObservationValue(observation);
            
            // Build observation data structure
            StringBuilder observationData = new StringBuilder();
            observationData.append("{");
            observationData.append("\"concept\": \"").append(escapeJson(observation.getConcept().getName().getName())).append("\",");
            observationData.append("\"value\": \"").append(escapeJson(observationValue)).append("\",");
            observationData.append("\"datatype\": \"").append(observation.getConcept().getDatatype().getName()).append("\",");
            observationData.append("\"obsDatetime\": \"").append(DATE_FORMAT.format(observation.getObsDatetime())).append("\",");
            observationData.append("\"uuid\": \"").append(observation.getUuid()).append("\",");
            observationData.append("\"location\": \"").append(observation.getLocation() != null ? 
                    escapeJson(observation.getLocation().getName()) : "OpenMRS").append("\"");
            observationData.append("}");
            
            // Build main JSON payload matching backend expected format
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"patientName\": \"").append(escapeJson(name.getFullName())).append("\",");
            json.append("\"observationType\": \"").append(observationType).append("\",");
            json.append("\"observationData\": ").append(observationData.toString()).append(",");
            json.append("\"doctorLicenseNumber\": \"OPENMRS_SYSTEM\",");
            json.append("\"hospitalName\": \"").append(observation.getLocation() != null ? 
                    escapeJson(observation.getLocation().getName()) : "OpenMRS Hospital").append("\"");
            json.append("}");
            
            String result = json.toString();
            log.debug("📋 Built Patient Passport observation JSON: {}", result);
            return result;
            
        } catch (Exception e) {
            log.error("💥 Error building observation JSON: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to build observation data", e);
        }
    }
    
    /**
     * Determines observation type based on concept name
     */
    private String determineObservationType(String conceptName) {
        // Map OpenMRS concept names to Patient Passport observation types
        if (conceptName.contains("diagnosis") || conceptName.contains("condition") || 
            conceptName.contains("problem") || conceptName.contains("disease")) {
            return "diagnosis";
        } else if (conceptName.contains("medication") || conceptName.contains("drug") || 
                   conceptName.contains("prescription") || conceptName.contains("treatment")) {
            return "medication";
        } else {
            // Default to diagnosis for other observations
            return "diagnosis";
        }
    }
    
    /**
     * Gets the observation value as string
     */
    private String getObservationValue(Obs observation) {
        if (observation.getValueText() != null) {
            return observation.getValueText();
        } else if (observation.getValueNumeric() != null) {
            return observation.getValueNumeric().toString();
        } else if (observation.getValueCoded() != null) {
            return observation.getValueCoded().getName().getName();
        } else if (observation.getValueDatetime() != null) {
            return DATE_FORMAT.format(observation.getValueDatetime());
        } else if (observation.getValueBoolean() != null) {
            return observation.getValueBoolean().toString();
        } else {
            return "N/A";
        }
    }
    
    /**
     * Escapes JSON string values
     */
    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
    
    /**
     * Sends HTTP POST request to Patient Passport API
     */
    private void sendToPatientPassport(String apiUrl, String jsonData) throws Exception {
        log.info("📡 Sending to Patient Passport API: {}", apiUrl);
        
        URL url = new URL(apiUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        try {
            // Configure connection
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("User-Agent", "OpenMRS-PatientPassport/1.0.0");
            connection.setDoOutput(true);
            connection.setConnectTimeout(10000); // 10 seconds
            connection.setReadTimeout(30000);    // 30 seconds
            
            // Send data
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonData.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Check response
            int responseCode = connection.getResponseCode();
            
            if (responseCode >= 200 && responseCode < 300) {
                log.info("✅ Patient Passport API responded with: {}", responseCode);
                
                // Read success response
                try (BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    String response = br.readLine();
                    log.debug("📨 API Response: {}", response);
                }
            } else {
                // Read error response
                String errorResponse = "";
                try (BufferedReader br = new BufferedReader(new InputStreamReader(connection.getErrorStream()))) {
                    errorResponse = br.readLine();
                } catch (Exception e) {
                    errorResponse = "Unable to read error response";
                }
                
                log.error("❌ Patient Passport API error {}: {}", responseCode, errorResponse);
                throw new Exception("API returned error " + responseCode + ": " + errorResponse);
            }
            
        } finally {
            connection.disconnect();
        }
    }
}