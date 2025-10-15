package org.openmrs.module.patientpassport.web.controller;

import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportService;

import java.util.Map;

/**
 * Controller for the Patient Passport admin page
 */
public class PatientPassportAdminController {
    
    private PatientPassportService patientPassportService;
    
    public void controller(Map<String, Object> model) {
        patientPassportService = Context.getService(PatientPassportService.class);
        
        // Get all configuration values
        String frontendUrl = patientPassportService.getFrontendUrl();
        String backendUrl = patientPassportService.getBackendUrl();
        boolean enablePatientContext = patientPassportService.isPatientContextEnabled();
        String iframeHeight = patientPassportService.getIframeHeight();
        
        // Add to model
        model.put("frontendUrl", frontendUrl);
        model.put("backendUrl", backendUrl);
        model.put("enablePatientContext", enablePatientContext);
        model.put("iframeHeight", iframeHeight);
        
        // Add module information
        model.put("moduleVersion", "1.0.0");
        model.put("openmrsVersion", "2.5.0+");
    }
}
