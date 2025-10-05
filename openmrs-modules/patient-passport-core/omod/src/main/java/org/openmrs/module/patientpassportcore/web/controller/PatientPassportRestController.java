package org.openmrs.module.patientpassportcore.web.controller;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.User;
import org.openmrs.api.APIException;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassportcore.api.PatientPassportCoreService;
import org.openmrs.module.patientpassportcore.model.AuditLog;
import org.openmrs.module.patientpassportcore.model.EmergencyOverride;
import org.openmrs.module.webservices.rest.SimpleObject;
import org.openmrs.module.webservices.rest.web.RestConstants;
import org.openmrs.module.webservices.rest.web.annotation.Resource;
import org.openmrs.module.webservices.rest.web.representation.Representation;
import org.openmrs.module.webservices.rest.web.resource.api.PageableResult;
import org.openmrs.module.webservices.rest.web.resource.impl.BaseDelegatingResource;
import org.openmrs.module.webservices.rest.web.resource.impl.DelegatingResourceDescription;
import org.openmrs.module.webservices.rest.web.resource.impl.NeedsPaging;
import org.openmrs.module.webservices.rest.web.response.ResponseException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

/**
 * REST API controller for Patient Passport Core functionality
 */
@Controller
@RequestMapping("/rest/" + RestConstants.VERSION_1 + "/patientpassport")
@Resource(name = RestConstants.VERSION_1 + "/patientpassport", supportedClass = Patient.class, supportedOpenmrsVersions = {"2.0.*", "2.1.*", "2.2.*", "2.3.*", "2.4.*", "2.5.*"})
public class PatientPassportRestController {
	
	protected final Log log = LogFactory.getLog(this.getClass());
	
	/**
	 * Generate universal patient ID
	 */
	@RequestMapping(value = "/generate-universal-id", method = RequestMethod.POST)
	@ResponseBody
	public SimpleObject generateUniversalId(@RequestParam("patientUuid") String patientUuid) {
		try {
			PatientService patientService = Context.getPatientService();
			Patient patient = patientService.getPatientByUuid(patientUuid);
			
			if (patient == null) {
				throw new APIException("Patient not found");
			}
			
			PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
			PatientIdentifier universalId = passportService.generateUniversalPatientId(patient);
			
			SimpleObject response = new SimpleObject();
			response.put("success", true);
			response.put("universalId", universalId.getIdentifier());
			response.put("message", "Universal ID generated successfully");
			
			return response;
		} catch (Exception e) {
			log.error("Error generating universal ID", e);
			SimpleObject response = new SimpleObject();
			response.put("success", false);
			response.put("message", "Error generating universal ID: " + e.getMessage());
			return response;
		}
	}
	
	/**
	 * Find patient by universal ID
	 */
	@RequestMapping(value = "/find-by-universal-id", method = RequestMethod.GET)
	@ResponseBody
	public SimpleObject findPatientByUniversalId(@RequestParam("universalId") String universalId) {
		try {
			PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
			Patient patient = passportService.findPatientByUniversalId(universalId);
			
			SimpleObject response = new SimpleObject();
			if (patient != null) {
				response.put("success", true);
				response.put("patient", convertPatientToSimpleObject(patient));
			} else {
				response.put("success", false);
				response.put("message", "Patient not found");
			}
			
			return response;
		} catch (Exception e) {
			log.error("Error finding patient by universal ID", e);
			SimpleObject response = new SimpleObject();
			response.put("success", false);
			response.put("message", "Error finding patient: " + e.getMessage());
			return response;
		}
	}
	
	/**
	 * Perform emergency override
	 */
	@RequestMapping(value = "/emergency-override", method = RequestMethod.POST)
	@ResponseBody
	public SimpleObject performEmergencyOverride(
			@RequestParam("patientUuid") String patientUuid,
			@RequestParam("justification") String justification,
			HttpServletRequest request) {
		try {
			PatientService patientService = Context.getPatientService();
			Patient patient = patientService.getPatientByUuid(patientUuid);
			
			if (patient == null) {
				throw new APIException("Patient not found");
			}
			
			User currentUser = Context.getAuthenticatedUser();
			PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
			EmergencyOverride override = passportService.performEmergencyOverride(currentUser, patient, justification);
			
			SimpleObject response = new SimpleObject();
			response.put("success", true);
			response.put("overrideId", override.getId());
			response.put("accessTime", override.getAccessTime());
			response.put("message", "Emergency override granted");
			
			return response;
		} catch (Exception e) {
			log.error("Error performing emergency override", e);
			SimpleObject response = new SimpleObject();
			response.put("success", false);
			response.put("message", "Error performing emergency override: " + e.getMessage());
			return response;
		}
	}
	
