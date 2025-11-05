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
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("🎯 ObservationSaveAdvice CONSTRUCTOR CALLED - AOP ADVICE CREATED!");
        log.info("═══════════════════════════════════════════════════════════════");
        System.out.println("🎯 ObservationSaveAdvice created - AOP ready!");
    }
    
    @Override
    public void afterReturning(Object returnValue, Method method, Object[] args, Object target) throws Throwable {
        
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("🚀 AOP INTERCEPTED! afterReturning() called!");
        log.info("Method: " + method.getName());
        log.info("Return type: " + (returnValue != null ? returnValue.getClass().getName() : "null"));
        log.info("═══════════════════════════════════════════════════════════════");
        System.out.println("🚀 AOP INTERCEPTED: " + method.getName());
        
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
     * Enhanced to handle more observation types
     */
    private String determineObservationType(Obs obs) {
        if (obs.getConcept() == null) {
            log.debug("⏭️ Observation has no concept - skipping");
            return null;
        }
        
        String conceptName = obs.getConcept().getName().getName().toLowerCase();
        log.debug("🔍 Analyzing concept: " + conceptName);
        
        // Check for diagnosis-related concepts (BROAD matching)
        if (conceptName.contains("diagnosis") || 
            conceptName.contains("condition") ||
            conceptName.contains("problem") ||
            conceptName.contains("disease") ||
            conceptName.contains("malaria") ||
            conceptName.contains("fever") ||
            conceptName.contains("infection") ||
            conceptName.contains("smear") ||      // For "Malaria smear"
            conceptName.contains("test") ||       // Lab tests often indicate diagnoses
            conceptName.contains("impression") || // Clinical impressions
            conceptName.contains("finding") ||    // Clinical findings
            obs.getValueCoded() != null) {        // Coded values often diagnoses
            log.info("✅ Detected as DIAGNOSIS: " + conceptName);
            return "diagnosis";
        }
        
        // Check for medication-related concepts
        if (conceptName.contains("medication") || 
            conceptName.contains("drug") ||
            conceptName.contains("prescription") ||
            conceptName.contains("treatment") ||
            conceptName.contains("paract") ||     // paractmol/paracetamol
            conceptName.contains("aspirin") ||
            conceptName.contains("medicine") ||
            conceptName.contains("tablet") ||
            conceptName.contains("capsule") ||
            conceptName.contains("syrup") ||
            obs.getValueDrug() != null) {         // Has drug value
            log.info("✅ Detected as MEDICATION: " + conceptName);
            return "medication";
        }
        
        // If observation has a text value and not clearly vital signs/other
        if (obs.getValueText() != null && !obs.getValueText().isEmpty()) {
            String valueText = obs.getValueText().toLowerCase();
            
            // Check value text for medication indicators
            if (valueText.contains("mg") || valueText.contains("ml") || 
                valueText.contains("tablet") || valueText.contains("dose")) {
                log.info("✅ Detected as MEDICATION from value: " + valueText);
                return "medication";
            }
            
            // If it has a coded concept, probably a diagnosis
            if (obs.getValueCoded() != null) {
                log.info("✅ Detected as DIAGNOSIS (has coded value)");
                return "diagnosis";
            }
            
            // Default to diagnosis for text observations
            log.info("✅ Defaulting to DIAGNOSIS for text observation");
            return "diagnosis";
        }
        
        log.debug("⏭️ Could not determine type for: " + conceptName);
        return null;
    }
}
