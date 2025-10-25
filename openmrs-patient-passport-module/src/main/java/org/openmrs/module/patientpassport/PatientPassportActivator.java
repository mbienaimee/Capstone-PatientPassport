package org.openmrs.module.patientpassport;

import org.openmrs.module.BaseModuleActivator;

/**
 * ModuleActivator for Patient Passport Module
 * Required by OpenMRS 2.7.6 for all modules
 */
public class PatientPassportActivator extends BaseModuleActivator {

    @Override
    public void willStart() {
        System.out.println("Starting Patient Passport Module");
    }

    @Override
    public void started() {
        System.out.println("Patient Passport Module started successfully");
    }

    @Override
    public void willStop() {
        System.out.println("Stopping Patient Passport Module");
    }

    @Override
    public void stopped() {
        System.out.println("Patient Passport Module stopped");
    }
}

