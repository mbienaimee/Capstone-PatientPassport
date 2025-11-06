package org.openmrs.module.patientpassport.service;

import org.openmrs.Patient;
import org.openmrs.User;
import org.openmrs.module.patientpassport.model.PatientPassportAccessLog;
import org.openmrs.module.patientpassport.model.PatientPassportSyncStatus;
import org.openmrs.module.patientpassport.dto.PatientPassportDTO;
import org.openmrs.module.patientpassport.dto.PassportAccessRequestDTO;
import org.openmrs.module.patientpassport.dto.PassportAccessResponseDTO;
import org.openmrs.module.patientpassport.dto.EmergencyAccessDTO;

import java.util.List;
import java.util.Map;

/**
 * Service interface for Patient Passport operations
 */
public interface PatientPassportService {

    /**
     * Get patient passport data from external API
     * @param patient OpenMRS Patient object
     * @param user User requesting access
     * @param accessType Type of access (view, update, emergency)
     * @param reason Reason for access
     * @return PatientPassportDTO containing passport data
     */
    PatientPassportDTO getPatientPassport(Patient patient, User user, String accessType, String reason);

    /**
     * Request access to patient passport with OTP verification
     * @param request Access request details
     * @return Access response with OTP details
     */
    PassportAccessResponseDTO requestPassportAccess(PassportAccessRequestDTO request);

    /**
     * Verify OTP and grant access to patient passport
     * @param patientId Patient ID
     * @param otp OTP code
     * @param user User requesting access
     * @return PatientPassportDTO if OTP is valid
     */
    PatientPassportDTO verifyOTPAndGetPassport(Integer patientId, String otp, User user);

    /**
     * Emergency access to patient passport
     * @param emergencyAccess Emergency access details
     * @return PatientPassportDTO
     */
    PatientPassportDTO emergencyAccess(EmergencyAccessDTO emergencyAccess);

    /**
     * Sync patient data with external passport system
     * @param patient Patient to sync
     * @return Sync status
     */
    PatientPassportSyncStatus syncPatientData(Patient patient);

    /**
     * Get access history for a patient
     * @param patient Patient
     * @param limit Number of records to return
     * @return List of access logs
     */
    List<PatientPassportAccessLog> getAccessHistory(Patient patient, Integer limit);

    /**
     * Log access to patient passport
     * @param patient Patient
     * @param user User accessing
     * @param accessType Type of access
     * @param reason Reason for access
     * @param otpVerified Whether OTP was verified
     * @param emergencyOverride Whether emergency override was used
     * @param ipAddress IP address of request
     * @param userAgent User agent string
     */
    void logAccess(Patient patient, User user, String accessType, String reason, 
                   Boolean otpVerified, Boolean emergencyOverride, String ipAddress, String userAgent);

    /**
     * Check if user has permission to access patient passport
     * @param patient Patient
     * @param user User requesting access
     * @param accessType Type of access requested
     * @return True if user has permission
     */
    Boolean hasPermission(Patient patient, User user, String accessType);

    /**
     * Get configuration value
     * @param key Configuration key
     * @return Configuration value
     */
    String getConfiguration(String key);

    /**
     * Update configuration value
     * @param key Configuration key
     * @param value Configuration value
     */
    void updateConfiguration(String key, String value);

    /**
     * Get patient passport mapping
     * @param patient Patient
     * @return Map containing passport identifiers
     */
    Map<String, String> getPatientPassportMapping(Patient patient);

    /**
     * Create or update patient passport mapping
     * @param patient Patient
     * @param passportId Passport ID from external system
     * @param nationalId National ID
     * @param universalId Universal ID
     */
    void updatePatientPassportMapping(Patient patient, String passportId, String nationalId, String universalId);

    /**
     * Check if patient has passport in external system
     * @param patient Patient
     * @return True if patient has passport
     */
    Boolean hasPatientPassport(Patient patient);

    /**
     * Get sync status for patient
     * @param patient Patient
     * @return Sync status
     */
    PatientPassportSyncStatus getSyncStatus(Patient patient);

    /**
     * Update sync status
     * @param patient Patient
     * @param status Sync status
     * @param error Error message if any
     */
    void updateSyncStatus(Patient patient, String status, String error);

    /**
     * Get API base URL
     * @return API base URL
     */
    String getApiBaseUrl();

    /**
     * Get frontend URL
     * @return Frontend URL
     */
    String getFrontendUrl();

    /**
     * Get API timeout
     * @return API timeout in milliseconds
     */
    Integer getApiTimeout();

    /**
     * Check if OTP is enabled
     * @return True if OTP is enabled
     */
    Boolean isOTPEnabled();

    /**
     * Check if audit logging is enabled
     * @return True if audit logging is enabled
     */
    Boolean isAuditLoggingEnabled();
}
