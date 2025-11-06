package org.openmrs.module.patientpassport.dto;

/**
 * DTO for Emergency Access
 */
public class EmergencyAccessDTO {
    
    private Integer patientId;
    private Integer userId;
    private String justification;
    private String ipAddress;
    private String userAgent;
    private Integer approvedBy;
    
    // Constructors
    public EmergencyAccessDTO() {}
    
    public EmergencyAccessDTO(Integer patientId, Integer userId, String justification) {
        this.patientId = patientId;
        this.userId = userId;
        this.justification = justification;
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
    
    public String getJustification() {
        return justification;
    }
    
    public void setJustification(String justification) {
        this.justification = justification;
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
    
    public Integer getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(Integer approvedBy) {
        this.approvedBy = approvedBy;
    }
}
