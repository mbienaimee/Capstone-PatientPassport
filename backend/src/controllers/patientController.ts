import { Request, Response, NextFunction } from 'express';
import Patient from '@/models/Patient';
import PatientPassport from '@/models/PatientPassport';
import MedicalCondition from '@/models/MedicalCondition';
import Medication from '@/models/Medication';
import TestResult from '@/models/TestResult';
import HospitalVisit from '@/models/HospitalVisit';
import MedicalRecord from '@/models/MedicalRecord';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse, SearchQuery } from '@/types';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin, Doctor)
export const getAllPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status }: SearchQuery = req.query;

  const query: any = {};

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

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private (Admin, Doctor)
export const searchPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status }: SearchQuery = req.query;

  if (!search) {
    throw new CustomError('Search query is required', 400);
  }

  const query: any = {};

  // Search functionality
  query.$or = [
    { nationalId: { $regex: search, $options: 'i' } },
    { address: { $regex: search, $options: 'i' } }
  ];

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
  const { name, email, nationalId, dateOfBirth, gender, contactNumber, address, bloodType, allergies, emergencyContact, hospitalId } = req.body;

  // Check if patient with national ID already exists
  const existingPatient = await Patient.findByNationalId(nationalId);
  if (existingPatient) {
    throw new CustomError('Patient with this National ID already exists', 400);
  }

  // Check if user with email already exists
  const User = require('@/models/User').default;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User with this email already exists', 400);
  }

  // Create user for patient
  const user = await User.create({
    name,
    email,
    password: nationalId, // Default password is national ID (patient should change it)
    role: 'patient',
    isActive: true,
    isEmailVerified: true // Auto-verify for doctor-created patients
  });

  // Create patient
  const patient = await Patient.create({
    user: user._id,
    nationalId,
    dateOfBirth,
    gender,
    contactNumber,
    address,
    bloodType,
    allergies: allergies || [],
    emergencyContact,
    status: 'active'
  });

  // If doctor is creating patient, add to doctor's patient list and hospital's patient list
  if (req.user.role === 'doctor') {
    const Doctor = require('@/models/Doctor').default;
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (doctor) {
      // Add patient to doctor's list
      doctor.patients.push(patient._id);
      await doctor.save();

      // Add patient to hospital's list and hospital to patient's visits
      if (doctor.hospital) {
        const Hospital = require('@/models/Hospital').default;
        const hospital = await Hospital.findById(doctor.hospital);
        if (hospital && !hospital.patients.includes(patient._id)) {
          hospital.patients.push(patient._id);
          await hospital.save();
          
          // Add hospital to patient's hospitalVisits
          if (!patient.hospitalVisits.includes(doctor.hospital)) {
            patient.hospitalVisits.push(doctor.hospital);
          }
        }
      }

      // Add doctor to patient's assigned doctors
      patient.assignedDoctors.push(doctor._id);
      await patient.save();
    }
  }

  // If hospital is creating patient, add to hospital's patient list
  if (req.user.role === 'hospital') {
    const Hospital = require('@/models/Hospital').default;
    const hospital = await Hospital.findOne({ user: req.user._id });
    
    if (hospital) {
      if (!hospital.patients.includes(patient._id)) {
        hospital.patients.push(patient._id);
        await hospital.save();
      }
      
      // Add hospital to patient's hospitalVisits
      if (!patient.hospitalVisits.includes(hospital._id)) {
        patient.hospitalVisits.push(hospital._id);
        await patient.save();
      }
    }
  }

  // If hospitalId is provided in request body, add patient to that hospital
  if (hospitalId) {
    const Hospital = require('@/models/Hospital').default;
    const hospital = await Hospital.findById(hospitalId);
    
    if (hospital) {
      if (!hospital.patients.includes(patient._id)) {
        hospital.patients.push(patient._id);
        await hospital.save();
      }
      
      // Add hospital to patient's hospitalVisits
      if (!patient.hospitalVisits.includes(hospitalId)) {
        patient.hospitalVisits.push(hospitalId);
        await patient.save();
      }
    }
  }

  // Populate patient data
  await patient.populate('user', 'name email');

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

