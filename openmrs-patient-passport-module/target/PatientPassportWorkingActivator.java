package org.openmrs.module.patientpassportworking;

import org.openmrs.module.BaseModuleActivator;

/**
 * Working ModuleActivator for Patient Passport Working Module
 * This is the REQUIRED activator for OpenMRS 2.7.6
 */
public class PatientPassportWorkingActivator extends BaseModuleActivator {

    @Override
    public void willStart() {
        System.out.println("Starting Patient Passport Working Module");
    }

    @Override
    public void started() {
        System.out.println("Patient Passport Working Module started successfully");
    }

    @Override
    public void willStop() {
        System.out.println("Stopping Patient Passport Working Module");
    }

    @Override
    public void stopped() {
        System.out.println("Patient Passport Working Module stopped");
    }
}
