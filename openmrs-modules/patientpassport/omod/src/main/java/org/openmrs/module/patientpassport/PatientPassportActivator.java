package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class PatientPassportActivator extends BaseModuleActivator {
    
    private static final Log log = LogFactory.getLog(PatientPassportActivator.class);
    
    /**
     * @see BaseModuleActivator#started()
     */
    public void started() {
        log.info("Patient Passport module started successfully");
    }
    
    /**
     * @see BaseModuleActivator#stopped()
     */
    public void stopped() {
        log.info("Patient Passport module stopped");
    }
}