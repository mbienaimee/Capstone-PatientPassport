package org.openmrs.module.patientpassport.advice;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Obs;
import org.openmrs.Patient;
import org.openmrs.Person;
import org.openmrs.module.patientpassport.service.PatientPassportDataService;
import org.openmrs.module.patientpassport.service.impl.PatientPassportDataServiceImpl;
import org.springframework.aop.AfterReturningAdvice;

import java.lang.reflect.Method;

/**
 * AOP Advice to automatically send observations to Patient Passport
 * when they are saved in OpenMRS
 * 
 * This intercepts saveObs() method calls and triggers automatic sync
 */
public class ObservationSaveAdvice implements AfterReturningAdvice {
    
    private static final Log log = LogFactory.getLog(ObservationSaveAdvice.class);
    
    private final PatientPassportDataService dataService;
    
    public ObservationSaveAdvice() {
        this.dataService = new PatientPassportDataServiceImpl();
    }
    
    @Override
    public void afterReturning(Object returnValue, Method method, Object[] args, Object target) throws Throwable {
        
        // Check if the return value is an Obs object
        if (returnValue instanceof Obs) {
            Obs obs = (Obs) returnValue;
            
            // Verify this observation is for a patient
            Person person = obs.getPerson();
            if (!(person instanceof Patient)) {
                log.debug("⏭️ Skipping - observation not for a patient");
                return;
            }
            
            Patient patient = (Patient) person;
            
            // Only process non-voided observations
            if (obs.getVoided()) {
                log.debug("⏭️ Skipping - observation is voided");
                return;
            }
            
            log.info("🔔 New observation saved - Auto-syncing to Patient Passport");
            log.info("📋 Patient: " + patient.getPatientId() + ", Concept: " + 
                    (obs.getConcept() != null ? obs.getConcept().getName().getName() : "Unknown"));
            
            // Determine observation type
            String observationType = determineObservationType(obs);
            if (observationType == null) {
                log.debug("⏭️ Skipping - not a diagnosis or medication");
                return;
            }
            
            // Send to Patient Passport asynchronously to avoid blocking
            try {
                boolean success = dataService.sendObservationToPassport(patient, obs, observationType);
                if (success) {
                    log.info("✅ Auto-sync successful - " + observationType + " sent to Patient Passport");
                } else {
                    log.warn("⚠️ Auto-sync failed for " + observationType);
                }
            } catch (Exception e) {
                log.error("❌ Error during auto-sync to Patient Passport", e);
                // Don't throw - we don't want to break the observation save
            }
        }
    }
    
    /**
     * Determine if the observation is a diagnosis or medication
     */
    private String determineObservationType(Obs obs) {
        if (obs.getConcept() == null) {
            return null;
        }
        
        String conceptName = obs.getConcept().getName().getName().toLowerCase();
        
        // Check for diagnosis-related concepts
        if (conceptName.contains("diagnosis") || 
            conceptName.contains("condition") ||
            conceptName.contains("problem") ||
            conceptName.contains("disease") ||
            conceptName.contains("malaria") ||
            conceptName.contains("fever") ||
            conceptName.contains("infection")) {
            return "diagnosis";
        }
        
        // Check for medication-related concepts
        if (conceptName.contains("medication") || 
            conceptName.contains("drug") ||
            conceptName.contains("prescription") ||
            conceptName.contains("treatment") ||
            conceptName.contains("paract") ||
            conceptName.contains("aspirin") ||
            conceptName.contains("medicine") ||
            obs.getValueDrug() != null) {
            return "medication";
        }
        
        return null;
    }
}
