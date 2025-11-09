package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;

public class PatientPassportActivator extends BaseModuleActivator {
    private static final Log log = LogFactory.getLog(PatientPassportActivator.class);

    @Override
    public void willStart() {
        log.info("========================================");
        log.info("PATIENT PASSPORT MODULE - STARTING...");
        log.info("========================================");
    }

    @Override
    public void started() {
        log.info("========================================");
        log.info("PATIENT PASSPORT MODULE - STARTED SUCCESSFULLY!");
        log.info("Manual observation sync is available via REST API");
        log.info("========================================");
    }

    @Override
    public void willStop() {
        log.info("========================================");
        log.info("PATIENT PASSPORT MODULE - STOPPING...");
        log.info("========================================");
    }

    @Override
    public void stopped() {
        log.info("========================================");
        log.info("PATIENT PASSPORT MODULE - STOPPED");
        log.info("========================================");
    }
}
