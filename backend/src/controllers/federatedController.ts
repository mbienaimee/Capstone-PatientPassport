import { Request, Response } from 'express';
import { FederatedService } from '../services/federatedService';
import { AuditService } from '../services/auditService';
import { FHIRService } from '../services/fhirService';
import logger from '../utils/logger';
import { validationResult } from 'express-validator';

export class FederatedController {
  
  /**
   * Get federated patient data
   */
  public static async getFederatedPatientData(req: Request, res: Response): Promise<void> {
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

      const { universalId } = req.params;
      const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

      // Log access
      await AuditService.logPatientDataAccess(
        req.user?.userId || 'unknown',
        universalId,
        'consent',
        'view',
        'Federated patient data access',
        req
      );

      const federatedData = await FederatedService.retrieveFederatedPatientData(
        universalId,
        accessToken
      );

      if (!federatedData) {
        res.status(404).json({
          success: false,
          message: 'No federated data found for this patient'
        });
        return;
      }

      res.json({
        success: true,
        data: federatedData
      });

    } catch (error) {
      logger.error('Error getting federated patient data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate consent token
   */
  public static async generateConsentToken(req: Request, res: Response): Promise<void> {
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

      const { universalId, duration, purpose } = req.body;

      // Generate consent token (this would integrate with the patient passport service)
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + (duration || 60) * 60 * 1000);

      // Log token generation
      await AuditService.logPatientDataAccess(
        req.user?.userId || 'unknown',
        universalId,
        'consent',
        'create',
        `Consent token generated: ${purpose}`,
        req
      );

      res.json({
        success: true,
        data: {
          token,
          expiresAt,
          purpose,
          duration: duration || 60
        }
      });

    } catch (error) {
      logger.error('Error generating consent token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify consent token
   */
  public static async verifyConsentToken(req: Request, res: Response): Promise<void> {
    try {
      const { universalId, token } = req.body;

      // This would verify the token with the patient passport service
      // For now, return a mock response
      const isValid = token && token.length === 6 && /^\d+$/.test(token);

      if (isValid) {
        res.json({
          success: true,
          message: 'Token is valid',
          data: {
            universalId,
            token,
            isValid: true
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

    } catch (error) {
      logger.error('Error verifying consent token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get audit logs for patient
   */
  public static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      const auditLogs = await AuditService.getAuditLogsForPatient(
        patientId,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: auditLogs
      });

    } catch (error) {
      logger.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get emergency override logs
   */
  public static async getEmergencyOverrideLogs(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, skip = 0 } = req.query;

      const emergencyOverrides = await AuditService.getEmergencyOverrideLogs(
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.json({
        success: true,
        data: emergencyOverrides
      });

    } catch (error) {
      logger.error('Error getting emergency override logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Perform emergency override
   */
  public static async performEmergencyOverride(req: Request, res: Response): Promise<void> {
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

      const { patientId, justification } = req.body;

      // Check if user has emergency override role
      if (!req.user?.roles?.includes('emergency_doctor') && !req.user?.roles?.includes('emergency_nurse')) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions for emergency override'
        });
        return;
      }

      const overrideId = await AuditService.logEmergencyOverride(
        req.user?.userId || 'unknown',
        patientId,
        justification,
        req
      );

      res.json({
        success: true,
        message: 'Emergency override logged successfully',
        data: {
          overrideId,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('Error performing emergency override:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get FHIR data from hospital
   */
  public static async getFHIRData(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalId, patientId } = req.params;
      const { resourceType, dateFrom, dateTo } = req.query;
      const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

      // Get hospital FHIR endpoint from central registry
      const hospitals = await FederatedService.getHospitalsWithPatientRecords(patientId);
      
      if (!hospitals.includes(hospitalId)) {
        res.status(404).json({
          success: false,
          message: 'Hospital not found for this patient'
        });
        return;
      }

      // This would get the actual FHIR endpoint from central registry
      const fhirEndpoint = `https://${hospitalId}.hospital.com/fhir`;

      let fhirData;
      switch (resourceType) {
        case 'Patient':
          fhirData = await FHIRService.getPatient(fhirEndpoint, patientId, accessToken);
          break;
        case 'Observation':
          fhirData = await FHIRService.getObservations(fhirEndpoint, patientId, accessToken, undefined, dateFrom as string, dateTo as string);
          break;
        case 'Condition':
          fhirData = await FHIRService.getConditions(fhirEndpoint, patientId, accessToken);
          break;
        case 'MedicationStatement':
          fhirData = await FHIRService.getMedicationStatements(fhirEndpoint, patientId, accessToken);
          break;
        case 'DiagnosticReport':
          fhirData = await FHIRService.getDiagnosticReports(fhirEndpoint, patientId, accessToken, dateFrom as string, dateTo as string);
          break;
        case 'Encounter':
          fhirData = await FHIRService.getEncounters(fhirEndpoint, patientId, accessToken, undefined, dateFrom as string, dateTo as string);
          break;
        default:
          fhirData = await FHIRService.getComprehensivePatientData(fhirEndpoint, patientId, accessToken, {
            dateFrom: dateFrom as string,
            dateTo: dateTo as string
          });
      }

      // Log FHIR data access
      await AuditService.logPatientDataAccess(
        req.user?.userId || 'unknown',
        patientId,
        'regular',
        'view',
        `FHIR ${resourceType} data accessed from hospital ${hospitalId}`,
        req
      );

      res.json({
        success: true,
        data: fhirData
      });

    } catch (error) {
      logger.error('Error getting FHIR data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Register hospital with central registry
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

      const { hospitalId, hospitalName, fhirEndpoint, apiKey } = req.body;

      const success = await FederatedService.registerHospitalWithCentralRegistry(
        hospitalId,
        hospitalName,
        fhirEndpoint,
        apiKey
      );

      if (success) {
        res.json({
          success: true,
          message: 'Hospital registered successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to register hospital'
        });
      }

    } catch (error) {
      logger.error('Error registering hospital:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

