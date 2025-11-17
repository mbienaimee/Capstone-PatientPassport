/**
 * OpenMRS Sync Controller
 * 
 * Endpoints to manage automatic synchronization between OpenMRS and Patient Passport
 */

import { Request, Response, NextFunction } from 'express';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';
import openmrsSyncService from '@/services/openmrsSyncService';
import AuditLog from '@/models/AuditLog';

/**
 * @desc    Initialize sync connections
 * @route   POST /api/openmrs-sync/initialize
 * @access  Admin only
 */
export const initializeSync = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { hospitals } = req.body;

  console.log(`🔄 Initializing OpenMRS sync for ${hospitals?.length || 0} hospitals...`);

  if (!hospitals || !Array.isArray(hospitals) || hospitals.length === 0) {
    throw new CustomError('Please provide an array of hospital configurations', 400);
  }

  // Validate hospital configurations
  for (const hospital of hospitals) {
    if (!hospital.hospitalId || !hospital.host || !hospital.database || !hospital.user) {
      throw new CustomError('Each hospital must have: hospitalId, host, database, user, password', 400);
    }
  }

  await openmrsSyncService.initializeConnections(hospitals);

  // Log the initialization
  await AuditLog.create({
    action: 'openmrs_sync_init',
    performedBy: req.user?.userId || 'System',
    targetModel: 'System',
    changes: {
      hospitalsCount: hospitals.length,
      hospitalIds: hospitals.map((h: any) => h.hospitalId)
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  const response: ApiResponse = {
    success: true,
    message: `Successfully initialized sync connections for ${hospitals.length} hospitals`,
    data: {
      hospitalsConnected: hospitals.length
    }
  };

  res.status(200).json(response);
});

/**
 * @desc    Start automatic synchronization
 * @route   POST /api/openmrs-sync/start
 * @access  Admin only
 */
export const startAutoSync = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { intervalMinutes = 5 } = req.body;

  console.log(`▶️ Starting automatic sync with interval: ${intervalMinutes} minutes`);

  openmrsSyncService.startAutoSync(intervalMinutes);

  await AuditLog.create({
    action: 'openmrs_sync_start',
    performedBy: req.user?.userId || 'System',
    targetModel: 'System',
    changes: {
      intervalMinutes
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  const response: ApiResponse = {
    success: true,
    message: `Automatic sync started with ${intervalMinutes} minute interval`,
    data: {
      intervalMinutes,
      status: 'running'
    }
  };

  res.status(200).json(response);
});

/**
 * @desc    Stop automatic synchronization
 * @route   POST /api/openmrs-sync/stop
 * @access  Admin only
 */
export const stopAutoSync = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  console.log('⏹️ Stopping automatic sync...');

  openmrsSyncService.stopAutoSync();

  await AuditLog.create({
    action: 'openmrs_sync_stop',
    performedBy: req.user?.userId || 'System',
    targetModel: 'System',
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  const response: ApiResponse = {
    success: true,
    message: 'Automatic sync stopped',
    data: {
      status: 'stopped'
    }
  };

  res.status(200).json(response);
});

/**
 * @desc    Trigger manual sync for all hospitals
 * @route   POST /api/openmrs-sync/sync-all
 * @access  Admin only
 * @query   fullHistory=true - Sync ALL historical observations (default: true)
 */
export const syncAllHospitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if full history sync is requested (default: true)
  const fullHistory = req.query.fullHistory !== 'false'; // Default to true unless explicitly set to false
  
  console.log(`🔄 Triggering manual sync for all hospitals... (Full History: ${fullHistory})`);

  // Run sync in background
  openmrsSyncService.syncAllHospitals(fullHistory).catch(error => {
    console.error('Error during manual sync:', error);
  });

  await AuditLog.create({
    action: fullHistory ? 'openmrs_manual_sync_all_full' : 'openmrs_manual_sync_all_incremental',
    performedBy: req.user?.userId || 'System',
    targetModel: 'System',
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  const response: ApiResponse = {
    success: true,
    message: `Manual sync triggered for all hospitals (${fullHistory ? 'FULL HISTORY' : 'INCREMENTAL'} - running in background)`,
    data: {
      status: 'triggered',
      mode: fullHistory ? 'full_history' : 'incremental'
    }
  };

  res.status(200).json(response);
});

/**
 * @desc    Sync specific patient from all hospitals
 * @route   POST /api/openmrs-sync/sync-patient/:nationalId
 * @access  Doctor/Admin
 */
export const syncPatient = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { nationalId } = req.params;

  console.log(`🔄 Syncing patient: ${nationalId}`);

  if (!nationalId) {
    throw new CustomError('National ID is required', 400);
  }

  const result = await openmrsSyncService.syncPatient(nationalId);

  await AuditLog.create({
    action: 'openmrs_patient_sync',
    performedBy: req.user?.userId || 'System',
    targetModel: 'Patient',
    targetId: result.patientId,
    changes: {
      nationalId,
      totalSynced: result.totalSynced,
      hospitals: result.hospitals
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  const response: ApiResponse = {
    success: true,
    message: `Synced ${result.totalSynced} observations for patient ${nationalId}`,
    data: result
  };

  res.status(200).json(response);
});

/**
 * @desc    Get sync status
 * @route   GET /api/openmrs-sync/status
 * @access  Admin only
 */
export const getSyncStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get recent sync logs
  const recentSyncs = await AuditLog.find({
    action: { $in: ['openmrs_auto_sync', 'openmrs_manual_sync_all', 'openmrs_patient_sync'] }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email');

  const response: ApiResponse = {
    success: true,
    message: 'Sync status retrieved successfully',
    data: {
      recentSyncs: recentSyncs.map(log => ({
        action: log.action,
        timestamp: log.createdAt,
        performedBy: log.user,
        details: log.details
      }))
    }
  };

  res.status(200).json(response);
});

export default {
  initializeSync,
  startAutoSync,
  stopAutoSync,
  syncAllHospitals,
  syncPatient,
  getSyncStatus
};
