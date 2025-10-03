import express from 'express';
import {
  // Medical Conditions
  getAllMedicalConditions,
  createMedicalCondition,
  updateMedicalCondition,
  deleteMedicalCondition,
  // Medications
  getAllMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  // Test Results
  getAllTestResults,
  createTestResult,
  updateTestResult,
  deleteTestResult,
  // Hospital Visits
  getAllHospitalVisits,
  createHospitalVisit,
  updateHospitalVisit,
  deleteHospitalVisit
} from '@/controllers/medicalController';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter } from '@/middleware/rateLimiter';
import {
  validateMedicalCondition,
  validateMedication,
  validateTestResult,
  validateHospitalVisit,
  validateObjectId,
  validateSearchQuery
} from '@/middleware/validation';

const router = express.Router();

// Medical Conditions Routes
// @route   GET /api/medical-conditions
// @desc    Get all medical conditions
// @access  Private (Admin, Doctor)
router.get('/conditions', authenticate, authorize('admin', 'doctor'), generalLimiter, validateSearchQuery, getAllMedicalConditions);

// @route   POST /api/medical-conditions
// @desc    Create medical condition
// @access  Private (Doctor)
router.post('/conditions', authenticate, authorize('doctor'), validateMedicalCondition, createMedicalCondition);

// @route   PUT /api/medical-conditions/:id
// @desc    Update medical condition
// @access  Private (Doctor)
router.put('/conditions/:id', authenticate, authorize('doctor'), validateObjectId('id'), updateMedicalCondition);

// @route   DELETE /api/medical-conditions/:id
// @desc    Delete medical condition
// @access  Private (Doctor)
router.delete('/conditions/:id', authenticate, authorize('doctor'), validateObjectId('id'), deleteMedicalCondition);

// Medications Routes
// @route   GET /api/medications
// @desc    Get all medications
// @access  Private (Admin, Doctor)
router.get('/medications', authenticate, authorize('admin', 'doctor'), generalLimiter, validateSearchQuery, getAllMedications);

// @route   POST /api/medications
// @desc    Create medication
// @access  Private (Doctor)
router.post('/medications', authenticate, authorize('doctor'), validateMedication, createMedication);

// @route   PUT /api/medications/:id
// @desc    Update medication
// @access  Private (Doctor)
router.put('/medications/:id', authenticate, authorize('doctor'), validateObjectId('id'), updateMedication);

// @route   DELETE /api/medications/:id
// @desc    Delete medication
// @access  Private (Doctor)
router.delete('/medications/:id', authenticate, authorize('doctor'), validateObjectId('id'), deleteMedication);

// Test Results Routes
// @route   GET /api/test-results
// @desc    Get all test results
// @access  Private (Admin, Doctor)
router.get('/test-results', authenticate, authorize('admin', 'doctor'), generalLimiter, validateSearchQuery, getAllTestResults);

// @route   POST /api/test-results
// @desc    Create test result
// @access  Private (Doctor)
router.post('/test-results', authenticate, authorize('doctor'), validateTestResult, createTestResult);

// @route   PUT /api/test-results/:id
// @desc    Update test result
// @access  Private (Doctor)
router.put('/test-results/:id', authenticate, authorize('doctor'), validateObjectId('id'), updateTestResult);

// @route   DELETE /api/test-results/:id
// @desc    Delete test result
// @access  Private (Doctor)
router.delete('/test-results/:id', authenticate, authorize('doctor'), validateObjectId('id'), deleteTestResult);

// Hospital Visits Routes
// @route   GET /api/hospital-visits
// @desc    Get all hospital visits
// @access  Private (Admin, Doctor)
router.get('/hospital-visits', authenticate, authorize('admin', 'doctor'), generalLimiter, validateSearchQuery, getAllHospitalVisits);

// @route   POST /api/hospital-visits
// @desc    Create hospital visit
// @access  Private (Doctor)
router.post('/hospital-visits', authenticate, authorize('doctor'), validateHospitalVisit, createHospitalVisit);

// @route   PUT /api/hospital-visits/:id
// @desc    Update hospital visit
// @access  Private (Doctor)
router.put('/hospital-visits/:id', authenticate, authorize('doctor'), validateObjectId('id'), updateHospitalVisit);

// @route   DELETE /api/hospital-visits/:id
// @desc    Delete hospital visit
// @access  Private (Doctor)
router.delete('/hospital-visits/:id', authenticate, authorize('doctor'), validateObjectId('id'), deleteHospitalVisit);

export default router;








