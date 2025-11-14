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
  } else if (user.role === 'doctor') {
    // For doctors, try to find patient by ID first
    console.log(`   Looking up patient by patient ID (doctor access)...`);
    patient = await Patient.findById(patientId);
    
    // If not found, check if patientId is actually a doctor ID (from OTP verification response)
    // In that case, we need to find the patient through access records
    if (!patient) {
      console.log(`   Patient not found by ID, checking if it's a doctor ID...`);
      const Doctor = (await import('@/models/Doctor')).default;
      const doctor = await Doctor.findById(patientId);
      
      if (doctor) {
        console.log(`   ⚠️ Doctor ID passed instead of patient ID. Finding patient from access records...`);
        console.log(`   Doctor ID: ${doctor._id}`);
        
        // Try to find the most recent patient the doctor accessed
        const PatientPassport = (await import('@/models/PatientPassport')).default;
        
        // Method 1: Find passport with most recent access by this doctor
        // Convert doctor._id to string and ObjectId for comparison
        const doctorIdStr = doctor._id.toString();
        const mongoose = await import('mongoose');
        const doctorObjectId = new mongoose.default.Types.ObjectId(doctorIdStr);
        
        console.log(`   Searching for passports with doctor ID: ${doctorIdStr}`);
        
        // Try query with ObjectId
        let passportsWithAccess = await PatientPassport.find({
          'accessHistory.doctor': doctorObjectId,
          isActive: true
        })
        .populate('patient', 'user nationalId')
        .populate('patient.user', 'name email')
        .limit(10);
        
        // If no results, try with string ID
        if (passportsWithAccess.length === 0) {
          console.log(`   No results with ObjectId, trying with string ID...`);
          passportsWithAccess = await PatientPassport.find({
            'accessHistory.doctor': doctorIdStr,
            isActive: true
          })
          .populate('patient', 'user nationalId')
          .populate('patient.user', 'name email')
          .limit(10);
        }
        
        // Sort by most recent access date
        if (passportsWithAccess.length > 0) {
          passportsWithAccess.sort((a, b) => {
            const aAccess = a.accessHistory?.filter((acc: any) => 
              acc.doctor?.toString() === doctorIdStr || acc.doctor === doctorIdStr
            ).sort((x: any, y: any) => 
              new Date(y.accessDate || 0).getTime() - new Date(x.accessDate || 0).getTime()
            )[0];
            const bAccess = b.accessHistory?.filter((acc: any) => 
              acc.doctor?.toString() === doctorIdStr || acc.doctor === doctorIdStr
            ).sort((x: any, y: any) => 
              new Date(y.accessDate || 0).getTime() - new Date(x.accessDate || 0).getTime()
            )[0];
            
            const aDate = aAccess?.accessDate ? new Date(aAccess.accessDate).getTime() : 0;
            const bDate = bAccess?.accessDate ? new Date(bAccess.accessDate).getTime() : 0;
            return bDate - aDate;
          });
        }
        
        console.log(`   Found ${passportsWithAccess.length} passport(s) with access history for this doctor`);
        
        if (passportsWithAccess.length > 0) {
          // Get the most recent one
          const mostRecent = passportsWithAccess[0];
          console.log(`   Most recent passport patient: ${mostRecent.patient ? 'FOUND' : 'NOT FOUND'}`);
          
          if (mostRecent.patient) {
            const patientIdFromPassport = (mostRecent.patient as any)._id || mostRecent.patient;
            patient = await Patient.findById(patientIdFromPassport).populate('user', 'name email');
            if (patient) {
              console.log(`   ✅ Found patient from access history: ${patient._id} (${(patient.user as any)?.name || 'Unknown'})`);
            } else {
              console.log(`   ⚠️ Patient ID from passport exists but Patient document not found: ${patientIdFromPassport}`);
            }
          }
        }
        
        // Method 2: Try using the static method if Method 1 didn't work
        if (!patient) {
          console.log(`   Trying static method getRecentAccess...`);
          try {
            const recentAccess = await PatientPassport.getRecentAccess(doctorIdStr, 1);
            console.log(`   getRecentAccess returned ${recentAccess.length} passport(s)`);
            if (recentAccess.length > 0 && recentAccess[0].patient) {
              const patientIdFromPassport = (recentAccess[0].patient as any)._id || recentAccess[0].patient;
              patient = await Patient.findById(patientIdFromPassport).populate('user', 'name email');
              if (patient) {
                console.log(`   ✅ Found patient from getRecentAccess: ${patient._id}`);
              }
            }
          } catch (error: any) {
            console.error(`   Error in getRecentAccess:`, error.message);
          }
        }
        
        // Method 3: Use aggregation to find most recent access
        if (!patient) {
          console.log(`   Trying aggregation pipeline...`);
          try {
            const result = await PatientPassport.aggregate([
              { $match: { isActive: true } },
              { $unwind: '$accessHistory' },
              { $match: { 'accessHistory.doctor': doctorObjectId } },
              { $sort: { 'accessHistory.accessDate': -1 } },
              { $limit: 1 },
              { $project: { patient: 1 } }
            ]);
            
            if (result.length > 0 && result[0].patient) {
              const patientIdFromPassport = result[0].patient;
              patient = await Patient.findById(patientIdFromPassport).populate('user', 'name email');
              if (patient) {
                console.log(`   ✅ Found patient from aggregation: ${patient._id}`);
              }
            }
          } catch (error: any) {
            console.error(`   Error in aggregation:`, error.message);
          }
        }
      }
    }
    
    // If still not found, try to find patient by user ID (in case patientId is a user ID)
    if (!patient) {
      console.log(`   Trying to find patient by user ID...`);
      patient = await Patient.findOne({ user: patientId });
    }
    
    // Last resort: Get the current doctor and find their most recent access
    if (!patient) {
      console.log(`   Last resort: Finding patient from current doctor's access...`);
      const Doctor = (await import('@/models/Doctor')).default;
      const currentDoctor = await Doctor.findOne({ user: user.id });
      if (currentDoctor) {
        const PatientPassport = (await import('@/models/PatientPassport')).default;
        const recentAccess = await PatientPassport.getRecentAccess(currentDoctor._id.toString(), 1);
        if (recentAccess.length > 0 && recentAccess[0].patient) {
          const patientIdFromPassport = (recentAccess[0].patient as any)._id || recentAccess[0].patient;
          patient = await Patient.findById(patientIdFromPassport);
          console.log(`   ✅ Found patient from current doctor's recent access: ${patient?._id}`);
        }
      }
    }
  } else {
    // For admins, use the patientId directly
    console.log(`   Looking up patient by patient ID (admin access)...`);
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
  
  // For doctors, check if they have access to this patient's passport
  if (user.role === 'doctor') {
    const PatientPassport = (await import('@/models/PatientPassport')).default;
    const Doctor = (await import('@/models/Doctor')).default;
    
    const doctor = await Doctor.findOne({ user: user.id });
    if (doctor) {
      const passport = await PatientPassport.findByPatientId(patient._id);
      if (passport) {
        // Check if doctor has access (has accessed before via OTP or has active access)
        const hasAccess = passport.accessHistory.some(
          (access: any) => access.doctor.toString() === doctor._id.toString()
        );
        
        if (!hasAccess) {
          console.log(`   ⚠️ Doctor ${doctor._id} does not have access to patient ${patient._id}`);
          // Allow access anyway for now (can be restricted later)
          // throw new CustomError('You do not have access to this patient\'s passport. Please request access first.', 403);
        }
      }
    }
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
      console.log(`   🔍 Querying medical records for patient: ${patient._id}`);
      // Try both string and ObjectId formats for patientId
      const patientIdStr = patient._id.toString();
      const mongoose = await import('mongoose');
      const patientObjectId = new mongoose.default.Types.ObjectId(patientIdStr);
      
      let medicalRecords = await MedicalRecord.find({ 
        $or: [
          { patientId: patientIdStr },
          { patientId: patientObjectId }
        ]
      })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
      
      console.log(`   ✅ Found ${medicalRecords.length} medical records in MedicalRecord collection`);
      console.log(`   📊 Breakdown by type:`);
      console.log(`      - Conditions: ${medicalRecords.filter(r => r.type === 'condition').length}`);
      console.log(`      - Medications: ${medicalRecords.filter(r => r.type === 'medication').length}`);
      console.log(`      - Tests: ${medicalRecords.filter(r => r.type === 'test').length}`);
      console.log(`      - Visits: ${medicalRecords.filter(r => r.type === 'visit').length}`);
      
      // Log sample records for debugging
      if (medicalRecords.length > 0) {
        console.log(`   📋 Sample record (first):`, {
          id: medicalRecords[0]._id,
          type: medicalRecords[0].type,
          hasSyncDate: !!medicalRecords[0].syncDate,
          hasEditAccess: !!medicalRecords[0].editableBy,
          dataKeys: Object.keys(medicalRecords[0].data || {})
        });
      }

      // Import edit access utility
      const { getObservationEditInfo } = await import('@/utils/observationAccessControl');
      // Use User ID (not Doctor ID) for permission checks since editableBy stores User IDs
      // Mongoose documents use _id, but id is a virtual getter - use _id for consistency
      const doctorUserId = user.role === 'doctor' ? (user._id ? user._id.toString() : (user.id ? user.id.toString() : undefined)) : undefined;
      
      if (user.role === 'doctor') {
        console.log(`   🔍 Doctor User ID for edit access: ${doctorUserId}`);
        console.log(`   🔍 User _id: ${user._id}`);
        console.log(`   🔍 User id (virtual): ${user.id}`);
      }

      // Transform MedicalRecord data - ENHANCED: Include doctor and hospital fields + edit access
      const medicalRecordConditions = medicalRecords
        .filter(record => record.type === 'condition')
        .map(record => {
          // Debug: Log the raw data to see what we're working with
          const doctorValue = record.data.doctor || record.openmrsData?.creatorName || 'Unknown Doctor';
          const hospitalValue = record.data.hospital || record.openmrsData?.locationName || 'Unknown Hospital';
          
          // Get edit access information (pass User ID, not Doctor ID)
          const editInfo = getObservationEditInfo(record, doctorUserId);
          
          console.log(`   📋 Condition Record ${record._id}:`);
          console.log(`      - data.doctor: ${record.data.doctor || 'NOT SET'}`);
          console.log(`      - data.hospital: ${record.data.hospital || 'NOT SET'}`);
          console.log(`      - medications array: ${record.data.medications ? `${record.data.medications.length} medication(s)` : 'NOT SET'}`);
          console.log(`      - Edit access: ${editInfo.canEdit ? 'YES' : 'NO'} (${editInfo.reason})`);
          
          return {
            _id: record._id,
            data: {
              name: record.data.name || '',
              diagnosis: record.data.diagnosis || record.data.name || '',
              details: record.data.details || '',
              diagnosed: record.data.diagnosed || '',
              diagnosedDate: record.data.diagnosedDate || record.data.diagnosed || '',
              date: record.data.date || record.data.diagnosed || '',
              procedure: record.data.procedure || '',
              doctor: doctorValue,
              diagnosedBy: record.data.diagnosedBy || record.data.doctor || record.openmrsData?.creatorName || 'Unknown Doctor',
              hospital: hospitalValue,
              // Include medications array if available (from saved edits)
              medications: record.data.medications && Array.isArray(record.data.medications) ? record.data.medications : undefined,
              // Also include single medication fields for backward compatibility
              medicationName: record.data.medicationName || '',
              dosage: record.data.dosage || '',
              frequency: record.data.frequency || '',
              startDate: record.data.startDate || '',
              endDate: record.data.endDate || '',
              prescribedBy: record.data.prescribedBy || '',
              medicationStatus: record.data.medicationStatus || 'Active',
              // Include notes for editing
              notes: record.data.notes || record.data.details || ''
            },
            openmrsData: record.openmrsData || null,
            createdAt: record.createdAt,
            createdBy: record.createdBy,
            editAccess: editInfo,
            syncDate: record.syncDate || null,
            editableBy: record.editableBy || []
          };
        });

      const medicalRecordMedications = medicalRecords
        .filter(record => record.type === 'medication')
        .map(record => {
          const editInfo = getObservationEditInfo(record, doctorUserId);
          return {
            _id: record._id,
            data: {
              ...record.data,
              doctor: record.data.doctor || record.data.prescribedBy || record.openmrsData?.creatorName || 'Unknown Doctor',
              prescribedBy: record.data.prescribedBy || record.data.doctor || record.openmrsData?.creatorName || 'Unknown Doctor',
              hospital: record.data.hospital || record.openmrsData?.locationName || 'Unknown Hospital',
              medicationStatus: editInfo.medicationStatus || record.data.medicationStatus || 'Active'
            },
            openmrsData: record.openmrsData || null,
            createdAt: record.createdAt,
            createdBy: record.createdBy,
            editAccess: editInfo,
            syncDate: record.syncDate || null,
            editableBy: record.editableBy || []
          };
        });

      const medicalRecordTests = medicalRecords
        .filter(record => record.type === 'test')
        .map(record => {
          const editInfo = getObservationEditInfo(record, doctorUserId);
          return {
            _id: record._id,
            data: record.data,
            openmrsData: record.openmrsData || null,
            createdAt: record.createdAt,
            createdBy: record.createdBy,
            editAccess: editInfo,
            syncDate: record.syncDate || null,
            editableBy: record.editableBy || []
          };
        });

      const medicalRecordVisits = medicalRecords
        .filter(record => record.type === 'visit')
        .map(record => {
          const editInfo = getObservationEditInfo(record, doctorUserId);
          return {
            _id: record._id,
            data: record.data,
            openmrsData: record.openmrsData || null,
            createdAt: record.createdAt,
            createdBy: record.createdBy,
            editAccess: editInfo,
            syncDate: record.syncDate || null,
            editableBy: record.editableBy || []
          };
        });

      // Transform the data to match what the patient frontend expects
      console.log(`🔄 Transforming passport data for patient frontend...`);
      console.log(`   PatientPassport conditions: ${populatedPassport.medicalInfo.medicalConditions?.length || 0}`);
      console.log(`   MedicalRecord conditions: ${medicalRecordConditions.length}`);
      
      // **CRITICAL**: Filter out duplicates by checking if legacy data was synced from OpenMRS
      // Legacy data created by the sync service will have "Added from OpenMRS" in notes
      const legacyConditionsNotFromOpenMRS = (populatedPassport.medicalInfo.medicalConditions || [])
        .filter(condition => {
          const notes = (condition as any).notes || '';
          return !notes.includes('Added from OpenMRS');
        });
      
      const legacyMedicationsNotFromOpenMRS = (populatedPassport.medicalInfo.currentMedications || [])
        .filter(medication => {
          const notes = (medication as any).notes || '';
          return !notes.includes('Added from OpenMRS');
        });
      
      console.log(`   Legacy conditions (not from OpenMRS): ${legacyConditionsNotFromOpenMRS.length}`);
      console.log(`   TOTAL conditions to return: ${medicalRecordConditions.length + legacyConditionsNotFromOpenMRS.length}`);
      
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
        // Also include personalInfo for frontend compatibility
        personalInfo: {
          fullName: populatedPassport.personalInfo.fullName || populatedPassport.patient.user?.name || '',
          nationalId: populatedPassport.personalInfo.nationalId || populatedPassport.patient.nationalId || '',
          dateOfBirth: populatedPassport.personalInfo.dateOfBirth || populatedPassport.patient.dateOfBirth,
          gender: populatedPassport.personalInfo.gender || populatedPassport.patient.gender || '',
          bloodType: populatedPassport.personalInfo.bloodType || populatedPassport.patient.bloodType || '',
          contactNumber: populatedPassport.personalInfo.contactNumber || populatedPassport.patient.contactNumber || '',
          email: populatedPassport.personalInfo.email || populatedPassport.patient.user?.email || '',
          address: populatedPassport.personalInfo.address || populatedPassport.patient.address || '',
          emergencyContact: populatedPassport.personalInfo.emergencyContact || populatedPassport.patient.emergencyContact || null
        },
        // Include medicalInfo for frontend compatibility
        medicalInfo: {
          allergies: populatedPassport.medicalInfo.allergies || [],
          medicalConditions: populatedPassport.medicalInfo.medicalConditions || [],
          currentMedications: populatedPassport.medicalInfo.currentMedications || []
        },
        // Medical records in the format expected by frontend
        // **MERGE** MedicalRecord data (priority) + non-OpenMRS legacy data (to avoid duplicates)
        medicalRecords: {
          conditions: [
            // MedicalRecord collection (OpenMRS sync data + manual entries) - PRIORITIZE THIS
            ...medicalRecordConditions,
            // PatientPassport legacy data (ONLY those NOT from OpenMRS sync)
            // Note: PatientPassport.medicalInfo.medicalConditions doesn't have doctor/hospital fields
            // These are stored in the legacy MedicalCondition model which is separate
            ...legacyConditionsNotFromOpenMRS.map((condition: any) => ({
              data: {
                name: condition.condition || '',
                diagnosis: condition.condition || '',
                details: condition.notes || '',
                // Legacy conditions from PatientPassport don't have doctor/hospital populated
                // They only have diagnosedBy as a string
                doctor: condition.diagnosedBy || 'Unknown Doctor',
                diagnosedBy: condition.diagnosedBy || 'Unknown Doctor',
                hospital: 'Unknown Hospital', // Legacy conditions don't have hospital info
                diagnosed: condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString('en-US', { timeZone: 'Africa/Johannesburg' }) : '',
                procedure: condition.diagnosedBy || ''
              }
            }))
          ],
          medications: [
            ...medicalRecordMedications,
            // PatientPassport legacy medications (ONLY those NOT from OpenMRS sync)
            ...legacyMedicationsNotFromOpenMRS.map(medication => ({
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











































