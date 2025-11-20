import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/types';

// Custom error class
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (error: any): CustomError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists.`;
  return new CustomError(message, 400);
};

// Handle MongoDB validation errors
const handleValidationError = (error: any): CustomError => {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new CustomError(message, 400);
};

// Handle MongoDB cast errors
const handleCastError = (error: any): CustomError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new CustomError(message, 400);
};

// Handle JWT errors
const handleJWTError = (): CustomError => {
  return new CustomError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = (): CustomError => {
  return new CustomError('Your token has expired. Please log in again.', 401);
};

// Global error handler
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let err = { ...error };
  err.message = error.message;

  const isAuthCheck = req.originalUrl.includes('/auth/me') || req.path === '/me' || req.path.endsWith('/me');
  const isExpected401 = err.statusCode === 401 && isAuthCheck;

  // Check if this is a USSD route - USSD requires plain text responses, not JSON
  const isUSSDRoute = req.originalUrl.includes('/ussd/') || req.path.includes('/ussd/');

  if (!isExpected401) {
    console.error('Error:', error);
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    err = handleDuplicateKeyError(error);
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    err = handleValidationError(error);
  }

  // MongoDB cast error
  if (error.name === 'CastError') {
    err = handleCastError(error);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    err = handleJWTError();
  }

  if (error.name === 'TokenExpiredError') {
    err = handleJWTExpiredError();
  }

  // Default error
  if (!err.statusCode) {
    err.statusCode = 500;
    err.message = 'Something went wrong!';
  }

  // For USSD routes, return plain text instead of JSON
  if (isUSSDRoute) {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(`END An error occurred: ${err.message}`);
    return;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};











