	/**
	 * Get audit logs for a patient
	 */
	@RequestMapping(value = "/audit-logs", method = RequestMethod.GET)
	@ResponseBody
	public SimpleObject getAuditLogs(@RequestParam("patientUuid") String patientUuid) {
		try {
			PatientService patientService = Context.getPatientService();
			Patient patient = patientService.getPatientByUuid(patientUuid);
			
			if (patient == null) {
				throw new APIException("Patient not found");
			}
			
			PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
			List<AuditLog> auditLogs = passportService.getAuditLogsForPatient(patient);
			
			List<SimpleObject> auditLogObjects = new ArrayList<>();
			for (AuditLog auditLog : auditLogs) {
				auditLogObjects.add(convertAuditLogToSimpleObject(auditLog));
			}
			
			SimpleObject response = new SimpleObject();
			response.put("success", true);
			response.put("auditLogs", auditLogObjects);
			
			return response;
		} catch (Exception e) {
			log.error("Error getting audit logs", e);
			SimpleObject response = new SimpleObject();
			response.put("success", false);
			response.put("message", "Error getting audit logs: " + e.getMessage());
			return response;
		}
	}
	
	/**
	 * Get emergency override logs
	 */
	@RequestMapping(value = "/emergency-override-logs", method = RequestMethod.GET)
	@ResponseBody
	public SimpleObject getEmergencyOverrideLogs() {
		try {
			PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
			List<EmergencyOverride> overrides = passportService.getEmergencyOverrideLogs();
			
			List<SimpleObject> overrideObjects = new ArrayList<>();
			for (EmergencyOverride override : overrides) {
				overrideObjects.add(convertEmergencyOverrideToSimpleObject(override));
			}
			
			SimpleObject response = new SimpleObject();
			response.put("success", true);
			response.put("emergencyOverrides", overrideObjects);
			
			return response;
		} catch (Exception e) {
			log.error("Error getting emergency override logs", e);
			SimpleObject response = new SimpleObject();
			response.put("success", false);
			response.put("message", "Error getting emergency override logs: " + e.getMessage());
			return response;
		}
	}
	
	private SimpleObject convertPatientToSimpleObject(Patient patient) {
		SimpleObject patientObj = new SimpleObject();
		patientObj.put("uuid", patient.getUuid());
		patientObj.put("display", patient.getPersonName().getFullName());
		patientObj.put("gender", patient.getGender());
		patientObj.put("birthdate", patient.getBirthdate());
		
		// Add universal ID if exists
		PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
		PatientIdentifier universalId = null;
		for (PatientIdentifier identifier : patient.getIdentifiers()) {
			if (identifier.getIdentifierType().equals(passportService.getUniversalPatientIdentifierType())) {
				universalId = identifier;
				break;
			}
		}
		
		if (universalId != null) {
			patientObj.put("universalId", universalId.getIdentifier());
		}
		
		return patientObj;
	}
	
	private SimpleObject convertAuditLogToSimpleObject(AuditLog auditLog) {
		SimpleObject auditObj = new SimpleObject();
		auditObj.put("id", auditLog.getId());
		auditObj.put("user", auditLog.getUser().getUsername());
		auditObj.put("patient", auditLog.getPatient().getPersonName().getFullName());
		auditObj.put("accessType", auditLog.getAccessType());
		auditObj.put("action", auditLog.getAction());
		auditObj.put("details", auditLog.getDetails());
		auditObj.put("accessTime", auditLog.getAccessTime());
		auditObj.put("ipAddress", auditLog.getIpAddress());
		
		return auditObj;
	}
	
	private SimpleObject convertEmergencyOverrideToSimpleObject(EmergencyOverride override) {
		SimpleObject overrideObj = new SimpleObject();
		overrideObj.put("id", override.getId());
		overrideObj.put("user", override.getUser().getUsername());
		overrideObj.put("patient", override.getPatient().getPersonName().getFullName());
		overrideObj.put("justification", override.getJustification());
		overrideObj.put("accessTime", override.getAccessTime());
		overrideObj.put("ipAddress", override.getIpAddress());
		
		return overrideObj;
	}
}

