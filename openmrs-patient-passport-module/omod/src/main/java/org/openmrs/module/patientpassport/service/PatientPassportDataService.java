package org.openmrs.module.patientpassport.service;

import org.openmrs.Patient;
import org.openmrs.Obs;
import java.util.Map;

/**
 * Service interface for sending patient data TO Patient Passport system
 * Data Flow: OpenMRS → Patient Passport (ONE WAY)
 */
public interface PatientPassportDataService {
    
    /**
     * Send observation (diagnosis or medication) from OpenMRS to Patient Passport
     * This method is called when a doctor adds data in OpenMRS
     * 
     * @param patient The patient
     * @param obs The observation to send
     * @param observationType Type of observation ("diagnosis" or "medication")
     * @return true if successfully sent to Passport
     */
    boolean sendObservationToPassport(Patient patient, Obs obs, String observationType);
    
    /**
     * Sync patient mapping between OpenMRS and Patient Passport
     * 
     * @param patient The patient to sync
     * @return true if sync successful
     */
    boolean syncPatientMapping(Patient patient);
}
