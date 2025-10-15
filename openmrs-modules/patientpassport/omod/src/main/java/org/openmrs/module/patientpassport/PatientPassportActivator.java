package org.openmrs.module.patientpassport;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.api.context.Context;
import org.openmrs.module.BaseModuleActivator;
import org.openmrs.module.ModuleException;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class PatientPassportActivator extends BaseModuleActivator {

    private static Log log = LogFactory.getLog(PatientPassportActivator.class);

    /**
     * @see BaseModuleActivator#started()
     */
    public void started() {
        log.info("Starting Patient Passport Module");
    }

    /**
     * @see BaseModuleActivator#stopped()
     */
    public void stopped() {
        log.info("Shutting down Patient Passport Module");
    }

}

