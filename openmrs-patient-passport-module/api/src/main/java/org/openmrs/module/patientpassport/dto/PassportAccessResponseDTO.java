package org.openmrs.module.patientpassport.dto;

/**
 * DTO for Passport Access Response
 */
public class PassportAccessResponseDTO {
    
    private Boolean success;
    private String message;
    private String otpSent;
    private String otpExpiry;
    private String accessToken;
    private Integer expiresIn;
    
    // Constructors
    public PassportAccessResponseDTO() {}
    
    public PassportAccessResponseDTO(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    // Getters and Setters
    public Boolean getSuccess() {
        return success;
    }
    
    public void setSuccess(Boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getOtpSent() {
        return otpSent;
    }
    
    public void setOtpSent(String otpSent) {
        this.otpSent = otpSent;
    }
    
    public String getOtpExpiry() {
        return otpExpiry;
    }
    
    public void setOtpExpiry(String otpExpiry) {
        this.otpExpiry = otpExpiry;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public Integer getExpiresIn() {
        return expiresIn;
    }
    
    public void setExpiresIn(Integer expiresIn) {
        this.expiresIn = expiresIn;
    }
}
