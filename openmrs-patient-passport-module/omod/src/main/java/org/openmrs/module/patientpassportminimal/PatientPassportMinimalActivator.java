package org.openmrs.module.patientpassportminimal;

import org.openmrs.module.BaseModuleActivator;

/**
 * Simple ModuleActivator for Patient Passport Minimal Module
 * Required by OpenMRS 2.7.6 - all modules must have an activator
 */
public class PatientPassportMinimalActivator extends BaseModuleActivator {

    @Override
    public void willStart() {
        System.out.println("Starting Patient Passport Minimal Module");
    }

    @Override
    public void started() {
        System.out.println("Patient Passport Minimal Module started successfully");
    }

    @Override
    public void willStop() {
        System.out.println("Stopping Patient Passport Minimal Module");
    }

    @Override
    public void stopped() {
        System.out.println("Patient Passport Minimal Module stopped");
    }
}
