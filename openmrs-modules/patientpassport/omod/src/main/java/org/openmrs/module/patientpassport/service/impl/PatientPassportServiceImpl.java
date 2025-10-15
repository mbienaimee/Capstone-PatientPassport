package org.openmrs.module.patientpassport.service.impl;

import org.openmrs.api.AdministrationService;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.PatientPassportConfig;
import org.openmrs.module.patientpassport.service.PatientPassportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Implementation of PatientPassportService
 */
@Service("patientPassportService")
@Transactional
public class PatientPassportServiceImpl implements PatientPassportService {
    
    @Override
    public void onShutdown() {
        // Cleanup on shutdown
    }
    
    @Override
    public void onStartup() {
        // Initialize on startup
    }
    
    private AdministrationService adminService;
    
    public PatientPassportServiceImpl() {
        this.adminService = Context.getAdministrationService();
    }
    
    @Override
    public String getFrontendUrl() {
        return adminService.getGlobalProperty("patientpassport.frontend.url", 
                "https://jade-pothos-e432d0.netlify.app");
    }
    
    @Override
    public String getBackendUrl() {
        return adminService.getGlobalProperty("patientpassport.backend.url", 
                "https://capstone-patientpassport.onrender.com/api");
    }
    
    @Override
    public boolean isPatientContextEnabled() {
        String value = adminService.getGlobalProperty("patientpassport.enable_patient_context", "true");
        return "true".equalsIgnoreCase(value);
    }
    
    @Override
    public String getIframeHeight() {
        return adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
    }
    
    @Override
    public PatientPassportConfig getConfig() {
        return new PatientPassportConfig(
                getFrontendUrl(),
                getBackendUrl(),
                isPatientContextEnabled(),
                getIframeHeight()
        );
    }
    
    @Override
    public boolean testFrontendConnection() {
        return testConnection(getFrontendUrl());
    }
    
    @Override
    public boolean testBackendConnection() {
        return testConnection(getBackendUrl());
    }
    
    /**
     * Test connection to a given URL
     * @param urlString the URL to test
     * @return true if connection is successful
     */
    private boolean testConnection(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("HEAD");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            
            int responseCode = connection.getResponseCode();
            return responseCode >= 200 && responseCode < 400;
        } catch (IOException e) {
            System.err.println("Connection test failed for " + urlString + ": " + e.getMessage());
            return false;
        }
    }
}
