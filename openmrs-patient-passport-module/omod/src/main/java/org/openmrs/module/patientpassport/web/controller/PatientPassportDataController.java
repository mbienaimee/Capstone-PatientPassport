package org.openmrs.module.patientpassport.web.controller;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.Person;
import org.openmrs.Obs;
import org.openmrs.api.PatientService;
import org.openmrs.api.ObsService;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportDataService;
import org.openmrs.module.patientpassport.service.impl.PatientPassportDataServiceImpl;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for sending patient data TO Patient Passport
 * Data Flow: OpenMRS → Patient Passport
 */
@Controller
@RequestMapping("/module/patientpassport/api")
public class PatientPassportDataController {
    
    private static final Log log = LogFactory.getLog(PatientPassportDataController.class);
    
    private final PatientPassportDataService dataService;
    
    public PatientPassportDataController() {
        this.dataService = new PatientPassportDataServiceImpl();
    }
    
    /**
     * Send observation to Patient Passport
     * POST /module/patientpassport/api/send/{obsId}
     * 
     * @param obsId The observation ID to send
     * @param observationType "diagnosis" or "medication"
     */
    @RequestMapping(value = "/send/{obsId}", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> sendObservationToPassport(
            @PathVariable("obsId") Integer obsId,
            @RequestParam("type") String observationType,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("📤 Sending observation " + obsId + " to Patient Passport");
            
            ObsService obsService = Context.getObsService();
            Obs obs = obsService.getObs(obsId);
            
            if (obs == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                result.put("success", false);
                result.put("message", "Observation not found");
                return result;
            }
            
            Person person = obs.getPerson();
            if (!(person instanceof Patient)) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                result.put("success", false);
                result.put("message", "Observation is not for a patient");
                return result;
            }
            
            Patient patient = (Patient) person;
            
            // Send to Passport
            boolean success = dataService.sendObservationToPassport(patient, obs, observationType);
            
            if (success) {
                result.put("success", true);
                result.put("message", "Observation sent to Patient Passport successfully");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                result.put("success", false);
                result.put("message", "Failed to send observation to Patient Passport");
            }
            
        } catch (Exception e) {
            log.error("Error sending observation to passport", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Error: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Sync patient mapping
     * POST /module/patientpassport/api/sync/{patientId}
     */
    @RequestMapping(value = "/sync/{patientId}", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> syncPatientMapping(
            @PathVariable("patientId") Integer patientId,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("🔄 Syncing patient mapping for patient ID: " + patientId);
            
            PatientService patientService = Context.getPatientService();
            Patient patient = patientService.getPatient(patientId);
            
            if (patient == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                result.put("success", false);
                result.put("message", "Patient not found");
                return result;
            }
            
            // Sync mapping
            boolean success = dataService.syncPatientMapping(patient);
            
            if (success) {
                result.put("success", true);
                result.put("message", "Patient mapping synced successfully");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                result.put("success", false);
                result.put("message", "Failed to sync patient mapping");
            }
            
        } catch (Exception e) {
            log.error("Error syncing patient mapping", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("message", "Error: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Health check
     * GET /module/patientpassport/api/health
     */
    @RequestMapping(value = "/health", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> healthCheck() {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "OpenMRS Patient Passport module is running");
        result.put("dataFlow", "OpenMRS → Patient Passport");
        return result;
    }
}
