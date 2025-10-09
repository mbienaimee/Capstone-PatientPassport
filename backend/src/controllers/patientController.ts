import { Request, Response, NextFunction } from 'express';
import Patient from '@/models/Patient';
import MedicalCondition from '@/models/MedicalCondition';
import Medication from '@/models/Medication';
import TestResult from '@/models/TestResult';
import HospitalVisit from '@/models/HospitalVisit';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse, SearchQuery } from '@/types';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin, Doctor)
export const getAllPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status }: SearchQuery = req.query;

  const query: any = {};

  // Search functionality
  if (search) {
    query.$or = [
      { nationalId: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sorting
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const patients = await Patient.find(query)
    .populate('user', 'name email')
    .populate('assignedDoctors', 'specialization')
    .populate('assignedDoctors.user', 'name')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await Patient.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Patients retrieved successfully',
    data: patients,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private (Admin, Doctor, Patient)
export const getPatientById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patient = await Patient.findById(req.params.id)
    .populate('user', 'name email')
    .populate('assignedDoctors', 'specialization')
    .populate('assignedDoctors.user', 'name')
    .populate('medicalHistory')
    .populate('medications')
    .populate('testResults')
    .populate('hospitalVisits');

  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Patient retrieved successfully',
    data: patient
  };

  res.json(response);
});

// @desc    Get patient by national ID
// @route   GET /api/patients/national/:nationalId
// @access  Private (Admin, Doctor)
export const getPatientByNationalId = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patient = await Patient.findByNationalId(req.params.nationalId)
    .populate('user', 'name email')
    .populate('assignedDoctors', 'specialization')
    .populate('assignedDoctors.user', 'name');

  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Patient retrieved successfully',
    data: patient
  };

  res.json(response);
});

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Admin)
export const createPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patientData = req.body;

  // Check if patient with national ID already exists
  const existingPatient = await Patient.findByNationalId(patientData.nationalId);
  if (existingPatient) {
    throw new CustomError('Patient with this National ID already exists', 400);
  }

  const patient = await Patient.create(patientData);

  const response: ApiResponse = {
    success: true,
    message: 'Patient created successfully',
    data: patient
  };

  res.status(201).json(response);
});

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Admin, Doctor)
export const updatePatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Update patient data
  Object.assign(patient, req.body);
  await patient.save();

  const response: ApiResponse = {
    success: true,
    message: 'Patient updated successfully',
    data: patient
  };

  res.json(response);
});

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin)
export const deletePatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Soft delete - change status to inactive
  patient.status = 'inactive';
  await patient.save();

  const response: ApiResponse = {
    success: true,
    message: 'Patient deactivated successfully'
  };

  res.json(response);
});

// @desc    Get patient medical history
// @route   GET /api/patients/:id/medical-history
// @access  Private (Admin, Doctor, Patient)
export const getPatientMedicalHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const conditions = await MedicalCondition.findByPatient(req.params.id)
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'Medical history retrieved successfully',
    data: conditions
  };

  res.json(response);
});

// @desc    Get patient medications
// @route   GET /api/patients/:id/medications
// @access  Private (Admin, Doctor, Patient)
export const getPatientMedications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medications = await Medication.findByPatient(req.params.id)
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'Medications retrieved successfully',
    data: medications
  };

  res.json(response);
});

// @desc    Get patient test results
// @route   GET /api/patients/:id/test-results
// @access  Private (Admin, Doctor, Patient)
export const getPatientTestResults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const testResults = await TestResult.findByPatient(req.params.id)
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'Test results retrieved successfully',
    data: testResults
  };

  res.json(response);
});

// @desc    Get patient hospital visits
// @route   GET /api/patients/:id/hospital-visits
// @access  Private (Admin, Doctor, Patient)
export const getPatientHospitalVisits = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const visits = await HospitalVisit.findByPatient(req.params.id)
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'Hospital visits retrieved successfully',
    data: visits
  };

  res.json(response);
});

// @desc    Get patient summary
// @route   GET /api/patients/:id/summary
// @access  Private (Admin, Doctor, Patient)
export const getPatientSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patient = await Patient.findById(req.params.id);
  
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  const summary = patient.getSummary();

  // Get additional statistics
  const medicalHistoryCount = await MedicalCondition.countDocuments({ patient: patient._id });
  const medicationsCount = await Medication.countDocuments({ patient: patient._id });
  const testResultsCount = await TestResult.countDocuments({ patient: patient._id });
  const hospitalVisitsCount = await HospitalVisit.countDocuments({ patient: patient._id });

  const response: ApiResponse = {
    success: true,
    message: 'Patient summary retrieved successfully',
    data: {
      ...summary,
      medicalHistoryCount,
      medicationsCount,
      testResultsCount,
      hospitalVisitsCount
    }
  };

  res.json(response);
});

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private (Admin, Doctor)
export const searchPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    throw new CustomError('Search query is required', 400);
  }

  const query = {
    $or: [
      { nationalId: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (Number(page) - 1) * Number(limit);

  const patients = await Patient.find(query)
    .populate('user', 'name email')
    .populate('assignedDoctors', 'specialization')
    .populate('assignedDoctors.user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Patient.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Search results retrieved successfully',
    data: patients,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});










