// @desc    Get complete patient passport data
// @route   GET /api/patients/passport/:patientId
// @access  Private (Patient, Doctor, Admin)
export const getPatientPassport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const user = req.user;

  console.log(`\n🔍 === getPatientPassport called ===`);
  console.log(`   Patient ID param: ${patientId}`);
  console.log(`   User role: ${user.role}`);
  console.log(`   User ID: ${user.id}`);

  let patient;
  
  // If the patientId is actually a user ID (for patient role), find the patient by user reference
  if (user.role === 'patient' && patientId === user.id) {
    console.log(`   Looking up patient by user ID...`);
    patient = await Patient.findOne({ user: patientId });
  } else {
    // For doctors and admins, use the patientId directly
    console.log(`   Looking up patient by patient ID...`);
    patient = await Patient.findById(patientId);
  }

  if (!patient) {
    console.log(`   ❌ Patient not found!`);
    throw new CustomError('Patient not found', 404);
  }

  console.log(`   ✅ Found patient document ID: ${patient._id}`);
  console.log(`   Patient name: ${patient.user?.name || 'Unknown'}`);

  // Check permissions
  if (user.role === 'patient' && patient.user.toString() !== user.id) {
    throw new CustomError('Not authorized to view this patient\'s passport', 403);
  }

  console.log(`✅ Found patient: ${patient.user.name || 'Unknown'}`);

  try {
    // First, try to get the PatientPassport (the unified passport system)
    const passport = await PatientPassport.findByPatientId(patient._id);
    
    if (passport) {
      console.log(`✅ Found PatientPassport for patient: ${patient._id}`);
      
      // Populate passport data
      const populatedPassport = await PatientPassport.findById(passport._id)
        .populate('patient', 'user nationalId')
        .populate('patient.user', 'name email')
        .populate('lastUpdatedBy', 'user')
        .populate('lastUpdatedBy.user', 'name')
        .populate('accessHistory.doctor', 'user')
        .populate('accessHistory.doctor.user', 'name');

      // **CRITICAL FIX**: Also fetch MedicalRecord data (where OpenMRS sync stores data)
      console.log(`🔍 Fetching MedicalRecord collection data for patient: ${patient._id}`);
      const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 });
      
      console.log(`   Found ${medicalRecords.length} medical records in MedicalRecord collection`);

      // Transform MedicalRecord data
      const medicalRecordConditions = medicalRecords
        .filter(record => record.type === 'condition')
        .map(record => ({
          _id: record._id,
          data: {
            name: record.data.name || '',
            details: record.data.details || '',
            diagnosed: record.data.diagnosed || '',
            procedure: record.data.procedure || ''
          },
          openmrsData: record.openmrsData || null,
          createdAt: record.createdAt,
          createdBy: record.createdBy
        }));

      const medicalRecordMedications = medicalRecords
        .filter(record => record.type === 'medication')
        .map(record => ({
          _id: record._id,
          data: record.data,
          openmrsData: record.openmrsData || null,
          createdAt: record.createdAt,
          createdBy: record.createdBy
        }));

      const medicalRecordTests = medicalRecords
        .filter(record => record.type === 'test')
        .map(record => ({
          _id: record._id,
          data: record.data,
          openmrsData: record.openmrsData || null,
          createdAt: record.createdAt,
          createdBy: record.createdBy
        }));

      const medicalRecordVisits = medicalRecords
        .filter(record => record.type === 'visit')
        .map(record => ({
          _id: record._id,
          data: record.data,
          openmrsData: record.openmrsData || null,
          createdAt: record.createdAt,
          createdBy: record.createdBy
        }));

      // Transform the data to match what the patient frontend expects
      console.log(`🔄 Transforming passport data for patient frontend...`);
      console.log(`   PatientPassport conditions: ${populatedPassport.medicalInfo.medicalConditions?.length || 0}`);
      console.log(`   MedicalRecord conditions: ${medicalRecordConditions.length}`);
      console.log(`   TOTAL conditions to return: ${medicalRecordConditions.length + (populatedPassport.medicalInfo.medicalConditions?.length || 0)}`);
      
      const transformedData = {
        // Patient profile data
        patient: {
          _id: populatedPassport.patient._id,
          user: populatedPassport.patient.user,
          nationalId: populatedPassport.patient.nationalId,
          dateOfBirth: populatedPassport.personalInfo.dateOfBirth,
          gender: populatedPassport.personalInfo.gender,
          bloodType: populatedPassport.personalInfo.bloodType,
          contactNumber: populatedPassport.personalInfo.contactNumber,
          address: populatedPassport.personalInfo.address,
          emergencyContact: populatedPassport.personalInfo.emergencyContact,
          allergies: populatedPassport.medicalInfo.allergies || [],
          status: 'active'
        },
        // Medical records in the format expected by frontend
        // **MERGE** both PatientPassport data and MedicalRecord data
        medicalRecords: {
          conditions: [
            // MedicalRecord collection (OpenMRS sync data) - PRIORITIZE THIS
            ...medicalRecordConditions,
            // PatientPassport legacy data
            ...(populatedPassport.medicalInfo.medicalConditions || []).map(condition => ({
              data: {
                name: condition.condition || '',
                details: condition.notes || '',
                diagnosed: condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString('en-US', { timeZone: 'Africa/Johannesburg' }) : '',
                procedure: condition.diagnosedBy || ''
              }
            }))
          ],
          medications: [
            ...medicalRecordMedications,
            ...(populatedPassport.medicalInfo.currentMedications || []).map(medication => ({
              data: {
                medicationName: medication.name || '',
                dosage: medication.dosage || '',
                status: 'Active'
              }
            }))
          ],
          tests: [
            ...medicalRecordTests,
            ...(populatedPassport.testResults || []).map(test => ({
              data: {
                testName: test.testType || '',
                result: test.results || '',
                date: test.testDate ? new Date(test.testDate).toLocaleDateString('en-US', { timeZone: 'Africa/Johannesburg' }) : '',
                status: test.status || 'normal'
              }
            }))
          ],
          visits: [
            ...medicalRecordVisits,
            ...(populatedPassport.hospitalVisits || []).map(visit => ({
              data: {
                hospital: visit.hospital || '',
                doctor: visit.doctor || '',
                reason: visit.reason || '',
                date: visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-US', { timeZone: 'Africa/Johannesburg' }) : '',
                diagnosis: visit.diagnosis || '',
                treatment: visit.treatment || ''
              }
            }))
          ],
          images: [] // Not implemented yet
        },
        // Passport metadata
        passport: {
          _id: populatedPassport._id,
          lastUpdated: populatedPassport.lastUpdated,
          lastUpdatedBy: populatedPassport.lastUpdatedBy,
          version: populatedPassport.version,
          accessHistory: populatedPassport.accessHistory
        }
      };

      const response: ApiResponse = {
        success: true,
        message: 'Patient passport retrieved successfully',
        data: transformedData
      };

      res.json(response);
      return;
    }

    console.log(`⚠️  No PatientPassport found, falling back to legacy patient data`);
    
    // Fallback to legacy patient data if no passport exists
    const completePatient = await Patient.findById(patient._id)
      .populate('user', 'name email role')
      .populate({
        path: 'medicalHistory',
        populate: {
          path: 'doctor',
          populate: {
            path: 'user',
            select: 'name'
          }
        }
      })
      .populate('medications')
      .populate('testResults')
      .populate('hospitalVisits')
      .populate('assignedDoctors', 'specialization')
      .populate('assignedDoctors.user', 'name email');

    console.log(`📊 Legacy data loaded:`);
    console.log(`   Medical History (medicalHistory): ${completePatient.medicalHistory?.length || 0}`);
    console.log(`   Medications: ${completePatient.medications?.length || 0}`);
    console.log(`   Test Results: ${completePatient.testResults?.length || 0}`);
    console.log(`   Hospital Visits: ${completePatient.hospitalVisits?.length || 0}`);

    // Get medical records
    const medicalRecords = await MedicalRecord.find({ patientId: patient._id })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    console.log(`   Medical Records: ${medicalRecords.length}`);

    // Transform records to include OpenMRS metadata
    const transformedRecords = medicalRecords.map(record => ({
      _id: record._id,
      type: record.type,
      data: record.data,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      // Include OpenMRS metadata if available
      openmrsData: record.openmrsData || null
    }));

    // Add medicalHistory (OpenMRS synced conditions) to the conditions list
    const medicalHistoryConditions = (completePatient.medicalHistory || []).map((condition: any) => ({
      _id: condition._id,
      type: 'condition',
      data: {
        name: condition.name,
        details: condition.details,
        diagnosed: condition.diagnosed ? new Date(condition.diagnosed).toLocaleDateString('en-US', { timeZone: 'Africa/Johannesburg' }) : '',
        procedure: condition.procedure || '',
        status: condition.status || 'active'
      },
      createdBy: condition.doctor?.user || null,
      createdAt: condition.createdAt || condition.diagnosed,
      updatedAt: condition.updatedAt,
      openmrsData: {
        synced: true,
        syncedAt: condition.createdAt
      }
    }));

    // Group records by type
    const groupedRecords = {
      conditions: [...transformedRecords.filter(record => record.type === 'condition'), ...medicalHistoryConditions],
      medications: transformedRecords.filter(record => record.type === 'medication'),
      tests: transformedRecords.filter(record => record.type === 'test'),
      visits: transformedRecords.filter(record => record.type === 'visit'),
      images: transformedRecords.filter(record => record.type === 'image')
    };

    console.log(`📤 Returning passport data:`);
    console.log(`   Conditions (total): ${groupedRecords.conditions.length}`);
    console.log(`   - From MedicalRecord: ${transformedRecords.filter(r => r.type === 'condition').length}`);
    console.log(`   - From medicalHistory (OpenMRS): ${medicalHistoryConditions.length}`);

    const response: ApiResponse = {
      success: true,
      message: 'Patient data retrieved successfully (legacy format)',
      data: {
        patient: completePatient,
        medicalRecords: groupedRecords,
        summary: completePatient.getSummary()
      }
    };

    res.json(response);
  } catch (error) {
    console.error(`❌ Error getting patient passport for ${patientId}:`, error);
    throw new CustomError('Failed to retrieve patient passport', 500);
  }
});











































