package org.openmrs.module.patientpassport.web.controller;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.User;
import org.openmrs.api.context.Context;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * Controller for Patient Passport web interface
 */
@Controller
@RequestMapping("/module/patientpassport")
public class PatientPassportController {
    
    private static final Log log = LogFactory.getLog(PatientPassportController.class);
    
    /**
     * Main management page
     */
    @RequestMapping(value = "/manage", method = RequestMethod.GET)
    public String manage(ModelMap model) {
        model.addAttribute("apiBaseUrl", "https://patientpassport-api.azurewebsites.net/api");
        model.addAttribute("frontendUrl", "https://patient-passpo.netlify.app/");
        model.addAttribute("otpEnabled", true);
        model.addAttribute("auditLogging", true);
        return "/module/patientpassport/manage";
    }
    
    /**
     * Full-screen iframe view of Patient Passport frontend
     */
    @RequestMapping(value = "/iframe", method = RequestMethod.GET)
    public String iframeView(ModelMap model) {
        try {
            User user = Context.getAuthenticatedUser();
            model.addAttribute("authenticatedUser", user);
            model.addAttribute("frontendUrl", "https://patient-passpo.netlify.app/");
            
            log.info("Loading Patient Passport iframe for user: " + user.getUsername());
            
            return "/module/patientpassport/iframe";
            
        } catch (Exception e) {
            log.error("Error loading Patient Passport iframe", e);
            model.addAttribute("error", "Error loading Patient Passport: " + e.getMessage());
            return "/module/patientpassport/error";
        }
    }
}
