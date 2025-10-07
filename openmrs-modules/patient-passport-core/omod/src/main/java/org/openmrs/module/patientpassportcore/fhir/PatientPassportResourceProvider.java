package org.openmrs.module.patientpassportcore.fhir;

import ca.uhn.fhir.rest.annotation.*;
import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.param.StringParam;
import ca.uhn.fhir.rest.server.IResourceProvider;
import org.hl7.fhir.r4.model.*;
import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.fhir2.api.FhirPatientService;
import org.openmrs.module.patientpassportcore.api.PatientPassportCoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * FHIR Resource Provider for Patient Passport integration
 */
@Component
public class PatientPassportResourceProvider implements IResourceProvider {

    @Autowired
    private FhirPatientService fhirPatientService;

    @Override
    public Class<? extends Resource> getResourceType() {
        return Patient.class;
    }

    /**
     * Create a new patient in both OpenMRS and Patient Passport
     */
    @Create
    public MethodOutcome createPatient(@ResourceParam Patient patient) {
        try {
            // Convert FHIR Patient to OpenMRS Patient
            Patient openmrsPatient = fhirPatientService.convertFhirPatientToOpenmrsPatient(patient);
            
            // Save in OpenMRS
            PatientService patientService = Context.getPatientService();
            Patient savedPatient = patientService.savePatient(openmrsPatient);
            
            // Generate universal ID
            PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
            PatientIdentifier universalId = passportService.generateUniversalPatientId(savedPatient);
            
            // Sync with Patient Passport API
            syncPatientToPassport(savedPatient, universalId);
            
            // Convert back to FHIR
            Patient fhirPatient = fhirPatientService.convertOpenmrsPatientToFhirPatient(savedPatient);
            
            MethodOutcome outcome = new MethodOutcome();
            outcome.setId(fhirPatient.getIdElement());
            outcome.setResource(fhirPatient);
            
            return outcome;
        } catch (Exception e) {
            throw new RuntimeException("Error creating patient: " + e.getMessage(), e);
        }
    }

    /**
     * Search patients by universal ID
     */
    @Search
    public List<Patient> searchPatientsByUniversalId(@RequiredParam(name = "identifier") StringParam universalId) {
        List<Patient> patients = new ArrayList<>();
        
        try {
            PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
            Patient openmrsPatient = passportService.findPatientByUniversalId(universalId.getValue());
            
            if (openmrsPatient != null) {
                Patient fhirPatient = fhirPatientService.convertOpenmrsPatientToFhirPatient(openmrsPatient);
                patients.add(fhirPatient);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error searching patient: " + e.getMessage(), e);
        }
        
        return patients;
    }

    /**
     * Update patient information
     */
    @Update
    public MethodOutcome updatePatient(@IdParam IdType id, @ResourceParam Patient patient) {
        try {
            // Get existing patient
            PatientService patientService = Context.getPatientService();
            Patient existingPatient = patientService.getPatientByUuid(id.getIdPart());
            
            if (existingPatient == null) {
                throw new RuntimeException("Patient not found");
            }
            
            // Convert FHIR Patient to OpenMRS Patient
            Patient openmrsPatient = fhirPatientService.convertFhirPatientToOpenmrsPatient(patient);
            openmrsPatient.setId(existingPatient.getId());
            
            // Save updated patient
            Patient savedPatient = patientService.savePatient(openmrsPatient);
            
            // Sync with Patient Passport API
            PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
            PatientIdentifier universalId = passportService.getUniversalPatientId(savedPatient);
            if (universalId != null) {
                syncPatientToPassport(savedPatient, universalId);
            }
            
            // Convert back to FHIR
            Patient fhirPatient = fhirPatientService.convertOpenmrsPatientToFhirPatient(savedPatient);
            
            MethodOutcome outcome = new MethodOutcome();
            outcome.setId(fhirPatient.getIdElement());
            outcome.setResource(fhirPatient);
            
            return outcome;
        } catch (Exception e) {
            throw new RuntimeException("Error updating patient: " + e.getMessage(), e);
        }
    }

    /**
     * Sync patient data to Patient Passport API
     */
    private void syncPatientToPassport(Patient patient, PatientIdentifier universalId) {
        try {
            PatientPassportCoreService passportService = Context.getService(PatientPassportCoreService.class);
            
            // Create patient data for API
            String patientData = createPatientPassportData(patient, universalId);
            
            // Send to Patient Passport API
            passportService.syncPatientToPassport(patient.getUuid(), patientData);
            
        } catch (Exception e) {
            // Log error but don't fail the operation
            System.err.println("Error syncing patient to passport: " + e.getMessage());
        }
    }

    /**
     * Create patient data in Patient Passport format
     */
    private String createPatientPassportData(Patient patient, PatientIdentifier universalId) {
        StringBuilder data = new StringBuilder();
        data.append("{");
        data.append("\"universalId\":\"").append(universalId.getIdentifier()).append("\",");
        data.append("\"openmrsId\":\"").append(patient.getUuid()).append("\",");
        data.append("\"firstName\":\"").append(patient.getGivenName()).append("\",");
        data.append("\"lastName\":\"").append(patient.getFamilyName()).append("\",");
        data.append("\"gender\":\"").append(patient.getGender()).append("\",");
        data.append("\"birthDate\":\"").append(patient.getBirthdate()).append("\",");
        data.append("\"phone\":\"").append(patient.getAttribute("Phone Number")).append("\",");
        data.append("\"email\":\"").append(patient.getAttribute("Email")).append("\",");
        data.append("\"address\":\"").append(patient.getPersonAddress().getAddressString()).append("\"");
        data.append("}");
        
        return data.toString();
    }
}


















