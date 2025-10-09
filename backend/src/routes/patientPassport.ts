import express from 'express';
import { param } from 'express-validator';
import { handleValidationErrors } from '@/middleware/validation';
import {
  getPatientPassportWithAccess,
  updatePatientPassportWithAccess
} from '@/controllers/passportAccessController';

const router = express.Router();

// @route   GET /api/patient-passport/:patientId
// @desc    Get patient passport with OTP access token (separate route)
// @access  Private (Doctor with valid access token)
router.get('/:patientId',
  [
    param('patientId').isMongoId().withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  getPatientPassportWithAccess
);

// @route   PUT /api/patient-passport/:patientId
// @desc    Update patient passport with OTP access token (separate route)
// @access  Private (Doctor with valid access token)
router.put('/:patientId',
  [
    param('patientId').isMongoId().withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  updatePatientPassportWithAccess
);

export default router;





