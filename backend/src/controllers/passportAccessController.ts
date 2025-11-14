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

  if (req.user.role === 'patient') {
    throw new CustomError('Patients should access their passport directly at /api/patients/passport/:patientId. OTP access is only for doctors.', 403);
  }

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
    
    // Check if email was previously sent (we can't know for sure, but assume yes if OTP exists)
    const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    const response: ApiResponse = {
      success: true,
      message: 'OTP already sent. Please use the existing OTP or wait for it to expire.',
      data: {
        patientName: patient.user.name,
        patientEmail: patient.user.email,
        otpExpiry: '10 minutes',
        existingOTP: true,
        emailSent: hasEmailConfig ? true : undefined, // Assume sent if config exists
        emailWarning: !hasEmailConfig ? 'No email credentials configured. Check server logs for OTP code.' : undefined
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

  console.log(`💾 OTP stored in database:`);
  console.log(`   Patient: ${patient.user.name} (${patient.user.email})`);
  console.log(`   Doctor: ${doctor.user.name}`);
  console.log(`   OTP: ${otp}`);
  console.log(`   Expires: ${patient.tempOTPExpiry.toISOString()}`);

  // Send OTP to patient using the real email service
  let emailSent = false;
  let emailError: any = null;
  
  // Check if email credentials are configured
  const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  
  try {
    console.log(`📧 Attempting to send OTP email to: ${patient.user.email}`);
    if (hasEmailConfig) {
      console.log(`✅ Email credentials found - attempting real email delivery`);
    } else {
      console.log(`⚠️  No email credentials configured - OTP will be logged to console only`);
    }
    
    await sendOTP(patient.user.email, otp, 'passport-access', doctor.user.name, patient.user.name);
    emailSent = true;
    console.log(`✅ OTP email sent successfully to ${patient.user.email}`);
    console.log(`📧 Patient: ${patient.user.name}`);
    console.log(`👨‍⚕️ Doctor: ${doctor.user.name}`);
  } catch (error) {
    emailError = error;
    console.error('❌ Error sending OTP email:', error);
    console.error('   Error details:', error instanceof Error ? error.message : String(error));
    
    if (hasEmailConfig) {
      console.error('⚠️  Email credentials are configured but email delivery failed!');
      console.error('   Please check:');
      console.error('   1. EMAIL_USER and EMAIL_PASS are correct');
      console.error('   2. Gmail App Password is valid (if using Gmail)');
      console.error('   3. Network connectivity to SMTP server');
      console.error('   4. Server firewall allows outbound SMTP (port 587)');
    } else {
      console.log('⚠️  No email credentials configured');
      console.log('   To enable email delivery, set environment variables:');
      console.log('   EMAIL_HOST=smtp.gmail.com');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASS=your-app-password');
    }
    
    // Even if email fails, OTP is stored and can be retrieved from logs
    console.log('💾 OTP is stored in database and logged to console for testing');
    console.log(`🔐 OTP Code for testing: ${otp}`);
  }

  // Return response indicating email status
  const response: ApiResponse = {
    success: true,
    message: emailSent 
      ? 'OTP sent to patient successfully' 
      : 'OTP generated successfully. Email delivery failed - check server logs for OTP code.',
    data: {
      patientName: patient.user.name,
      patientEmail: patient.user.email,
      otpExpiry: '10 minutes',
      emailSent: emailSent,
      ...(emailError && { 
        emailWarning: 'Email delivery failed. OTP is available in server logs for testing purposes.'
      })
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
  console.log(`   Stored OTP: ${patient.tempOTP || 'NOT SET'}`);
  console.log(`   Stored Doctor ID: ${patient.tempOTPDoctor?.toString() || 'NOT SET'}`);
  console.log(`   OTP Expiry: ${patient.tempOTPExpiry?.toISOString() || 'NOT SET'}`);
  console.log(`   Current Time: ${new Date().toISOString()}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);

  // Check if OTP exists
  if (!patient.tempOTP) {
    console.log(`❌ No OTP found for patient`);
    throw new CustomError('No OTP code found. Please request a new OTP.', 400);
  }

  // Verify OTP code matches
  if (patient.tempOTP !== otpCode.trim()) {
    console.log(`❌ OTP mismatch:`);
    console.log(`   Provided: ${otpCode}`);
    console.log(`   Expected: ${patient.tempOTP}`);
    throw new CustomError('Invalid OTP code. Please check the code and try again.', 400);
  }

  // Check if OTP has expired
  if (!patient.tempOTPExpiry || patient.tempOTPExpiry < new Date()) {
    console.log(`❌ OTP expired:`);
    console.log(`   Expiry: ${patient.tempOTPExpiry?.toISOString() || 'NOT SET'}`);
    console.log(`   Current: ${new Date().toISOString()}`);
    // Clear expired OTP
    patient.tempOTP = undefined;
    patient.tempOTPExpiry = undefined;
    patient.tempOTPDoctor = undefined;
    await patient.save();
    throw new CustomError('OTP has expired. Please request a new OTP.', 400);
  }

  // Verify doctor ID matches
  if (!patient.tempOTPDoctor || patient.tempOTPDoctor.toString() !== doctorId.toString()) {
    console.log(`❌ Doctor ID mismatch:`);
    console.log(`   Expected: ${doctorId.toString()}`);
    console.log(`   Stored: ${patient.tempOTPDoctor?.toString() || 'NOT SET'}`);
    throw new CustomError('This OTP was not requested by you. Please request a new OTP.', 400);
  }

  console.log(`✅ OTP verification successful`);

  // Clear OTP after successful verification
  patient.tempOTP = undefined;
  patient.tempOTPExpiry = undefined;
  patient.tempOTPDoctor = undefined;
  await patient.save();
  console.log(`🧹 OTP cleared from patient record`);

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

  // Add access record for audit trail
  await passport.addAccessRecord(doctorId, 'view', 'OTP verified access', true);
  console.log(`📝 Access record added for doctor: ${doctorId}`);

  // Populate passport data with all related information
  const populatedPassport = await PatientPassport.findById(passport._id)
    .populate('patient', 'user nationalId')
    .populate('patient.user', 'name email')
    .populate('lastUpdatedBy', 'user')
    .populate('lastUpdatedBy.user', 'name')
    .populate('accessHistory.doctor', 'user')
    .populate('accessHistory.doctor.user', 'name');

  console.log(`✅ Passport populated successfully`);
  console.log(`✅ Doctor ${doctor.user.name} now has access to ${patient.user.name}'s passport`);

  const response: ApiResponse = {
    success: true,
    message: 'OTP verified successfully. Passport access granted.',
    data: {
      passport: populatedPassport,
      accessToken: 'temp-access-token', // You can implement JWT tokens for passport access
      expiresIn: '1 hour',
      doctorId: doctorId.toString(),
      patientId: patientId.toString(), // CRITICAL: This is the patient ID to use for passport access
      patientName: patient.user.name, // Include patient name for frontend display
      doctorName: doctor.user.name, // Include doctor name for frontend display
      grantedAt: new Date().toISOString(),
      // IMPORTANT: Frontend should use patientId (not doctorId) to access passport
      passportUrl: `/api/patients/passport/${patientId.toString()}`
    }
  };

  console.log(`📤 OTP Verification Response:`);
  console.log(`   - patientId: ${patientId.toString()} (USE THIS for passport access)`);
  console.log(`   - doctorId: ${doctorId.toString()} (DO NOT use this for passport access)`);
  console.log(`   - Patient Name: ${patient.user.name}`);

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