# OpenMRS Patient Passport Integration - Complete Guide

## Overview

The Patient Passport system is integrated with OpenMRS as a plugin/module that enables doctors to record patient history and keep it updated for access across multiple hospitals. This creates a federated healthcare system where patient records can be shared securely between different healthcare facilities.

## How OpenMRS Works

OpenMRS (Open Medical Record System) is a modular, open-source EMR platform that provides:

### Core Components
- **Patient Management**: Registration, demographics, identifiers
- **Encounter System**: Clinical visits, observations, diagnoses
- **Concept Dictionary**: Standardized medical terminology
- **User Management**: Roles, privileges, authentication
- **Module System**: Extensible plugin architecture
- **REST API**: Programmatic access to all data
- **FHIR Support**: Healthcare interoperability standards

### Key OpenMRS Concepts
- **Patient**: Individual receiving healthcare
- **Encounter**: Clinical interaction (visit, consultation)
- **Observation**: Clinical data point (vital signs, lab results)
- **Concept**: Medical term in the concept dictionary
- **Provider**: Healthcare worker (doctor, nurse)
- **Location**: Physical place where care is provided

## Patient Passport OpenMRS Module Architecture

### Module Structure
```
openmrs-modules/
├── patient-passport-core/
│   └── omod/src/main/java/
│       └── org/openmrs/module/patientpassportcore/
│           ├── api/
│           │   ├── PatientPassportCoreService.java
│           │   └── impl/PatientPassportCoreServiceImpl.java
│           ├── model/
│           │   ├── PatientPassportRecord.java
│           │   ├── EmergencyOverride.java
│           │   └── AuditLog.java
│           ├── fhir/
│           │   └── PatientPassportResourceProvider.java
│           └── web/controller/
│               ├── PatientPassportAdminController.java
│               └── PatientPassportDashboardController.java
└── patient-passport-interoperability/
    └── omod/src/main/java/
        └── org/openmrs/module/patientpassportinteroperability/
```

## Cross-Hospital Patient Record Sharing

### 1. Universal Patient ID System

**Purpose**: Create a unique identifier that works across all hospitals in the network.

**Implementation**:
```java
// Generate Universal Patient ID
PatientIdentifier generateUniversalPatientId(Patient patient) {
    String universalId = "PP" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    
    PatientIdentifier identifier = new PatientIdentifier();
    identifier.setIdentifier(universalId);
    identifier.setIdentifierType(getUniversalPatientIdentifierType());
    identifier.setLocation(Context.getLocationService().getDefaultLocation());
    identifier.setPreferred(true);
    
    patient.addIdentifier(identifier);
    patientService.savePatient(patient);
    
    // Register with Patient Passport system
    registerPatientWithCentralRegistry(patient, universalId);
    
    return identifier;
}
```

### 2. Cross-Hospital Patient Search

**Purpose**: Allow doctors to find patients who have been treated at other hospitals.

**Implementation**:
```java
// Search patients across all hospitals
List<PatientPassportRecord> searchPatientAcrossHospitals(String searchCriteria) {
    String apiUrl = getApiUrl();
    String apiKey = getApiKey();
    
    HttpURLConnection connection = new URL(apiUrl + "/patients/search?q=" + searchCriteria).openConnection();
    connection.setRequestMethod("GET");
    connection.setRequestProperty("Authorization", "Bearer " + apiKey);
    
    // Parse response and return patient records from all hospitals
    return parsePatientSearchResponse(response);
}
```

### 3. Complete Medical History Access

**Purpose**: Retrieve patient's complete medical history from all hospitals.

**Implementation**:
```java
// Get complete medical history from all hospitals
String getCompleteMedicalHistory(String universalId) {
    String apiUrl = getApiUrl();
    String apiKey = getApiKey();
    
    HttpURLConnection connection = new URL(apiUrl + "/patients/" + universalId + "/complete-history").openConnection();
    connection.setRequestMethod("GET");
    connection.setRequestProperty("Authorization", "Bearer " + apiKey);
    
    return response.toString();
}
```

### 4. Medical Encounter Recording

**Purpose**: Record patient encounters in OpenMRS and sync to Patient Passport.

**Implementation**:
```java
// Add medical encounter to Patient Passport
boolean addMedicalEncounter(Patient patient, String encounterData, String doctorId) {
    PatientIdentifier universalId = getUniversalPatientId(patient);
    
    JSONObject encounter = new JSONObject(encounterData);
    encounter.put("universalId", universalId.getIdentifier());
    encounter.put("doctorId", doctorId);
    encounter.put("hospitalId", getCurrentHospitalId());
    encounter.put("encounterDate", new Date());
    
    // Send to Patient Passport API
    HttpURLConnection connection = new URL(apiUrl + "/medical-encounters").openConnection();
    connection.setRequestMethod("POST");
    connection.setRequestProperty("Content-Type", "application/json");
    connection.setRequestProperty("Authorization", "Bearer " + apiKey);
    
    // Send encounter data
    return sendEncounterData(connection, encounter);
}
```

