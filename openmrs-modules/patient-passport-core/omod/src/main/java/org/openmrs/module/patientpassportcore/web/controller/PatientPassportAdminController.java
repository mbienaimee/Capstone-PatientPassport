package org.openmrs.module.patientpassportcore.web.controller;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassportcore.api.PatientPassportCoreService;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Controller for Patient Passport Administration page
 */
@Controller
@RequestMapping("/patientpassport/admin.page")
public class PatientPassportAdminController {

    protected final Log log = LogFactory.getLog(this.getClass());

    @RequestMapping(method = RequestMethod.GET)
    public String handleGet(ModelMap model, HttpServletRequest request) {
        try {
            PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
            
            // Get configuration values
            String apiUrl = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.url");
            String apiKey = Context.getAdministrationService().getGlobalProperty("patientpassportcore.api.key");
            boolean enableSync = Boolean.parseBoolean(Context.getAdministrationService().getGlobalProperty("patientpassportcore.enable.sync"));
            
            model.addAttribute("apiUrl", apiUrl != null ? apiUrl : "http://localhost:3000/api");
            model.addAttribute("apiKey", apiKey != null ? apiKey : "");
            model.addAttribute("enableSync", enableSync);
            
            // Get sync statistics
            int totalPatients = passportService.getTotalPatientCount();
            int syncedPatients = passportService.getSyncedPatientCount();
            int pendingSync = totalPatients - syncedPatients;
            
            model.addAttribute("totalPatients", totalPatients);
            model.addAttribute("syncedPatients", syncedPatients);
            model.addAttribute("pendingSync", pendingSync);
            
            // Get emergency override logs
            List<EmergencyOverride> emergencyOverrides = passportService.getEmergencyOverrideLogs();
            model.addAttribute("emergencyOverrides", emergencyOverrides);
            
        } catch (Exception e) {
            log.error("Error loading admin page", e);
            model.addAttribute("error", "Error loading administration page: " + e.getMessage());
        }
        
        return "/module/patientpassportcore/pages/admin";
    }

    @RequestMapping(method = RequestMethod.POST)
    public String handlePost(@RequestParam("apiUrl") String apiUrl,
                           @RequestParam("apiKey") String apiKey,
                           @RequestParam(value = "enableSync", required = false) boolean enableSync,
                           ModelMap model) {
        try {
            // Save configuration
            Context.getAdministrationService().setGlobalProperty("patientpassportcore.api.url", apiUrl);
            Context.getAdministrationService().setGlobalProperty("patientpassportcore.api.key", apiKey);
            Context.getAdministrationService().setGlobalProperty("patientpassportcore.enable.sync", String.valueOf(enableSync));
            
            model.addAttribute("message", "Configuration saved successfully");
            
        } catch (Exception e) {
            log.error("Error saving configuration", e);
            model.addAttribute("error", "Error saving configuration: " + e.getMessage());
        }
        
        return handleGet(model, null);
    }
}












