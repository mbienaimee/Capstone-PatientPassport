import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import Receptionist from '@/models/Receptionist';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '@/types';
import { generateAndSendOTP, verifyOTP } from '@/services/otpService';
import { sendEmailVerification } from '@/utils/email';
import crypto from 'crypto';

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env['JWT_SECRET'] || 'fallback-jwt-secret-key-12345-67890';
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env['JWT_EXPIRE'] || '7d'
  } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  const secret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret-key-12345-67890';
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env['JWT_REFRESH_EXPIRE'] || '30d'
  } as jwt.SignOptions);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, nationalId, dateOfBirth, gender, contactNumber, address, hospitalName, adminContact, licenseNumber, specialization, employeeId, department, shift }: RegisterRequest = req.body;
  

  // Validate password confirmation
  if (password !== req.body.confirmPassword) {
    throw new CustomError('Password confirmation does not match password', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User with this email already exists', 400);
  }

  // Create user (without email verification initially)
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Create role-specific profile
  console.log('Registration data:', { role, nationalId, dateOfBirth, gender, contactNumber, address });
  console.log('Full request body:', req.body);
  
  if (role === 'patient' && nationalId && dateOfBirth && gender && contactNumber && address) {
    console.log('Creating patient record...');
    
    // Validate emergency contact fields
    const emergencyContact = req.body.emergencyContact;
    if (!emergencyContact || !emergencyContact.name || !emergencyContact.relationship || !emergencyContact.phone) {
      throw new CustomError('Emergency contact information is required (name, relationship, and phone)', 400);
    }
    
    try {
      const patient = await Patient.create({
        user: user._id,
        nationalId,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        contactNumber,
        address,
        emergencyContact: {
          name: emergencyContact.name,
          relationship: emergencyContact.relationship,
          phone: emergencyContact.phone
        }
      });
      console.log('Patient created successfully:', patient._id);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  } else {
    console.log('Patient creation skipped - missing required fields');
    console.log('Missing fields check:', {
      role: role === 'patient',
      nationalId: !!nationalId,
      dateOfBirth: !!dateOfBirth,
      gender: !!gender,
      contactNumber: !!contactNumber,
      address: !!address
    });
  }
  
  if (role === 'hospital' && hospitalName && licenseNumber) {
    console.log('Creating hospital record...');
    try {
      const hospital = await Hospital.create({
        user: user._id,
        name: hospitalName,
        address: req.body.address || '',
        contact: req.body.contact || '',
        licenseNumber,
        adminContact: adminContact || ''
      });
      console.log('Hospital created successfully:', hospital._id);
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  } else if (role === 'doctor' && licenseNumber && specialization) {
    // Doctors can only be created by hospitals through the hospital dashboard
    // This prevents unauthorized doctor registration
    throw new CustomError('Doctor registration is not allowed through public registration. Doctors must be created by hospitals through the hospital dashboard.', 403);
  } else if (role === 'receptionist' && employeeId && department && shift) {
    console.log('Creating receptionist record...');
    // Receptionist registration requires hospital assignment
    if (!req.body.hospital) {
      throw new CustomError('Hospital assignment is required for receptionist registration', 400);
    }
    
    try {
      const receptionist = await Receptionist.create({
        user: user._id,
        employeeId,
        hospital: req.body.hospital,
        department,
        shift,
        permissions: {
          canAssignDoctors: true,
          canViewPatientRecords: true,
          canScheduleAppointments: true,
          canAccessEmergencyOverride: false
        }
      });
      console.log('Receptionist created successfully:', receptionist._id);
    } catch (error) {
      console.error('Error creating receptionist:', error);
      throw error;
    }
  } else {
    console.log('No role-specific profile created for role:', role);
    console.log('Role-specific profile creation conditions:');
    console.log('- Patient:', role === 'patient' && 'nationalId, dateOfBirth, gender, contactNumber, address');
    console.log('- Hospital:', role === 'hospital' && 'hospitalName, licenseNumber');
    console.log('- Doctor:', role === 'doctor' && 'licenseNumber, specialization, hospital');
    console.log('- Receptionist:', role === 'receptionist' && 'employeeId, department, shift, hospital');
  }

  // Send OTP for email verification (skip for doctors)
  if (role !== 'doctor') {
    try {
      await generateAndSendOTP(email, 'email');
      console.log('OTP sent successfully for email verification');
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Don't fail registration if OTP sending fails
    }
  }

  const response: ApiResponse = {
    success: true,
    message: role === 'doctor' 
      ? 'Doctor registered successfully. You can now log in.'
      : 'User registered successfully. Please check your email for OTP to complete verification.',
    data: {
      user: user.getPublicProfile(),
      requiresOTPVerification: role !== 'doctor'
    }
  };

  res.status(201).json(response);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, nationalId, hospitalName, password }: LoginRequest = req.body;

    console.log('Login attempt:', { email, nationalId, hospitalName, password: '***' });

  // Validate required fields
  if (!password) {
    throw new CustomError('Password is required', 400);
  }

  if (!email && !nationalId && !hospitalName) {
    throw new CustomError('Email, National ID, or Hospital Name is required', 400);
  }

  let user: any = null;

  try {
    // Find user by different identifiers
    if (email) {
      user = await User.findOne({ email }).select('+password');
      console.log('Found user by email:', !!user);
      if (user) {
        console.log('User details:', { id: user._id, email: user.email, role: user.role, isActive: user.isActive, isEmailVerified: user.isEmailVerified });
      }
    } else if (nationalId) {
      console.log('Searching for patient with nationalId:', nationalId);
      console.log('NationalId type:', typeof nationalId);
      console.log('NationalId length:', nationalId.length);
      
      try {
        // First, try to find the patient without populate to see if it exists
        const patientExists = await Patient.findOne({ nationalId });
        console.log('Patient exists (without populate):', !!patientExists);
        
        if (patientExists) {
          console.log('Patient ID:', patientExists._id);
          console.log('Patient user reference:', patientExists.user);
        }
        
        // Now try with populate
        const patient = await Patient.findOne({ nationalId }).populate('user', '+password');
        console.log('Patient found (with populate):', !!patient);
        
        if (patient) {
          user = patient.user;
          console.log('User from patient:', !!user);
          if (user) {
            console.log('User details from patient:', { 
              id: user._id, 
              email: user.email, 
              role: user.role, 
              isActive: user.isActive, 
              isEmailVerified: user.isEmailVerified,
              hasPassword: !!user.password
            });
          } else {
            console.log('❌ Patient found but user is null/undefined');
            console.log('Patient data:', {
              id: patient._id,
              nationalId: patient.nationalId,
              userRef: patient.user
            });
            
            // Check if the user reference exists
            if (patient.user) {
              console.log('Checking if user exists in database...');
              const userExists = await User.findById(patient.user);
              console.log('User exists in database:', !!userExists);
              
              if (!userExists) {
                console.log('❌ User referenced by patient does not exist - orphaned patient record');
                throw new CustomError('Patient account is corrupted. Please contact support.', 500);
              }
            } else {
              console.log('❌ Patient has no user reference');
              throw new CustomError('Patient account is incomplete. Please contact support.', 500);
            }
          }
        } else {
          console.log('❌ No patient found with nationalId:', nationalId);
          
          // Try to find any patients to see if the collection exists
          const allPatients = await Patient.find({}).limit(5);
          console.log('Total patients in database:', allPatients.length);
          if (allPatients.length > 0) {
            console.log('Sample patient nationalIds:', allPatients.map(p => p.nationalId));
          }
        }
      } catch (patientError) {
        console.error('Error during patient lookup:', patientError);
        console.error('Patient error details:', {
          message: patientError.message,
          name: patientError.name,
          stack: patientError.stack
        });
        
        // Re-throw as CustomError to ensure proper error handling
        if (patientError instanceof CustomError) {
          throw patientError;
        } else {
          throw new CustomError(`Database error during patient lookup: ${patientError.message}`, 500);
        }
      }
    } else if (hospitalName) {
      // For hospital login, treat hospitalName as email
      const hospitalUser = await User.findOne({ email: hospitalName, role: 'hospital' }).select('+password');
      if (hospitalUser) {
        user = hospitalUser;
        console.log('Found hospital user by email:', !!user);
      } else {
        // Fallback: try to find by hospital name
        const hospital = await Hospital.findOne({ name: hospitalName }).populate('user', '+password');
        user = hospital?.user;
        console.log('Found hospital by name:', !!hospital, 'User:', !!user);
      }
    }
  } catch (dbError) {
    console.error('Database error during login:', dbError);
    throw new CustomError('Database connection error. Please try again.', 500);
  }

  if (!user) {
    console.log('No user found for login attempt');
    throw new CustomError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new CustomError('Account has been deactivated', 401);
  }

  // Check if email is verified (skip for doctors and admins)
  if (!user.isEmailVerified && user.role !== 'doctor' && user.role !== 'admin') {
    throw new CustomError('Please verify your email address before logging in. Check your email for verification instructions.', 401);
  }

  // Check password
  console.log('Testing password for user:', user.email);
  console.log('User has password field:', !!user.password);
  
  try {
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password comparison result:', isPasswordValid);
    if (!isPasswordValid) {
      throw new CustomError('Invalid credentials', 401);
    }
  } catch (passwordError) {
    console.error('Password comparison error:', passwordError);
    throw new CustomError('Invalid credentials', 401);
  }

  // For patients, hospitals, doctors, and admins, skip OTP and login directly
  if (user.role === 'patient' || user.role === 'hospital' || user.role === 'doctor' || user.role === 'admin') {
    try {
      // Update last login
      console.log('Updating last login for user:', user._id);
      user.lastLogin = new Date();
      await user.save();
      console.log('Last login updated successfully');

      // Generate tokens
      console.log('Generating tokens for user:', user._id);
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      console.log('Tokens generated successfully');

      // Get public profile
      console.log('Getting public profile for user:', user._id);
      const publicProfile = user.getPublicProfile();
      console.log('Public profile retrieved successfully');

      const response: AuthResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: publicProfile,
          token,
          refreshToken
        }
      };

      console.log('Login response prepared successfully');
      return res.json(response);
    } catch (loginProcessError) {
      console.error('Error during login process:', loginProcessError);
      console.error('Login process error details:', {
        message: loginProcessError.message,
        name: loginProcessError.name,
        stack: loginProcessError.stack
      });
      throw new CustomError(`Login process error: ${loginProcessError.message}`, 500);
    }
  }

  // For other roles, send OTP for login verification
  try {
    await generateAndSendOTP(user.email, 'email');
    console.log('OTP sent successfully for login verification');
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new CustomError('Failed to send OTP. Please try again.', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Password verified. Please check your email for OTP to complete login.',
    data: {
      user: user.getPublicProfile(),
      requiresOTPVerification: true,
      email: user.email
    }
  };

  return res.json(response);
  } catch (error) {
    console.error('Login function error:', error);
    console.error('Login error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Re-throw as CustomError to ensure proper error handling
    if (error instanceof CustomError) {
      throw error;
    } else {
      throw new CustomError(`Login error: ${error.message}`, 500);
    }
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new CustomError('Refresh token is required', 400);
  }

  try {
    const secret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret-key-12345-67890';
    const decoded = jwt.verify(refreshToken, secret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new CustomError('Invalid refresh token', 401);
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    const response: AuthResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: user.getPublicProfile(),
        token: newToken,
        refreshToken: newRefreshToken
      }
    };

    res.json(response);
  } catch (error) {
    throw new CustomError('Invalid refresh token', 401);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  // Get role-specific profile with optimized queries (only essential fields)
  let profile = null;
  
  if (user.role === 'patient') {
    // Optimized: Don't populate large arrays, just get basic patient info
    profile = await Patient.findOne({ user: user._id })
      .select('nationalId dateOfBirth bloodType allergies emergencyContact assignedDoctors')
      .populate('assignedDoctors', 'specialization')
      .populate('assignedDoctors.user', 'name email')
      .lean(); // Use lean() for faster queries
  } else if (user.role === 'doctor') {
    profile = await Doctor.findOne({ user: user._id })
      .populate('hospital', 'name location')
      .lean();
  } else if (user.role === 'hospital') {
    profile = await Hospital.findOne({ user: user._id })
      .lean();
  }

  const response: ApiResponse = {
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: user.getPublicProfile(),
      profile
    }
  };

  res.json(response);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { name, email } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Update user fields
  if (name) user.name = name;
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new CustomError('Email already in use', 400);
    }
    user.email = email;
  }

  await user.save();

  const response: ApiResponse = {
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  };

  res.json(response);
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new CustomError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  const response: ApiResponse = {
    success: true,
    message: 'Password changed successfully'
  };

  res.json(response);
});

