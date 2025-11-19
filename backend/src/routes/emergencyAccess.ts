import express from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter } from '@/middleware/rateLimiter';
import { handleValidationErrors } from '@/middleware/validation';
import { body, param, query } from 'express-validator';
import {
  requestEmergencyAccess,
  getPatientRecordsEmergency,
  getEmergencyAccessLogs,
  getPatientEmergencyAudit,
  getDoctorEmergencyHistory
} from '@/controllers/emergencyAccessController';

const router = express.Router();

// @route   POST /api/emergency-access/request
// @desc    Request emergency break-glass access to patient records
// @access  Private (Doctor)
router.post('/request',
  authenticate,
  authorize('doctor'),
  generalLimiter,
  [
    body('patientId')
      .isMongoId()
      .withMessage('Valid patient ID is required'),
    body('justification')
      .trim()
      .isLength({ min: 20, max: 500 })
      .withMessage('Justification must be between 20 and 500 characters and must clearly describe the emergency'),
    body('hospitalId')
      .optional()
      .isMongoId()
      .withMessage('Valid hospital ID is required if provided')
  ],
  handleValidationErrors,
  requestEmergencyAccess
);

// @route   GET /api/emergency-access/patient/:patientId
// @desc    Get patient records with emergency access
// @access  Private (Doctor with emergency access)
router.get('/patient/:patientId',
  authenticate,
  authorize('doctor'),
  generalLimiter,
  [
    param('patientId')
      .isMongoId()
      .withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  getPatientRecordsEmergency
);

// @route   GET /api/emergency-access/logs
// @desc    Get all emergency access logs (for audit)
// @access  Private (Admin)
router.get('/logs',
  authenticate,
  authorize('admin'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('doctorId')
      .optional()
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    query('patientId')
      .optional()
      .isMongoId()
      .withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  getEmergencyAccessLogs
);

// @route   GET /api/emergency-access/audit/:patientId
// @desc    Get emergency access audit trail for a specific patient
// @access  Private (Admin, Patient)
router.get('/audit/:patientId',
  authenticate,
  [
    param('patientId')
      .isMongoId()
      .withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  getPatientEmergencyAudit
);

// @route   GET /api/emergency-access/my-history
// @desc    Get doctor's emergency access history
// @access  Private (Doctor)
router.get('/my-history',
  authenticate,
  authorize('doctor'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  getDoctorEmergencyHistory
);

export default router;
