import { Request, Response, NextFunction } from 'express';
import PatientPassport from '@/models/PatientPassport';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import { generateOTP, sendOTP } from '@/utils/otp';

// @desc    Request OTP for passport access
// @route   POST /api/passport-access/request-otp
// @access  Private (Doctor)
export const requestPassportAccessOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.body;

  console.log(`🔐 Passport Access OTP Request:`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   User ID: ${req.user._id}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);

  if (!patientId) {
    throw new CustomError('Patient ID is required', 400);
  }

  // Find patient
  const patient = await Patient.findById(patientId).populate('user', 'name email');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Find doctor by user ID
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email');
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  const doctorId = doctor._id;

  console.log(`🔐 Passport Access OTP Request:`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   User ID: ${req.user._id}`);
  console.log(`   Doctor ID: ${doctorId}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  if (patient.tempOTP && patient.tempOTPExpiry && patient.tempOTPExpiry > new Date() && 
      patient.tempOTPDoctor?.toString() === doctorId.toString()) {
    console.log(`⚠️  Valid OTP already exists for this patient-doctor combination`);
    console.log(`   OTP: ${patient.tempOTP}`);
    console.log(`   Expires: ${patient.tempOTPExpiry}`);
    
    const response: ApiResponse = {
      success: true,
      message: 'OTP already sent. Please use the existing OTP or wait for it to expire.',
      data: {
        patientName: patient.user.name,
        patientEmail: patient.user.email,
        otpExpiry: '10 minutes',
        existingOTP: true
      }
    };
    return res.json(response);
  }

  // Generate OTP
  const otp = generateOTP();
  
  // Store OTP in patient's temporary field (you might want to create a separate OTP collection)
  patient.tempOTP = otp;
  patient.tempOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  patient.tempOTPDoctor = doctorId;
  await patient.save();

  // Send OTP to patient using the real email service
  try {
    await sendOTP(patient.user.email, otp, 'passport-access', doctor.user.name, patient.user.name);
    console.log(`✅ OTP sent to patient ${patient.user.email}: ${otp}`);
    console.log(`📧 Patient: ${patient.user.name}`);
    console.log(`👨‍⚕️ Doctor: ${doctor.user.name}`);
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    // Don't fail the request if OTP sending fails, but log the issue
    console.log('⚠️  OTP request succeeded but email delivery failed');
  }

  const response: ApiResponse = {
    success: true,
    message: 'OTP sent to patient successfully',
    data: {
      patientName: patient.user.name,
      patientEmail: patient.user.email,
      otpExpiry: '10 minutes'
    }
  };

  return res.json(response);
});

// @desc    Verify OTP and grant passport access
// @route   POST /api/passport-access/verify-otp
// @access  Private (Doctor)
export const verifyPassportAccessOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, otpCode } = req.body;

  if (!patientId || !otpCode) {
    throw new CustomError('Patient ID and OTP code are required', 400);
  }

  // Find patient
  const patient = await Patient.findById(patientId).populate('user', 'name email');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Find doctor by user ID
  const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'name email');
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  const doctorId = doctor._id;

  console.log(`🔐 Passport Access OTP Verification:`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   User ID: ${req.user._id}`);
  console.log(`   Doctor ID: ${doctorId}`);
  console.log(`   OTP Code: ${otpCode}`);
  console.log(`   Stored OTP: ${patient.tempOTP}`);
  console.log(`   Stored Doctor ID: ${patient.tempOTPDoctor}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);

  // Verify OTP
  if (!patient.tempOTP || patient.tempOTP !== otpCode) {
    throw new CustomError('Invalid OTP code', 400);
  }

  if (!patient.tempOTPExpiry || patient.tempOTPExpiry < new Date()) {
    throw new CustomError('OTP has expired', 400);
  }

  if (patient.tempOTPDoctor?.toString() !== doctorId.toString()) {
    console.log(`❌ Doctor ID mismatch:`);
    console.log(`   Expected: ${doctorId.toString()}`);
    console.log(`   Stored: ${patient.tempOTPDoctor?.toString()}`);
    throw new CustomError('OTP was not requested by this doctor', 400);
  }

  // Clear OTP
  patient.tempOTP = undefined;
  patient.tempOTPExpiry = undefined;
  patient.tempOTPDoctor = undefined;
  await patient.save();

  // Find or create patient passport
  let passport = await PatientPassport.findByPatientId(patientId);
  
  if (!passport) {
    console.log(`📋 Creating new passport for patient: ${patient.user.name}`);
    console.log(`   Patient data:`, {
      name: patient.user.name,
      nationalId: patient.nationalId,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodType: patient.bloodType,
      contactNumber: patient.contactNumber,
      email: patient.user.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact
    });
    
    try {
      // Create new passport with patient data
      passport = new PatientPassport({
        patient: patientId,
        personalInfo: {
          fullName: patient.user.name,
          nationalId: patient.nationalId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodType: patient.bloodType,
          contactNumber: patient.contactNumber,
          email: patient.user.email,
          address: patient.address,
          emergencyContact: patient.emergencyContact
        },
        medicalInfo: {
          allergies: patient.allergies || [],
          currentMedications: [],
          medicalConditions: [],
          immunizations: [],
          surgeries: []
        },
        testResults: [],
        hospitalVisits: [],
        accessHistory: []
      });
      await passport.save();
      console.log(`✅ Passport created successfully for patient: ${patient.user.name}`);
    } catch (error) {
      console.error(`❌ Error creating passport for patient ${patient.user.name}:`, error);
      throw new CustomError('Failed to create patient passport', 500);
    }
  }

  // Add access record
  await passport.addAccessRecord(doctorId, 'view', 'OTP verified access', true);

  // Populate passport data
  const populatedPassport = await PatientPassport.findById(passport._id)
    .populate('patient', 'user nationalId')
    .populate('patient.user', 'name email')
    .populate('lastUpdatedBy', 'user')
    .populate('lastUpdatedBy.user', 'name');

  const response: ApiResponse = {
    success: true,
    message: 'OTP verified successfully. Passport access granted.',
    data: {
      passport: populatedPassport,
      accessToken: 'temp-access-token', // You can implement JWT tokens for passport access
      expiresIn: '1 hour'
    }
  };

  res.json(response);
});

