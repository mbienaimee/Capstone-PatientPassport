package org.openmrs.module.patientpassport.web.controller;

import org.openmrs.api.context.Context;
import org.openmrs.api.AdministrationService;
import org.openmrs.api.PatientService;
import org.openmrs.Patient;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;

/**
 * Controller for Patient Passport module pages
 */
@Controller
public class PatientPassportController {
    
    @RequestMapping(value = "/module/patientpassport/patientPassport")
    public void patientPassport(ModelMap model, HttpServletRequest request) {
        AdministrationService adminService = Context.getAdministrationService();
        
        // Get configuration from global properties
        String frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", 
            "https://jade-pothos-e432d0.netlify.app");
        String iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
        Boolean enablePatientContext = Boolean.parseBoolean(
            adminService.getGlobalProperty("patientpassport.enable_patient_context", "true"));
        
        // Get patient context if available
        String patientId = request.getParameter("patientId");
        String passportUrl = frontendUrl;
        
        if (enablePatientContext && patientId != null) {
            try {
                PatientService patientService = Context.getPatientService();
                Patient patient = patientService.getPatientByUuid(patientId);
                if (patient != null) {
                    passportUrl = frontendUrl + "/patient/" + patientId;
                }
            } catch (Exception e) {
                // Log error but continue with default URL
                System.err.println("Error getting patient context: " + e.getMessage());
            }
        }
        
        model.addAttribute("passportUrl", passportUrl);
        model.addAttribute("iframeHeight", iframeHeight);
    }
    
    @RequestMapping(value = "/module/patientpassport/admin")
    public void admin(ModelMap model) {
        AdministrationService adminService = Context.getAdministrationService();
        
        // Get configuration from global properties
        String frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", 
            "https://jade-pothos-e432d0.netlify.app");
        String backendUrl = adminService.getGlobalProperty("patientpassport.backend.url", 
            "https://capstone-patientpassport.onrender.com/api");
        String enablePatientContext = adminService.getGlobalProperty("patientpassport.enable_patient_context", "true");
        String iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
        
        model.addAttribute("frontendUrl", frontendUrl);
        model.addAttribute("backendUrl", backendUrl);
        model.addAttribute("enablePatientContext", enablePatientContext);
        model.addAttribute("iframeHeight", iframeHeight);
    }
}

