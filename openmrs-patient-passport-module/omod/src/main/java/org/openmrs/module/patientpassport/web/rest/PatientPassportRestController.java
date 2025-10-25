package org.openmrs.module.patientpassport.web.rest;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.User;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportService;
import org.openmrs.module.patientpassport.dto.*;
import org.openmrs.module.webservices.rest.SimpleObject;
import org.openmrs.module.webservices.rest.web.RestConstants;
import org.openmrs.module.webservices.rest.web.annotation.Resource;
import org.openmrs.module.webservices.rest.web.representation.Representation;
import org.openmrs.module.webservices.rest.web.resource.api.PageableResult;
import org.openmrs.module.webservices.rest.web.resource.impl.BaseDelegatingCrudResource;
import org.openmrs.module.webservices.rest.web.resource.impl.DelegatingResourceDescription;
import org.openmrs.module.webservices.rest.web.resource.impl.NeedsPaging;
import org.openmrs.module.webservices.rest.web.response.ResponseException;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;

/**
 * REST Resource for Patient Passport operations
 */
@Component
@Resource(name = RestConstants.VERSION_1 + "/patientpassport", 
          supportedClass = PatientPassportDTO.class, 
          supportedOpenmrsVersions = {"2.5.*"})
public class PatientPassportRestController extends BaseDelegatingCrudResource<PatientPassportDTO> {
    
    private static final Log log = LogFactory.getLog(PatientPassportRestController.class);
    
    private PatientPassportService patientPassportService;
    
    public PatientPassportRestController() {
        this.patientPassportService = Context.getService(PatientPassportService.class);
    }
    
    @Override
    public PatientPassportDTO getByUniqueId(String uniqueId) {
        try {
            Integer patientId = Integer.parseInt(uniqueId);
            Patient patient = Context.getPatientService().getPatient(patientId);
            User user = Context.getAuthenticatedUser();
            
            if (patient == null) {
                throw new RuntimeException("Patient not found");
            }
            
            return patientPassportService.getPatientPassport(patient, user, "view", "REST API access");
            
        } catch (Exception e) {
            log.error("Error getting patient passport", e);
            throw new RuntimeException("Failed to retrieve patient passport: " + e.getMessage());
        }
    }
    
    @Override
    public PatientPassportDTO newDelegate() {
        return new PatientPassportDTO();
    }
    
    @Override
    public PatientPassportDTO save(PatientPassportDTO delegate) {
        // This would typically be used for updating passport data
        // Implementation depends on your specific requirements
        return delegate;
    }
    
    @Override
    public void purge(PatientPassportDTO delegate, RequestContext context) throws ResponseException {
        // Purge is not typically allowed for passport data
        throw new RuntimeException("Purge operation not supported for patient passport");
    }
    
    @Override
    public DelegatingResourceDescription getRepresentationDescription(Representation rep) {
        DelegatingResourceDescription description = new DelegatingResourceDescription();
        description.addProperty("passportId");
        description.addProperty("patientId");
        description.addProperty("nationalId");
        description.addProperty("universalId");
        description.addProperty("personalInfo");
        description.addProperty("medicalInfo");
        description.addProperty("testResults");
        description.addProperty("hospitalVisits");
        description.addProperty("insurance");
        description.addProperty("accessHistory");
        description.addProperty("lastUpdated");
        description.addProperty("lastUpdatedBy");
        description.addProperty("version");
        description.addProperty("isActive");
        return description;
    }
    
    @Override
    public DelegatingResourceDescription getCreatableProperties() {
        DelegatingResourceDescription description = new DelegatingResourceDescription();
        description.addProperty("patientId");
        description.addProperty("accessType");
        description.addProperty("reason");
        return description;
    }
    
    @Override
    public DelegatingResourceDescription getUpdatableProperties() {
        DelegatingResourceDescription description = new DelegatingResourceDescription();
        description.addProperty("personalInfo");
        description.addProperty("medicalInfo");
        description.addProperty("testResults");
        description.addProperty("hospitalVisits");
        description.addProperty("insurance");
        return description;
    }
    
    @Override
    public PageableResult doGetAll(RequestContext context) throws ResponseException {
        // This would typically return a list of patients with passport access
        // For now, return empty list
        return new NeedsPaging<>(new ArrayList<>(), context);
    }
    
    @Override
    public List<Representation> getAvailableRepresentations() {
        List<Representation> representations = new ArrayList<>();
        representations.add(Representation.DEFAULT);
        representations.add(Representation.FULL);
        return representations;
    }
    
    /**
     * Request OTP for passport access
     */
    public SimpleObject requestOTP(RequestContext context) throws ResponseException {
        try {
            String patientIdStr = context.getRequest().getParameter("patientId");
            String accessType = context.getRequest().getParameter("accessType");
            String reason = context.getRequest().getParameter("reason");
            
            if (patientIdStr == null) {
                throw new RuntimeException("Patient ID is required");
            }
            
            Integer patientId = Integer.parseInt(patientIdStr);
            User user = Context.getAuthenticatedUser();
            
            PassportAccessRequestDTO request = new PassportAccessRequestDTO();
            request.setPatientId(patientId);
            request.setUserId(user.getUserId());
            request.setAccessType(accessType != null ? accessType : "view");
            request.setReason(reason != null ? reason : "REST API OTP request");
            request.setIpAddress(context.getRequest().getRemoteAddr());
            request.setUserAgent(context.getRequest().getHeader("User-Agent"));
            
            PassportAccessResponseDTO response = patientPassportService.requestPassportAccess(request);
            
            SimpleObject result = new SimpleObject();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("otpSent", response.getOtpSent());
            result.put("otpExpiry", response.getOtpExpiry());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error requesting OTP", e);
            SimpleObject error = new SimpleObject();
            error.put("success", false);
            error.put("message", "Error requesting OTP: " + e.getMessage());
            return error;
        }
    }
    