## Doctor Workflow in OpenMRS

### 1. Patient Registration/Import
```
Doctor Action: Register new patient or import existing patient
OpenMRS: Creates patient record with local ID
Patient Passport: Generates Universal Patient ID
Result: Patient accessible across all hospitals
```

### 2. Recording Medical History
```
Doctor Action: Create encounter, add observations, diagnoses
OpenMRS: Stores encounter data locally
Patient Passport: Syncs encounter to central registry
Result: Medical history available to all hospitals
```

### 3. Cross-Hospital Patient Lookup
```
Doctor Action: Search for patient by name/ID
OpenMRS: Queries Patient Passport API
Patient Passport: Returns patients from all hospitals
Result: Doctor can see patient's complete history
```

### 4. Emergency Access
```
Doctor Action: Request emergency access to patient record
OpenMRS: Validates emergency privileges
Patient Passport: Grants immediate access with audit log
Result: Emergency access with full audit trail
```

## FHIR Integration

### FHIR Resource Provider
The module extends OpenMRS FHIR capabilities:

```java
@Component
public class PatientPassportResourceProvider implements IResourceProvider {
    
    @Create
    public MethodOutcome createPatient(@ResourceParam Patient patient) {
        // Convert FHIR Patient to OpenMRS Patient
        Patient openmrsPatient = fhirPatientService.convertFhirPatientToOpenmrsPatient(patient);
        
        // Save in OpenMRS
        Patient savedPatient = patientService.savePatient(openmrsPatient);
        
        // Generate universal ID
        PatientIdentifier universalId = passportService.generateUniversalPatientId(savedPatient);
        
        // Sync with Patient Passport API
        syncPatientToPassport(savedPatient, universalId);
        
        return outcome;
    }
    
    @Search
    public List<Patient> searchPatientsByUniversalId(@RequiredParam(name = Patient.SP_IDENTIFIER) StringAndListParam identifier) {
        // Search patients by universal ID across hospitals
        return passportService.searchPatientAcrossHospitals(identifier.getValue());
    }
}
```

### FHIR Endpoints
- `POST /openmrs/ws/fhir2/R4/Patient` - Create patient with universal ID
- `GET /openmrs/ws/fhir2/R4/Patient?identifier={universalId}` - Find by universal ID
- `PUT /openmrs/ws/fhir2/R4/Patient/{id}` - Update patient record

## Configuration

### OpenMRS Global Properties
Configure these in OpenMRS Administration:

```properties
# Patient Passport API Configuration
patientpassportcore.api.url=http://localhost:3000/api
patientpassportcore.api.key=your-api-key-here
patientpassportcore.enable.sync=true
patientpassportcore.universal.id.type=UNIVERSAL_PATIENT_ID
patientpassportcore.hospital.id=HOSPITAL_001

# Sync Configuration
patientpassportcore.sync.interval=300000  # 5 minutes
patientpassportcore.sync.batch.size=100
patientpassportcore.retry.attempts=3

# Security Configuration
patientpassportcore.emergency.access.enabled=true
patientpassportcore.audit.logging.enabled=true
patientpassportcore.data.encryption.enabled=true
```

### User Roles and Privileges
Assign these privileges to users:

```
Privileges:
- Manage Patient Passport: Full administrative access
- View Patient Passport: Read-only access to passport data
- Emergency Override Patient Passport: Emergency access override
- Cross Hospital Access: Access to patients from other hospitals
- Sync Patient Data: Ability to sync patient data

Roles:
- Emergency Doctor: Can perform emergency overrides
- Emergency Nurse: Can perform emergency overrides
- Patient Passport Admin: Full administrative access
- Cross Hospital Doctor: Access to patients from other hospitals
```

## Installation Process

### 1. Build the Module
```bash
cd openmrs-modules/patient-passport-core/omod
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
1. Log into OpenMRS: `http://localhost:8080/openmrs`
2. Go to Administration > Manage Modules
3. Find "Patient Passport Core" and click "Start"
4. Configure global properties
5. Assign user roles and privileges

### 4. Test Integration
1. Create a test patient in OpenMRS
2. Verify universal ID generation
3. Check API sync to Patient Passport
4. Test cross-hospital search functionality

## API Endpoints

