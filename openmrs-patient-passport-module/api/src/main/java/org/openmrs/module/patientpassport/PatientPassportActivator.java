package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;

public class PatientPassportActivator extends BaseModuleActivator {
    private static final Log log = LogFactory.getLog(PatientPassportActivator.class);

    @Override
    public void willStart() {
        log.info("PATIENT PASSPORT MODULE - STARTING...");
    }

    @Override
    public void started() {
        log.info("PATIENT PASSPORT MODULE - STARTED SUCCESSFULLY!");
    }

    @Override
    public void willStop() {
        log.info("PATIENT PASSPORT MODULE - STOPPING...");
    }

    @Override
    public void stopped() {
        log.info("PATIENT PASSPORT MODULE - STOPPED");
    }
}
