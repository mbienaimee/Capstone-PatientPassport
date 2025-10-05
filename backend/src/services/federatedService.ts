import axios from 'axios';
import logger from '@/utils/logger';
import { FederatedPatientData, HospitalData } from '@/types';

export class FederatedService {
  private static readonly CENTRAL_REGISTRY_URL = process.env.CENTRAL_REGISTRY_URL || 'http://localhost:3001';
  private static readonly API_KEY = process.env.CENTRAL_REGISTRY_API_KEY || '';

  /**
   * Register patient with central registry
   */
  static async registerPatientWithCentralRegistry(
    universalId: string,
    hospitalId: string,
    localPatientId: string,
    patientName: string,
    dateOfBirth: Date,
    gender: string,
    insuranceNumber?: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.CENTRAL_REGISTRY_URL}/api/patients/register`,
        {
          universalId,
          hospitalId,
          localPatientId,
          patientName,
          dateOfBirth: dateOfBirth.toISOString(),
          gender,
          insuranceNumber
        },
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        logger.info(`Patient registered with central registry: ${universalId}`);
        return true;
      } else {
        logger.error(`Failed to register patient with central registry: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      logger.error('Error registering patient with central registry:', error);
      return false;
    }
  }

  /**
   * Get hospitals with patient records
   */
  static async getHospitalsWithPatientRecords(universalId: string): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.CENTRAL_REGISTRY_URL}/api/patients/lookup/${universalId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success && response.data.data?.hospitals) {
        return response.data.data.hospitals.map((hospital: any) => hospital.hospitalId);
      } else {
        logger.warn(`No hospitals found for universal ID: ${universalId}`);
        return [];
      }
    } catch (error) {
      logger.error('Error getting hospitals with patient records:', error);
      return [];
    }
  }

  /**
   * Get hospitals by insurance number
   */
  static async getHospitalsByInsuranceNumber(insuranceNumber: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.CENTRAL_REGISTRY_URL}/api/patients/lookup-by-insurance/${insuranceNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success && response.data.data?.patients) {
        return response.data.data.patients;
      } else {
        logger.warn(`No patients found for insurance number: ${insuranceNumber}`);
        return [];
      }
    } catch (error) {
      logger.error('Error getting hospitals by insurance number:', error);
      return [];
    }
  }

  /**
   * Retrieve FHIR data from hospital
   */
  static async retrieveFHIRDataFromHospital(
    hospitalId: string,
    universalId: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      // First get hospital details from central registry
      const hospitalResponse = await axios.get(
        `${this.CENTRAL_REGISTRY_URL}/api/hospitals/${hospitalId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!hospitalResponse.data.success) {
        logger.error(`Hospital not found: ${hospitalId}`);
        return null;
      }

      const hospital = hospitalResponse.data.data;
      const fhirEndpoint = hospital.fhirEndpoint;

      // Retrieve FHIR patient data
      const fhirResponse = await axios.get(
        `${fhirEndpoint}/Patient?identifier=${universalId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/fhir+json'
          },
          timeout: 15000
        }
      );

      if (fhirResponse.data && fhirResponse.data.entry && fhirResponse.data.entry.length > 0) {
        logger.info(`FHIR data retrieved for patient ${universalId} from hospital ${hospitalId}`);
        return JSON.stringify(fhirResponse.data);
      } else {
        logger.warn(`No FHIR data found for patient ${universalId} at hospital ${hospitalId}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error retrieving FHIR data from hospital ${hospitalId}:`, error);
      return null;
    }
  }

  /**
   * Retrieve federated patient data
   */
  static async retrieveFederatedPatientData(
    universalId: string,
    accessToken: string
  ): Promise<FederatedPatientData | null> {
    try {
      // Get hospitals with patient records
      const hospitalIds = await this.getHospitalsWithPatientRecords(universalId);
      
      if (hospitalIds.length === 0) {
        logger.warn(`No hospitals found for universal ID: ${universalId}`);
        return null;
      }

      const hospitalData: HospitalData[] = [];

      // Retrieve data from each hospital
      for (const hospitalId of hospitalIds) {
        try {
          const fhirData = await this.retrieveFHIRDataFromHospital(hospitalId, universalId, accessToken);
          
          if (fhirData) {
            hospitalData.push({
              hospitalId,
              hospitalName: `Hospital ${hospitalId}`, // This would be retrieved from central registry
              fhirData,
              lastSync: new Date(),
              availableResources: ['Patient', 'Observation', 'Condition', 'MedicationStatement']
            });
          }
        } catch (error) {
          logger.error(`Error retrieving data from hospital ${hospitalId}:`, error);
          // Continue with other hospitals even if one fails
        }
      }

      if (hospitalData.length === 0) {
        logger.warn(`No data retrieved for universal ID: ${universalId}`);
        return null;
      }

      // Create federated patient data
      const federatedData: FederatedPatientData = {
        universalId,
        patientName: 'Unknown', // This would be extracted from FHIR data
        gender: 'Unknown', // This would be extracted from FHIR data
        birthdate: new Date(), // This would be extracted from FHIR data
        hospitalData,
        lastUpdated: new Date()
      };

      logger.info(`Federated data retrieved for universal ID: ${universalId} from ${hospitalData.length} hospitals`);
      return federatedData;

    } catch (error) {
      logger.error('Error retrieving federated patient data:', error);
      return null;
    }
  }

  /**
   * Register hospital with central registry
   */
  static async registerHospitalWithCentralRegistry(
    hospitalId: string,
    hospitalName: string,
    fhirEndpoint: string,
    apiKey?: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.CENTRAL_REGISTRY_URL}/api/hospitals/register`,
        {
          hospitalId,
          hospitalName,
          fhirEndpoint,
          apiKey
        },
        {
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        logger.info(`Hospital registered with central registry: ${hospitalId}`);
        return true;
      } else {
        logger.error(`Failed to register hospital with central registry: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      logger.error('Error registering hospital with central registry:', error);
      return false;
    }
  }
}

