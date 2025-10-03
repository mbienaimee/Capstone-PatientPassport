import { Request, Response, NextFunction } from 'express';
import Hospital from '@/models/Hospital';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse, SearchQuery } from '@/types';

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private (Admin)
export const getAllHospitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status }: SearchQuery = req.query;

  const query: any = {};

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { licenseNumber: { $regex: search, $options: 'i' } }
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

  const hospitals = await Hospital.find(query)
    .populate('user', 'name email')
    .populate('doctors', 'specialization')
    .populate('doctors.user', 'name')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await Hospital.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Hospitals retrieved successfully',
    data: hospitals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Get hospital by ID
// @route   GET /api/hospitals/:id
// @access  Private (Admin, Hospital)
export const getHospitalById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findById(req.params.id)
    .populate('user', 'name email')
    .populate('doctors', 'specialization')
    .populate('doctors.user', 'name')
    .populate('patients', 'nationalId')
    .populate('patients.user', 'name');

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Hospital retrieved successfully',
    data: hospital
  };

  res.json(response);
});

// @desc    Get hospital by license number
// @route   GET /api/hospitals/license/:licenseNumber
// @access  Private (Admin)
export const getHospitalByLicense = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findByLicenseNumber(req.params.licenseNumber)
    .populate('user', 'name email')
    .populate('doctors', 'specialization')
    .populate('doctors.user', 'name');

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Hospital retrieved successfully',
    data: hospital
  };

  res.json(response);
});

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private (Admin)
export const createHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospitalData = req.body;

  // Check if hospital with license number already exists
  const existingHospital = await Hospital.findByLicenseNumber(hospitalData.licenseNumber);
  if (existingHospital) {
    throw new CustomError('Hospital with this license number already exists', 400);
  }

  const hospital = await Hospital.create(hospitalData);

  const response: ApiResponse = {
    success: true,
    message: 'Hospital created successfully',
    data: hospital
  };

  res.status(201).json(response);
});

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private (Admin, Hospital)
export const updateHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  // Update hospital data
  Object.assign(hospital, req.body);
  await hospital.save();

  const response: ApiResponse = {
    success: true,
    message: 'Hospital updated successfully',
    data: hospital
  };

  res.json(response);
});

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private (Admin)
export const deleteHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  // Soft delete - change status to inactive
  hospital.status = 'inactive';
  await hospital.save();

  const response: ApiResponse = {
    success: true,
    message: 'Hospital deactivated successfully'
  };

  res.json(response);
});

// @desc    Approve hospital
// @route   PATCH /api/hospitals/:id/approve
// @access  Private (Admin)
export const approveHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  hospital.status = 'active';
  await hospital.save();

  const response: ApiResponse = {
    success: true,
    message: 'Hospital approved successfully',
    data: hospital
  };

  res.json(response);
});

// @desc    Reject hospital
// @route   PATCH /api/hospitals/:id/reject
// @access  Private (Admin)
export const rejectHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  hospital.status = 'inactive';
  await hospital.save();

  const response: ApiResponse = {
    success: true,
    message: 'Hospital rejected successfully'
  };

  res.json(response);
});

// @desc    Get hospital doctors
// @route   GET /api/hospitals/:id/doctors
// @access  Private (Admin, Hospital)
export const getHospitalDoctors = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const doctors = await Doctor.findByHospital(req.params.id)
    .populate('user', 'name email')
    .populate('patients', 'nationalId')
    .populate('patients.user', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'Hospital doctors retrieved successfully',
    data: doctors
  };

  res.json(response);
});

// @desc    Get hospital patients
// @route   GET /api/hospitals/:id/patients
// @access  Private (Admin, Hospital)
export const getHospitalPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patients = await Patient.find({ hospitalVisits: { $in: [req.params.id] } })
    .populate('user', 'name email')
    .populate('assignedDoctors', 'specialization')
    .populate('assignedDoctors.user', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'Hospital patients retrieved successfully',
    data: patients
  };

  res.json(response);
});

// @desc    Get hospital summary
// @route   GET /api/hospitals/:id/summary
// @access  Private (Admin, Hospital)
export const getHospitalSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospital = await Hospital.findById(req.params.id);
  
  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  const summary = hospital.getSummary();

  // Get additional statistics
  const doctorsCount = await Doctor.countDocuments({ hospital: hospital._id });
  const patientsCount = await Patient.countDocuments({ hospitalVisits: { $in: [hospital._id] } });

  const response: ApiResponse = {
    success: true,
    message: 'Hospital summary retrieved successfully',
    data: {
      ...summary,
      doctorsCount,
      patientsCount
    }
  };

  res.json(response);
});

// @desc    Search hospitals
// @route   GET /api/hospitals/search
// @access  Private (Admin)
export const searchHospitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    throw new CustomError('Search query is required', 400);
  }

  const query = {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } },
      { licenseNumber: { $regex: q, $options: 'i' } }
    ]
  };

  const skip = (Number(page) - 1) * Number(limit);

  const hospitals = await Hospital.find(query)
    .populate('user', 'name email')
    .populate('doctors', 'specialization')
    .populate('doctors.user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Hospital.countDocuments(query);

  const response: ApiResponse = {
    success: true,
    message: 'Search results retrieved successfully',
    data: hospitals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});

// @desc    Get pending hospitals
// @route   GET /api/hospitals/pending
// @access  Private (Admin)
export const getPendingHospitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const hospitals = await Hospital.findPending()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Hospital.countDocuments({ status: 'pending' });

  const response: ApiResponse = {
    success: true,
    message: 'Pending hospitals retrieved successfully',
    data: hospitals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
});








