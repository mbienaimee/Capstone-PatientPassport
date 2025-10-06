# Patient Passport OpenMRS Integration Guide

## Overview
This guide explains how to integrate the Patient Passport system with OpenMRS as a plugin, allowing doctors to add patient records directly to the Patient Passport system.

## Prerequisites
- OpenMRS 2.5.0+ running
- Patient Passport API running on port 3000
- Java 8+ installed
- Maven 3.6+ installed

## Installation Steps

### 1. Build the Module
```bash
# Navigate to the module directory
cd openmrs-modules/patient-passport-core/omod

# Build the module
mvn clean package
```

### 2. Deploy to OpenMRS
```bash
# Copy the OMOD file to OpenMRS modules directory
cp target/patientpassportcore-1.0.0.omod /usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
sudo systemctl restart tomcat
```

### 3. Enable the Module
1. Log into OpenMRS: http://localhost:8080/openmrs
2. Go to Administration > Manage Modules
3. Find "Patient Passport Core" and click "Start"
4. The module should now be active

## Configuration

### 1. Global Properties
Configure these properties in OpenMRS Administration:

- `patientpassportcore.api.url`: Patient Passport API URL (default: http://localhost:3000/api)
- `patientpassportcore.api.key`: API key for authentication
- `patientpassportcore.enable.sync`: Enable automatic sync (default: true)
- `patientpassportcore.universal.id.type`: Universal ID type name (default: UNIVERSAL_PATIENT_ID)

### 2. User Roles and Privileges
Assign these privileges to users who need access:

- `Manage Patient Passport`: Full administrative access
- `View Patient Passport`: Read-only access to passport data
- `Emergency Override Patient Passport`: Emergency access override

### 3. Emergency Roles
Create these roles for emergency access:
- `Emergency Doctor`: Can perform emergency overrides
- `Emergency Nurse`: Can perform emergency overrides

## Usage

### 1. Patient Dashboard Integration
When viewing a patient in OpenMRS:
1. Navigate to the patient's dashboard
2. Look for the "Patient Passport" section
3. Generate a Universal Patient ID if not exists
4. View passport status and sync data

### 2. Creating New Patients
When creating a new patient:
1. Fill in patient information as usual
2. The system will automatically generate a Universal Patient ID
3. Patient data will be synced to Patient Passport system
4. A passport record will be created

### 3. Emergency Override
In emergency situations:
1. Click "Emergency Override" on patient dashboard
2. Provide justification for the override
3. Access will be logged for audit purposes
4. Patient data can be accessed immediately

## API Integration

### REST API Endpoints
The module provides these REST endpoints:

```
POST /openmrs/ws/rest/v1/patientpassport/generate-universal-id
GET  /openmrs/ws/rest/v1/patientpassport/find-by-universal-id
POST /openmrs/ws/rest/v1/patientpassport/emergency-override
GET  /openmrs/ws/rest/v1/patientpassport/audit-logs
GET  /openmrs/ws/rest/v1/patientpassport/emergency-override-logs
POST /openmrs/ws/rest/v1/patientpassport/sync-patient
POST /openmrs/ws/rest/v1/patientpassport/sync-all
```

### FHIR Integration
The module extends FHIR capabilities:

```
POST /openmrs/ws/fhir2/R4/Patient
GET  /openmrs/ws/fhir2/R4/Patient?identifier={universalId}
PUT  /openmrs/ws/fhir2/R4/Patient/{id}
```

## Data Flow

### 1. Patient Creation Flow
```
OpenMRS Patient Creation
    ↓
Generate Universal Patient ID
    ↓
Create Patient Passport Record
    ↓
Sync Data to Patient Passport API
    ↓
Log Access in Audit Trail
```

### 2. Patient Lookup Flow
```
Universal Patient ID Lookup
    ↓
Search OpenMRS Database
    ↓
Return Patient Information
    ↓
Log Access in Audit Trail
```

### 3. Emergency Override Flow
```
Emergency Override Request
    ↓
Validate User Permissions
    ↓
Log Override with Justification
    ↓
Grant Immediate Access
    ↓
Send Alert to Administrators
```

## Security Features

### 1. Audit Logging
All patient data access is logged with:
- User information
- Access type (regular/emergency)
- Timestamp
- IP address
- Action details

### 2. Emergency Override Controls
- Requires specific roles
- Mandatory justification
- Automatic logging
- Administrator notifications

### 3. Data Encryption
- Universal Patient IDs are encrypted
- API communications use HTTPS
- Sensitive data is masked in logs

## Troubleshooting

### Common Issues

1. **Module Not Starting**
   - Check OpenMRS logs: `/usr/local/tomcat/logs/catalina.out`
   - Verify Java version compatibility
   - Check module dependencies

2. **API Connection Issues**
   - Verify Patient Passport API is running
   - Check API URL configuration
   - Validate API key

3. **Permission Errors**
   - Ensure user has required privileges
   - Check role assignments
   - Verify emergency override roles

### Log Locations
- OpenMRS Logs: `/usr/local/tomcat/logs/`
- Module Logs: Check OpenMRS admin interface
- Audit Logs: Stored in database tables

## Testing the Integration

### 1. Test Patient Creation
```bash
# Create a test patient via API
curl -X POST http://localhost:8080/openmrs/ws/fhir2/R4/Patient \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Patient",
    "name": [{"given": ["John"], "family": "Doe"}],
    "gender": "male",
    "birthDate": "1990-01-01"
  }'
```

### 2. Test Universal ID Generation
```bash
# Generate universal ID for patient
curl -X POST "http://localhost:8080/openmrs/ws/rest/v1/patientpassport/generate-universal-id?patientUuid={patient-uuid}"
```

### 3. Test Patient Lookup
```bash
# Find patient by universal ID
curl "http://localhost:8080/openmrs/ws/rest/v1/patientpassport/find-by-universal-id?universalId={universal-id}"
```

## Maintenance

### Regular Tasks
1. Monitor audit logs for suspicious activity
2. Review emergency override usage
3. Update API keys periodically
4. Backup audit and override data

### Performance Optimization
1. Index database tables for faster lookups
2. Implement caching for frequently accessed data
3. Monitor API response times
4. Optimize sync operations

## Support

For technical support:
1. Check OpenMRS community forums
2. Review module documentation
3. Contact Patient Passport development team
4. Submit issues to the project repository

## Version History

- v1.0.0: Initial release with basic integration
- Future versions will include enhanced features and bug fixes











