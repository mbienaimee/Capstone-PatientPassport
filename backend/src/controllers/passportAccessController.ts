import { Request, Response } from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { generateAndSendOTP, verifyOTP } from '@/services/otpService';
import Patient from '@/models/Patient';
import User from '@/models/User';
import MedicalCondition from '@/models/MedicalCondition';
import Medication from '@/models/Medication';
import TestResult from '@/models/TestResult';
import HospitalVisit from '@/models/HospitalVisit';
import { sendPassportAccessOTPEmail } from '@/services/simpleEmailService';

// @desc    Request OTP for passport access (Doctor requests OTP from patient)
// @route   POST /api/passport-access/request-otp
// @access  Private (Doctor)
export const requestPassportAccessOTP = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.body;
  const doctorId = req.user.id;

  if (!patientId) {
    throw new CustomError('Patient ID is required', 400);
  }

  // Find patient and their user account
  const patient = await Patient.findById(patientId).populate('user');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Find doctor
  const doctor = await User.findById(doctorId);
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  // Generate and send OTP to patient's email
  const otpCode = await generateAndSendOTP(patient.user.email, 'email');

  // Send email notification to patient about OTP request
  try {
    await sendPassportAccessOTPEmail(
      patient.user.email,
      otpCode,
      doctor.name,
      patient.user.name
    );
  } catch (emailError) {
    console.error('Error sending OTP email:', emailError);
    // Don't fail the request if email fails, OTP is still generated
  }

  res.json({
    success: true,
    message: 'OTP sent to patient email',
    data: {
      patientId: patient._id,
      patientName: patient.user.name,
      patientEmail: patient.user.email,
      doctorName: doctor.name,
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otpCode })
    }
  });
});

// @desc    Verify OTP and grant passport access (Doctor enters OTP)
// @route   POST /api/passport-access/verify-otp
// @access  Private (Doctor)
export const verifyPassportAccessOTP = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, otpCode } = req.body;
  const doctorId = req.user.id;

  if (!patientId || !otpCode) {
    throw new CustomError('Patient ID and OTP code are required', 400);
  }

  // Find patient
  const patient = await Patient.findById(patientId).populate('user');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Find doctor
  const doctor = await User.findById(doctorId);
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  // Verify OTP
  const isOTPValid = await verifyOTP(patient.user.email, otpCode, 'email');
  
  if (!isOTPValid) {
    throw new CustomError('Invalid or expired OTP', 400);
  }

  // Generate temporary access token (valid for 24 hours)
  const accessToken = require('jsonwebtoken').sign(
    { 
      doctorId, 
      patientId, 
      accessType: 'passport_view',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'OTP verified successfully. Access granted.',
    data: {
      accessToken,
      patientId: patient._id,
      patientName: patient.user.name,
      doctorName: doctor.name,
      expiresIn: '24 hours'
    }
  });
});

// @desc    Get patient passport with OTP access token
// @route   GET /api/passport-access/patient/:patientId/passport
// @access  Private (Doctor with valid access token)
export const getPatientPassportWithAccess = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const accessToken = req.headers['x-access-token'] as string;

  if (!accessToken) {
    throw new CustomError('Access token required', 401);
  }

  // Verify access token
  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(accessToken, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    throw new CustomError('Invalid access token', 401);
  }

  // Check if token is for this patient
  if (decoded.patientId !== patientId) {
    throw new CustomError('Access token not valid for this patient', 403);
  }

  // Check if token is expired
  if (new Date(decoded.expiresAt) < new Date()) {
    throw new CustomError('Access token has expired', 401);
  }

  // Find patient and get their medical records
  const patient = await Patient.findById(patientId).populate('user');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Get medical records from the correct collections
  const [conditions, medications, testResults, hospitalVisits] = await Promise.all([
    MedicalCondition.find({ patient: patient._id })
      .populate('doctor', 'name email')
      .sort({ diagnosed: -1 }),
    Medication.find({ patient: patient._id })
      .populate('doctor', 'name email')
      .sort({ startDate: -1 }),
    TestResult.find({ patient: patient._id })
      .populate('doctor', 'name email')
      .populate('hospital', 'name')
      .sort({ date: -1 }),
    HospitalVisit.find({ patient: patient._id })
      .populate('doctor', 'name email')
      .populate('hospital', 'name')
      .sort({ date: -1 })
  ]);

  // Group records by type
  const groupedRecords = {
    conditions: conditions,
    medications: medications,
    tests: testResults,
    visits: hospitalVisits,
    images: [] // Images are not implemented yet
  };

  res.json({
    success: true,
    message: 'Patient passport data retrieved successfully',
    data: {
      patient: {
        id: patient._id,
        name: patient.user.name,
        email: patient.user.email,
        nationalId: patient.nationalId,
        dateOfBirth: patient.dateOfBirth,
        contactNumber: patient.contactNumber,
        address: patient.address,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        emergencyContact: patient.emergencyContact
      },
      medicalRecords: groupedRecords,
      accessGrantedBy: decoded.doctorId,
      accessExpiresAt: decoded.expiresAt
    }
  });
});

