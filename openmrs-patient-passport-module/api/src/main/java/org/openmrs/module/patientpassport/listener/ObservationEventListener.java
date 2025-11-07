package org.openmrs.module.patientpassport.listener;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.openmrs.Obs;
import org.openmrs.Patient;
import org.openmrs.api.context.Context;
import org.openmrs.event.Event;
import org.openmrs.event.Event.Action;
import org.openmrs.event.EventListener;
import org.openmrs.module.patientpassport.service.PatientPassportService;

import javax.jms.Message;
import java.util.concurrent.CompletableFuture;

/**
 * Event listener for OpenMRS observations
 * Automatically syncs new observations to Patient Passport
 */
public class ObservationEventListener implements EventListener {
    
    private static final Log log = LogFactory.getLog(ObservationEventListener.class);
    
    @Override
    public void onMessage(Message message) {
        try {
            log.info("========================================");
            log.info("PATIENT PASSPORT - Observation event received!");
            log.info("========================================");
            
            String action = Event.getAction(message);
            String uuid = Event.getUuid(message);
            
            if (Action.CREATED.name().equals(action) || Action.UPDATED.name().equals(action)) {
                log.info("Processing " + action + " observation: " + uuid);
                
                // Get the observation
                Obs observation = Context.getObsService().getObsByUuid(uuid);
                
                if (observation != null && observation.getPerson() instanceof Patient) {
                    Patient patient = (Patient) observation.getPerson();
                    
                    log.info("Patient found: " + patient.getPersonName().getFullName() + 
                            " (ID: " + patient.getPatientIdentifier().getIdentifier() + ")");
                    log.info("Observation concept: " + observation.getConcept().getName().getName());
                    
                    // Async sync to avoid blocking OpenMRS
                    CompletableFuture.runAsync(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                PatientPassportService passportService = new PatientPassportService();
                                passportService.syncObservationToPassport(observation, patient);
                                
                                log.info("========================================");
                                log.info("SUCCESS! Synced observation " + uuid + " to Patient Passport");
                                log.info("========================================");
                            } catch (Exception e) {
                                log.error("========================================");
                                log.error("FAILED to sync observation " + uuid + " to Patient Passport: " + e.getMessage(), e);
                                log.error("========================================");
                            }
                        }
                    });
                } else {
                    log.debug("Skipping non-patient observation: " + uuid);
                }
            }
        } catch (Exception e) {
            log.error("========================================");
            log.error("ERROR processing observation event: " + e.getMessage(), e);
            log.error("========================================");
        }
    }
    
    @Override
    public void subscribeToObjects() {
        log.info("========================================");
        log.info("PATIENT PASSPORT - Subscribing to Observation events");
        log.info("========================================");
        Event.subscribe(Obs.class, Action.CREATED, this);
        Event.subscribe(Obs.class, Action.UPDATED, this);
        log.info("========================================");
        log.info("SUCCESS! Subscribed to observation CREATED and UPDATED events");
        log.info("========================================");
    }
    
    @Override
    public void unsubscribeFromObjects() {
        log.info("========================================");
        log.info("PATIENT PASSPORT - Unsubscribing from Observation events");
        log.info("========================================");
        Event.unsubscribe(Obs.class, Action.CREATED, this);
        Event.unsubscribe(Obs.class, Action.UPDATED, this);
        log.info("========================================");
        log.info("SUCCESS! Unsubscribed from observation events");
        log.info("========================================");
    }
}
