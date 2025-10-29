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
  // First get the hospital to verify it exists
  const hospital = await Hospital.findById(req.params.id);
  
  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  console.log('Fetching patients for hospital:', hospital.name);

  // Get ALL patients from database (not filtered by hospital)
  const patients = await Patient.find({})
    .populate('user', 'name email')
    .populate({
      path: 'assignedDoctors',
      select: 'specialization user',
      populate: {
        path: 'user',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });

  console.log('Total patients found:', patients.length);

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
  const patientsCount = hospital.patients ? hospital.patients.length : 0;

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

// @desc    Add doctor to hospital
// @route   POST /api/hospitals/:id/doctors
// @access  Private (Admin, Hospital)
export const addDoctorToHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospitalId = req.params.id; // Fix: use 'id' instead of 'hospitalId'
  const { name, email, password, licenseNumber, specialization } = req.body;

  console.log('Adding doctor to hospital:', hospitalId);
  console.log('Doctor data:', { name, email, licenseNumber, specialization });

  // Check if hospital exists
  const hospital = await Hospital.findById(hospitalId);
  console.log('Hospital found:', !!hospital);
  if (hospital) {
    console.log('Hospital details:', { id: hospital._id, name: hospital.name, status: hospital.status });
  }
  
  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  // Additional authorization check: Only the hospital owner or admin can add doctors
  if (req.user.role === 'hospital' && hospital.user.toString() !== req.user._id.toString()) {
    throw new CustomError('Access denied. You can only add doctors to your own hospital.', 403);
  }

  // Check if doctor with license number already exists
  const existingDoctor = await Doctor.findByLicenseNumber(licenseNumber);
  if (existingDoctor) {
    throw new CustomError('Doctor with this license number already exists', 400);
  }

  // Create user for doctor (password will be automatically hashed by User model pre-save middleware)
  const User = require('@/models/User').default;
  const user = await User.create({
    name,
    email,
    password, // Let the User model handle password hashing
    role: 'doctor',
    isActive: true,
    isEmailVerified: true
  });

  // Create doctor
  const doctor = await Doctor.create({
    user: user._id,
    licenseNumber,
    specialization,
    hospital: hospitalId,
    isActive: true
  });

  // Add doctor to hospital
  hospital.doctors.push(doctor._id);
  await hospital.save();

  // Populate doctor data
  await doctor.populate('user', 'name email');

  const response: ApiResponse = {
    success: true,
    message: 'Doctor added to hospital successfully',
    data: doctor
  };

  res.status(201).json(response);
});

// @desc    Remove doctor from hospital
// @route   DELETE /api/hospitals/:id/doctors/:doctorId
// @access  Private (Admin, Hospital)
export const removeDoctorFromHospital = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const hospitalId = req.params.id; // Fix: use 'id' instead of 'hospitalId'
  const doctorId = req.params.doctorId;

  // Check if hospital exists
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  // Additional authorization check: Only the hospital owner or admin can remove doctors
  if (req.user.role === 'hospital' && hospital.user.toString() !== req.user._id.toString()) {
    throw new CustomError('Access denied. You can only remove doctors from your own hospital.', 403);
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  // Check if doctor belongs to this hospital
  if (doctor.hospital.toString() !== hospitalId) {
    throw new CustomError('Doctor does not belong to this hospital', 400);
  }

  // Remove doctor from hospital
  hospital.doctors = hospital.doctors.filter(id => id.toString() !== doctorId);
  await hospital.save();

  // Deactivate doctor
  doctor.isActive = false;
  await doctor.save();

  const response: ApiResponse = {
    success: true,
    message: 'Doctor removed from hospital successfully'
  };

  res.json(response);
});


























