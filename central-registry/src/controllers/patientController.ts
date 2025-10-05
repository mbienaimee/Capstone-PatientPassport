import { Request, Response } from 'express';
import { PatientRegistry } from '../models/PatientRegistry';
import { Hospital } from '../models/Hospital';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';

export class PatientController {
  
  /**
   * Register a patient with a hospital
   */
  public static async registerPatient(req: Request, res: Response): Promise<void> {
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
        universalId,
        hospitalId,
        localPatientId,
        patientName,
        dateOfBirth,
        gender,
        insuranceNumber
      } = req.body;

      // Check if hospital exists and is active
      const hospital = await Hospital.findOne({
        where: { hospitalId, isActive: true }
      });

      if (!hospital) {
        res.status(404).json({
          success: false,
          message: 'Hospital not found or inactive'
        });
        return;
      }

      // Check if patient already registered with this hospital
      const existingRegistration = await PatientRegistry.findOne({
        where: { universalId, hospitalId }
      });

      if (existingRegistration) {
        res.status(409).json({
          success: false,
          message: 'Patient already registered with this hospital'
        });
        return;
      }

      // Create new patient registration
      const patientRegistry = await PatientRegistry.create({
        universalId,
        hospitalId,
        localPatientId,
        patientName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        insuranceNumber,
        isActive: true,
        lastUpdated: new Date()
      });

      logger.info(`Patient registered: ${universalId} with hospital ${hospitalId}`);

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: {
          id: patientRegistry.id,
          universalId: patientRegistry.universalId,
          hospitalId: patientRegistry.hospitalId,
          localPatientId: patientRegistry.localPatientId
        }
      });

    } catch (error) {
      logger.error('Error registering patient:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Lookup hospitals for a patient by universal ID
   */
  public static async lookupPatientHospitals(req: Request, res: Response): Promise<void> {
    try {
      const { universalId } = req.params;

      const patientRegistrations = await PatientRegistry.findAll({
        where: { universalId, isActive: true },
        include: [{
          model: Hospital,
          as: 'hospital',
          attributes: ['hospitalName', 'fhirEndpoint', 'isActive']
        }]
      });

      if (patientRegistrations.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No hospitals found for this patient'
        });
        return;
      }

      const hospitals = patientRegistrations.map(reg => ({
        hospitalId: reg.hospitalId,
        hospitalName: reg.hospital?.hospitalName,
        localPatientId: reg.localPatientId,
        fhirEndpoint: reg.hospital?.fhirEndpoint,
        lastUpdated: reg.lastUpdated
      }));

      res.json({
        success: true,
        data: {
          universalId,
          hospitals
        }
      });

    } catch (error) {
      logger.error('Error looking up patient hospitals:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Lookup hospitals for a patient by insurance number
   */
  public static async lookupPatientHospitalsByInsurance(req: Request, res: Response): Promise<void> {
    try {
      const { insuranceNumber } = req.params;

      const patientRegistrations = await PatientRegistry.findAll({
        where: { insuranceNumber, isActive: true },
        include: [{
          model: Hospital,
          as: 'hospital',
          attributes: ['hospitalName', 'fhirEndpoint', 'isActive']
        }]
      });

      if (patientRegistrations.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No hospitals found for this insurance number'
        });
        return;
      }

      // Group by universal ID since multiple patients might have same insurance
      const patients = patientRegistrations.reduce((acc, reg) => {
        if (!acc[reg.universalId]) {
          acc[reg.universalId] = {
            universalId: reg.universalId,
            patientName: reg.patientName,
            hospitals: []
          };
        }
        acc[reg.universalId].hospitals.push({
          hospitalId: reg.hospitalId,
          hospitalName: reg.hospital?.hospitalName,
          localPatientId: reg.localPatientId,
          fhirEndpoint: reg.hospital?.fhirEndpoint,
          lastUpdated: reg.lastUpdated
        });
        return acc;
      }, {} as any);

      res.json({
        success: true,
        data: {
          insuranceNumber,
          patients: Object.values(patients)
        }
      });

    } catch (error) {
      logger.error('Error looking up patient hospitals by insurance:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update patient information
   */
  public static async updatePatient(req: Request, res: Response): Promise<void> {
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

      const { universalId, hospitalId } = req.params;
      const updateData = req.body;

      const patientRegistry = await PatientRegistry.findOne({
        where: { universalId, hospitalId, isActive: true }
      });

      if (!patientRegistry) {
        res.status(404).json({
          success: false,
          message: 'Patient registration not found'
        });
        return;
      }

      // Update patient data
      await patientRegistry.update({
        ...updateData,
        lastUpdated: new Date()
      });

      logger.info(`Patient updated: ${universalId} at hospital ${hospitalId}`);

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: {
          universalId: patientRegistry.universalId,
          hospitalId: patientRegistry.hospitalId,
          lastUpdated: patientRegistry.lastUpdated
        }
      });

    } catch (error) {
      logger.error('Error updating patient:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Deactivate patient registration
   */
  public static async deactivatePatient(req: Request, res: Response): Promise<void> {
    try {
      const { universalId, hospitalId } = req.params;

      const patientRegistry = await PatientRegistry.findOne({
        where: { universalId, hospitalId, isActive: true }
      });

      if (!patientRegistry) {
        res.status(404).json({
          success: false,
          message: 'Patient registration not found'
        });
        return;
      }

      await patientRegistry.update({
        isActive: false,
        lastUpdated: new Date()
      });

      logger.info(`Patient deactivated: ${universalId} at hospital ${hospitalId}`);

      res.json({
        success: true,
        message: 'Patient deactivated successfully'
      });

    } catch (error) {
      logger.error('Error deactivating patient:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

