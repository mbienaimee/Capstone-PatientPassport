import { Request, Response } from 'express';
import { Hospital } from '../models/Hospital';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';
import crypto from 'crypto';

export class HospitalController {
  
  /**
   * Register a new hospital
   */
  public static async registerHospital(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const {
        hospitalId,
        hospitalName,
        fhirEndpoint,
        apiKey
      } = req.body;

      // Check if hospital already exists
      const existingHospital = await Hospital.findOne({
        where: { hospitalId }
      });

      if (existingHospital) {
        res.status(409).json({
          success: false,
          message: 'Hospital already registered'
        });
        return;
      }

      // Generate API key if not provided
      const generatedApiKey = apiKey || crypto.randomBytes(32).toString('hex');

      // Create new hospital
      const hospital = await Hospital.create({
        hospitalId,
        hospitalName,
        fhirEndpoint,
        apiKey: generatedApiKey,
        isActive: true,
        lastSync: new Date()
      });

      logger.info(`Hospital registered: ${hospitalId} - ${hospitalName}`);

      res.status(201).json({
        success: true,
        message: 'Hospital registered successfully',
        data: {
          hospitalId: hospital.hospitalId,
          hospitalName: hospital.hospitalName,
          fhirEndpoint: hospital.fhirEndpoint,
          apiKey: hospital.apiKey,
          isActive: hospital.isActive
        }
      });

    } catch (error) {
      logger.error('Error registering hospital:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all hospitals
   */
  public static async getHospitals(req: Request, res: Response): Promise<void> {
    try {
      const { active } = req.query;
      
      const whereClause = active !== undefined ? { isActive: active === 'true' } : {};

      const hospitals = await Hospital.findAll({
        where: whereClause,
        attributes: ['hospitalId', 'hospitalName', 'fhirEndpoint', 'isActive', 'lastSync', 'createdAt']
      });

      res.json({
        success: true,
        data: hospitals
      });

    } catch (error) {
      logger.error('Error getting hospitals:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get hospital by ID
   */
  public static async getHospitalById(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalId } = req.params;

      const hospital = await Hospital.findOne({
        where: { hospitalId },
        attributes: ['hospitalId', 'hospitalName', 'fhirEndpoint', 'isActive', 'lastSync', 'createdAt']
      });

      if (!hospital) {
        res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
        return;
      }

      res.json({
        success: true,
        data: hospital
      });

    } catch (error) {
      logger.error('Error getting hospital:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update hospital information
   */
  public static async updateHospital(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { hospitalId } = req.params;
      const updateData = req.body;

      const hospital = await Hospital.findOne({
        where: { hospitalId }
      });

      if (!hospital) {
        res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
        return;
      }

      // Update hospital data
      await hospital.update(updateData);

      logger.info(`Hospital updated: ${hospitalId}`);

      res.json({
        success: true,
        message: 'Hospital updated successfully',
        data: {
          hospitalId: hospital.hospitalId,
          hospitalName: hospital.hospitalName,
          isActive: hospital.isActive,
          lastSync: hospital.lastSync
        }
      });

    } catch (error) {
      logger.error('Error updating hospital:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deactivate hospital
   */
  public static async deactivateHospital(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalId } = req.params;

      const hospital = await Hospital.findOne({
        where: { hospitalId }
      });

      if (!hospital) {
        res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
        return;
      }

      await hospital.update({
        isActive: false,
        lastSync: new Date()
      });

      logger.info(`Hospital deactivated: ${hospitalId}`);

      res.json({
        success: true,
        message: 'Hospital deactivated successfully'
      });

    } catch (error) {
      logger.error('Error deactivating hospital:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Regenerate API key
   */
  public static async regenerateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalId } = req.params;

      const hospital = await Hospital.findOne({
        where: { hospitalId }
      });

      if (!hospital) {
        res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
        return;
      }

      const newApiKey = crypto.randomBytes(32).toString('hex');

      await hospital.update({
        apiKey: newApiKey,
        lastSync: new Date()
      });

      logger.info(`API key regenerated for hospital: ${hospitalId}`);

      res.json({
        success: true,
        message: 'API key regenerated successfully',
        data: {
          hospitalId: hospital.hospitalId,
          apiKey: newApiKey
        }
      });

    } catch (error) {
      logger.error('Error regenerating API key:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

