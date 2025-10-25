package org.openmrs.module.patientpassport.dto;

/**
 * DTO for Passport Access Request
 */
public class PassportAccessRequestDTO {
    
    private Integer patientId;
    private Integer userId;
    private String accessType;
    private String reason;
    private String ipAddress;
    private String userAgent;
    
    // Constructors
    public PassportAccessRequestDTO() {}
    
    public PassportAccessRequestDTO(Integer patientId, Integer userId, String accessType, String reason) {
        this.patientId = patientId;
        this.userId = userId;
        this.accessType = accessType;
        this.reason = reason;
    }
    
    // Getters and Setters
    public Integer getPatientId() {
        return patientId;
    }
    
    public void setPatientId(Integer patientId) {
        this.patientId = patientId;
    }
    
    public Integer getUserId() {
        return userId;
    }
    
    public void setUserId(Integer userId) {
        this.userId = userId;
    }
    
    public String getAccessType() {
        return accessType;
    }
    
    public void setAccessType(String accessType) {
        this.accessType = accessType;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
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
}
