package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;

/**
 * ModuleActivator for Patient Passport Module
 * Required by OpenMRS 2.7.6 for all modules
 */
public class PatientPassportActivator extends BaseModuleActivator {

    private static final Log log = LogFactory.getLog(PatientPassportActivator.class);

    @Override
    public void willStart() {
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("🚀 PATIENT PASSPORT MODULE - STARTING...");
        log.info("═══════════════════════════════════════════════════════════════");
        System.out.println("═══════════════════════════════════════════════════════════════");
        System.out.println("🚀 PATIENT PASSPORT MODULE - STARTING...");
        System.out.println("═══════════════════════════════════════════════════════════════");
    }

    @Override
    public void started() {
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("✅ PATIENT PASSPORT MODULE - STARTED SUCCESSFULLY!");
        log.info("🎯 AOP Advice should be registered by Spring now");
        log.info("🔍 Watch for ObservationSaveAdvice constructor logs");
        log.info("🎧 Watch for AOP INTERCEPTED logs when saving observations");
        log.info("═══════════════════════════════════════════════════════════════");
        
        System.out.println("═══════════════════════════════════════════════════════════════");
        System.out.println("✅ PATIENT PASSPORT MODULE - STARTED!");
        System.out.println("🎯 AOP-based observation interception enabled");
        System.out.println("📝 Check logs for 'ObservationSaveAdvice' and 'AOP INTERCEPTED'");
        System.out.println("═══════════════════════════════════════════════════════════════");
    }

    @Override
    public void willStop() {
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("⏸️ PATIENT PASSPORT MODULE - STOPPING...");
        log.info("═══════════════════════════════════════════════════════════════");
        System.out.println("⏸️ Stopping Patient Passport Module");
    }

    @Override
    public void stopped() {
        log.info("═══════════════════════════════════════════════════════════════");
        log.info("⏹️ PATIENT PASSPORT MODULE - STOPPED");
        log.info("═══════════════════════════════════════════════════════════════");
        System.out.println("⏹️ Patient Passport Module stopped");
    }
}

