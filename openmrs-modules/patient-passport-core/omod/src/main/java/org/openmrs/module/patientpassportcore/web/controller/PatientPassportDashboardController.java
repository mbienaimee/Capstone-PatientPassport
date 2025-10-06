package org.openmrs.module.patientpassportcore.web.controller;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassportcore.api.PatientPassportCoreService;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Controller for Patient Passport Dashboard page
 */
@Controller
@RequestMapping("/patientpassport/patientDashboard.page")
public class PatientPassportDashboardController {

    protected final Log log = LogFactory.getLog(this.getClass());

    @RequestMapping(method = RequestMethod.GET)
    public String handleGet(@RequestParam("patientId") Integer patientId, ModelMap model, HttpServletRequest request) {
        try {
            PatientService patientService = Context.getPatientService();
            Patient patient = patientService.getPatient(patientId);
            
            if (patient == null) {
                model.addAttribute("error", "Patient not found");
                return "/module/patientpassportcore/pages/patientDashboard";
            }
            
            PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
            
            // Get universal ID
            PatientIdentifier universalId = passportService.getUniversalPatientId(patient);
            String universalIdString = universalId != null ? universalId.getIdentifier() : null;
            model.addAttribute("universalId", universalIdString);
            
            // Get passport status
            String passportStatus = passportService.getPassportStatus(patient);
            model.addAttribute("passportStatus", passportStatus);
            
            // Get audit logs
            List<AuditLog> auditLogs = passportService.getAuditLogsForPatient(patient);
            model.addAttribute("auditLogs", auditLogs);
            
            // Add patient to model
            model.addAttribute("patient", patient);
            
        } catch (Exception e) {
            log.error("Error loading patient dashboard", e);
            model.addAttribute("error", "Error loading patient passport dashboard: " + e.getMessage());
        }
        
        return "/module/patientpassportcore/pages/patientDashboard";
    }
}