// @desc    Update patient passport data (Doctor with valid access token)
// @route   PUT /api/passport-access/patient/:patientId/passport
// @access  Private (Doctor with valid access token)
export const updatePatientPassportWithAccess = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const accessToken = req.headers['x-access-token'] as string;

  if (!accessToken) {
    throw new CustomError('Access token required', 401);
  }

  // Verify access token
  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(accessToken, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    throw new CustomError('Invalid access token', 401);
  }

  // Check if token is for this patient
  if (decoded.patientId !== patientId) {
    throw new CustomError('Access token not valid for this patient', 403);
  }

  // Check if token is expired
  if (new Date(decoded.expiresAt) < new Date()) {
    throw new CustomError('Access token has expired', 401);
  }

  // Find patient
  const patient = await Patient.findById(patientId).populate('user');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Update patient data
  const {
    contactNumber,
    address,
    bloodType,
    emergencyContact,
    medicalHistory,
    allergies,
    medications,
    testResults,
    hospitalVisits,
    medicalImages
  } = req.body;

  const updateData: any = {};
  if (contactNumber) updateData.contactNumber = contactNumber;
  if (address) updateData.address = address;
  if (bloodType) updateData.bloodType = bloodType;
  if (emergencyContact) updateData.emergencyContact = emergencyContact;
  if (allergies) updateData.allergies = allergies;
  if (medications) updateData.medications = medications;
  if (testResults) updateData.testResults = testResults;
  if (hospitalVisits) updateData.hospitalVisits = hospitalVisits;
  if (medicalImages) updateData.medicalImages = medicalImages;

  // Handle medical history - create MedicalCondition documents and get their IDs
  if (medicalHistory && Array.isArray(medicalHistory)) {
    const medicalConditionIds = [];
    
    for (const condition of medicalHistory) {
      if (condition.name && condition.details) {
        // Check if this is an existing condition (has an ID) or a new one
        if (condition.id) {
          // Update existing medical condition
          const existingCondition = await MedicalCondition.findByIdAndUpdate(
            condition.id,
            {
              name: condition.name,
              details: condition.details,
              diagnosed: condition.diagnosed ? new Date(condition.diagnosed) : new Date(),
              procedure: condition.procedure || '',
              status: 'active'
            },
            { new: true }
          );
          
          if (existingCondition) {
            medicalConditionIds.push(existingCondition._id);
          }
        } else {
          // Create new medical condition
          const medicalCondition = await MedicalCondition.create({
            patient: patientId,
            doctor: decoded.doctorId,
            name: condition.name,
            details: condition.details,
            diagnosed: condition.diagnosed ? new Date(condition.diagnosed) : new Date(),
            procedure: condition.procedure || '',
            status: 'active'
          });
          
          medicalConditionIds.push(medicalCondition._id);
        }
      }
    }
    
    if (medicalConditionIds.length > 0) {
      updateData.medicalHistory = medicalConditionIds;
    }
  }

  // Handle medications - create Medication documents and get their IDs
  if (medications && Array.isArray(medications)) {
    const medicationIds = [];
    
    for (const medication of medications) {
      if (medication.name && medication.dosage) {
        // Check if this is an existing medication (has an ID) or a new one
        if (medication.id) {
          // Update existing medication
          const existingMedication = await Medication.findByIdAndUpdate(
            medication.id,
            {
              name: medication.name,
              dosage: medication.dosage,
              frequency: medication.frequency || 'Once daily',
              startDate: medication.startDate ? new Date(medication.startDate) : new Date(),
              endDate: medication.endDate ? new Date(medication.endDate) : undefined,
              status: medication.status || 'active',
              notes: medication.notes
            },
            { new: true }
          );
          
          if (existingMedication) {
            medicationIds.push(existingMedication._id);
          }
        } else {
          // Create new medication
          const medicationDoc = await Medication.create({
            patient: patientId,
            doctor: decoded.doctorId,
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency || 'Once daily',
            startDate: medication.startDate ? new Date(medication.startDate) : new Date(),
            endDate: medication.endDate ? new Date(medication.endDate) : undefined,
            status: medication.status || 'active',
            notes: medication.notes
          });
          
          medicationIds.push(medicationDoc._id);
        }
      }
    }
    
    if (medicationIds.length > 0) {
      updateData.medications = medicationIds;
    }
  }

  // Handle test results - create TestResult documents and get their IDs
  if (testResults && Array.isArray(testResults)) {
    const testResultIds = [];
    
    for (const test of testResults) {
      if (test.name && test.findings) {
        // Check if this is an existing test result (has an ID) or a new one
        if (test.id) {
          // Update existing test result
          const existingTestResult = await TestResult.findByIdAndUpdate(
            test.id,
            {
              name: test.name,
              date: test.date ? new Date(test.date) : new Date(),
              status: test.status || 'normal',
              findings: test.findings,
              notes: test.notes,
              attachments: test.attachments || []
            },
            { new: true }
          );
          
          if (existingTestResult) {
            testResultIds.push(existingTestResult._id);
          }
        } else {
          // Create new test result
          const testResult = await TestResult.create({
            patient: patientId,
            doctor: decoded.doctorId,
            hospital: decoded.hospitalId,
            name: test.name,
            date: test.date ? new Date(test.date) : new Date(),
            status: test.status || 'normal',
            findings: test.findings,
            notes: test.notes,
            attachments: test.attachments || []
          });
          
          testResultIds.push(testResult._id);
        }
      }
    }
    
    if (testResultIds.length > 0) {
      updateData.testResults = testResultIds;
    }
  }

  // Handle hospital visits - create HospitalVisit documents and get their IDs
  if (hospitalVisits && Array.isArray(hospitalVisits)) {
    const hospitalVisitIds = [];
    
    for (const visit of hospitalVisits) {
      if (visit.reason) {
        // Check if this is an existing visit (has an ID) or a new one
        if (visit.id) {
          // Update existing hospital visit
          const existingVisit = await HospitalVisit.findByIdAndUpdate(
            visit.id,
            {
              reason: visit.reason,
              date: visit.date ? new Date(visit.date) : new Date(),
              notes: visit.notes,
              diagnosis: visit.diagnosis,
              treatment: visit.treatment,
              followUpDate: visit.followUpDate ? new Date(visit.followUpDate) : undefined
            },
            { new: true }
          );
          
          if (existingVisit) {
            hospitalVisitIds.push(existingVisit._id);
          }
        } else {
          // Create new hospital visit
          const hospitalVisit = await HospitalVisit.create({
            patient: patientId,
            doctor: decoded.doctorId,
            hospital: decoded.hospitalId,
            reason: visit.reason,
            date: visit.date ? new Date(visit.date) : new Date(),
            notes: visit.notes,
            diagnosis: visit.diagnosis,
            treatment: visit.treatment,
            followUpDate: visit.followUpDate ? new Date(visit.followUpDate) : undefined
          });
          
          hospitalVisitIds.push(hospitalVisit._id);
        }
      }
    }
    
    if (hospitalVisitIds.length > 0) {
      updateData.hospitalVisits = hospitalVisitIds;
    }
  }

  // Update patient record
  const updatedPatient = await Patient.findByIdAndUpdate(
    patientId,
    updateData,
    { new: true, runValidators: true }
  ).populate('user');

  res.json({
    success: true,
    message: 'Patient passport data updated successfully',
    data: {
      patient: {
        id: updatedPatient._id,
        name: updatedPatient.user.name,
        email: updatedPatient.user.email,
        nationalId: updatedPatient.nationalId,
        dateOfBirth: updatedPatient.dateOfBirth,
        contactNumber: updatedPatient.contactNumber,
        address: updatedPatient.address,
        gender: updatedPatient.gender,
        bloodType: updatedPatient.bloodType,
        emergencyContact: updatedPatient.emergencyContact,
        medicalHistory: updatedPatient.medicalHistory,
        allergies: updatedPatient.allergies,
        medications: updatedPatient.medications,
        testResults: updatedPatient.testResults,
        hospitalVisits: updatedPatient.hospitalVisits,
        medicalImages: updatedPatient.medicalImages
      },
      updatedBy: decoded.doctorId,
      updatedAt: new Date()
    }
  });
});
