import express from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  changeUserPassword,
  logout,
  deleteAccount,
  requestOTP,
  verifyOTPLogin,
  verifyEmail,
  resendEmailVerification,
  verifyRegistrationOTP,
  forgotPassword,
  resetPassword,
  verifyResetToken
} from '@/controllers/authController';
import { testEmail } from '@/controllers/testEmailController';
import { authenticate } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimiter';
import {
  validateUserRegistration,
  validateUserLogin
} from '@/middleware/validation';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validateUserRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateUserLogin, login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshToken);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, changePassword);

// @route   PUT /api/users/:userId/change-password
// @desc    Change any user's password (Admin/Hospital only)
// @access  Private (Admin, Hospital)
router.put('/users/:userId/change-password', authenticate, changeUserPassword);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, logout);

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticate, deleteAccount);

// OTP Routes
router.post('/request-otp', authLimiter, requestOTP);
router.post('/verify-otp', authLimiter, verifyOTPLogin);

// Email Verification Routes
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, resendEmailVerification);

// OTP Verification Routes
router.post('/verify-registration-otp', authLimiter, verifyRegistrationOTP);

// Password Reset Routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// Test Email Route (for debugging)
router.post('/test-email', testEmail);

export default router;












