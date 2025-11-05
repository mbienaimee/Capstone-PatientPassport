package org.openmrs.module.patientpassport.advice;

import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Obs;
import org.openmrs.api.context.Context;

public class ObservationSaveAdvice implements MethodInterceptor {
    
    private static final Log log = LogFactory.getLog(ObservationSaveAdvice.class);
    
    public ObservationSaveAdvice() {
        log.info("========================================");
        log.info(" ObservationSaveAdvice CONSTRUCTOR CALLED - AOP Interceptor Bean Created!");
        log.info("========================================");
    }
    
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        log.info("========================================");
        log.info(" AOP INTERCEPTING! Method: " + invocation.getMethod().getName());
        log.info("========================================");
        
        boolean sessionOpened = false;
        boolean wasAuthenticated = false;
        
        try {
            //  CRITICAL FIX: Ensure OpenMRS Context session is available BEFORE method execution
            if (!Context.isSessionOpen()) {
                log.info(" No session open - opening new session for method execution");
                Context.openSession();
                sessionOpened = true;
                
                // If we opened the session, we need to authenticate
                try {
                    if (!Context.isAuthenticated()) {
                        log.info(" Not authenticated - using daemon authentication");
                        Context.becomeUser("daemon");
                        wasAuthenticated = true;
                    }
                } catch (Exception e) {
                    log.warn("Could not authenticate as daemon: " + e.getMessage());
                }
            } else {
                log.info(" Session already open");
            }
            
            // Execute the actual method (saveObs, etc.)
            log.info(" Executing method: " + invocation.getMethod().getName());
            Object result = invocation.proceed();
            
            // Log the observation details AFTER successful execution
            if (result instanceof Obs) {
                Obs obs = (Obs) result;
                log.info(" Observation saved successfully!");
                log.info("   - ID: " + obs.getObsId());
                log.info("   - UUID: " + obs.getUuid());
                log.info("   - Concept: " + (obs.getConcept() != null ? obs.getConcept().getName() : "null"));
                log.info("   - Person: " + (obs.getPerson() != null ? obs.getPerson().getUuid() : "null"));
                
                String obsType = determineObservationType(obs);
                log.info("   - Type: " + obsType);
            }
            
            log.info(" Method execution completed successfully");
            return result;
            
        } catch (Exception e) {
            log.error(" Error during method execution: " + e.getMessage(), e);
            throw e;
        } finally {
            //  CRITICAL: Clean up authentication and session if we created them
            if (wasAuthenticated) {
                try {
                    Context.logout();
                    log.info(" Logged out daemon user");
                } catch (Exception e) {
                    log.error(" Error logging out: " + e.getMessage(), e);
                }
            }
            
            if (sessionOpened && Context.isSessionOpen()) {
                try {
                    Context.closeSession();
                    log.info(" Session closed successfully");
                } catch (Exception e) {
                    log.error(" Error closing session: " + e.getMessage(), e);
                }
            }
            
            log.info("========================================");
            log.info(" AOP Processing Complete");
            log.info("========================================");
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
