# OpenMRS Integration Guide - Patient Passport Auto-Population

## Overview

This integration enables **automatic population** of diagnosis and medication data from the Patient Passport system into OpenMRS. Doctors no longer need to manually enter historical medical data when it's already available in the patient's passport.

## Key Features

### 1. **Automatic Data Population**
- Diagnosis data automatically populates as OpenMRS observations
- Medication data automatically populates as observations
- Data is organized by hospital and provider
- Maintains complete audit trail

### 2. **Multi-Hospital Support**
- Patient passport holds data from different hospitals
- Each diagnosis/medication is tagged with:
  - Hospital name
  - Doctor/Provider name
  - Date of observation
  - Status (active/resolved/chronic)

### 3. **Bidirectional Sync**
- Patient data flows from Passport → OpenMRS (auto-population)
- New data from OpenMRS can flow back to Passport (optional)
- Hospital and doctor mappings are maintained

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Patient Passport   │◄───────►│      OpenMRS         │
│    Database         │  REST   │    Database          │
└─────────────────────┘  API    └──────────────────────┘
         │                               │
         │                               │
    ┌────▼────┐                     ┌────▼────┐
    │Diagnosis│                     │  Obs:   │
    │  Data   │────Sync as──────────►Diagnosis│
    └─────────┘   Observations      └─────────┘
         │                               │
    ┌────▼────┐                     ┌────▼────┐
    │  Meds   │────Sync as──────────►  Obs:   │
    │  Data   │   Observations      │  Meds   │
    └─────────┘                     └─────────┘
```

## Data Mapping

### Patient Linking
Patients are linked between systems using **National ID**:
```
Passport Patient ←→ OpenMRS Patient
    National ID  =  National ID Identifier
```

### Hospital Linking
Hospitals are mapped by **Name**:
```
Passport Hospital ←→ OpenMRS Location
    Hospital Name = Location Name
```

### Diagnosis Mapping
```json
{
  "type": "diagnosis",
  "conceptName": "DIAGNOSIS",
  "valueCoded": "Hypertension",
  "valueText": "Stage 2 hypertension",
  "obsDatetime": "2024-01-15",
  "provider": "Dr. Jane Smith",
  "hospital": "Central Hospital",
  "status": "active"
}
```

Becomes OpenMRS Observation:
- **Concept**: Diagnosis (UUID: 159947...)
- **Value**: "Hypertension: Stage 2 hypertension"
- **Comment**: "From Patient Passport - Hospital: Central Hospital, Provider: Dr. Jane Smith, Status: active"
- **Obs Datetime**: 2024-01-15

### Medication Mapping
```json
{
  "type": "medication",
  "conceptName": "MEDICATION",
  "valueDrug": "Amlodipine",
  "valueText": "10mg - Once daily",
  "dosage": "10mg",
  "frequency": "Once daily",
  "obsDatetime": "2024-01-15",
  "provider": "Dr. Jane Smith",
  "hospital": "Central Hospital",
  "status": "active"
}
```

Becomes OpenMRS Observation:
- **Concept**: Medication (UUID: 1282...)
- **Value**: "Amlodipine - 10mg Once daily"
- **Comment**: "From Patient Passport - Hospital: Central Hospital, Provider: Dr. Jane Smith, Status: active"
- **Obs Datetime**: 2024-01-15

## API Endpoints

### Backend (Patient Passport API)

#### 1. Get Patient Observations
```http
GET /api/openmrs/patient/:nationalId/observations
```

**Response:**
```json
{
  "success": true,
  "message": "Patient observations retrieved successfully",
  "data": {
    "patient": {
      "passportId": "...",
      "nationalId": "1234567890",
      "fullName": "John Doe",
      "dateOfBirth": "1980-01-01",
      "gender": "male",
      "bloodType": "A+",
      "allergies": ["Penicillin"]
    },
    "observations": [
      {
        "type": "diagnosis",
        "conceptName": "DIAGNOSIS",
        "valueCoded": "Diabetes Type 2",
        "valueText": "Well controlled",
        "obsDatetime": "2024-01-15T10:30:00",
        "provider": "Dr. Jane Smith",
        "hospital": "Central Hospital",
        "status": "active"
      },
      {
        "type": "medication",
        "conceptName": "MEDICATION",
        "valueDrug": "Metformin",
        "valueText": "500mg - Twice daily",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "obsDatetime": "2024-01-15T10:30:00",
        "provider": "Dr. Jane Smith",
        "hospital": "Central Hospital",
        "status": "active"
      }
    ],
    "diagnosisByHospital": {
      "Central Hospital": [...],
      "District Hospital": [...]
    },
    "medicationsByHospital": {
      "Central Hospital": [...],
      "District Hospital": [...]
    },
    "summary": {
      "totalDiagnoses": 5,
      "totalMedications": 8,
      "hospitalsCount": 3
    }
  }
}
```

#### 2. Sync Patient Mapping
```http
POST /api/openmrs/patient/sync
```

**Request Body:**
```json
{
  "nationalId": "1234567890",
  "openmrsPatientUuid": "abc-123-def-456"
}
```

#### 3. Sync Hospital Mapping
```http
POST /api/openmrs/hospital/sync
```

**Request Body:**
```json
{
  "hospitalName": "Central Hospital",
  "openmrsHospitalUuid": "xyz-789-uvw-012",
  "passportHospitalId": "60f1b2c3d4e5f6g7h8i9j0k1"
}
```

### OpenMRS Module Endpoints

#### 1. Auto-Populate Patient Data
```http
GET /module/patientpassport/api/populate/{patientId}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient data auto-populated successfully from passport",
  "hasData": true,
  "encounterId": 123
}
```

#### 2. Check if Patient Has Passport Data
```http
GET /module/patientpassport/api/check/{patientId}
```

**Response:**
```json
{
  "success": true,
  "hasData": true,
  "message": "Patient has passport data available"
}
```

## Usage Workflow

### For Doctors in OpenMRS

1. **Doctor opens patient chart** in OpenMRS
2. **System automatically checks** if patient has passport data (by National ID)
3. **If data exists**, a button/link appears: "Load from Patient Passport"
4. **Doctor clicks the button**
5. **System creates encounter** and populates observations
6. **Diagnosis and medications** appear in patient's chart
7. **Doctor can review** and add new observations manually if needed

### Implementation in OpenMRS UI

Add this JavaScript to the patient dashboard:

```javascript
// Check if patient has passport data
jQuery.ajax({
  url: '/openmrs/module/patientpassport/api/check/' + patientId,
  type: 'GET',
  success: function(response) {
    if (response.hasData) {
      // Show button to load passport data
      jQuery('#passportDataButton').show();
    }
  }
});

