import { Request, Response, NextFunction } from 'express';
import MedicalCondition from '@/models/MedicalCondition';
import Medication from '@/models/Medication';
import TestResult from '@/models/TestResult';
import HospitalVisit from '@/models/HospitalVisit';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse, SearchQuery } from '@/types';

// Medical Conditions Controller

// @desc    Get all medical conditions
// @route   GET /api/medical-conditions
// @access  Private (Admin, Doctor)
export const getAllMedicalConditions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'diagnosed', sortOrder = 'desc', status, patientId }: SearchQuery = req.query;

  const query: any = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { details: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by patient
  if (patientId) {
    query.patient = patientId;
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sorting
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const conditions = await MedicalCondition.find(query)
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await MedicalCondition.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Medical conditions retrieved successfully',
    data: conditions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Create medical condition
// @route   POST /api/medical-conditions
// @access  Private (Doctor)
export const createMedicalCondition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const conditionData = req.body;

  const condition = await MedicalCondition.create(conditionData);

  const response: ApiResponse = {
    success: true,
    message: 'Medical condition created successfully',
    data: condition
  };

  res.status(201).json(response);
});

// @desc    Update medical condition
// @route   PUT /api/medical-conditions/:id
// @access  Private (Doctor)
export const updateMedicalCondition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const condition = await MedicalCondition.findById(req.params.id);

  if (!condition) {
    throw new CustomError('Medical condition not found', 404);
  }

  Object.assign(condition, req.body);
  await condition.save();

  const response: ApiResponse = {
    success: true,
    message: 'Medical condition updated successfully',
    data: condition
  };

  res.json(response);
});

// @desc    Delete medical condition
// @route   DELETE /api/medical-conditions/:id
// @access  Private (Doctor)
export const deleteMedicalCondition = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const condition = await MedicalCondition.findById(req.params.id);

  if (!condition) {
    throw new CustomError('Medical condition not found', 404);
  }

  await condition.deleteOne();

  const response: ApiResponse = {
    success: true,
    message: 'Medical condition deleted successfully'
  };

  res.json(response);
});

// Medications Controller

// @desc    Get all medications
// @route   GET /api/medications
// @access  Private (Admin, Doctor)
export const getAllMedications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'startDate', sortOrder = 'desc', status, patientId }: SearchQuery = req.query;

  const query: any = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { dosage: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by patient
  if (patientId) {
    query.patient = patientId;
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sorting
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const medications = await Medication.find(query)
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await Medication.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Medications retrieved successfully',
    data: medications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Create medication
// @route   POST /api/medications
// @access  Private (Doctor)
export const createMedication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medicationData = req.body;

  const medication = await Medication.create(medicationData);

  const response: ApiResponse = {
    success: true,
    message: 'Medication created successfully',
    data: medication
  };

  res.status(201).json(response);
});

// @desc    Update medication
// @route   PUT /api/medications/:id
// @access  Private (Doctor)
export const updateMedication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medication = await Medication.findById(req.params.id);

  if (!medication) {
    throw new CustomError('Medication not found', 404);
  }

  Object.assign(medication, req.body);
  await medication.save();

  const response: ApiResponse = {
    success: true,
    message: 'Medication updated successfully',
    data: medication
  };

  res.json(response);
});

// @desc    Delete medication
// @route   DELETE /api/medications/:id
// @access  Private (Doctor)
export const deleteMedication = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const medication = await Medication.findById(req.params.id);

  if (!medication) {
    throw new CustomError('Medication not found', 404);
  }

  await medication.deleteOne();

  const response: ApiResponse = {
    success: true,
    message: 'Medication deleted successfully'
  };

  res.json(response);
});

// Test Results Controller

// @desc    Get all test results
// @route   GET /api/test-results
// @access  Private (Admin, Doctor)
export const getAllTestResults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc', status, patientId }: SearchQuery = req.query;

  const query: any = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { findings: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by patient
  if (patientId) {
    query.patient = patientId;
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sorting
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const testResults = await TestResult.find(query)
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await TestResult.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Test results retrieved successfully',
    data: testResults,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Create test result
// @route   POST /api/test-results
// @access  Private (Doctor)
export const createTestResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const testResultData = req.body;

  const testResult = await TestResult.create(testResultData);

  const response: ApiResponse = {
    success: true,
    message: 'Test result created successfully',
    data: testResult
  };

  res.status(201).json(response);
});

// @desc    Update test result
// @route   PUT /api/test-results/:id
// @access  Private (Doctor)
export const updateTestResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const testResult = await TestResult.findById(req.params.id);

  if (!testResult) {
    throw new CustomError('Test result not found', 404);
  }

  Object.assign(testResult, req.body);
  await testResult.save();

  const response: ApiResponse = {
    success: true,
    message: 'Test result updated successfully',
    data: testResult
  };

  res.json(response);
});

// @desc    Delete test result
// @route   DELETE /api/test-results/:id
// @access  Private (Doctor)
export const deleteTestResult = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const testResult = await TestResult.findById(req.params.id);

  if (!testResult) {
    throw new CustomError('Test result not found', 404);
  }

  await testResult.deleteOne();

  const response: ApiResponse = {
    success: true,
    message: 'Test result deleted successfully'
  };

  res.json(response);
});

// Hospital Visits Controller

// @desc    Get all hospital visits
// @route   GET /api/hospital-visits
// @access  Private (Admin, Doctor)
export const getAllHospitalVisits = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc', patientId }: SearchQuery = req.query;

  const query: any = {};

  // Search functionality
  if (search) {
    query.$or = [
      { reason: { $regex: search, $options: 'i' } },
      { diagnosis: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by patient
  if (patientId) {
    query.patient = patientId;
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Sorting
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const visits = await HospitalVisit.find(query)
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await HospitalVisit.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Hospital visits retrieved successfully',
    data: visits,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Create hospital visit
// @route   POST /api/hospital-visits
// @access  Private (Doctor)
export const createHospitalVisit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const visitData = req.body;

  const visit = await HospitalVisit.create(visitData);

  const response: ApiResponse = {
    success: true,
    message: 'Hospital visit created successfully',
    data: visit
  };

  res.status(201).json(response);
});

// @desc    Update hospital visit
// @route   PUT /api/hospital-visits/:id
// @access  Private (Doctor)
export const updateHospitalVisit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const visit = await HospitalVisit.findById(req.params.id);

  if (!visit) {
    throw new CustomError('Hospital visit not found', 404);
  }

  Object.assign(visit, req.body);
  await visit.save();

  const response: ApiResponse = {
    success: true,
    message: 'Hospital visit updated successfully',
    data: visit
  };

  res.json(response);
});

// @desc    Delete hospital visit
// @route   DELETE /api/hospital-visits/:id
// @access  Private (Doctor)
export const deleteHospitalVisit = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const visit = await HospitalVisit.findById(req.params.id);

  if (!visit) {
    throw new CustomError('Hospital visit not found', 404);
  }

  await visit.deleteOne();

  const response: ApiResponse = {
    success: true,
    message: 'Hospital visit deleted successfully'
  };

  res.json(response);
});































