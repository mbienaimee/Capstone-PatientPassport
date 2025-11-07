package org.openmrs.module.patientpassport.advice;

import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Obs;
import org.openmrs.Patient;
import org.openmrs.api.context.Context;
import org.openmrs.module.patientpassport.service.PatientPassportDataService;

import java.util.concurrent.CompletableFuture;

public class ObservationSaveAdvice implements MethodInterceptor {
    
    private static final Log log = LogFactory.getLog(ObservationSaveAdvice.class);
    
    private PatientPassportDataService dataService;
    
    public ObservationSaveAdvice() {
        log.info("========================================");
        log.info("🚀 ObservationSaveAdvice CONSTRUCTOR CALLED - AOP Interceptor Bean Created!");
        log.info("========================================");
    }
    
    /**
     * Spring setter injection for the data service
     */
    public void setDataService(PatientPassportDataService dataService) {
        this.dataService = dataService;
        log.info("✅ PatientPassportDataService injected into ObservationSaveAdvice");
    }
    
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        log.info("========================================");
        log.info("🎯 AOP INTERCEPTING! Method: " + invocation.getMethod().getName());
        log.info("========================================");
        
        boolean sessionOpened = false;
        boolean wasAuthenticated = false;
        
        try {
            //  CRITICAL FIX: Ensure OpenMRS Context session is available BEFORE method execution
            if (!Context.isSessionOpen()) {
                log.info("📂 No session open - opening new session for method execution");
                Context.openSession();
                sessionOpened = true;
                
                // If we opened the session, we need to authenticate
                try {
                    if (!Context.isAuthenticated()) {
                        log.info("🔐 Not authenticated - using daemon authentication");
                        Context.becomeUser("daemon");
                        wasAuthenticated = true;
                    }
                } catch (Exception e) {
                    log.warn("⚠️ Could not authenticate as daemon: " + e.getMessage());
                }
            } else {
                log.info("✅ Session already open");
            }
            
            // Execute the actual method (saveObs, etc.)
            log.info("⚙️ Executing method: " + invocation.getMethod().getName());
            Object result = invocation.proceed();
            
            // Sync observation to Patient Passport AFTER successful execution
            if (result instanceof Obs) {
                Obs obs = (Obs) result;
                log.info("✅ Observation saved successfully!");
                log.info("   - ID: " + obs.getObsId());
                log.info("   - UUID: " + obs.getUuid());
                log.info("   - Concept: " + (obs.getConcept() != null ? obs.getConcept().getName() : "null"));
                log.info("   - Person: " + (obs.getPerson() != null ? obs.getPerson().getUuid() : "null"));
                
                String obsType = determineObservationType(obs);
                log.info("   - Type: " + obsType);
                
                // 🚀 SYNC TO PATIENT PASSPORT ASYNCHRONOUSLY
                syncObservationToPassport(obs, obsType);
            }
            
            log.info("✅ Method execution completed successfully");
            return result;
            
        } catch (Exception e) {
            log.error("❌ Error during method execution: " + e.getMessage(), e);
            throw e;
        } finally {
            //  CRITICAL: Clean up authentication and session if we created them
            if (wasAuthenticated) {
                try {
                    Context.logout();
                    log.info("🔓 Logged out daemon user");
                } catch (Exception e) {
                    log.error("❌ Error logging out: " + e.getMessage(), e);
                }
            }
            
            if (sessionOpened && Context.isSessionOpen()) {
                try {
                    Context.closeSession();
                    log.info("📁 Session closed successfully");
                } catch (Exception e) {
                    log.error("❌ Error closing session: " + e.getMessage(), e);
                }
            }
            
            log.info("========================================");
            log.info("✅ AOP Processing Complete");
            log.info("========================================");
        }
    }
    
    /**
     * Sync observation to Patient Passport asynchronously to avoid blocking OpenMRS
     */
    private void syncObservationToPassport(Obs obs, String obsType) {
        CompletableFuture.runAsync(() -> {
            try {
                log.info("🔄 Starting async sync to Patient Passport...");
                
                // Get patient from observation
                Patient patient = null;
                if (obs.getPerson() != null) {
                    // Check if person is a patient
                    try {
                        patient = Context.getPatientService().getPatient(obs.getPerson().getPersonId());
                    } catch (Exception e) {
                        log.warn("⚠️ Person is not a patient: " + e.getMessage());
                    }
                }
                
                if (patient == null) {
                    log.warn("⚠️ Cannot sync - observation not associated with a patient");
                    return;
                }
                
                // Check if data service is available
                if (dataService == null) {
                    log.error("❌ PatientPassportDataService is null - cannot sync!");
                    log.error("   This likely means Spring dependency injection failed");
                    return;
                }
                
                // Convert obsType to format expected by API ("diagnosis" or "medication")
                String apiObsType = convertToApiObservationType(obsType);
                
                log.info("📤 Syncing to Patient Passport:");
                log.info("   - Patient: " + patient.getPatientId());
                log.info("   - Observation: " + obs.getObsId());
                log.info("   - Type: " + apiObsType);
                
                // Call the sync service
                boolean success = dataService.sendObservationToPassport(patient, obs, apiObsType);
                
                if (success) {
                    log.info("✅ Successfully synced observation to Patient Passport!");
                } else {
                    log.error("❌ Failed to sync observation to Patient Passport");
                }
                
            } catch (Exception e) {
                log.error("❌ Error during async sync: " + e.getMessage(), e);
            }
        });
    }
    
    /**
     * Convert internal observation type to API format
     */
    private String convertToApiObservationType(String obsType) {
        if (obsType == null) {
            return "diagnosis"; // Default
        }
        
        switch (obsType.toUpperCase()) {
            case "DIAGNOSIS":
            case "LAB_RESULT":
            case "VITAL_SIGN":
            case "PROCEDURE":
            case "IMMUNIZATION":
            case "OTHER":
                return "diagnosis";
            case "MEDICATION":
            case "ALLERGY":
                return "medication";
            default:
                return "diagnosis";
        }
    }
    
    private String determineObservationType(Obs obs) {
        try {
            if (obs.getConcept() == null) {
                return "UNKNOWN";
            }
            
            String conceptName = obs.getConcept().getName().getName().toUpperCase();
            
            if (conceptName.contains("DIAGNOSIS") || conceptName.contains("CONDITION")) {
                return "DIAGNOSIS";
            } else if (conceptName.contains("MEDICATION") || conceptName.contains("DRUG")) {
                return "MEDICATION";
            } else if (conceptName.contains("ALLERG")) {
                return "ALLERGY";
            } else if (conceptName.contains("LAB") || conceptName.contains("TEST")) {
                return "LAB_RESULT";
            } else if (conceptName.contains("VITAL") || conceptName.contains("WEIGHT") || 
                       conceptName.contains("HEIGHT") || conceptName.contains("TEMPERATURE") ||
                       conceptName.contains("PRESSURE") || conceptName.contains("PULSE")) {
                return "VITAL_SIGN";
            } else if (conceptName.contains("PROCEDURE") || conceptName.contains("SURGERY")) {
                return "PROCEDURE";
            } else if (conceptName.contains("IMMUN") || conceptName.contains("VACCIN")) {
                return "IMMUNIZATION";
            } else {
                return "OTHER";
            }
        } catch (Exception e) {
            log.error("Error determining observation type: " + e.getMessage(), e);
            return "UNKNOWN";
        }
    }
}
