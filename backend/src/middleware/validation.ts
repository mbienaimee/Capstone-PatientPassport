import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CustomError } from './errorHandler';

// Validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => 
      `${error.type === 'field' ? error.path : 'unknown'}: ${error.msg}`
    ).join(', ');
    
    throw new CustomError(`Validation failed: ${errorMessages}`, 400);
  }
  
  next();
};

// User registration validation
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  // Password confirmation validation moved to controller
  
  body('role')
    .isIn(['patient', 'doctor', 'admin', 'hospital'])
    .withMessage('Role must be one of: patient, doctor, admin, hospital'),
  
  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body()
    .custom((body) => {
      const hasEmail = body.email;
      const hasNationalId = body.nationalId;
      const hasHospitalName = body.hospitalName;
      
      if (!hasEmail && !hasNationalId && !hasHospitalName) {
        throw new Error('At least one identifier (email, nationalId, or hospitalName) is required');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Patient validation
export const validatePatient = [
  body('nationalId')
    .isLength({ min: 11, max: 16 })
    .withMessage('National ID must be between 11 and 16 digits')
    .isNumeric()
    .withMessage('National ID must contain only numbers'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) {
        throw new Error('Date of birth must be in the past');
      }
      return true;
    }),
  
  body('contactNumber')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('emergencyContact.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact name must be between 2 and 50 characters'),
  
  body('emergencyContact.relationship')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Emergency contact relationship must be between 2 and 20 characters'),
  
  body('emergencyContact.phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid emergency contact phone number'),
  
  body('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-'),
  
  handleValidationErrors
];

// Hospital validation
export const validateHospital = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital name must be between 2 and 100 characters'),
  
  body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('contact')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid contact number'),
  
  body('licenseNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  
  body('adminContact')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid admin contact email'),
  
  handleValidationErrors
];

// Doctor validation
export const validateDoctor = [
  body('licenseNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('License number must be between 5 and 20 characters'),
  
  body('specialization')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Specialization must be between 2 and 50 characters'),
  
  body('hospital')
    .isMongoId()
    .withMessage('Please provide a valid hospital ID'),
  
  handleValidationErrors
];

// Medical condition validation
export const validateMedicalCondition = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Condition name must be between 2 and 100 characters'),
  
  body('details')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Details must be between 10 and 1000 characters'),
  
  body('diagnosed')
    .isISO8601()
    .withMessage('Diagnosis date must be a valid date')
    .custom((value) => {
      const diagnosisDate = new Date(value);
      const today = new Date();
      if (diagnosisDate > today) {
        throw new Error('Diagnosis date cannot be in the future');
      }
      return true;
    }),
  
  body('status')
    .isIn(['active', 'resolved', 'chronic'])
    .withMessage('Status must be one of: active, resolved, chronic'),
  
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  
  handleValidationErrors
];

// Medication validation
export const validateMedication = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medication name must be between 2 and 100 characters'),
  
  body('dosage')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Dosage must be between 1 and 50 characters'),
  
  body('frequency')
    .isIn([
      'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
      'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
      'As needed', 'Before meals', 'After meals', 'At bedtime', 'Weekly', 'Monthly'
    ])
    .withMessage('Invalid frequency value'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('status')
    .isIn(['active', 'completed', 'discontinued'])
    .withMessage('Status must be one of: active, completed, discontinued'),
  
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  
  handleValidationErrors
];

// Test result validation
export const validateTestResult = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Test name must be between 2 and 100 characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Test date must be a valid date')
    .custom((value) => {
      const testDate = new Date(value);
      const today = new Date();
      if (testDate > today) {
        throw new Error('Test date cannot be in the future');
      }
      return true;
    }),
  
  body('status')
    .isIn(['normal', 'critical', 'abnormal'])
    .withMessage('Status must be one of: normal, critical, abnormal'),
  
  body('findings')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Findings must be between 10 and 2000 characters'),
  
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  
  body('hospital')
    .isMongoId()
    .withMessage('Please provide a valid hospital ID'),
  
  handleValidationErrors
];

// Hospital visit validation
export const validateHospitalVisit = [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Visit reason must be between 5 and 200 characters'),
  
  body('date')
    .isISO8601()
    .withMessage('Visit date must be a valid date')
    .custom((value) => {
      const visitDate = new Date(value);
      const today = new Date();
      if (visitDate > today) {
        throw new Error('Visit date cannot be in the future');
      }
      return true;
    }),
  
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date')
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date(req.body.date)) {
        throw new Error('Follow-up date must be after visit date');
      }
      return true;
    }),
  
  body('patient')
    .isMongoId()
    .withMessage('Please provide a valid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  
  body('hospital')
    .isMongoId()
    .withMessage('Please provide a valid hospital ID'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = (paramName: string) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID format`),
  
  handleValidationErrors
];

// Search query validation
export const validateSearchQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  
  handleValidationErrors
];








