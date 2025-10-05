import axios from 'axios';
import logger from '@/utils/logger';

export class FHIRService {
  private static readonly FHIR_VERSION = 'R4';
  private static readonly DEFAULT_TIMEOUT = 15000;

  /**
   * Retrieve FHIR Patient resource
   */
  static async getPatient(fhirEndpoint: string, patientId: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${fhirEndpoint}/Patient/${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
            'Content-Type': 'application/fhir+json'
          },
          timeout: this.DEFAULT_TIMEOUT
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Error retrieving FHIR Patient resource: ${error}`);
      throw error;
    }
  }

  /**
   * Search for patients by identifier
   */
  static async searchPatientsByIdentifier(
    fhirEndpoint: string,
    identifier: string,
    accessToken: string
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${fhirEndpoint}/Patient?identifier=${identifier}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
            'Content-Type': 'application/fhir+json'
          },
          timeout: this.DEFAULT_TIMEOUT
        }
      );

      if (response.data && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }

      return [];
    } catch (error) {
      logger.error(`Error searching FHIR patients by identifier: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve FHIR Observations for a patient
   */
  static async getObservations(
    fhirEndpoint: string,
    patientId: string,
    accessToken: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    try {
      let url = `${fhirEndpoint}/Observation?patient=${patientId}`;
      
      if (category) {
        url += `&category=${category}`;
      }
      if (dateFrom) {
        url += `&date=ge${dateFrom}`;
      }
      if (dateTo) {
        url += `&date=le${dateTo}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
          'Content-Type': 'application/fhir+json'
        },
        timeout: this.DEFAULT_TIMEOUT
      });

      if (response.data && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }

      return [];
    } catch (error) {
      logger.error(`Error retrieving FHIR Observations: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve FHIR Conditions for a patient
   */
  static async getConditions(
    fhirEndpoint: string,
    patientId: string,
    accessToken: string,
    clinicalStatus?: string
  ): Promise<any[]> {
    try {
      let url = `${fhirEndpoint}/Condition?patient=${patientId}`;
      
      if (clinicalStatus) {
        url += `&clinical-status=${clinicalStatus}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
          'Content-Type': 'application/fhir+json'
        },
        timeout: this.DEFAULT_TIMEOUT
      });

      if (response.data && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }

      return [];
    } catch (error) {
      logger.error(`Error retrieving FHIR Conditions: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve FHIR MedicationStatements for a patient
   */
  static async getMedicationStatements(
    fhirEndpoint: string,
    patientId: string,
    accessToken: string,
    status?: string
  ): Promise<any[]> {
    try {
      let url = `${fhirEndpoint}/MedicationStatement?patient=${patientId}`;
      
      if (status) {
        url += `&status=${status}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
          'Content-Type': 'application/fhir+json'
        },
        timeout: this.DEFAULT_TIMEOUT
      });

      if (response.data && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }

      return [];
    } catch (error) {
      logger.error(`Error retrieving FHIR MedicationStatements: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve FHIR DiagnosticReports for a patient
   */
  static async getDiagnosticReports(
    fhirEndpoint: string,
    patientId: string,
    accessToken: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    try {
      let url = `${fhirEndpoint}/DiagnosticReport?patient=${patientId}`;
      
      if (dateFrom) {
        url += `&date=ge${dateFrom}`;
      }
      if (dateTo) {
        url += `&date=le${dateTo}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
          'Content-Type': 'application/fhir+json'
        },
        timeout: this.DEFAULT_TIMEOUT
      });

      if (response.data && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }

      return [];
    } catch (error) {
      logger.error(`Error retrieving FHIR DiagnosticReports: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve FHIR Encounters for a patient
   */
  static async getEncounters(
    fhirEndpoint: string,
    patientId: string,
    accessToken: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    try {
      let url = `${fhirEndpoint}/Encounter?patient=${patientId}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      if (dateFrom) {
        url += `&date=ge${dateFrom}`;
      }
      if (dateTo) {
        url += `&date=le${dateTo}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`,
          'Content-Type': 'application/fhir+json'
        },
        timeout: this.DEFAULT_TIMEOUT
      });

      if (response.data && response.data.entry) {
        return response.data.entry.map((entry: any) => entry.resource);
      }

      return [];
    } catch (error) {
      logger.error(`Error retrieving FHIR Encounters: ${error}`);
      throw error;
    }
  }

  /**
   * Get comprehensive patient data from FHIR
   */
  static async getComprehensivePatientData(
    fhirEndpoint: string,
    patientId: string,
    accessToken: string,
    options: {
      includeObservations?: boolean;
      includeConditions?: boolean;
      includeMedications?: boolean;
      includeDiagnosticReports?: boolean;
      includeEncounters?: boolean;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<any> {
    try {
      const {
        includeObservations = true,
        includeConditions = true,
        includeMedications = true,
        includeDiagnosticReports = true,
        includeEncounters = true,
        dateFrom,
        dateTo
      } = options;

      // Get patient basic info
      const patient = await this.getPatient(fhirEndpoint, patientId, accessToken);

      const result: any = {
        patient,
        observations: [],
        conditions: [],
        medications: [],
        diagnosticReports: [],
        encounters: []
      };

      // Get observations
      if (includeObservations) {
        result.observations = await this.getObservations(
          fhirEndpoint,
          patientId,
          accessToken,
          undefined,
          dateFrom,
          dateTo
        );
      }

      // Get conditions
      if (includeConditions) {
        result.conditions = await this.getConditions(
          fhirEndpoint,
          patientId,
          accessToken
        );
      }

      // Get medications
      if (includeMedications) {
        result.medications = await this.getMedicationStatements(
          fhirEndpoint,
          patientId,
          accessToken
        );
      }

      // Get diagnostic reports
      if (includeDiagnosticReports) {
        result.diagnosticReports = await this.getDiagnosticReports(
          fhirEndpoint,
          patientId,
          accessToken,
          dateFrom,
          dateTo
        );
      }

      // Get encounters
      if (includeEncounters) {
        result.encounters = await this.getEncounters(
          fhirEndpoint,
          patientId,
          accessToken,
          undefined,
          dateFrom,
          dateTo
        );
      }

      logger.info(`Comprehensive FHIR data retrieved for patient ${patientId}`);
      return result;

    } catch (error) {
      logger.error(`Error retrieving comprehensive FHIR data: ${error}`);
      throw error;
    }
  }

  /**
   * Validate FHIR endpoint
   */
  static async validateFHIREndpoint(fhirEndpoint: string, accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${fhirEndpoint}/metadata`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': `application/fhir+json; fhirVersion=${this.FHIR_VERSION}`
          },
          timeout: 10000
        }
      );

      return response.status === 200 && response.data.resourceType === 'CapabilityStatement';
    } catch (error) {
      logger.error(`Error validating FHIR endpoint: ${error}`);
      return false;
    }
  }

  /**
   * Convert FHIR Patient to internal format
   */
  static convertFHIRPatientToInternal(fhirPatient: any): any {
    return {
      id: fhirPatient.id,
      name: fhirPatient.name?.[0]?.text || 'Unknown',
      gender: fhirPatient.gender,
      birthDate: fhirPatient.birthDate,
      identifiers: fhirPatient.identifier || [],
      telecom: fhirPatient.telecom || [],
      address: fhirPatient.address || []
    };
  }

  /**
   * Convert FHIR Observation to internal format
   */
  static convertFHIRObservationToInternal(fhirObservation: any): any {
    return {
      id: fhirObservation.id,
      status: fhirObservation.status,
      category: fhirObservation.category?.[0]?.coding?.[0]?.code,
      code: fhirObservation.code?.coding?.[0]?.code,
      display: fhirObservation.code?.text,
      value: fhirObservation.valueQuantity || fhirObservation.valueString,
      effectiveDateTime: fhirObservation.effectiveDateTime,
      issued: fhirObservation.issued,
      performer: fhirObservation.performer || []
    };
  }
}

