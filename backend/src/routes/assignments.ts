import express from 'express';
import {
  assignPatientToDoctor,
  removePatientFromDoctor,
  getDoctorAssignments,
  getPatientAssignments,
  getAvailableDoctors,
  getAssignmentStatistics
} from '@/controllers/assignmentController';
import { authenticate, authorize } from '@/middleware/auth';
import { generalLimiter } from '@/middleware/rateLimiter';
import { validateObjectId } from '@/middleware/validation';

const router = express.Router();

// @route   POST /api/assignments/assign-patient
// @desc    Assign patient to doctor
// @access  Private (Receptionist, Admin)
router.post('/assign-patient', 
  authenticate, 
  authorize('receptionist', 'admin'), 
  generalLimiter, 
  assignPatientToDoctor
);

// @route   DELETE /api/assignments/remove-patient
// @desc    Remove patient from doctor
// @access  Private (Receptionist, Admin, Doctor)
router.delete('/remove-patient', 
  authenticate, 
  authorize('receptionist', 'admin', 'doctor'), 
  generalLimiter, 
  removePatientFromDoctor
);

// @route   GET /api/assignments/doctor/:doctorId
// @desc    Get all assignments for a doctor
// @access  Private (Doctor, Admin)
router.get('/doctor/:doctorId', 
  authenticate, 
  authorize('doctor', 'admin'), 
  validateObjectId('doctorId'), 
  getDoctorAssignments
);

// @route   GET /api/assignments/patient/:patientId
// @desc    Get all assignments for a patient
// @access  Private (Patient, Doctor, Admin)
router.get('/patient/:patientId', 
  authenticate, 
  authorize('patient', 'doctor', 'admin'), 
  validateObjectId('patientId'), 
  getPatientAssignments
);

// @route   GET /api/assignments/available-doctors
// @desc    Get available doctors for assignment
// @access  Private (Receptionist, Admin)
router.get('/available-doctors', 
  authenticate, 
  authorize('receptionist', 'admin'), 
  generalLimiter, 
  getAvailableDoctors
);

// @route   GET /api/assignments/statistics
// @desc    Get assignment statistics
// @access  Private (Admin)
router.get('/statistics', 
  authenticate, 
  authorize('admin'), 
  generalLimiter, 
  getAssignmentStatistics
);

export default router;


