// @desc    Get patient passport
// @route   GET /api/passport-access/:patientId
// @access  Private (Doctor)
export const getPatientPassport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  
  console.log(`🔍 Getting passport for patient: ${patientId}`);
  console.log(`   Doctor User ID: ${req.user._id}`);
  
  // Find doctor by user ID
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    console.log(`❌ Doctor not found for user: ${req.user._id}`);
    throw new CustomError('Doctor not found', 404);
  }
  
  const doctorId = doctor._id;
  console.log(`   Doctor ID: ${doctorId}`);

  // Find passport
  const passport = await PatientPassport.findByPatientId(patientId);

  if (!passport) {
    console.log(`❌ Patient passport not found for patient: ${patientId}`);
    throw new CustomError('Patient passport not found', 404);
  }

  console.log(`✅ Found passport for patient: ${patientId}`);

  try {
    // Add access record
    await passport.addAccessRecord(doctorId, 'view', 'Direct passport access', false);
    console.log(`✅ Added access record for doctor: ${doctorId}`);

    // Populate passport data
    const populatedPassport = await PatientPassport.findById(passport._id)
      .populate('patient', 'user nationalId')
      .populate('patient.user', 'name email')
      .populate('lastUpdatedBy', 'user')
      .populate('lastUpdatedBy.user', 'name')
      .populate('accessHistory.doctor', 'user')
      .populate('accessHistory.doctor.user', 'name');

    console.log(`✅ Passport populated successfully`);

    const response: ApiResponse = {
      success: true,
      message: 'Patient passport retrieved successfully',
      data: populatedPassport
    };

    res.json(response);
  } catch (error) {
    console.error(`❌ Error accessing passport for patient ${patientId}:`, error);
    throw new CustomError('Failed to access patient passport', 500);
  }
});

// @desc    Update patient passport
// @route   PUT /api/passport-access/:patientId
// @access  Private (Doctor)
export const updatePatientPassport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const updateData = req.body;
  
  console.log(`📝 Updating passport for patient: ${patientId}`);
  console.log(`   Doctor User ID: ${req.user._id}`);
  console.log(`   Update data:`, JSON.stringify(updateData, null, 2));
  
  // Find doctor by user ID
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    console.log(`❌ Doctor not found for user: ${req.user._id}`);
    throw new CustomError('Doctor not found', 404);
  }
  
  const doctorId = doctor._id;
  console.log(`   Doctor ID: ${doctorId}`);

  // Find passport
  const passport = await PatientPassport.findByPatientId(patientId);
  if (!passport) {
    console.log(`❌ Patient passport not found for patient: ${patientId}`);
    throw new CustomError('Patient passport not found', 404);
  }

  console.log(`✅ Found passport for patient: ${patientId}`);

  try {
    // Update passport
    console.log(`🔄 Updating passport data...`);
    const updatedPassport = await passport.updatePassport(updateData, doctorId);
    console.log(`✅ Passport updated successfully`);

    // Add access record
    console.log(`📝 Adding access record...`);
    await updatedPassport.addAccessRecord(doctorId, 'update', 'Passport updated', false);
    console.log(`✅ Access record added`);

    // Populate updated passport
    console.log(`🔄 Populating updated passport data...`);
    const populatedPassport = await PatientPassport.findById(updatedPassport._id)
      .populate('patient', 'user nationalId')
      .populate('patient.user', 'name email')
      .populate('lastUpdatedBy', 'user')
      .populate('lastUpdatedBy.user', 'name')
      .populate('accessHistory.doctor', 'user')
      .populate('accessHistory.doctor.user', 'name');

    console.log(`✅ Passport populated successfully`);

    const response: ApiResponse = {
      success: true,
      message: 'Patient passport updated successfully',
      data: populatedPassport
    };

    res.json(response);
  } catch (error) {
    console.error(`❌ Error updating passport for patient ${patientId}:`, error);
    throw new CustomError('Failed to update patient passport', 500);
  }
});

// @desc    Get doctor's recent passport access
// @route   GET /api/passport-access/recent
// @access  Private (Doctor)
export const getRecentPassportAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Find doctor by user ID
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }
  
  const doctorId = doctor._id;
  const limit = parseInt(req.query.limit as string) || 10;

  const recentAccess = await PatientPassport.getRecentAccess(doctorId, limit);

  const response: ApiResponse = {
    success: true,
    message: 'Recent passport access retrieved successfully',
    data: recentAccess
  };

  res.json(response);
});