import { Request, Response } from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { generateAndSendOTP, verifyOTP } from '@/services/otpService';
import Patient from '@/models/Patient';
import User from '@/models/User';
import MedicalRecord from '@/models/MedicalRecord';
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

  // Generate temporary access token (valid for 1 hour)
  const accessToken = require('jsonwebtoken').sign(
    { 
      doctorId, 
      patientId, 
      accessType: 'passport_view',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  res.json({
    success: true,
    message: 'OTP verified successfully. Access granted.',
    data: {
      accessToken,
      patientId: patient._id,
      patientName: patient.user.name,
      doctorName: doctor.name,
      expiresIn: '1 hour'
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

  // Get medical records (similar to existing getPatientMedicalRecords)
  const records = await MedicalRecord.find({ patientId: patient._id })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  // Group records by type
  const groupedRecords = {
    conditions: records.filter(record => record.type === 'condition'),
    medications: records.filter(record => record.type === 'medication'),
    tests: records.filter(record => record.type === 'test'),
    visits: records.filter(record => record.type === 'visit'),
    images: records.filter(record => record.type === 'image')
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
