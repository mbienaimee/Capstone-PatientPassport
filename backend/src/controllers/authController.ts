import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Hospital from '@/models/Hospital';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '@/types';

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
  const { name, email, password, role, nationalId, dateOfBirth, contactNumber, address, hospitalName, adminContact, licenseNumber, specialization }: RegisterRequest = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Create role-specific profile
  if (role === 'patient' && nationalId && dateOfBirth && contactNumber && address) {
    await Patient.create({
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
  } else if (role === 'hospital' && hospitalName && adminContact && licenseNumber) {
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
  }

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const response: AuthResponse = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      token,
      refreshToken
    }
  };

  res.status(201).json(response);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, nationalId, hospitalName, password }: LoginRequest = req.body;

  let user: any = null;

  // Find user by different identifiers
  if (email) {
    user = await User.findOne({ email }).select('+password');
  } else if (nationalId) {
    const patient = await Patient.findOne({ nationalId }).populate('user', '+password');
    user = patient?.user;
  } else if (hospitalName) {
    const hospital = await Hospital.findOne({ name: hospitalName }).populate('user', '+password');
    user = hospital?.user;
  }

  if (!user) {
    throw new CustomError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new CustomError('Account has been deactivated', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
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