### OpenMRS REST Endpoints
```
POST /openmrs/ws/rest/v1/patientpassport/generate-universal-id
GET  /openmrs/ws/rest/v1/patientpassport/find-by-universal-id
POST /openmrs/ws/rest/v1/patientpassport/emergency-override
GET  /openmrs/ws/rest/v1/patientpassport/audit-logs
POST /openmrs/ws/rest/v1/patientpassport/sync-patient
POST /openmrs/ws/rest/v1/patientpassport/sync-all
GET  /openmrs/ws/rest/v1/patientpassport/search-across-hospitals
GET  /openmrs/ws/rest/v1/patientpassport/complete-history/{universalId}
POST /openmrs/ws/rest/v1/patientpassport/share-patient
GET  /openmrs/ws/rest/v1/patientpassport/network-hospitals
```

### FHIR Endpoints
```
POST /openmrs/ws/fhir2/R4/Patient
GET  /openmrs/ws/fhir2/R4/Patient?identifier={universalId}
PUT  /openmrs/ws/fhir2/R4/Patient/{id}
GET  /openmrs/ws/fhir2/R4/Encounter?patient={universalId}
POST /openmrs/ws/fhir2/R4/Encounter
```

## Data Flow Examples

### 1. New Patient Registration
```
1. Doctor registers patient in OpenMRS
2. OpenMRS creates patient with local ID
3. Patient Passport module generates Universal Patient ID
4. Patient data synced to Patient Passport API
5. Patient accessible across all hospitals
```

### 2. Medical Encounter Recording
```
1. Doctor creates encounter in OpenMRS
2. Doctor adds observations, diagnoses, medications
3. OpenMRS stores encounter locally
4. Patient Passport module syncs encounter to API
5. Medical history updated across all hospitals
```

### 3. Cross-Hospital Patient Lookup
```
1. Doctor searches for patient by name/ID
2. OpenMRS queries Patient Passport API
3. API returns patients from all hospitals
4. Doctor selects patient
5. Complete medical history displayed
```

### 4. Emergency Access
```
1. Emergency situation requires immediate access
2. Doctor requests emergency override
3. System validates emergency privileges
4. Access granted with audit logging
5. Patient record accessible immediately
```

## Security Features

### 1. Authentication & Authorization
- JWT token-based authentication
- Role-based access control
- Privilege-based permissions
- Emergency access controls

### 2. Data Protection
- End-to-end encryption
- Secure API communication
- Audit logging for all access
- Data anonymization options

### 3. Privacy Controls
- Patient consent management
- Data sharing permissions
- Access revocation capabilities
- Compliance with healthcare regulations

## Benefits of This Integration

### For Doctors
- **Complete Patient History**: Access to patient's complete medical history from all hospitals
- **Seamless Workflow**: Record encounters in familiar OpenMRS interface
- **Cross-Hospital Collaboration**: Share patient data with other hospitals
- **Emergency Access**: Immediate access in emergency situations

### For Patients
- **Continuity of Care**: Medical history follows them across hospitals
- **Reduced Redundancy**: No need to repeat tests or provide same information
- **Better Outcomes**: Doctors have complete picture for better decisions
- **Privacy Control**: Control over who can access their data

### For Hospitals
- **Improved Care Quality**: Better patient outcomes through complete history
- **Reduced Costs**: Less redundant testing and procedures
- **Compliance**: Audit trails for regulatory compliance
- **Interoperability**: Seamless data exchange with other facilities

## Troubleshooting

### Common Issues
1. **Module Not Starting**: Check OpenMRS logs, verify dependencies
2. **API Connection Failed**: Verify API URL and authentication
3. **Sync Issues**: Check network connectivity and API status
4. **Permission Errors**: Verify user roles and privileges

### Debugging Steps
1. Check OpenMRS logs: `/usr/local/tomcat/logs/catalina.out`
2. Verify module status in Administration > Manage Modules
3. Test API connectivity manually
4. Check global properties configuration
5. Verify user permissions and roles

## Future Enhancements

### Planned Features
- **Real-time Sync**: WebSocket-based real-time synchronization
- **Mobile Integration**: Mobile app for doctors
- **AI Features**: Automated diagnosis suggestions
- **Blockchain**: Immutable audit trails
- **Advanced Analytics**: Patient health trend analysis

### Integration Opportunities
- **Laboratory Systems**: Direct lab result integration
- **Pharmacy Systems**: Medication management
- **Imaging Systems**: Radiology integration
- **Billing Systems**: Automated billing integration

## Conclusion

The Patient Passport OpenMRS integration provides a comprehensive solution for cross-hospital patient record sharing. Doctors can record patient history in OpenMRS and keep it updated for access across all hospitals in the network. The system ensures data security, privacy, and compliance while providing seamless interoperability between healthcare facilities.

The integration transforms OpenMRS from a single-hospital EMR into a federated healthcare platform that enables true continuity of care across multiple institutions.