    /**
     * Verify OTP and get passport
     */
    public SimpleObject verifyOTP(RequestContext context) throws ResponseException {
        try {
            String patientIdStr = context.getRequest().getParameter("patientId");
            String otp = context.getRequest().getParameter("otp");
            
            if (patientIdStr == null || otp == null) {
                throw new RuntimeException("Patient ID and OTP are required");
            }
            
            Integer patientId = Integer.parseInt(patientIdStr);
            User user = Context.getAuthenticatedUser();
            
            PatientPassportDTO passport = patientPassportService.verifyOTPAndGetPassport(patientId, otp, user);
            
            SimpleObject result = new SimpleObject();
            result.put("success", true);
            result.put("message", "OTP verified successfully");
            result.put("data", passport);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error verifying OTP", e);
            SimpleObject error = new SimpleObject();
            error.put("success", false);
            error.put("message", "Error verifying OTP: " + e.getMessage());
            return error;
        }
    }
    
    /**
     * Emergency access to patient passport
     */
    public SimpleObject emergencyAccess(RequestContext context) throws ResponseException {
        try {
            String patientIdStr = context.getRequest().getParameter("patientId");
            String justification = context.getRequest().getParameter("justification");
            
            if (patientIdStr == null || justification == null) {
                throw new RuntimeException("Patient ID and justification are required");
            }
            
            Integer patientId = Integer.parseInt(patientIdStr);
            User user = Context.getAuthenticatedUser();
            
            EmergencyAccessDTO emergencyAccess = new EmergencyAccessDTO();
            emergencyAccess.setPatientId(patientId);
            emergencyAccess.setUserId(user.getUserId());
            emergencyAccess.setJustification(justification);
            emergencyAccess.setIpAddress(context.getRequest().getRemoteAddr());
            emergencyAccess.setUserAgent(context.getRequest().getHeader("User-Agent"));
            emergencyAccess.setApprovedBy(user.getUserId()); // Self-approved for now
            
            PatientPassportDTO passport = patientPassportService.emergencyAccess(emergencyAccess);
            
            SimpleObject result = new SimpleObject();
            result.put("success", true);
            result.put("message", "Emergency access granted");
            result.put("data", passport);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error in emergency access", e);
            SimpleObject error = new SimpleObject();
            error.put("success", false);
            error.put("message", "Error in emergency access: " + e.getMessage());
            return error;
        }
    }
    
    /**
     * Sync patient data with external passport system
     */
    public SimpleObject syncPatient(RequestContext context) throws ResponseException {
        try {
            String patientIdStr = context.getRequest().getParameter("patientId");
            
            if (patientIdStr == null) {
                throw new RuntimeException("Patient ID is required");
            }
            
            Integer patientId = Integer.parseInt(patientIdStr);
            Patient patient = Context.getPatientService().getPatient(patientId);
            
            if (patient == null) {
                throw new RuntimeException("Patient not found");
            }
            
            PatientPassportSyncStatus syncStatus = patientPassportService.syncPatientData(patient);
            
            SimpleObject result = new SimpleObject();
            result.put("success", true);
            result.put("message", "Patient sync completed");
            result.put("syncStatus", syncStatus.getSyncStatus());
            result.put("lastSync", syncStatus.getLastSyncTimestamp());
            result.put("error", syncStatus.getSyncError());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error syncing patient", e);
            SimpleObject error = new SimpleObject();
            error.put("success", false);
            error.put("message", "Error syncing patient: " + e.getMessage());
            return error;
        }
    }
    
    /**
     * Get access history for a patient
     */
    public SimpleObject getAccessHistory(RequestContext context) throws ResponseException {
        try {
            String patientIdStr = context.getRequest().getParameter("patientId");
            String limitStr = context.getRequest().getParameter("limit");
            
            if (patientIdStr == null) {
                throw new RuntimeException("Patient ID is required");
            }
            
            Integer patientId = Integer.parseInt(patientIdStr);
            Integer limit = limitStr != null ? Integer.parseInt(limitStr) : 10;
            
            Patient patient = Context.getPatientService().getPatient(patientId);
            if (patient == null) {
                throw new RuntimeException("Patient not found");
            }
            
            List<PatientPassportAccessLog> accessHistory = patientPassportService.getAccessHistory(patient, limit);
            
            SimpleObject result = new SimpleObject();
            result.put("success", true);
            result.put("message", "Access history retrieved");
            result.put("data", accessHistory);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error getting access history", e);
            SimpleObject error = new SimpleObject();
            error.put("success", false);
            error.put("message", "Error getting access history: " + e.getMessage());
            return error;
        }
    }
    
    /**
     * Check if patient has passport
     */
    public SimpleObject hasPassport(RequestContext context) throws ResponseException {
        try {
            String patientIdStr = context.getRequest().getParameter("patientId");
            
            if (patientIdStr == null) {
                throw new RuntimeException("Patient ID is required");
            }
            
            Integer patientId = Integer.parseInt(patientIdStr);
            Patient patient = Context.getPatientService().getPatient(patientId);
            
            if (patient == null) {
                throw new RuntimeException("Patient not found");
            }
            
            Boolean hasPassport = patientPassportService.hasPatientPassport(patient);
            
            SimpleObject result = new SimpleObject();
            result.put("success", true);
            result.put("hasPassport", hasPassport);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error checking passport status", e);
            SimpleObject error = new SimpleObject();
            error.put("success", false);
            error.put("message", "Error checking passport status: " + e.getMessage());
            return error;
        }
    }
}
