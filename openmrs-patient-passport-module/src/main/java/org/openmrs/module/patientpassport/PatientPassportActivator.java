package org.openmrs.module.patientpassport;

import org.openmrs.module.BaseModuleActivator;
import org.openmrs.module.patientpassport.api.ObservationEventListener;
import org.openmrs.module.patientpassport.api.PatientPassportConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ModuleActivator for Patient Passport Module
 * Manages lifecycle and event listener registration
 */
public class PatientPassportActivator extends BaseModuleActivator {
    
    private static final Logger log = LoggerFactory.getLogger(PatientPassportActivator.class);
    private ObservationEventListener observationListener;

    @Override
    public void willStart() {
        log.info("🚀 PATIENT PASSPORT MODULE - STARTING...");
        System.out.println("🚀 PATIENT PASSPORT MODULE - STARTING...");
    }

    @Override
    public void started() {
        try {
            log.info("✅ PATIENT PASSPORT MODULE - STARTED SUCCESSFULLY!");
            System.out.println("✅ PATIENT PASSPORT MODULE - STARTED SUCCESSFULLY!");
            
            // Log configuration
            PatientPassportConfig config = new PatientPassportConfig();
            config.logConfiguration();
            
            // Validate configuration
            if (!config.validateConfiguration()) {
                log.warn("⚠️ Patient Passport configuration has issues - check global properties");
            }
            
            // Initialize and register observation event listener
            if (config.isSyncEnabled()) {
                observationListener = new ObservationEventListener();
                observationListener.subscribeToObjects();
                log.info("🎯 AOP-based observation interception enabled");
                System.out.println("🎯 AOP-based observation interception enabled");
            } else {
                log.info("⏸️ Patient Passport sync is disabled");
                System.out.println("⏸️ Patient Passport sync is disabled");
            }
            
        } catch (Exception e) {
            log.error("❌ Error during Patient Passport module startup: {}", e.getMessage(), e);
            System.err.println("❌ Patient Passport Module startup error: " + e.getMessage());
        }
    }

    @Override
    public void willStop() {
        log.info("🔌 PATIENT PASSPORT MODULE - STOPPING...");
        System.out.println("🔌 PATIENT PASSPORT MODULE - STOPPING...");
        
        try {
            // Unsubscribe event listener
            if (observationListener != null) {
                observationListener.unsubscribeFromObjects();
                observationListener = null;
                log.info("🔌 Observation event listener unregistered");
            }
        } catch (Exception e) {
            log.error("❌ Error during Patient Passport module shutdown: {}", e.getMessage(), e);
        }
    }

    @Override
    public void stopped() {
        log.info("⛔ PATIENT PASSPORT MODULE - STOPPED");
        System.out.println("⛔ PATIENT PASSPORT MODULE - STOPPED");
    }
}

