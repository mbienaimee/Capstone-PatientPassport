package org.openmrs.module.patientpassport.model;

import org.openmrs.BaseOpenmrsData;
import org.openmrs.Patient;
import org.openmrs.User;

import java.util.Date;

/**
 * Model for Patient Passport Access Log
 */
public class PatientPassportAccessLog extends BaseOpenmrsData {
    
    private Integer accessLogId;
    private Patient patient;
    private User user;
    private String accessType;
    private String accessReason;
    private Boolean otpVerified;
    private Boolean emergencyOverride;
    private String emergencyJustification;
    private User emergencyApprovedBy;
    private Date emergencyExpiresAt;
    private String ipAddress;
    private String userAgent;
    private Date accessTimestamp;
    
    // Constructors
    public PatientPassportAccessLog() {}
    
    public PatientPassportAccessLog(Patient patient, User user, String accessType, String accessReason) {
        this.patient = patient;
        this.user = user;
        this.accessType = accessType;
        this.accessReason = accessReason;
        this.accessTimestamp = new Date();
    }
    
    // Getters and Setters
    @Override
    public Integer getId() {
        return accessLogId;
    }
    
    @Override
    public void setId(Integer id) {
        this.accessLogId = id;
    }
    
    public Integer getAccessLogId() {
        return accessLogId;
    }
    
    public void setAccessLogId(Integer accessLogId) {
        this.accessLogId = accessLogId;
    }
    
    public Patient getPatient() {
        return patient;
    }
    
    public void setPatient(Patient patient) {
        this.patient = patient;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getAccessType() {
        return accessType;
    }
    
    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }
    
    public String getAccessReason() {
        return accessReason;
    }
    
    public void setAccessReason(String accessReason) {
        this.accessReason = accessReason;
    }
    
    public Boolean getOtpVerified() {
        return otpVerified;
    }
    
    public void setOtpVerified(Boolean otpVerified) {
        this.otpVerified = otpVerified;
    }
    
    public Boolean getEmergencyOverride() {
        return emergencyOverride;
    }
    
    public void setEmergencyOverride(Boolean emergencyOverride) {
        this.emergencyOverride = emergencyOverride;
    }
    
    public String getEmergencyJustification() {
        return emergencyJustification;
    }
    
    public void setEmergencyJustification(String emergencyJustification) {
        this.emergencyJustification = emergencyJustification;
    }
    
    public User getEmergencyApprovedBy() {
        return emergencyApprovedBy;
    }
    
    public void setEmergencyApprovedBy(User emergencyApprovedBy) {
        this.emergencyApprovedBy = emergencyApprovedBy;
    }
    
    public Date getEmergencyExpiresAt() {
        return emergencyExpiresAt;
    }
    
    public void setEmergencyExpiresAt(Date emergencyExpiresAt) {
        this.emergencyExpiresAt = emergencyExpiresAt;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public Date getAccessTimestamp() {
        return accessTimestamp;
    }
    
    public void setAccessTimestamp(Date accessTimestamp) {
        this.accessTimestamp = accessTimestamp;
    }
}
