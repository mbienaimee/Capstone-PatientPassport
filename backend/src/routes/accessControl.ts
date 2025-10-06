import express from 'express';
import { authenticate } from '@/middleware/auth';
import { handleValidationErrors } from '@/middleware/validation';
import { body, param } from 'express-validator';
import patientPassportAccessService from '@/services/patientPassportAccessService';
import { CustomError } from '@/middleware/errorHandler';

const router = express.Router();

// Create access request (Doctor)
router.post('/request', 
  authenticate,
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('hospitalId').isMongoId().withMessage('Valid hospital ID is required'),
    body('requestType').isIn(['view', 'edit', 'emergency']).withMessage('Valid request type is required'),
    body('reason').isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
    body('requestedData').isArray({ min: 1 }).withMessage('At least one data type must be requested'),
    body('requestedData.*').isIn(['medical_history', 'medications', 'allergies', 'lab_results', 'imaging', 'emergency_contacts', 'insurance']).withMessage('Invalid data type'),
    body('expiresInHours').optional().isInt({ min: 1, max: 168 }).withMessage('Expiration must be between 1 and 168 hours')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const requestData = {
        ...req.body,
        doctorId: req.user.id
      };

      const accessRequest = await patientPassportAccessService.createAccessRequest(requestData);
      
      res.status(201).json({
        success: true,
        message: 'Access request created successfully',
        data: accessRequest
      });
    } catch (error) {
      console.error('Error creating access request:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create access request'
      });
    }
  }
);

// Check if doctor has access to patient
router.get('/check-access/:patientId',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { patientId } = req.params;
      const doctorId = req.user.id;
      
      // Check if there's an approved access request
      const accessRequest = await patientPassportAccessService.getAccessRequestByDoctorAndPatient(doctorId, patientId);
      
      const hasAccess = accessRequest && accessRequest.status === 'approved' && !accessRequest.isExpired();
      
      res.json({
        success: true,
        data: {
          hasAccess,
          accessRequest: hasAccess ? accessRequest : null
        }
      });
    } catch (error) {
      console.error('Error checking access:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to check access'
      });
    }
  }
);

// Get pending requests for patient
router.get('/patient/pending',
  authenticate,
  async (req: any, res: any) => {
    try {
      const requests = await patientPassportAccessService.getPendingRequests(req.user.id);
      
      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch pending requests'
      });
    }
  }
);

// Get requests by doctor
router.get('/doctor/requests',
  authenticate,
  async (req: any, res: any) => {
    try {
      const requests = await patientPassportAccessService.getRequestsByDoctor(req.user.id);
      
      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('Error fetching doctor requests:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch requests'
      });
    }
  }
);

// Patient responds to access request
router.post('/respond/:requestId',
  authenticate,
  [
    param('requestId').isMongoId().withMessage('Valid request ID is required'),
    body('status').isIn(['approved', 'denied']).withMessage('Status must be approved or denied'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { requestId } = req.params;
      const { status, reason } = req.body;

      const accessRequest = await patientPassportAccessService.respondToRequest(
        requestId,
        req.user.id,
        { requestId, status, reason }
      );
      
      res.json({
        success: true,
        message: `Access request ${status} successfully`,
        data: accessRequest
      });
    } catch (error) {
      console.error('Error responding to access request:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to respond to access request'
      });
    }
  }
);

// Get specific access request
router.get('/:requestId',
  authenticate,
  [
    param('requestId').isMongoId().withMessage('Valid request ID is required')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { requestId } = req.params;
      const accessRequest = await patientPassportAccessService.getAccessRequest(requestId, req.user.id);
      
      res.json({
        success: true,
        data: accessRequest
      });
    } catch (error) {
      console.error('Error fetching access request:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch access request'
      });
    }
  }
);

// Emergency access (bypass patient approval for urgent cases)
router.post('/emergency',
  authenticate,
  [
    body('patientId').isMongoId().withMessage('Valid patient ID is required'),
    body('hospitalId').isMongoId().withMessage('Valid hospital ID is required'),
    body('reason').isLength({ min: 20, max: 500 }).withMessage('Emergency reason must be between 20 and 500 characters'),
    body('requestedData').isArray({ min: 1 }).withMessage('At least one data type must be requested')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      // Check if user has emergency access permissions
      if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        throw new CustomError('Insufficient permissions for emergency access', 403);
      }

      const requestData = {
        ...req.body,
        doctorId: req.user.id,
        requestType: 'emergency' as const,
        expiresInHours: 2 // Emergency access expires in 2 hours
      };

      const accessRequest = await patientPassportAccessService.createAccessRequest(requestData);
      
      // Auto-approve emergency requests
      await patientPassportAccessService.respondToRequest(
        accessRequest._id.toString(),
        accessRequest.patientId.toString(),
        { 
          requestId: accessRequest._id.toString(), 
          status: 'approved', 
          reason: 'Emergency access granted automatically' 
        }
      );
      
      res.status(201).json({
        success: true,
        message: 'Emergency access granted',
        data: accessRequest
      });
    } catch (error) {
      console.error('Error creating emergency access:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create emergency access'
      });
    }
  }
);

export default router;
