package org.openmrs.module.patientpassport.config;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.api.context.Context;

/**
 * Configuration utility for Patient Passport module
 * Manages settings from OpenMRS global properties
 */
public class PatientPassportConfig {
    
    private static final Log log = LogFactory.getLog(PatientPassportConfig.class);
    
    // Global property keys
    private static final String API_BASE_URL_PROPERTY = "patientpassport.api.baseUrl";
    private static final String FRONTEND_URL_PROPERTY = "patientpassport.frontend.url";
    private static final String SYNC_ENABLED_PROPERTY = "patientpassport.sync.enabled";
    
    // Default values
    private static final String DEFAULT_API_URL = "http://localhost:5000/api";
    private static final String DEFAULT_FRONTEND_URL = "https://patient-passpo.netlify.app/";
    
    /**
     * Gets the Patient Passport API base URL
     */
    public String getApiBaseUrl() {
        try {
            String url = Context.getAdministrationService().getGlobalProperty(API_BASE_URL_PROPERTY);
            if (url == null || url.trim().isEmpty()) {
                log.warn("Patient Passport API URL not configured, using default: " + DEFAULT_API_URL);
                return DEFAULT_API_URL;
            }
            
            // Remove trailing slash if present
            if (url.endsWith("/")) {
                url = url.substring(0, url.length() - 1);
            }
            
            log.info("Using Patient Passport API URL: " + url);
            return url;
            
        } catch (Exception e) {
            log.error("Error getting API URL, using default: " + e.getMessage());
            return DEFAULT_API_URL;
        }
    }
    
    /**
     * Gets the Patient Passport frontend URL
     */
    public String getFrontendUrl() {
        try {
            String url = Context.getAdministrationService().getGlobalProperty(FRONTEND_URL_PROPERTY);
            if (url == null || url.trim().isEmpty()) {
                log.warn("Patient Passport frontend URL not configured, using default: " + DEFAULT_FRONTEND_URL);
                return DEFAULT_FRONTEND_URL;
            }
            
            log.info("Using Patient Passport frontend URL: " + url);
            return url;
            
        } catch (Exception e) {
            log.error("Error getting frontend URL, using default: " + e.getMessage());
            return DEFAULT_FRONTEND_URL;
        }
    }
    
    /**
     * Checks if Patient Passport sync is enabled
     */
    public boolean isSyncEnabled() {
        try {
            String enabled = Context.getAdministrationService().getGlobalProperty(SYNC_ENABLED_PROPERTY);
            
            // Default to enabled if not explicitly disabled
            if (enabled == null || enabled.trim().isEmpty()) {
                return true;
            }
            
            boolean isEnabled = "true".equalsIgnoreCase(enabled.trim());
            log.info("Patient Passport sync enabled: " + isEnabled);
            return isEnabled;
            
        } catch (Exception e) {
            log.error("Error checking sync status, defaulting to enabled: " + e.getMessage());
            return true;
        }
    }
    
    /**
     * Validates the current configuration
     */
    public boolean validateConfiguration() {
        try {
            String apiUrl = getApiBaseUrl();
            String frontendUrl = getFrontendUrl();
            boolean syncEnabled = isSyncEnabled();
            
            if (apiUrl == null || !apiUrl.startsWith("http")) {
                log.error("Invalid API URL configuration: " + apiUrl);
                return false;
            }
            
            if (frontendUrl == null || !frontendUrl.startsWith("http")) {
                log.error("Invalid frontend URL configuration: " + frontendUrl);
                return false;
            }
            
            log.info("Patient Passport configuration valid - API: " + apiUrl + ", Frontend: " + frontendUrl + ", Sync: " + syncEnabled);
            return true;
            
        } catch (Exception e) {
            log.error("Configuration validation failed: " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Logs current configuration for debugging
     */
    public void logConfiguration() {
        log.info("Patient Passport Configuration:");
        log.info("   API Base URL: " + getApiBaseUrl());
        log.info("   Frontend URL: " + getFrontendUrl());
        log.info("   Sync Enabled: " + isSyncEnabled());
        log.info("   Configuration Valid: " + validateConfiguration());
    }
}
