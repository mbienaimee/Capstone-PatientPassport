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
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env['JWT_EXPIRE'] || '7d'
  } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  const secret = process.env['JWT_REFRESH_SECRET'];
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env['JWT_REFRESH_EXPIRE'] || '30d'
  } as jwt.SignOptions);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, nationalId, dateOfBirth, contactNumber, address, hospitalName, adminContact, licenseNumber, specialization, employeeId, department, shift }: RegisterRequest = req.body;
  

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
  console.log('Registration data:', { role, nationalId, dateOfBirth, contactNumber, address });
  
  if (role === 'patient' && nationalId && dateOfBirth && contactNumber && address) {
    console.log('Creating patient record...');
    try {
      const patient = await Patient.create({
        user: user._id,
        nationalId,
        dateOfBirth: new Date(dateOfBirth),
        contactNumber,
        address,
        emergencyContact: {
          name: req.body.emergencyContact?.name || '',
          relationship: req.body.emergencyContact?.relationship || '',
          phone: req.body.emergencyContact?.phone || ''
        }
      });
      console.log('Patient created successfully:', patient._id);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  } else {
    console.log('Patient creation skipped - missing required fields');
  }
  
  if (role === 'hospital' && hospitalName && adminContact && licenseNumber) {
    await Hospital.create({
      user: user._id,
      name: hospitalName,
      address: req.body.address || '',
      contact: req.body.contact || '',
      licenseNumber,
      adminContact
    });
  } else if (role === 'doctor' && licenseNumber && specialization) {
    // Doctor registration requires hospital assignment
    if (!req.body.hospital) {
      throw new CustomError('Hospital assignment is required for doctor registration', 400);
    }
    
    await Doctor.create({
      user: user._id,
      licenseNumber,
      specialization,
      hospital: req.body.hospital
    });
  } else if (role === 'receptionist' && employeeId && department && shift) {
    // Receptionist registration requires hospital assignment
    if (!req.body.hospital) {
      throw new CustomError('Hospital assignment is required for receptionist registration', 400);
    }
    
    await Receptionist.create({
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
  }

  // Send OTP for email verification
  let otpCode: string | undefined;
  try {
    otpCode = await generateAndSendOTP(email, 'email');
    console.log('OTP sent successfully for email verification');
    
    // In development mode, log OTP
    if (process.env.NODE_ENV === 'development') {
      console.log('='.repeat(50));
      console.log('DEVELOPMENT MODE - OTP for registration:');
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otpCode}`);
      console.log('='.repeat(50));
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Don't fail registration if OTP sending fails
  }

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully. Please check your email for OTP to complete verification.',
    data: {
      user: user.getPublicProfile(),
      requiresOTPVerification: true
    }
  };

  res.status(201).json(response);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, nationalId, hospitalName, password }: LoginRequest = req.body;

  console.log('Login attempt:', { email, nationalId, hospitalName, password: '***' });

  let user: any = null;

  // Find user by different identifiers
  if (email) {
    user = await User.findOne({ email }).select('+password');
    console.log('Found user by email:', !!user);
    if (user) {
      console.log('User details:', { id: user._id, email: user.email, role: user.role, isActive: user.isActive, isEmailVerified: user.isEmailVerified });
    }
  } else if (nationalId) {
    const patient = await Patient.findOne({ nationalId }).populate('user', '+password');
    user = patient?.user;
    console.log('Found patient by nationalId:', !!patient, 'User:', !!user);
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

  if (!user) {
    console.log('No user found for login attempt');
    throw new CustomError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new CustomError('Account has been deactivated', 401);
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new CustomError('Please verify your email address before logging in. Check your email for verification instructions.', 401);
  }

  // Check password
  console.log('Testing password for user:', user.email);
  console.log('User has password field:', !!user.password);
  const isPasswordValid = await user.comparePassword(password);
  console.log('Password comparison result:', isPasswordValid);
  if (!isPasswordValid) {
    throw new CustomError('Invalid credentials', 401);
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

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new CustomError('Refresh token is required', 400);
  }

  try {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
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

  // Get role-specific profile
  let profile = null;
  
  if (user.role === 'patient') {
    profile = await Patient.findOne({ user: user._id });
  } else if (user.role === 'doctor') {
    profile = await Doctor.findOne({ user: user._id }).populate('hospital');
  } else if (user.role === 'hospital') {
    profile = await Hospital.findOne({ user: user._id });
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

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new CustomError('Please verify your email address before logging in. Check your email for verification instructions.', 401);
  }

  // Generate token
  const token = generateToken(user._id);

  const response: AuthResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token,
      refreshToken: token // Using same token for refresh for now
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


