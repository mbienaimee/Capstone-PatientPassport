import express from 'express';
import { authenticate } from '@/middleware/auth';
import { handleValidationErrors } from '@/middleware/validation';
import { body, param } from 'express-validator';
import {
  requestPassportAccessOTP,
  verifyPassportAccessOTP,
  getPatientPassportWithAccess
} from '@/controllers/passportAccessController';

const router = express.Router();

// @route   POST /api/passport-access/request-otp
// @desc    Request OTP for passport access (Doctor requests OTP from patient)
// @access  Private (Doctor)
router.post('/request-otp',
  authenticate,
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  requestPassportAccessOTP
);

// @route   POST /api/passport-access/verify-otp
// @desc    Verify OTP and grant passport access (Doctor enters OTP)
// @access  Private (Doctor)
router.post('/verify-otp',
  authenticate,
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits')
  ],
  handleValidationErrors,
  verifyPassportAccessOTP
);

// @route   GET /api/passport-access/patient/:patientId/passport
// @desc    Get patient passport with OTP access token
// @access  Private (Doctor with valid access token)
router.get('/patient/:patientId/passport',
  [
    param('patientId').isMongoId().withMessage('Valid patient ID is required')
  ],
  handleValidationErrors,
  getPatientPassportWithAccess
);

export default router;

