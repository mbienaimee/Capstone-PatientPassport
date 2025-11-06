package org.openmrs.module.patientpassport.service.impl;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.openmrs.Patient;
import org.openmrs.User;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportService;
import org.openmrs.module.patientpassport.model.PatientPassportAccessLog;
import org.openmrs.module.patientpassport.model.PatientPassportSyncStatus;
import org.openmrs.module.patientpassport.dto.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

/**
 * Implementation of Patient Passport Service
 */
@Service
public class PatientPassportServiceImpl implements PatientPassportService {
    
    private static final Log log = LogFactory.getLog(PatientPassportServiceImpl.class);
    
    private static final String API_BASE_URL_KEY = "patientpassport.api.baseUrl";
    private static final String FRONTEND_URL_KEY = "patientpassport.frontend.url";
    private static final String API_TIMEOUT_KEY = "patientpassport.api.timeout";
    private static final String ENABLE_OTP_KEY = "patientpassport.enable.otp";
    private static final String AUDIT_LOGGING_KEY = "patientpassport.audit.logging";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClientBuilder.create().build();
    
    @Override
    public PatientPassportDTO getPatientPassport(Patient patient, User user, String accessType, String reason) {
        try {
            // Check permissions
            if (!hasPermission(patient, user, accessType)) {
                throw new SecurityException("Access denied. User does not have permission to access patient passport.");
            }
            
            // Log access
            if (isAuditLoggingEnabled()) {
                logAccess(patient, user, accessType, reason, false, false, null, null);
            }
            
            // Get patient passport mapping
            Map<String, String> mapping = getPatientPassportMapping(patient);
            String passportId = mapping.get("passportId");
            String nationalId = mapping.get("nationalId");
            
            if (passportId == null && nationalId == null) {
                throw new RuntimeException("Patient passport not found in external system");
            }
            
            // Make API call to external system
            String apiUrl = getApiBaseUrl() + "/patients/passport/" + 
                           (passportId != null ? passportId : patient.getPatientId());
            
            HttpGet request = new HttpGet(apiUrl);
            request.setHeader("Content-Type", "application/json");
            request.setHeader("Authorization", "Bearer " + generateAccessToken(user));
            
            HttpResponse response = httpClient.execute(request);
            HttpEntity entity = response.getEntity();
            
            if (response.getStatusLine().getStatusCode() == 200) {
                String responseBody = EntityUtils.toString(entity);
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                
                if (responseMap.containsKey("success") && (Boolean) responseMap.get("success")) {
                    Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
                    return convertToPatientPassportDTO(data);
                } else {
                    throw new RuntimeException("API returned error: " + responseMap.get("message"));
                }
            } else {
                throw new RuntimeException("API call failed with status: " + response.getStatusLine().getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error getting patient passport for patient " + patient.getPatientId(), e);
            throw new RuntimeException("Failed to retrieve patient passport: " + e.getMessage());
        }
    }
    
    @Override
    public PassportAccessResponseDTO requestPassportAccess(PassportAccessRequestDTO request) {
        try {
            if (!isOTPEnabled()) {
                // If OTP is disabled, return direct access
                return new PassportAccessResponseDTO(true, "Access granted without OTP verification");
            }
            
            String apiUrl = getApiBaseUrl() + "/passport-access/request-otp";
            
            HttpPost httpPost = new HttpPost(apiUrl);
            httpPost.setHeader("Content-Type", "application/json");
            
            String jsonRequest = objectMapper.writeValueAsString(request);
            StringEntity entity = new StringEntity(jsonRequest);
            httpPost.setEntity(entity);
            
            HttpResponse response = httpClient.execute(httpPost);
            HttpEntity responseEntity = response.getEntity();
            
            if (response.getStatusLine().getStatusCode() == 200) {
                String responseBody = EntityUtils.toString(responseEntity);
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                
                if (responseMap.containsKey("success") && (Boolean) responseMap.get("success")) {
                    Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
                    PassportAccessResponseDTO responseDTO = new PassportAccessResponseDTO(true, "OTP sent successfully");
                    responseDTO.setOtpSent((String) data.get("otpSent"));
                    responseDTO.setOtpExpiry((String) data.get("otpExpiry"));
                    return responseDTO;
                } else {
                    return new PassportAccessResponseDTO(false, (String) responseMap.get("message"));
                }
            } else {
                return new PassportAccessResponseDTO(false, "Failed to request OTP");
            }
            
        } catch (Exception e) {
            log.error("Error requesting passport access", e);
            return new PassportAccessResponseDTO(false, "Error requesting access: " + e.getMessage());
        }
    }
    
    @Override
    public PatientPassportDTO verifyOTPAndGetPassport(Integer patientId, String otp, User user) {
        try {
            Patient patient = Context.getPatientService().getPatient(patientId);
            if (patient == null) {
                throw new RuntimeException("Patient not found");
            }
            
            String apiUrl = getApiBaseUrl() + "/passport-access/verify-otp";
            
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("patientId", patientId);
            requestData.put("otp", otp);
            requestData.put("userId", user.getUserId());
            
            HttpPost httpPost = new HttpPost(apiUrl);
            httpPost.setHeader("Content-Type", "application/json");
            
            String jsonRequest = objectMapper.writeValueAsString(requestData);
            StringEntity entity = new StringEntity(jsonRequest);
            httpPost.setEntity(entity);
            
            HttpResponse response = httpClient.execute(httpPost);
            HttpEntity responseEntity = response.getEntity();
            
            if (response.getStatusLine().getStatusCode() == 200) {
                String responseBody = EntityUtils.toString(responseEntity);
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                
                if (responseMap.containsKey("success") && (Boolean) responseMap.get("success")) {
                    Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
                    
                    // Log successful access
                    if (isAuditLoggingEnabled()) {
                        logAccess(patient, user, "view", "OTP verified access", true, false, null, null);
                    }
                    
                    return convertToPatientPassportDTO(data);
                } else {
                    throw new RuntimeException("OTP verification failed: " + responseMap.get("message"));
                }
            } else {
                throw new RuntimeException("OTP verification failed");
            }
            
        } catch (Exception e) {
            log.error("Error verifying OTP and getting passport", e);
            throw new RuntimeException("Failed to verify OTP: " + e.getMessage());
        }
    }
    
    @Override
    public PatientPassportDTO emergencyAccess(EmergencyAccessDTO emergencyAccess) {
        try {
            Patient patient = Context.getPatientService().getPatient(emergencyAccess.getPatientId());
            User user = Context.getUserService().getUser(emergencyAccess.getUserId());
            
            if (patient == null || user == null) {
                throw new RuntimeException("Patient or user not found");
            }
            
            // Log emergency access
            if (isAuditLoggingEnabled()) {
                PatientPassportAccessLog accessLog = new PatientPassportAccessLog(patient, user, "emergency", emergencyAccess.getJustification());
                accessLog.setEmergencyOverride(true);
                accessLog.setEmergencyJustification(emergencyAccess.getJustification());
                accessLog.setEmergencyApprovedBy(Context.getUserService().getUser(emergencyAccess.getApprovedBy()));
                accessLog.setIpAddress(emergencyAccess.getIpAddress());
                accessLog.setUserAgent(emergencyAccess.getUserAgent());
                
                // Save access log (you would implement DAO for this)
                // patientPassportAccessLogDAO.save(accessLog);
            }
            
            // Get passport data
            return getPatientPassport(patient, user, "emergency", emergencyAccess.getJustification());
            
        } catch (Exception e) {
            log.error("Error in emergency access", e);
            throw new RuntimeException("Emergency access failed: " + e.getMessage());
        }
    }
    
    @Override
    public PatientPassportSyncStatus syncPatientData(Patient patient) {
        try {
            PatientPassportSyncStatus syncStatus = getSyncStatus(patient);
            if (syncStatus == null) {
                syncStatus = new PatientPassportSyncStatus(patient);
            }
            
            syncStatus.setSyncStatus("SYNCING");
            syncStatus.setLastSyncTimestamp(new Date());
            
            // Make API call to sync data
            String apiUrl = getApiBaseUrl() + "/patients/sync/" + patient.getPatientId();
            
            HttpPost httpPost = new HttpPost(apiUrl);
            httpPost.setHeader("Content-Type", "application/json");
            
            Map<String, Object> patientData = convertPatientToMap(patient);
            String jsonRequest = objectMapper.writeValueAsString(patientData);
            StringEntity entity = new StringEntity(jsonRequest);
            httpPost.setEntity(entity);
            
            HttpResponse response = httpClient.execute(httpPost);
            HttpEntity responseEntity = response.getEntity();
            
            if (response.getStatusLine().getStatusCode() == 200) {
                String responseBody = EntityUtils.toString(responseEntity);
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                
                if (responseMap.containsKey("success") && (Boolean) responseMap.get("success")) {
                    syncStatus.setSyncStatus("SUCCESS");
                    syncStatus.setSyncError(null);
                    
                    // Update passport mapping if provided
                    Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
                    if (data.containsKey("passportId")) {
                        updatePatientPassportMapping(patient, 
                            (String) data.get("passportId"),
                            (String) data.get("nationalId"),
                            (String) data.get("universalId"));
                    }
                } else {
                    syncStatus.setSyncStatus("ERROR");
                    syncStatus.setSyncError((String) responseMap.get("message"));
                }
            } else {
                syncStatus.setSyncStatus("ERROR");
                syncStatus.setSyncError("HTTP " + response.getStatusLine().getStatusCode());
            }
            
            return syncStatus;
            
        } catch (Exception e) {
            log.error("Error syncing patient data", e);
            PatientPassportSyncStatus syncStatus = getSyncStatus(patient);
            if (syncStatus == null) {
                syncStatus = new PatientPassportSyncStatus(patient);
            }
            syncStatus.setSyncStatus("ERROR");
            syncStatus.setSyncError(e.getMessage());
            return syncStatus;
        }
    }
    
    @Override
    public List<PatientPassportAccessLog> getAccessHistory(Patient patient, Integer limit) {
        // This would be implemented with DAO
        // return patientPassportAccessLogDAO.findByPatient(patient, limit);
        return new ArrayList<>();
    }
    
    @Override
    public void logAccess(Patient patient, User user, String accessType, String reason, 
                          Boolean otpVerified, Boolean emergencyOverride, String ipAddress, String userAgent) {
        try {
            PatientPassportAccessLog accessLog = new PatientPassportAccessLog(patient, user, accessType, reason);
            accessLog.setOtpVerified(otpVerified);
            accessLog.setEmergencyOverride(emergencyOverride);
            accessLog.setIpAddress(ipAddress);
            accessLog.setUserAgent(userAgent);
            
            // Save access log (implement with DAO)
            // patientPassportAccessLogDAO.save(accessLog);
            
            log.info("Logged access: Patient " + patient.getPatientId() + 
                    ", User " + user.getUserId() + 
                    ", Type " + accessType + 
                    ", Reason " + reason);
            
        } catch (Exception e) {
            log.error("Error logging access", e);
        }
    }
    
    @Override
    public Boolean hasPermission(Patient patient, User user, String accessType) {
        // Check if user has appropriate privileges
        if (Context.hasPrivilege("Patient Passport: View Patient Passport")) {
            return true;
        }
        
        if ("emergency".equals(accessType) && Context.hasPrivilege("Patient Passport: Access Emergency Override")) {
            return true;
        }
        
        return false;
    }
    
    @Override
    public String getConfiguration(String key) {
        return Context.getAdministrationService().getGlobalProperty(key);
    }
    
    @Override
    public void updateConfiguration(String key, String value) {
        Context.getAdministrationService().setGlobalProperty(key, value);
    }
    
    @Override
    public Map<String, String> getPatientPassportMapping(Patient patient) {
        Map<String, String> mapping = new HashMap<>();
        
        // This would be implemented with DAO to get from database
        // PatientPassportMapping dbMapping = patientPassportMappingDAO.findByPatient(patient);
        // if (dbMapping != null) {
        //     mapping.put("passportId", dbMapping.getPassportId());
        //     mapping.put("nationalId", dbMapping.getNationalId());
        //     mapping.put("universalId", dbMapping.getUniversalId());
        // }
        
        return mapping;
    }
    
    @Override
    public void updatePatientPassportMapping(Patient patient, String passportId, String nationalId, String universalId) {
        // This would be implemented with DAO
        // PatientPassportMapping mapping = patientPassportMappingDAO.findByPatient(patient);
        // if (mapping == null) {
        //     mapping = new PatientPassportMapping();
        //     mapping.setPatient(patient);
        // }
        // mapping.setPassportId(passportId);
        // mapping.setNationalId(nationalId);
        // mapping.setUniversalId(universalId);
        // mapping.setIsActive(true);
        // patientPassportMappingDAO.save(mapping);
    }
    
    @Override
    public Boolean hasPatientPassport(Patient patient) {
        Map<String, String> mapping = getPatientPassportMapping(patient);
        return mapping.containsKey("passportId") || mapping.containsKey("nationalId");
    }
    
    @Override
    public PatientPassportSyncStatus getSyncStatus(Patient patient) {
        // This would be implemented with DAO
        // return patientPassportSyncStatusDAO.findByPatient(patient);
        return null;
    }
    
    @Override
    public void updateSyncStatus(Patient patient, String status, String error) {
        PatientPassportSyncStatus syncStatus = getSyncStatus(patient);
        if (syncStatus == null) {
            syncStatus = new PatientPassportSyncStatus(patient);
        }
        syncStatus.setSyncStatus(status);
        syncStatus.setSyncError(error);
        syncStatus.setLastSyncTimestamp(new Date());
        
        // Save sync status (implement with DAO)
        // patientPassportSyncStatusDAO.save(syncStatus);
    }
    
    @Override
    public String getApiBaseUrl() {
        return getConfiguration(API_BASE_URL_KEY);
    }
    
    @Override
    public String getFrontendUrl() {
        return getConfiguration(FRONTEND_URL_KEY);
    }
    
    @Override
    public Integer getApiTimeout() {
        String timeout = getConfiguration(API_TIMEOUT_KEY);
        return timeout != null ? Integer.parseInt(timeout) : 30000;
    }
    
    @Override
    public Boolean isOTPEnabled() {
        String enabled = getConfiguration(ENABLE_OTP_KEY);
        return "true".equalsIgnoreCase(enabled);
    }
    
    @Override
    public Boolean isAuditLoggingEnabled() {
        String enabled = getConfiguration(AUDIT_LOGGING_KEY);
        return "true".equalsIgnoreCase(enabled);
    }
    
    // Helper methods
    private String generateAccessToken(User user) {
        // Generate access token for API authentication
        // This would typically involve JWT or similar token generation
        return "token_" + user.getUserId() + "_" + System.currentTimeMillis();
    }
    
    private PatientPassportDTO convertToPatientPassportDTO(Map<String, Object> data) {
        PatientPassportDTO dto = new PatientPassportDTO();
        
        // Convert the response data to DTO
        // This would involve mapping the JSON response to the DTO structure
        
        return dto;
    }
    
    private Map<String, Object> convertPatientToMap(Patient patient) {
        Map<String, Object> patientMap = new HashMap<>();
        patientMap.put("patientId", patient.getPatientId());
        patientMap.put("uuid", patient.getUuid());
        
        // Add other patient data as needed
        
        return patientMap;
    }
}
