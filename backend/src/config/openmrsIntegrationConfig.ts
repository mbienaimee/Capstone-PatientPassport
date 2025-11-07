/**
 * OpenMRS Integration Configuration
 * Contains all constants and configuration values for OpenMRS integration
 */

export const OPENMRS_CONFIG = {
  // Placeholder email domain for auto-created records
  PLACEHOLDER_EMAIL_DOMAIN: process.env.OPENMRS_PLACEHOLDER_EMAIL_DOMAIN || 'openmrs.system',
  
  // Default values for auto-created doctors
  DEFAULT_DOCTOR_SPECIALIZATION: process.env.OPENMRS_DEFAULT_DOCTOR_SPECIALIZATION || 'General Practice',
  DEFAULT_DOCTOR_EXPERIENCE: parseInt(process.env.OPENMRS_DEFAULT_DOCTOR_EXPERIENCE || '0'),
  
  // Default values for auto-created hospitals
  DEFAULT_HOSPITAL_CONTACT: process.env.OPENMRS_DEFAULT_HOSPITAL_CONTACT || 'Contact not provided',
  DEFAULT_HOSPITAL_ADDRESS: process.env.OPENMRS_DEFAULT_HOSPITAL_ADDRESS || 'Address not provided from OpenMRS',
  
  // License number prefix for auto-generated hospitals
  HOSPITAL_LICENSE_PREFIX: process.env.OPENMRS_HOSPITAL_LICENSE_PREFIX || 'OPENMRS',
  
  // Default values for observations
  DEFAULT_OBSERVATION_STATUS: 'active',
  DEFAULT_MEDICATION_FREQUENCY: 'As needed',
  DEFAULT_DIAGNOSIS_FALLBACK: 'Observation from OpenMRS',
  DEFAULT_MEDICATION_FALLBACK: 'Medication from OpenMRS',
  DEFAULT_DETAILS_FALLBACK: 'Recorded in OpenMRS',
  DEFAULT_DOSAGE_FALLBACK: 'As prescribed',
  
  // Field name mappings for flexible data extraction
  DIAGNOSIS_FIELD_NAMES: ['diagnosis', 'concept', 'name'],
  DETAILS_FIELD_NAMES: ['details', 'value', 'comment'],
  MEDICATION_FIELD_NAMES: ['medicationName', 'concept', 'name', 'value'],
  DOSAGE_FIELD_NAMES: ['dosage', 'value'],
  DATE_FIELD_NAMES: ['date', 'obsDatetime', 'startDate'],
  
  // Validation
  MAX_EMAIL_LENGTH: 30,
  MIN_FIELD_LENGTH: 1,
};

export default OPENMRS_CONFIG;
