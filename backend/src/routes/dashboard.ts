import express from 'express';
import {
  getAdminDashboard,
  getHospitalDashboard,
  getDoctorDashboard,
  getPatientDashboard,
  getGeneralStats,
  getAllPatients,
  getAllHospitals,
  getAdminOverview,
  updateHospitalStatus,
  updatePatientStatus
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

// @route   GET /api/dashboard/admin/patients
// @desc    Get all patients for admin dashboard
// @access  Private (Admin)
router.get('/admin/patients', authenticate, authorize('admin'), generalLimiter, getAllPatients);

// @route   GET /api/dashboard/admin/hospitals
// @desc    Get all hospitals for admin dashboard
// @access  Private (Admin)
router.get('/admin/hospitals', authenticate, authorize('admin'), generalLimiter, getAllHospitals);

// @route   GET /api/dashboard/admin/overview
// @desc    Get comprehensive admin dashboard data
// @access  Private (Admin)
router.get('/admin/overview', authenticate, authorize('admin'), generalLimiter, getAdminOverview);

// @route   PUT /api/dashboard/admin/hospitals/:hospitalId/status
// @desc    Update hospital status
// @access  Private (Admin)
router.put('/admin/hospitals/:hospitalId/status', authenticate, authorize('admin'), generalLimiter, updateHospitalStatus);

// @route   PUT /api/dashboard/admin/patients/:patientId/status
// @desc    Update patient status
// @access  Private (Admin)
router.put('/admin/patients/:patientId/status', authenticate, authorize('admin'), generalLimiter, updatePatientStatus);

export default router;











































