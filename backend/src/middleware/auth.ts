import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { JWTPayload } from '@/types';
import { CustomError } from './errorHandler';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const isAuthCheck = req.path === '/me' || req.path.endsWith('/me') || req.originalUrl.includes('/auth/me');
      if (isAuthCheck) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
          data: null
        });
      }
      throw new CustomError('Access denied. No token provided.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new CustomError('Token is valid but user no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new CustomError('User account has been deactivated.', 401);
    }

    // Verify role matches actual account type (check Doctor/Patient models)
    // This ensures role is correct even if it was manually changed
    try {
      const Doctor = (await import('@/models/Doctor')).default;
      const Patient = (await import('@/models/Patient')).default;
      
      const doctorRecord = await Doctor.findOne({ user: user._id });
      const patientRecord = await Patient.findOne({ user: user._id });
      
      // If user has a Doctor record but role is not 'doctor', update it
      if (doctorRecord && user.role !== 'doctor') {
        console.log(`⚠️  Role mismatch: User has Doctor record but role is '${user.role}'. Updating to 'doctor'...`);
        user.role = 'doctor';
        await user.save();
        console.log(`✅ User role updated to 'doctor'`);
      }
      // If user has a Patient record but role is not 'patient', update it (unless they also have Doctor record)
      else if (patientRecord && !doctorRecord && user.role !== 'patient') {
        console.log(`⚠️  Role mismatch: User has Patient record but role is '${user.role}'. Updating to 'patient'...`);
        user.role = 'patient';
        await user.save();
        console.log(`✅ User role updated to 'patient'`);
      }
    } catch (error) {
      // Don't fail authentication if role verification fails, just log it
      console.error('Error verifying user role:', error);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError('Invalid token.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError('Token has expired.', 401));
    }
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Access denied. Please authenticate first.', 401));
    }

    // Debug logging
    console.log(`🔐 Authorization check:`);
    console.log(`   User ID: ${req.user._id}`);
    console.log(`   User Email: ${req.user.email}`);
    console.log(`   User Role in DB: ${req.user.role}`);
    console.log(`   Required Roles: ${roles.join(', ')}`);

    // If the role doesn't match, check if user has a Doctor record (for doctor role)
    if (!roles.includes(req.user.role)) {
      // Special case: If trying to access as doctor but role is patient, check if they have a Doctor record
      if (roles.includes('doctor') && req.user.role === 'patient') {
        console.log(`⚠️  Role mismatch detected. Checking if user has Doctor record...`);
        try {
          const Doctor = (await import('@/models/Doctor')).default;
          const doctor = await Doctor.findOne({ user: req.user._id });
          
          if (doctor) {
            console.log(`✅ Found Doctor record for user. Updating user role to 'doctor'...`);
            // Update user role to match their Doctor record
            req.user.role = 'doctor';
            await req.user.save();
            console.log(`✅ User role updated to 'doctor'`);
          } else {
            console.log(`❌ No Doctor record found for user ${req.user._id}`);
            return next(new CustomError(`Access denied. Role '${req.user.role}' is not authorized to access this resource. Please ensure you are logged in with a doctor account.`, 403));
          }
        } catch (error) {
          console.error(`❌ Error checking Doctor record:`, error);
          return next(new CustomError(`Access denied. Role '${req.user.role}' is not authorized to access this resource.`, 403));
        }
      } else {
        return next(new CustomError(`Access denied. Role '${req.user.role}' is not authorized to access this resource.`, 403));
      }
    }

    console.log(`✅ Authorization passed for role: ${req.user.role}`);
    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};








