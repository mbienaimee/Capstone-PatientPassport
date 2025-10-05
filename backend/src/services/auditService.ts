import AuditLog from '@/models/AuditLog';
import EmergencyOverride from '@/models/EmergencyOverride';
import logger from '@/utils/logger';
import { Request } from 'express';

export class AuditService {
  /**
   * Log patient data access
   */
  static async logPatientDataAccess(
    userId: string,
    patientId: string,
    accessType: 'regular' | 'emergency' | 'consent',
    action: 'view' | 'create' | 'update' | 'delete',
    details: string,
    req?: Request
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        user: userId,
        patient: patientId,
        accessType,
        action,
        details,
        accessTime: new Date(),
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      });

      await auditLog.save();
      logger.info(`Audit log created: ${action} ${accessType} access for patient ${patientId} by user ${userId}`);
    } catch (error) {
      logger.error('Error creating audit log:', error);
    }
  }

  /**
   * Log emergency override
   */
  static async logEmergencyOverride(
    userId: string,
    patientId: string,
    justification: string,
    req?: Request
  ): Promise<string> {
    try {
      const emergencyOverride = new EmergencyOverride({
        user: userId,
        patient: patientId,
        justification,
        accessTime: new Date(),
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      });

      const savedOverride = await emergencyOverride.save();
      
      // Also log as audit entry
      await this.logPatientDataAccess(
        userId,
        patientId,
        'emergency',
        'view',
        `Emergency override: ${justification}`,
        req
      );

      logger.info(`Emergency override logged: ${savedOverride._id} for patient ${patientId} by user ${userId}`);
      return savedOverride._id;
    } catch (error) {
      logger.error('Error logging emergency override:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a patient
   */
  static async getAuditLogsForPatient(
    patientId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<any[]> {
    try {
      const auditLogs = await AuditLog.find({ patient: patientId })
        .populate('user', 'name email role')
        .populate('patient', 'nationalId')
        .sort({ accessTime: -1 })
        .limit(limit)
        .skip(skip);

      return auditLogs;
    } catch (error) {
      logger.error('Error getting audit logs for patient:', error);
      return [];
    }
  }

  /**
   * Get emergency override logs
   */
  static async getEmergencyOverrideLogs(
    limit: number = 50,
    skip: number = 0
  ): Promise<any[]> {
    try {
      const emergencyOverrides = await EmergencyOverride.find()
        .populate('user', 'name email role')
        .populate('patient', 'nationalId')
        .sort({ accessTime: -1 })
        .limit(limit)
        .skip(skip);

      return emergencyOverrides;
    } catch (error) {
      logger.error('Error getting emergency override logs:', error);
      return [];
    }
  }

  /**
   * Get emergency overrides for a specific patient
   */
  static async getEmergencyOverridesForPatient(
    patientId: string,
    limit: number = 20,
    skip: number = 0
  ): Promise<any[]> {
    try {
      const emergencyOverrides = await EmergencyOverride.find({ patient: patientId })
        .populate('user', 'name email role')
        .populate('patient', 'nationalId')
        .sort({ accessTime: -1 })
        .limit(limit)
        .skip(skip);

      return emergencyOverrides;
    } catch (error) {
      logger.error('Error getting emergency overrides for patient:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.accessTime = {};
        if (startDate) matchStage.accessTime.$gte = startDate;
        if (endDate) matchStage.accessTime.$lte = endDate;
      }

      const stats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$accessType',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            uniquePatients: { $addToSet: '$patient' }
          }
        },
        {
          $project: {
            accessType: '$_id',
            count: 1,
            uniqueUserCount: { $size: '$uniqueUsers' },
            uniquePatientCount: { $size: '$uniquePatients' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error getting audit statistics:', error);
      return [];
    }
  }

  /**
   * Get user access summary
   */
  static async getUserAccessSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const matchStage: any = { user: userId };
      if (startDate || endDate) {
        matchStage.accessTime = {};
        if (startDate) matchStage.accessTime.$gte = startDate;
        if (endDate) matchStage.accessTime.$lte = endDate;
      }

      const summary = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalAccess: { $sum: 1 },
            emergencyAccess: {
              $sum: { $cond: [{ $eq: ['$accessType', 'emergency'] }, 1, 0] }
            },
            uniquePatients: { $addToSet: '$patient' },
            lastAccess: { $max: '$accessTime' }
          }
        },
        {
          $project: {
            totalAccess: 1,
            emergencyAccess: 1,
            uniquePatientCount: { $size: '$uniquePatients' },
            lastAccess: 1
          }
        }
      ]);

      return summary[0] || {
        totalAccess: 0,
        emergencyAccess: 0,
        uniquePatientCount: 0,
        lastAccess: null
      };
    } catch (error) {
      logger.error('Error getting user access summary:', error);
      return {
        totalAccess: 0,
        emergencyAccess: 0,
        uniquePatientCount: 0,
        lastAccess: null
      };
    }
  }
}

