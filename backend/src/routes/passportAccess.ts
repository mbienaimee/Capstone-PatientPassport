import express from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter } from '@/middleware/rateLimiter';
import { validateObjectId } from '@/middleware/validation';
import {
  requestPassportAccessOTP,
  verifyPassportAccessOTP,
  getPatientPassport,
  updatePatientPassport,
  getRecentPassportAccess
} from '@/controllers/passportAccessController';

const router = express.Router();

// @route   POST /api/passport-access/request-otp
// @desc    Request OTP for passport access
// @access  Private (Doctor)
router.post('/request-otp', authenticate, authorize('doctor'), generalLimiter, requestPassportAccessOTP);

// @route   POST /api/passport-access/verify-otp
// @desc    Verify OTP and grant passport access
// @access  Private (Doctor)
router.post('/verify-otp', authenticate, authorize('doctor'), generalLimiter, verifyPassportAccessOTP);

// @route   GET /api/passport-access/:patientId
// @desc    Get patient passport
// @access  Private (Doctor)
router.get('/:patientId', authenticate, authorize('doctor'), validateObjectId('patientId'), getPatientPassport);

// @route   PUT /api/passport-access/:patientId
// @desc    Update patient passport
// @access  Private (Doctor)
router.put('/:patientId', authenticate, authorize('doctor'), validateObjectId('patientId'), updatePatientPassport);

// @route   GET /api/passport-access/recent
// @desc    Get doctor's recent passport access
// @access  Private (Doctor)
router.get('/recent', authenticate, authorize('doctor'), generalLimiter, getRecentPassportAccess);

export default router;