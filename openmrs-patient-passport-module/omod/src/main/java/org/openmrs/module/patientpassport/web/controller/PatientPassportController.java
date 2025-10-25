package org.openmrs.module.patientpassport.web.controller;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.User;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportService;
import org.openmrs.module.patientpassport.dto.*;
import org.openmrs.module.web.extension.AdministrationSectionExt;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Patient Passport web interface
 */
@Controller
public class PatientPassportController extends AdministrationSectionExt {
    
    private static final Log log = LogFactory.getLog(PatientPassportController.class);
    
    private PatientPassportService patientPassportService;
    
    public PatientPassportController() {
        this.patientPassportService = Context.getService(PatientPassportService.class);
    }
    
    @Override
    public String getTitle() {
        return Context.getMessageSourceService().getMessage("patientpassport.title");
    }
    
    @Override
    public String getRequiredPrivilege() {
        return "Patient Passport: View Patient Passport";
    }
    
    @Override
    public String getUrl() {
        return "patientpassport/manage";
    }
    
    /**
     * Main management page
     */
    @RequestMapping(value = "/module/patientpassport/manage", method = RequestMethod.GET)
    public String manage(ModelMap model) {
        model.addAttribute("apiBaseUrl", patientPassportService.getApiBaseUrl());
        model.addAttribute("frontendUrl", patientPassportService.getFrontendUrl());
        model.addAttribute("otpEnabled", patientPassportService.isOTPEnabled());
        model.addAttribute("auditLogging", patientPassportService.isAuditLoggingEnabled());
        return "/module/patientpassport/manage";
    }
    
    /**
     * Patient passport view page
     */
    @RequestMapping(value = "/module/patientpassport/view", method = RequestMethod.GET)
    public String viewPassport(@RequestParam("patientId") Integer patientId, ModelMap model) {
        try {
            Patient patient = Context.getPatientService().getPatient(patientId);
            User user = Context.getAuthenticatedUser();
            
            if (patient == null) {
                model.addAttribute("error", "Patient not found");
                return "/module/patientpassport/error";
            }
            
            // Check if patient has passport
            Boolean hasPassport = patientPassportService.hasPatientPassport(patient);
            model.addAttribute("hasPassport", hasPassport);
            model.addAttribute("patient", patient);
            model.addAttribute("patientId", patientId);
            model.addAttribute("otpEnabled", patientPassportService.isOTPEnabled());
            
            if (hasPassport) {
                // Get passport data
                PatientPassportDTO passport = patientPassportService.getPatientPassport(
                    patient, user, "view", "Web interface access");
                model.addAttribute("passport", passport);
            }
            
            return "/module/patientpassport/view";
            
        } catch (Exception e) {
            log.error("Error viewing patient passport", e);
            model.addAttribute("error", "Error loading patient passport: " + e.getMessage());
            return "/module/patientpassport/error";
        }
    }
    
