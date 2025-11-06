import express from 'express';
import openmrsIntegrationController from '@/controllers/openmrsIntegrationController';

const router = express.Router();

/**
 * OpenMRS Integration Routes
 * 
 * These endpoints allow OpenMRS to:
 * 1. Fetch patient diagnosis and medication data automatically (using PATIENT NAME)
 * 2. Sync patient, hospital, and doctor mappings
 * 3. Store new observations from OpenMRS back to the passport system
 * 
 * KEY CHANGE: Uses PATIENT NAME as the identifier (not National ID)
 */

// Health check
router.get('/health', openmrsIntegrationController.openmrsHealthCheck);

// Patient data endpoints - using patient NAME
router.get('/patient/:patientName/observations', openmrsIntegrationController.getPatientObservations);
router.get('/patient/:patientName/passport', openmrsIntegrationController.getPatientPassportForOpenMRS);
router.get('/patient/uuid/:openmrsUuid', openmrsIntegrationController.getPatientByOpenmrsUuid);

// Sync endpoints
router.post('/patient/sync', openmrsIntegrationController.syncPatientMapping);
router.post('/hospital/sync', openmrsIntegrationController.syncHospitalMapping);
router.post('/doctor/sync', openmrsIntegrationController.syncDoctorMapping);

// Store observation from OpenMRS to passport (NEW: Doctors add data in OpenMRS → flows to Passport)
router.post('/observation/store', openmrsIntegrationController.storeObservationFromOpenMRS);

export default router;
