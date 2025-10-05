import express from 'express';
import {
  getAdminDashboard,
  getHospitalDashboard,
  getDoctorDashboard,
  getPatientDashboard,
  getGeneralStats
} from '@/controllers/dashboardController';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter } from '@/middleware/rateLimiter';

const router = express.Router();

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/admin', authenticate, authorize('admin'), generalLimiter, getAdminDashboard);

// @route   GET /api/dashboard/hospital
// @desc    Get hospital dashboard statistics
// @access  Private (Hospital)
router.get('/hospital', authenticate, authorize('hospital'), generalLimiter, getHospitalDashboard);

// @route   GET /api/dashboard/doctor
// @desc    Get doctor dashboard statistics
// @access  Private (Doctor)
router.get('/doctor', authenticate, authorize('doctor'), generalLimiter, getDoctorDashboard);

// @route   GET /api/dashboard/patient
// @desc    Get patient dashboard statistics
// @access  Private (Patient)
router.get('/patient', authenticate, authorize('patient'), generalLimiter, getPatientDashboard);

// @route   GET /api/dashboard/stats
// @desc    Get general statistics
// @access  Private (Admin)
router.get('/stats', authenticate, authorize('admin'), generalLimiter, getGeneralStats);

export default router;

