// @desc    Change any user's password (Admin/Hospital only)
// @route   PUT /api/users/:userId/change-password
// @access  Private (Admin, Hospital)
export const changeUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  const currentUser = req.user;

  // Check if current user is admin or hospital
  if (!['admin', 'hospital'].includes(currentUser.role)) {
    throw new CustomError('Access denied. Only admins and hospitals can change user passwords.', 403);
  }

  // Find the target user
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // If current user is hospital, check if the target user is a doctor in their hospital
  if (currentUser.role === 'hospital') {
    const Doctor = require('@/models/Doctor').default;
    const doctor = await Doctor.findOne({ user: userId, hospital: currentUser.hospital });
    if (!doctor) {
      throw new CustomError('Access denied. You can only change passwords for doctors in your hospital.', 403);
    }
  }

  // Update password
  user.password = newPassword;
  await user.save();

  const response: ApiResponse = {
    success: true,
    message: 'Password changed successfully'
  };

  res.json(response);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };

  res.json(response);
});

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;

  // Soft delete - deactivate account
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  user.isActive = false;
  await user.save();

  const response: ApiResponse = {
    success: true,
    message: 'Account deactivated successfully'
  };

  res.json(response);
});

// Request OTP for login
export const requestOTP = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, type } = req.body;

  if (!identifier || !type) {
    throw new CustomError('Identifier and type are required', 400);
  }

  if (!['email', 'phone'].includes(type)) {
    throw new CustomError('Type must be either email or phone', 400);
  }

  // Check if user exists
  let user;
  if (type === 'email') {
    user = await User.findOne({ email: identifier });
  } else {
    // For phone, we need to find user by phone number in patient record
    const patient = await Patient.findOne({ contactNumber: identifier });
    if (patient) {
      user = await User.findById(patient.user);
    }
  }

  if (!user) {
    throw new CustomError('User not found with this identifier', 404);
  }

  // Generate and send OTP
  const otpCode = await generateAndSendOTP(identifier, type);

  const response: ApiResponse = {
    success: true,
    message: `OTP sent to your ${type}`,
    data: {
      identifier,
      type,
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otpCode })
    }
  };

  res.json(response);
});

