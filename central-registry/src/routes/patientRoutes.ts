import { Router } from 'express';
import { body, param } from 'express-validator';
import { PatientController } from '../controllers/patientController';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all routes
router.use(rateLimiter);

// Apply authentication to all routes
router.use(authMiddleware);

// Validation rules
const registerPatientValidation = [
  body('universalId')
    .isString()
    .isLength({ min: 10, max: 20 })
    .withMessage('Universal ID must be between 10 and 20 characters'),
  body('hospitalId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Hospital ID is required'),
  body('localPatientId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Local Patient ID is required'),
  body('patientName')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Patient name is required'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .isIn(['M', 'F', 'O'])
    .withMessage('Gender must be M, F, or O'),
  body('insuranceNumber')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Insurance number must be less than 50 characters')
];

const updatePatientValidation = [
  body('patientName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Patient name must be less than 255 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional()
    .isIn(['M', 'F', 'O'])
    .withMessage('Gender must be M, F, or O'),
  body('insuranceNumber')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Insurance number must be less than 50 characters')
];

const paramValidation = [
  param('universalId')
    .isString()
    .isLength({ min: 10, max: 20 })
    .withMessage('Invalid universal ID format'),
  param('hospitalId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid hospital ID format')
];

// Routes
router.post('/register', registerPatientValidation, PatientController.registerPatient);

router.get('/lookup/:universalId', PatientController.lookupPatientHospitals);

router.get('/lookup-by-insurance/:insuranceNumber', PatientController.lookupPatientHospitalsByInsurance);

router.put('/:universalId/:hospitalId', 
  [...paramValidation, ...updatePatientValidation], 
  PatientController.updatePatient
);

router.delete('/:universalId/:hospitalId', 
  paramValidation, 
  PatientController.deactivatePatient
);

export default router;

