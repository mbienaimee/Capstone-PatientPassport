import { Request, Response, NextFunction } from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import mongoose from 'mongoose';
import openmrsIntegrationService from '@/services/openmrsIntegrationService';
import Patient from '@/models/Patient';
import AuditLog from '@/models/AuditLog';

/**
 * OpenMRS Integration Controller
 * Handles API endpoints for OpenMRS to communicate with Patient Passport
 */

// @desc    Get patient observations (diagnosis & medications) for OpenMRS
// @route   GET /api/openmrs/patient/:patientName/observations
// @access  Public (OpenMRS API key required)
export const getPatientObservations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientName } = req.params;
  const { hospitalId } = req.query;

  console.log(`🏥 OpenMRS requesting patient observations:`);
  console.log(`   Patient Name: ${patientName}`);
  console.log(`   Hospital ID: ${hospitalId || 'All hospitals'}`);

  if (!patientName) {
    throw new CustomError('Patient name is required', 400);
  }

  // Get patient data formatted for OpenMRS
  const patientData = await openmrsIntegrationService.getPatientDataForOpenMRS(
    decodeURIComponent(patientName),
    hospitalId as string
  );

  // Log access
  try {
    await AuditLog.create({
      action: 'openmrs_data_access',
      performedBy: 'OpenMRS System',
      targetModel: 'Patient',
      targetId: patientData.patient.passportId,
      changes: {
        patientName: decodeURIComponent(patientName),
        accessType: 'observations',
        observationsCount: patientData.observations.length
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (logError) {
    console.error('Error creating audit log:', logError);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Patient observations retrieved successfully',
    data: patientData
  };

  res.json(response);
});

// @desc    Sync patient mapping between systems
// @route   POST /api/openmrs/patient/sync
// @access  Public (OpenMRS API key required)
export const syncPatientMapping = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientName, openmrsPatientUuid } = req.body;

  console.log(`🔄 Syncing patient mapping:`);
  console.log(`   Patient Name: ${patientName}`);
  console.log(`   OpenMRS UUID: ${openmrsPatientUuid}`);

  if (!patientName) {
    throw new CustomError('Patient name is required', 400);
  }

  const mapping = await openmrsIntegrationService.syncPatientMapping(
    patientName,
    openmrsPatientUuid
  );

  const response: ApiResponse = {
    success: true,
    message: 'Patient mapping synced successfully',
    data: mapping
  };

  res.json(response);
});

// @desc    Sync hospital mapping between systems
// @route   POST /api/openmrs/hospital/sync
// @access  Public (OpenMRS API key required)
export const syncHospitalMapping = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { hospitalName, openmrsHospitalUuid, passportHospitalId } = req.body;

  console.log(`🔄 Syncing hospital mapping:`);
  console.log(`   Hospital Name: ${hospitalName}`);
  console.log(`   OpenMRS UUID: ${openmrsHospitalUuid}`);

  if (!hospitalName) {
    throw new CustomError('Hospital name is required', 400);
  }

  const mapping = await openmrsIntegrationService.syncHospitalMapping(
    hospitalName,
    openmrsHospitalUuid,
    passportHospitalId
  );

  const response: ApiResponse = {
    success: true,
    message: 'Hospital mapping synced successfully',
    data: mapping
  };

  res.json(response);
});

// @desc    Get patient by OpenMRS UUID
// @route   GET /api/openmrs/patient/uuid/:openmrsUuid
// @access  Public (OpenMRS API key required)
export const getPatientByOpenmrsUuid = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { openmrsUuid } = req.params;

  console.log(`🔍 Looking up patient by OpenMRS UUID: ${openmrsUuid}`);

  if (!openmrsUuid) {
    throw new CustomError('OpenMRS UUID is required', 400);
  }

  const patient = await openmrsIntegrationService.getPatientByOpenmrsUuid(openmrsUuid);

  const response: ApiResponse = {
    success: true,
    message: 'Patient found',
    data: patient
  };

  res.json(response);
});

// @desc    Sync doctor/provider mapping
// @route   POST /api/openmrs/doctor/sync
// @access  Public (OpenMRS API key required)
export const syncDoctorMapping = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { licenseNumber, openmrsProviderUuid } = req.body;

  console.log(`🔄 Syncing doctor mapping:`);
  console.log(`   License Number: ${licenseNumber}`);
  console.log(`   OpenMRS Provider UUID: ${openmrsProviderUuid}`);

  if (!licenseNumber) {
    throw new CustomError('Doctor license number is required', 400);
  }

  const mapping = await openmrsIntegrationService.syncDoctorData(
    licenseNumber,
    openmrsProviderUuid
  );

  const response: ApiResponse = {
    success: true,
    message: 'Doctor mapping synced successfully',
    data: mapping
  };

  res.json(response);
});

