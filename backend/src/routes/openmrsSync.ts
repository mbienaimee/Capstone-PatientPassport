/**
 * OpenMRS Sync Routes
 * 
 * Routes for managing automatic synchronization between OpenMRS and Patient Passport
 */

import express from 'express';
import * as openmrsSyncController from '@/controllers/openmrsSyncController';
import { authenticateToken, authorizeRoles } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);

// Initialize sync connections (Admin only)
router.post(
  '/initialize',
  authorizeRoles('admin'),
  openmrsSyncController.initializeSync
);

// Start automatic synchronization (Admin only)
router.post(
  '/start',
  authorizeRoles('admin'),
  openmrsSyncController.startAutoSync
);

// Stop automatic synchronization (Admin only)
router.post(
  '/stop',
  authorizeRoles('admin'),
  openmrsSyncController.stopAutoSync
);

// Trigger manual sync for all hospitals (Admin only)
router.post(
  '/sync-all',
  authorizeRoles('admin'),
  openmrsSyncController.syncAllHospitals
);

// Sync specific patient (Doctor/Admin)
router.post(
  '/sync-patient/:nationalId',
  authorizeRoles('doctor', 'admin'),
  openmrsSyncController.syncPatient
);

// Get sync status (Admin only)
router.get(
  '/status',
  authorizeRoles('admin'),
  openmrsSyncController.getSyncStatus
);

export default router;
