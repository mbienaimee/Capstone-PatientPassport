/**
 * OpenMRS Sync Routes
 * 
 * Routes for managing automatic synchronization between OpenMRS and Patient Passport
 */

import express from 'express';
import * as openmrsSyncController from '@/controllers/openmrsSyncController';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);

// Initialize sync connections (Admin only)
router.post(
  '/initialize',
  authorize('admin'),
  openmrsSyncController.initializeSync
);

// Start automatic synchronization (Admin only)
router.post(
  '/start',
  authorize('admin'),
  openmrsSyncController.startAutoSync
);

// Stop automatic synchronization (Admin only)
router.post(
  '/stop',
  authorize('admin'),
  openmrsSyncController.stopAutoSync
);

// Trigger manual sync for all hospitals (Admin only)
router.post(
  '/sync-all',
  authorize('admin'),
  openmrsSyncController.syncAllHospitals
);

// Sync specific patient (Doctor/Admin)
router.post(
  '/sync-patient/:nationalId',
  authorize('doctor', 'admin'),
  openmrsSyncController.syncPatient
);

// Get sync status (Admin only)
router.get(
  '/status',
  authorize('admin'),
  openmrsSyncController.getSyncStatus
);

export default router;
