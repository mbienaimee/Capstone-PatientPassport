import express from 'express';
import {
  getAllHospitals,
  getHospitalById,
  getHospitalByLicense,
  createHospital,
  updateHospital,
  deleteHospital,
  approveHospital,
  rejectHospital,
  getHospitalDoctors,
  getHospitalPatients,
  getHospitalSummary,
  searchHospitals,
  getPendingHospitals,
  addDoctorToHospital,
  removeDoctorFromHospital
} from '@/controllers/hospitalController';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter, searchLimiter } from '@/middleware/rateLimiter';
import {
  validateHospital,
  validateObjectId,
  validateSearchQuery
} from '@/middleware/validation';

const router = express.Router();

// @route   GET /api/hospitals
// @desc    Get all hospitals
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin'), generalLimiter, validateSearchQuery, getAllHospitals);

// @route   GET /api/hospitals/pending
// @desc    Get pending hospitals
// @access  Private (Admin)
router.get('/pending', authenticate, authorize('admin'), getPendingHospitals);

// @route   GET /api/hospitals/search
// @desc    Search hospitals
// @access  Private (Admin)
router.get('/search', authenticate, authorize('admin'), searchLimiter, searchHospitals);

// @route   GET /api/hospitals/license/:licenseNumber
// @desc    Get hospital by license number
// @access  Private (Admin)
router.get('/license/:licenseNumber', authenticate, authorize('admin'), getHospitalByLicense);

// @route   GET /api/hospitals/:id
// @desc    Get hospital by ID
// @access  Private (Admin, Hospital)
router.get('/:id', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), getHospitalById);

// @route   POST /api/hospitals
// @desc    Create new hospital
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin'), validateHospital, createHospital);

// @route   PUT /api/hospitals/:id
// @desc    Update hospital
// @access  Private (Admin, Hospital)
router.put('/:id', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), updateHospital);

// @route   DELETE /api/hospitals/:id
// @desc    Delete hospital
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), deleteHospital);

// @route   PATCH /api/hospitals/:id/approve
// @desc    Approve hospital
// @access  Private (Admin)
router.patch('/:id/approve', authenticate, authorize('admin'), validateObjectId('id'), approveHospital);

// @route   PATCH /api/hospitals/:id/reject
// @desc    Reject hospital
// @access  Private (Admin)
router.patch('/:id/reject', authenticate, authorize('admin'), validateObjectId('id'), rejectHospital);

// @route   GET /api/hospitals/:id/doctors
// @desc    Get hospital doctors
// @access  Private (Admin, Hospital)
router.get('/:id/doctors', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), getHospitalDoctors);

// @route   GET /api/hospitals/:id/patients
// @desc    Get hospital patients
// @access  Private (Admin, Hospital)
router.get('/:id/patients', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), getHospitalPatients);

// @route   GET /api/hospitals/:id/summary
// @desc    Get hospital summary
// @access  Private (Admin, Hospital)
router.get('/:id/summary', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), getHospitalSummary);

// @route   POST /api/hospitals/:id/doctors
// @desc    Add doctor to hospital
// @access  Private (Admin, Hospital)
router.post('/:id/doctors', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), addDoctorToHospital);

// @route   DELETE /api/hospitals/:id/doctors/:doctorId
// @desc    Remove doctor from hospital
// @access  Private (Admin, Hospital)
router.delete('/:id/doctors/:doctorId', authenticate, authorize('admin', 'hospital'), validateObjectId('id'), validateObjectId('doctorId'), removeDoctorFromHospital);

export default router;





























