import express from 'express';
import {
  getAllPatients,
  getPatientById,
  getPatientByNationalId,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientMedicalHistory,
  getPatientMedications,
  getPatientTestResults,
  getPatientHospitalVisits,
  getPatientSummary,
  searchPatients
} from '@/controllers/patientController';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter, searchLimiter } from '@/middleware/rateLimiter';
import {
  validatePatient,
  validateObjectId,
  validateSearchQuery
} from '@/middleware/validation';

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (Admin, Doctor)
router.get('/', authenticate, authorize('admin', 'doctor'), generalLimiter, validateSearchQuery, getAllPatients);

// @route   GET /api/patients/search
// @desc    Search patients
// @access  Private (Admin, Doctor)
router.get('/search', authenticate, authorize('admin', 'doctor'), searchLimiter, searchPatients);

// @route   GET /api/patients/national/:nationalId
// @desc    Get patient by national ID
// @access  Private (Admin, Doctor)
router.get('/national/:nationalId', authenticate, authorize('admin', 'doctor'), getPatientByNationalId);

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private (Admin, Doctor, Patient)
router.get('/:id', authenticate, validateObjectId('id'), getPatientById);

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin'), validatePatient, createPatient);

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Admin, Doctor)
router.put('/:id', authenticate, authorize('admin', 'doctor'), validateObjectId('id'), updatePatient);

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), deletePatient);

// @route   GET /api/patients/:id/medical-history
// @desc    Get patient medical history
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/medical-history', authenticate, validateObjectId('id'), getPatientMedicalHistory);

// @route   GET /api/patients/:id/medications
// @desc    Get patient medications
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/medications', authenticate, validateObjectId('id'), getPatientMedications);

// @route   GET /api/patients/:id/test-results
// @desc    Get patient test results
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/test-results', authenticate, validateObjectId('id'), getPatientTestResults);

// @route   GET /api/patients/:id/hospital-visits
// @desc    Get patient hospital visits
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/hospital-visits', authenticate, validateObjectId('id'), getPatientHospitalVisits);

// @route   GET /api/patients/:id/summary
// @desc    Get patient summary
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/summary', authenticate, validateObjectId('id'), getPatientSummary);

export default router;