    /**
     * Request OTP for passport access
     */
    @RequestMapping(value = "/module/patientpassport/requestOtp", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> requestOtp(@RequestParam("patientId") Integer patientId,
                                         @RequestParam("accessType") String accessType,
                                         @RequestParam("reason") String reason,
                                         HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = Context.getAuthenticatedUser();
            
            PassportAccessRequestDTO accessRequest = new PassportAccessRequestDTO();
            accessRequest.setPatientId(patientId);
            accessRequest.setUserId(user.getUserId());
            accessRequest.setAccessType(accessType);
            accessRequest.setReason(reason);
            accessRequest.setIpAddress(request.getRemoteAddr());
            accessRequest.setUserAgent(request.getHeader("User-Agent"));
            
            PassportAccessResponseDTO otpResponse = patientPassportService.requestPassportAccess(accessRequest);
            
            response.put("success", otpResponse.getSuccess());
            response.put("message", otpResponse.getMessage());
            response.put("otpSent", otpResponse.getOtpSent());
            response.put("otpExpiry", otpResponse.getOtpExpiry());
            
        } catch (Exception e) {
            log.error("Error requesting OTP", e);
            response.put("success", false);
            response.put("message", "Error requesting OTP: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Verify OTP and get passport
     */
    @RequestMapping(value = "/module/patientpassport/verifyOtp", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> verifyOtp(@RequestParam("patientId") Integer patientId,
                                        @RequestParam("otp") String otp) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = Context.getAuthenticatedUser();
            
            PatientPassportDTO passport = patientPassportService.verifyOTPAndGetPassport(patientId, otp, user);
            
            response.put("success", true);
            response.put("message", "OTP verified successfully");
            response.put("passport", passport);
            
        } catch (Exception e) {
            log.error("Error verifying OTP", e);
            response.put("success", false);
            response.put("message", "Error verifying OTP: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Emergency access to patient passport
     */
    @RequestMapping(value = "/module/patientpassport/emergencyAccess", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> emergencyAccess(@RequestParam("patientId") Integer patientId,
                                              @RequestParam("justification") String justification,
                                              HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = Context.getAuthenticatedUser();
            
            EmergencyAccessDTO emergencyAccess = new EmergencyAccessDTO();
            emergencyAccess.setPatientId(patientId);
            emergencyAccess.setUserId(user.getUserId());
            emergencyAccess.setJustification(justification);
            emergencyAccess.setIpAddress(request.getRemoteAddr());
            emergencyAccess.setUserAgent(request.getHeader("User-Agent"));
            emergencyAccess.setApprovedBy(user.getUserId());
            
            PatientPassportDTO passport = patientPassportService.emergencyAccess(emergencyAccess);
            
            response.put("success", true);
            response.put("message", "Emergency access granted");
            response.put("passport", passport);
            
        } catch (Exception e) {
            log.error("Error in emergency access", e);
            response.put("success", false);
            response.put("message", "Error in emergency access: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Sync patient data
     */
    @RequestMapping(value = "/module/patientpassport/syncPatient", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> syncPatient(@RequestParam("patientId") Integer patientId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Patient patient = Context.getPatientService().getPatient(patientId);
            
            if (patient == null) {
                response.put("success", false);
                response.put("message", "Patient not found");
                return response;
            }
            
            PatientPassportSyncStatus syncStatus = patientPassportService.syncPatientData(patient);
            
            response.put("success", true);
            response.put("message", "Patient sync completed");
            response.put("syncStatus", syncStatus.getSyncStatus());
            response.put("lastSync", syncStatus.getLastSyncTimestamp());
            response.put("error", syncStatus.getSyncError());
            
        } catch (Exception e) {
            log.error("Error syncing patient", e);
            response.put("success", false);
            response.put("message", "Error syncing patient: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Get access history
     */
    @RequestMapping(value = "/module/patientpassport/accessHistory", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> getAccessHistory(@RequestParam("patientId") Integer patientId,
                                               @RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Patient patient = Context.getPatientService().getPatient(patientId);
            
            if (patient == null) {
                response.put("success", false);
                response.put("message", "Patient not found");
                return response;
            }
            
            List<PatientPassportAccessLog> accessHistory = patientPassportService.getAccessHistory(patient, limit);
            
            response.put("success", true);
            response.put("message", "Access history retrieved");
            response.put("data", accessHistory);
            
        } catch (Exception e) {
            log.error("Error getting access history", e);
            response.put("success", false);
            response.put("message", "Error getting access history: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Update configuration
     */
    @RequestMapping(value = "/module/patientpassport/updateConfig", method = RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> updateConfig(@RequestParam("key") String key,
                                           @RequestParam("value") String value) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            patientPassportService.updateConfiguration(key, value);
            
            response.put("success", true);
            response.put("message", "Configuration updated successfully");
            
        } catch (Exception e) {
            log.error("Error updating configuration", e);
            response.put("success", false);
            response.put("message", "Error updating configuration: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Get configuration
     */
    @RequestMapping(value = "/module/patientpassport/getConfig", method = RequestMethod.GET)
    @ResponseBody
    public Map<String, Object> getConfig(@RequestParam("key") String key) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String value = patientPassportService.getConfiguration(key);
            
            response.put("success", true);
            response.put("value", value);
            
        } catch (Exception e) {
            log.error("Error getting configuration", e);
            response.put("success", false);
            response.put("message", "Error getting configuration: " + e.getMessage());
        }
        
        return response;
    }
}