// Load passport data when button clicked
jQuery('#passportDataButton').click(function() {
  jQuery.ajax({
    url: '/openmrs/module/patientpassport/api/populate/' + patientId,
    type: 'GET',
    success: function(response) {
      if (response.success) {
        alert('Patient data loaded successfully from passport!');
        location.reload(); // Reload to show new observations
      }
    }
  });
});
```

## Database Schema Updates

### Patient Passport Database

```javascript
// Patient Model - Added field
{
  openmrsUuid: String, // Links to OpenMRS patient UUID
  // ... existing fields
}

// Hospital Model - Added field
{
  openmrsUuid: String, // Links to OpenMRS location UUID
  // ... existing fields
}

// Doctor Model - Added field
{
  openmrsProviderUuid: String, // Links to OpenMRS provider UUID
  // ... existing fields
}
```

## Security & Privacy

1. **Audit Logging**: All data access is logged in both systems
2. **OTP Verification**: For sensitive operations (optional)
3. **Provider Authentication**: Only authenticated providers can access data
4. **Data Attribution**: All observations show source hospital and provider

## Benefits

### For Doctors
- ✅ **Save Time**: No manual data entry of historical records
- ✅ **Complete History**: See patient's medical history from all hospitals
- ✅ **Accurate Data**: Data comes directly from source system
- ✅ **Better Decisions**: Access to comprehensive patient information

### For Patients
- ✅ **Continuity of Care**: Medical history follows them across hospitals
- ✅ **No Repetition**: Don't need to repeat medical history at each visit
- ✅ **Comprehensive Records**: All data in one place

### For Hospitals
- ✅ **Efficiency**: Reduced documentation time
- ✅ **Data Quality**: Standardized, structured data
- ✅ **Interoperability**: Seamless data exchange between systems

## Configuration

### Backend Environment Variables
```bash
# Patient Passport API
OPENMRS_ENABLED=true
OPENMRS_AUTO_SYNC=true
```

### OpenMRS Module Configuration
```java
// PatientPassportDataServiceImpl.java
private static final String PASSPORT_API_BASE_URL = 
  "https://patientpassport-api.azurewebsites.net/api";
```

## Testing

### Test Patient Data Flow

1. **Create test patient** in both systems with same National ID
2. **Add diagnosis** in Passport system (Hospital A)
3. **Add medication** in Passport system (Hospital A)
4. **Open patient chart** in OpenMRS
5. **Click "Load from Passport"**
6. **Verify observations** appear in OpenMRS

### Expected Results
- Diagnosis observation created with correct data
- Medication observation created with correct data
- Both observations tagged with Hospital A
- Audit log entries created in both systems

## Troubleshooting

### Patient Data Not Loading
1. **Check National ID** is same in both systems
2. **Verify API connectivity** between systems
3. **Check logs** for error messages
4. **Ensure patient has data** in Passport system

### Observations Not Appearing
1. **Check concept UUIDs** are correct for your OpenMRS instance
2. **Verify encounter type** exists
3. **Check user permissions** for creating observations

### Connection Issues
1. **Verify API URL** is correct
2. **Check network connectivity**
3. **Ensure firewall** allows connections
4. **Verify SSL certificates** if using HTTPS

## Future Enhancements

1. **Real-time Sync**: Automatic background sync without manual trigger
2. **Two-way Sync**: Send OpenMRS data back to Passport
3. **Smart Deduplication**: Avoid duplicate observations
4. **Conflict Resolution**: Handle data conflicts intelligently
5. **Selective Sync**: Choose which data to import

## Support

For issues or questions:
- Backend API: Check `/api/openmrs/health` endpoint
- OpenMRS Module: Check OpenMRS logs
- Documentation: See this guide

## Summary

This integration creates a **clean, automated flow** where:
- ✅ Patient diagnosis and medications flow automatically from Passport to OpenMRS
- ✅ Data is properly attributed to source hospital and doctor
- ✅ Doctors save time by not manually entering historical data
- ✅ Patient passport holds comprehensive data from multiple hospitals
- ✅ All data access is audited and secure

The system maintains **data integrity** while providing **ease of use** for healthcare providers.