// @desc    Store observation from OpenMRS to passport
// @route   POST /api/openmrs/observation/store
// @access  Public (OpenMRS API key required)
export const storeObservationFromOpenMRS = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { 
    patientName,
    observationType, 
    observationData, 
    doctorLicenseNumber,
    hospitalName 
  } = req.body;

  console.log(`💾 ========================================`);
  console.log(`💾 Storing observation from OpenMRS:`);
  console.log(`   Patient Name: ${patientName}`);
  console.log(`   Type: ${observationType}`);
  console.log(`   Doctor License: ${doctorLicenseNumber}`);
  console.log(`   Hospital: ${hospitalName}`);
  console.log(`   Observation Data:`, JSON.stringify(observationData, null, 2));
  console.log(`💾 ========================================`);

  if (!patientName || !observationType || !observationData || !doctorLicenseNumber || !hospitalName) {
    console.error('❌ Missing required fields:', {
      hasPatientName: !!patientName,
      hasObservationType: !!observationType,
      hasObservationData: !!observationData,
      hasDoctorLicense: !!doctorLicenseNumber,
      hasHospitalName: !!hospitalName
    });
    throw new CustomError('All fields are required: patientName, observationType, observationData, doctorLicenseNumber, hospitalName', 400);
  }

  if (!['diagnosis', 'medication'].includes(observationType)) {
    console.error('❌ Invalid observation type:', observationType);
    throw new CustomError('Observation type must be either "diagnosis" or "medication"', 400);
  }

  const result = await openmrsIntegrationService.storeOpenMRSObservation(
    patientName,
    observationType,
    observationData,
    doctorLicenseNumber,
    hospitalName
  );

  // Extract the IDs from the result (now returns both old model and MedicalRecord)
  const legacyRecord = 'condition' in result ? result.condition : result.medication;
  const medicalRecord = result.medicalRecord;

  console.log(`✅ Observation stored successfully`);
  console.log(`   - Legacy ID: ${legacyRecord?._id}`);
  console.log(`   - MedicalRecord ID: ${medicalRecord?._id}`);

  // Log the sync
  try {
    await AuditLog.create({
      action: 'openmrs_data_sync',
      performedBy: 'OpenMRS System',
      targetModel: observationType === 'diagnosis' ? 'MedicalCondition' : 'Medication',
      targetId: legacyRecord?._id,
      changes: {
        patientName,
        observationType,
        doctorLicenseNumber,
        hospitalName,
        observationDataKeys: Object.keys(observationData),
        medicalRecordId: medicalRecord?._id
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (logError) {
    console.error('Error creating audit log:', logError);
  }

  const response: ApiResponse = {
    success: true,
    message: `${observationType.charAt(0).toUpperCase() + observationType.slice(1)} stored successfully in passport`,
    data: result
  };

  res.json(response);
});

// @desc    Get full patient passport data for OpenMRS
// @route   GET /api/openmrs/patient/:patientName/passport
// @access  Public (OpenMRS API key required)
export const getPatientPassportForOpenMRS = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientName } = req.params;

  console.log(`📋 OpenMRS requesting full patient passport: ${patientName}`);

  if (!patientName) {
    throw new CustomError('Patient name is required', 400);
  }

  // Find user by name
  const User = mongoose.model('User');
  const user = await User.findOne({ 
    name: { $regex: new RegExp(`^${decodeURIComponent(patientName)}$`, 'i') },
    role: 'patient'
  });

  if (!user) {
    throw new CustomError(`User "${decodeURIComponent(patientName)}" not found`, 404);
  }

  const patient = await Patient.findOne({ user: user._id })
    .populate('user', 'name email')
    .populate({
      path: 'medicalHistory',
      populate: { path: 'doctor', populate: { path: 'user', select: 'name' } }
    })
    .populate({
      path: 'medications',
      populate: [
        { path: 'doctor', populate: { path: 'user', select: 'name' } },
        { path: 'hospital', select: 'name' }
      ]
    })
    .populate({
      path: 'testResults',
      populate: [
        { path: 'doctor', populate: { path: 'user', select: 'name' } },
        { path: 'hospital', select: 'name' }
      ]
    })
    .populate({
      path: 'hospitalVisits',
      populate: [
        { path: 'doctor', populate: { path: 'user', select: 'name' } },
        { path: 'hospital', select: 'name' }
      ]
    });

  if (!patient) {
    throw new CustomError(`Patient "${decodeURIComponent(patientName)}" not found`, 404);
  }

  // Log access
  try {
    await AuditLog.create({
      action: 'openmrs_passport_access',
      performedBy: 'OpenMRS System',
      targetModel: 'Patient',
      targetId: patient._id,
      changes: {
        patientName: decodeURIComponent(patientName),
        accessType: 'full_passport'
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (logError) {
    console.error('Error creating audit log:', logError);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Patient passport retrieved successfully',
    data: patient
  };

  res.json(response);
});

// @desc    Health check for OpenMRS integration
// @route   GET /api/openmrs/health
// @access  Public
export const openmrsHealthCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const response: ApiResponse = {
    success: true,
    message: 'OpenMRS integration service is healthy',
    data: {
      status: 'active',
      timestamp: new Date(),
      version: '1.0.0'
    }
  };

  res.json(response);
});

export default {
  getPatientObservations,
  syncPatientMapping,
  syncHospitalMapping,
  getPatientByOpenmrsUuid,
  syncDoctorMapping,
  storeObservationFromOpenMRS,
  getPatientPassportForOpenMRS,
  openmrsHealthCheck
};
