package org.openmrs.module.patientpassport.service;

/**
 * Service interface for Patient Passport module
 */
public interface PatientPassportService {
    
    /**
     * Get the frontend URL for the Patient Passport application
     * @return the frontend URL
     */
    String getFrontendUrl();
    
    /**
     * Get the backend URL for the Patient Passport API
     * @return the backend URL
     */
    String getBackendUrl();
    
    /**
     * Check if patient context is enabled
     * @return true if patient context is enabled
     */
    boolean isPatientContextEnabled();
    
    /**
     * Get the iframe height setting
     * @return the iframe height
     */
    String getIframeHeight();
}