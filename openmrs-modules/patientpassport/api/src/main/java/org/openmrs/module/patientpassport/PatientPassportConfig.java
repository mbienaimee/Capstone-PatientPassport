package org.openmrs.module.patientpassport;

/**
 * Configuration class for Patient Passport module
 */
public class PatientPassportConfig {
    
    private String frontendUrl;
    private String backendUrl;
    private boolean enablePatientContext;
    private String iframeHeight;
    
    public PatientPassportConfig() {
        // Default values
        this.frontendUrl = "https://jade-pothos-e432d0.netlify.app";
        this.backendUrl = "https://capstone-patientpassport.onrender.com/api";
        this.enablePatientContext = true;
        this.iframeHeight = "90vh";
    }
    
    public PatientPassportConfig(String frontendUrl, String backendUrl, 
                               boolean enablePatientContext, String iframeHeight) {
        this.frontendUrl = frontendUrl;
        this.backendUrl = backendUrl;
        this.enablePatientContext = enablePatientContext;
        this.iframeHeight = iframeHeight;
    }
    
    // Getters and Setters
    public String getFrontendUrl() {
        return frontendUrl;
    }
    
    public void setFrontendUrl(String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }
    
    public String getBackendUrl() {
        return backendUrl;
    }
    
    public void setBackendUrl(String backendUrl) {
        this.backendUrl = backendUrl;
    }
    
    public boolean isEnablePatientContext() {
        return enablePatientContext;
    }
    
    public void setEnablePatientContext(boolean enablePatientContext) {
        this.enablePatientContext = enablePatientContext;
    }
    
    public String getIframeHeight() {
        return iframeHeight;
    }
    
    public void setIframeHeight(String iframeHeight) {
        this.iframeHeight = iframeHeight;
    }
    
    @Override
    public String toString() {
        return "PatientPassportConfig{" +
                "frontendUrl='" + frontendUrl + '\'' +
                ", backendUrl='" + backendUrl + '\'' +
                ", enablePatientContext=" + enablePatientContext +
                ", iframeHeight='" + iframeHeight + '\'' +
                '}';
    }
}


