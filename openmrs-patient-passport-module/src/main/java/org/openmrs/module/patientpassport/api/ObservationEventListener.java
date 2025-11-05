package org.openmrs.module.patientpassport.api;

import org.openmrs.Obs;
import org.openmrs.Patient;
import org.openmrs.api.context.Context;
import org.openmrs.event.Event;
import org.openmrs.event.Event.Action;
import org.openmrs.event.EventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jms.Message;
import java.util.concurrent.CompletableFuture;

/**
 * Event listener for OpenMRS observations
 * Automatically syncs new observations to Patient Passport
 */
public class ObservationEventListener implements EventListener {
    
    private static final Logger log = LoggerFactory.getLogger(ObservationEventListener.class);
    
    @Override
    public void onMessage(Message message) {
        try {
            log.info("🎯 Patient Passport - Observation event received");
            
            String action = Event.getAction(message);
            String uuid = Event.getUuid(message);
            
            if (Action.CREATED.name().equals(action) || Action.UPDATED.name().equals(action)) {
                log.info("📤 Processing {} observation: {}", action, uuid);
                
                // Get the observation
                Obs observation = Context.getObsService().getObsByUuid(uuid);
                
                if (observation != null && observation.getPerson() instanceof Patient) {
                    Patient patient = (Patient) observation.getPerson();
                    
                    log.info("🏥 Patient found: {} (ID: {})", 
                            patient.getPersonName().getFullName(), 
                            patient.getPatientIdentifier().getIdentifier());
                    
                    // Async sync to avoid blocking OpenMRS
                    CompletableFuture.runAsync(() -> {
                        try {
                            PatientPassportService passportService = new PatientPassportService();
                            passportService.syncObservationToPassport(observation, patient);
                            
                            log.info("✅ Successfully synced observation {} to Patient Passport", uuid);
                        } catch (Exception e) {
                            log.error("❌ Failed to sync observation {} to Patient Passport: {}", 
                                    uuid, e.getMessage(), e);
                        }
                    });
                } else {
                    log.debug("⏭️ Skipping non-patient observation: {}", uuid);
                }
            }
        } catch (Exception e) {
            log.error("💥 Error processing observation event: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void subscribeToObjects() {
        log.info("🔗 Patient Passport - Subscribing to Observation events");
        Event.subscribe(Obs.class, Action.CREATED, this);
        Event.subscribe(Obs.class, Action.UPDATED, this);
        log.info("✅ Patient Passport - Successfully subscribed to observation events");
    }
    
    @Override
    public void unsubscribeFromObjects() {
        log.info("🔌 Patient Passport - Unsubscribing from Observation events");
        Event.unsubscribe(Obs.class, Action.CREATED, this);
        Event.unsubscribe(Obs.class, Action.UPDATED, this);
        log.info("✅ Patient Passport - Successfully unsubscribed from observation events");
    }
}