import express from 'express';
import {
  getPatientMedicalRecords,
  addMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecordsByType,
  getMedicalRecordEditAccess
} from '@/controllers/medicalRecordController';
import { authenticate } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get all medical records for a patient
// @access  Private
router.get('/patient/:patientId', getPatientMedicalRecords);

// @route   GET /api/medical-records/patient/:patientId/type/:type
// @desc    Get medical records by type for a patient
// @access  Private
router.get('/patient/:patientId/type/:type', getMedicalRecordsByType);

// @route   POST /api/medical-records
// @desc    Add a new medical record
// @access  Private (Doctor, Admin)
router.post('/', addMedicalRecord);

// @route   GET /api/medical-records/:id/edit-access
// @desc    Get edit access info for a medical record
// @access  Private (Doctor, Admin)
router.get('/:id/edit-access', getMedicalRecordEditAccess);

// @route   PUT /api/medical-records/:id
// @desc    Update a medical record
// @access  Private (Doctor, Admin)
router.put('/:id', updateMedicalRecord);

// @route   DELETE /api/medical-records/:id
// @desc    Delete a medical record
// @access  Private (Doctor, Admin)
router.delete('/:id', deleteMedicalRecord);

export default router;































