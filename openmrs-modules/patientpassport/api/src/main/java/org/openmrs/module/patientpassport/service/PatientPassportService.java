package org.openmrs.module.patientpassport.service;

import org.openmrs.api.OpenmrsService;
import org.openmrs.module.patientpassport.PatientPassportConfig;

/**
 * Service interface for Patient Passport module
 */
public interface PatientPassportService extends OpenmrsService {
    
    /**
     * Get the frontend URL from global properties
     * @return the frontend URL
     */
    String getFrontendUrl();
    
    /**
     * Get the backend URL from global properties
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
    
    /**
     * Get the complete configuration
     * @return PatientPassportConfig object
     */
    PatientPassportConfig getConfig();
    
    /**
     * Test connection to frontend
     * @return true if connection is successful
     */
    boolean testFrontendConnection();
    
    /**
     * Test connection to backend
     * @return true if connection is successful
     */
    boolean testBackendConnection();
}