// Verify OTP and login
export const verifyOTPLogin = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, otpCode, type } = req.body;

  if (!identifier || !otpCode || !type) {
    throw new CustomError('Identifier, OTP code, and type are required', 400);
  }

  // Verify OTP
  const isOTPValid = await verifyOTP(identifier, otpCode, type);
  
  if (!isOTPValid) {
    throw new CustomError('Invalid or expired OTP', 400);
  }

  // Find user
  let user;
  if (type === 'email') {
    user = await User.findOne({ email: identifier });
  } else {
    const patient = await Patient.findOne({ contactNumber: identifier });
    if (patient) {
      user = await User.findById(patient.user);
    }
  }

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new CustomError('Account has been deactivated', 401);
  }

  // Check if email is verified (skip for doctors)
  if (!user.isEmailVerified && user.role !== 'doctor') {
    throw new CustomError('Please verify your email address before logging in. Check your email for verification instructions.', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const response: AuthResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token,
      refreshToken
    }
  };

  res.json(response);
});

// @desc    Verify OTP for registration
// @route   POST /api/auth/verify-registration-otp
// @access  Public
export const verifyRegistrationOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    throw new CustomError('Email and OTP code are required', 400);
  }

  // Verify OTP
  const isOTPValid = await verifyOTP(email, otpCode, 'email');
  
  if (!isOTPValid) {
    throw new CustomError('Invalid or expired OTP', 400);
  }

  // Find user and mark email as verified
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Mark email as verified
  user.isEmailVerified = true;
  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const response: AuthResponse = {
    success: true,
    message: 'Email verified successfully. You can now log in.',
    data: {
      user: user.getPublicProfile(),
      token,
      refreshToken
    }
  };

  res.json(response);
});

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    throw new CustomError('Verification token is required', 400);
  }

  // Find user with valid verification token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new CustomError('Invalid or expired verification token', 400);
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const response: ApiResponse = {
    success: true,
    message: 'Email verified successfully. You can now log in to your account.'
  };

  res.json(response);
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError('Email is required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw new CustomError('Email is already verified', 400);
  }

  // Generate new verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();

  // Send verification email
  try {
    await sendEmailVerification(email, emailVerificationToken);
    console.log('Email verification resent successfully');
  } catch (error) {
    console.error('Error resending email verification:', error);
    throw new CustomError('Failed to send verification email', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Verification email sent successfully. Please check your email.'
  };

  res.json(response);
});

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError('Please provide an email address', 400);
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists or not
    const response: ApiResponse = {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    };
    res.json(response);
    return;
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL (for email link - we'll also return the token for testing)
  const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  try {
    // TODO: Send email with reset link
    // For now, we'll return the token in the response (in production, only send via email)
    console.log('Password reset token generated for:', email);
    console.log('Reset URL:', resetURL);
    console.log('Reset Token:', resetToken);

    // In production, send email here
    // await sendPasswordResetEmail(user.email, resetURL);

    const response: ApiResponse = {
      success: true,
      message: 'Password reset link has been sent to your email',
      data: {
        resetToken, // Remove this in production
        resetURL // Remove this in production
      }
    };

    res.json(response);
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new CustomError('Error sending password reset email. Please try again later.', 500);
  }
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    throw new CustomError('Please provide token, password, and password confirmation', 400);
  }

  if (password !== confirmPassword) {
    throw new CustomError('Passwords do not match', 400);
  }

  if (password.length < 8) {
    throw new CustomError('Password must be at least 8 characters long', 400);
  }

  // Hash the token to compare with database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new CustomError('Password reset token is invalid or has expired', 400);
  }

  // Set new password (will be hashed by pre-save middleware)
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Generate new token for auto-login
  const authToken = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  const response: AuthResponse = {
    success: true,
    message: 'Password has been reset successfully',
    data: {
      user: user.getPublicProfile(),
      token: authToken,
      refreshToken
    }
  };

  res.json(response);
});

// @desc    Verify reset token (check if token is valid)
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
export const verifyResetToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  if (!token) {
    throw new CustomError('Please provide a reset token', 400);
  }

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    const response: ApiResponse = {
      success: false,
      message: 'Password reset token is invalid or has expired'
    };
    res.status(400).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    message: 'Reset token is valid',
    data: {
      email: user.email
    }
  };

  res.json(response);
});


