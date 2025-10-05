import { Router } from 'express';
import { body, param } from 'express-validator';
import { HospitalController } from '../controllers/hospitalController';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all routes
router.use(rateLimiter);

// Apply authentication to all routes
router.use(authMiddleware);

// Validation rules
const registerHospitalValidation = [
  body('hospitalId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Hospital ID is required'),
  body('hospitalName')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Hospital name is required'),
  body('fhirEndpoint')
    .isURL()
    .withMessage('FHIR endpoint must be a valid URL'),
  body('apiKey')
    .optional()
    .isString()
    .isLength({ min: 32, max: 64 })
    .withMessage('API key must be between 32 and 64 characters')
];

const updateHospitalValidation = [
  body('hospitalName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Hospital name must be less than 255 characters'),
  body('fhirEndpoint')
    .optional()
    .isURL()
    .withMessage('FHIR endpoint must be a valid URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const paramValidation = [
  param('hospitalId')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid hospital ID format')
];

// Routes
router.post('/register', registerHospitalValidation, HospitalController.registerHospital);

router.get('/', HospitalController.getHospitals);

router.get('/:hospitalId', paramValidation, HospitalController.getHospitalById);

router.put('/:hospitalId', 
  [...paramValidation, ...updateHospitalValidation], 
  HospitalController.updateHospital
);

router.delete('/:hospitalId', paramValidation, HospitalController.deactivateHospital);

router.post('/:hospitalId/regenerate-api-key', paramValidation, HospitalController.regenerateApiKey);

export default router;

