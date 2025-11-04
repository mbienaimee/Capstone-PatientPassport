package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.module.BaseModuleActivator;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class PatientPassportModuleActivator extends BaseModuleActivator {
    
    private static final Log log = LogFactory.getLog(PatientPassportModuleActivator.class);

    /**
     * @see org.openmrs.module.ModuleActivator#willStart()
     */
    public void willStart() {
        log.info("🚀 Starting Patient Passport Module");
    }

    /**
     * @see org.openmrs.module.ModuleActivator#started()
     */
    public void started() {
        log.info("✅ Patient Passport Module started");
        log.info(" Data Flow: OpenMRS → Patient Passport");
        log.info("📡 Use REST API endpoints to send observations to Patient Passport");
    }

    /**
     * @see org.openmrs.module.ModuleActivator#willStop()
     */
    public void willStop() {
        log.info("⏸️ Stopping Patient Passport Module");
    }

    /**
     * @see org.openmrs.module.ModuleActivator#stopped()
     */
    public void stopped() {
        log.info("⏹️ Patient Passport Module stopped");
    }
}