package org.openmrs.module.patientpassport;

import org.openmrs.module.BaseModuleActivator;

/**
 * This class contains the logic that is run every time this module is either started or stopped.
 */
public class PatientPassportModuleActivator extends BaseModuleActivator {

    /**
     * @see org.openmrs.module.ModuleActivator#willStart()
     */
    public void willStart() {
        System.out.println("Starting Patient Passport Module");
    }

    /**
     * @see org.openmrs.module.ModuleActivator#started()
     */
    public void started() {
        System.out.println("Patient Passport Module started");
    }

    /**
     * @see org.openmrs.module.ModuleActivator#willStop()
     */
    public void willStop() {
        System.out.println("Stopping Patient Passport Module");
    }

    /**
     * @see org.openmrs.module.ModuleActivator#stopped()
     */
    public void stopped() {
        System.out.println("Patient Passport Module stopped");
    }
}