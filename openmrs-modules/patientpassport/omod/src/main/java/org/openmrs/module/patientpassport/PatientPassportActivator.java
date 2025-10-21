package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.ModuleActivator;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class PatientPassportActivator implements ModuleActivator {
    
    private static final Log log = LogFactory.getLog(PatientPassportActivator.class);
    
    /**
     * @see ModuleActivator#started()
     */
    public void started() {
        log.info("Patient Passport module started successfully");
    }
    
    /**
     * @see ModuleActivator#stopped()
     */
    public void stopped() {
        log.info("Patient Passport module stopped");
    }
    
    /**
     * @see ModuleActivator#willRefreshContext()
     */
    public void willRefreshContext() {
        log.info("Patient Passport module will refresh context");
    }
    
    /**
     * @see ModuleActivator#contextRefreshed()
     */
    public void contextRefreshed() {
        log.info("Patient Passport module context refreshed");
    }
    
    /**
     * @see ModuleActivator#willStart()
     */
    public void willStart() {
        log.info("Patient Passport module will start");
    }
    
    /**
     * @see ModuleActivator#willStop()
     */
    public void willStop() {
        log.info("Patient Passport module will stop");
    }
}