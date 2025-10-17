package org.openmrs.module.patientpassport.service.impl;

import org.openmrs.api.context.Context;
import org.openmrs.api.AdministrationService;
import org.openmrs.module.patientpassport.service.PatientPassportService;
import org.springframework.stereotype.Service;

/**
 * Implementation of PatientPassportService
 */
@Service("patientpassport.PatientPassportService")
public class PatientPassportServiceImpl implements PatientPassportService {
    
    @Override
    public String getFrontendUrl() {
        AdministrationService adminService = Context.getAdministrationService();
        return adminService.getGlobalProperty("patientpassport.frontend.url", 
            "https://jade-pothos-e432d0.netlify.app");
    }
    
    @Override
    public String getBackendUrl() {
        AdministrationService adminService = Context.getAdministrationService();
        return adminService.getGlobalProperty("patientpassport.backend.url", 
            "https://capstone-patientpassport.onrender.com/api");
    }
    
    @Override
    public boolean isPatientContextEnabled() {
        AdministrationService adminService = Context.getAdministrationService();
        return Boolean.parseBoolean(
            adminService.getGlobalProperty("patientpassport.enable_patient_context", "true"));
    }
    
    @Override
    public String getIframeHeight() {
        AdministrationService adminService = Context.getAdministrationService();
        return adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
    }
}