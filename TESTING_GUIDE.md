# Testing Guide - OpenMRS Integration

## Prerequisites

- Patient Passport backend running on `http://localhost:5000`
- OpenMRS running on `http://localhost:8080/openmrs`
- MongoDB running
- Test data in both systems

## Test Scenario Setup

### Step 1: Create Test Patient in Both Systems

#### In Patient Passport System:
```javascript
// Create user
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john.doe@test.com",
  "password": "Test123!",
  "role": "patient"
}

// Create patient profile
POST /api/patients
{
  "nationalId": "1234567890",
  "dateOfBirth": "1980-01-01",
  "gender": "male",
  "contactNumber": "+250788123456",
  "address": "Kigali, Rwanda",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+250788123457"
  }
}
```

#### In OpenMRS:
1. Create patient with National ID identifier: `1234567890`
2. Fill in basic demographics

### Step 2: Create Test Medical Data

#### Create Hospital
```javascript
POST /api/hospitals
{
  "name": "Central Hospital",
  "address": "Kigali City",
  "contact": "+250788999000",
  "licenseNumber": "HOSP001"
}
```

#### Create Doctor
```javascript
POST /api/hospitals/{hospitalId}/doctors
{
  "licenseNumber": "DOC12345",
  "specialization": "General Practice"
}
```

#### Add Diagnosis
```javascript
POST /api/medical/conditions
{
  "patientId": "{patientId}",
  "name": "Diabetes Type 2",
  "details": "Well controlled with medication",
  "diagnosed": "2024-01-15",
  "status": "active"
}
```

#### Add Medication
```javascript
POST /api/medical/medications
{
  "patientId": "{patientId}",
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "startDate": "2024-01-15",
  "status": "active"
}
```

## Integration Tests

### Test 1: Health Check

```bash
# Check Patient Passport API
curl http://localhost:5000/api/openmrs/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OpenMRS integration service is healthy",
  "data": {
    "status": "active",
    "timestamp": "2024-11-04T...",
    "version": "1.0.0"
  }
}
```

### Test 2: Get Patient Observations

```bash
# Get observations by National ID
curl http://localhost:5000/api/openmrs/patient/1234567890/observations
```

**Expected Response:**
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
      "bloodType": null,
      "allergies": []
    },
    "observations": [
      {
        "type": "diagnosis",
        "conceptName": "DIAGNOSIS",
        "valueCoded": "Diabetes Type 2",
        "valueText": "Well controlled with medication",
        "obsDatetime": "2024-01-15T...",
        "provider": "Dr. Test Doctor",
        "hospital": "Central Hospital",
        "status": "active",
        "source": "medical_condition"
      },
      {
        "type": "medication",
        "conceptName": "MEDICATION",
        "valueDrug": "Metformin",
        "valueText": "500mg - Twice daily",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "obsDatetime": "2024-01-15T...",
        "provider": "Dr. Test Doctor",
        "hospital": "Central Hospital",
        "status": "active",
        "source": "medication"
      }
    ],
    "diagnosisByHospital": {
      "Central Hospital": [...]
    },
    "medicationsByHospital": {
      "Central Hospital": [...]
    },
    "summary": {
      "totalDiagnoses": 1,
      "totalMedications": 1,
      "hospitalsCount": 1
    }
  }
}
```

### Test 3: Sync Patient Mapping

```bash
curl -X POST http://localhost:5000/api/openmrs/patient/sync \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890",
    "openmrsPatientUuid": "abc-123-def-456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient mapping synced successfully",
  "data": {
    "passportPatientId": "...",
    "openmrsPatientUuid": "abc-123-def-456",
    "nationalId": "1234567890",
    "syncedAt": "2024-11-04T..."
  }
}
```

### Test 4: Sync Hospital Mapping

```bash
curl -X POST http://localhost:5000/api/openmrs/hospital/sync \
  -H "Content-Type: application/json" \
  -d '{
    "hospitalName": "Central Hospital",
    "openmrsHospitalUuid": "xyz-789-uvw-012"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hospital mapping synced successfully",
  "data": {
    "passportHospitalId": "...",
    "openmrsHospitalUuid": "xyz-789-uvw-012",
    "hospitalName": "Central Hospital",
    "syncedAt": "2024-11-04T..."
  }
}
```

### Test 5: Check Patient Has Passport Data (OpenMRS Module)

```bash
# From OpenMRS
curl http://localhost:8080/openmrs/module/patientpassport/api/check/123
```

**Expected Response:**
```json
{
  "success": true,
  "hasData": true,
  "message": "Patient has passport data available"
}
```

### Test 6: Auto-Populate Data (OpenMRS Module)

```bash
# From OpenMRS
curl http://localhost:8080/openmrs/module/patientpassport/api/populate/123
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Patient data auto-populated successfully from passport",
  "hasData": true,
  "encounterId": 456
}
```

**Verify in OpenMRS:**
1. Open patient chart
2. Go to encounters/observations
3. Should see new observations:
   - DIAGNOSIS: "Diabetes Type 2"
   - MEDICATION: "Metformin - 500mg Twice daily"
   - Comments include hospital and provider info

## Multi-Hospital Test

### Setup Data from Multiple Hospitals

#### Hospital A - Central Hospital
```javascript
// Add diagnosis
POST /api/medical/conditions
{
  "patientId": "{patientId}",
  "name": "Diabetes Type 2",
  "details": "Diagnosed at Central Hospital",
  "diagnosed": "2024-01-15"
}
```

#### Hospital B - District Hospital
```javascript
// Create another hospital
POST /api/hospitals
{
  "name": "District Hospital",
  "address": "District Location",
  "contact": "+250788999001",
  "licenseNumber": "HOSP002"
}

// Add diagnosis from Hospital B
POST /api/medical/conditions
{
  "patientId": "{patientId}",
  "name": "Hypertension",
  "details": "Diagnosed at District Hospital",
  "diagnosed": "2024-03-05"
}
```

#### Hospital C - Regional Hospital
```javascript
// Create third hospital
POST /api/hospitals
{
  "name": "Regional Hospital",
  "address": "Regional Location",
  "contact": "+250788999002",
  "licenseNumber": "HOSP003"
}

// Add diagnosis from Hospital C
POST /api/medical/conditions
{
  "patientId": "{patientId}",
  "name": "Asthma",
  "details": "Diagnosed at Regional Hospital",
  "diagnosed": "2024-04-12"
}
```

### Verify Multi-Hospital Data

```bash
curl http://localhost:5000/api/openmrs/patient/1234567890/observations
```

**Expected:**
```json
{
  "diagnosisByHospital": {
    "Central Hospital": [
      { "valueCoded": "Diabetes Type 2", ... }
    ],
    "District Hospital": [
      { "valueCoded": "Hypertension", ... }
    ],
    "Regional Hospital": [
      { "valueCoded": "Asthma", ... }
    ]
  },
  "summary": {
    "totalDiagnoses": 3,
    "hospitalsCount": 3
  }
}
```

## Error Cases

### Test: Patient Not Found

```bash
curl http://localhost:5000/api/openmrs/patient/9999999999/observations
```

**Expected:**
```json
{
  "success": false,
  "message": "Patient with national ID 9999999999 not found"
}
```

### Test: No Data Available

```bash
# For patient with no medical data
curl http://localhost:8080/openmrs/module/patientpassport/api/check/999
```

**Expected:**
```json
{
  "success": true,
  "hasData": false,
  "message": "No passport data found for this patient"
}
```

## Database Verification

### Check Patient Mapping in MongoDB

```javascript
// Connect to MongoDB
use patient-passport

// Check patient has OpenMRS UUID
db.patients.findOne({ nationalId: "1234567890" })

// Should have:
{
  "_id": "...",
  "nationalId": "1234567890",
  "openmrsUuid": "abc-123-def-456",  // ← Should be set
  ...
}
```

### Check Hospital Mapping

```javascript
db.hospitals.findOne({ name: "Central Hospital" })

// Should have:
{
  "_id": "...",
  "name": "Central Hospital",
  "openmrsUuid": "xyz-789-uvw-012",  // ← Should be set
  ...
}
```

### Check Observations in OpenMRS Database

```sql
-- Connect to OpenMRS MySQL database

-- Check observations for patient
SELECT 
  o.obs_id,
  o.obs_datetime,
  c.name as concept_name,
  o.value_text,
  o.comments
FROM obs o
JOIN concept_name c ON o.concept_id = c.concept_id
WHERE o.person_id = 123
ORDER BY o.obs_datetime DESC;

-- Should see:
-- obs_id | obs_datetime | concept_name | value_text | comments
-- 1      | 2024-01-15   | DIAGNOSIS    | Diabetes...| From Patient Passport - Hospital: Central...
-- 2      | 2024-01-15   | MEDICATION   | Metformin..| From Patient Passport - Hospital: Central...
```

## Performance Tests

### Test: Large Dataset

Create 100 diagnoses and 100 medications for a patient, then test:

```bash
time curl http://localhost:5000/api/openmrs/patient/1234567890/observations
```

**Expected:** Response time < 2 seconds

### Test: Multiple Hospitals

Create data from 10 different hospitals, verify grouping:

```bash
curl http://localhost:5000/api/openmrs/patient/1234567890/observations | jq '.data.summary.hospitalsCount'
```

**Expected:** 10

## Integration Checklist

- [ ] Backend API endpoints responding
- [ ] OpenMRS module installed
- [ ] Patient mapping works (National ID)
- [ ] Hospital mapping works (Name)
- [ ] Doctor mapping works (License)
- [ ] Diagnosis auto-populates correctly
- [ ] Medications auto-populate correctly
- [ ] Multi-hospital data separated correctly
- [ ] Observations include hospital attribution
- [ ] Observations include provider attribution
- [ ] Audit logs created
- [ ] Error handling works
- [ ] Performance acceptable

## Troubleshooting

### Issue: No data returned

**Check:**
1. Patient exists in passport system
2. National ID is exact match
3. Patient has medical conditions or medications
4. Backend API is running

**Fix:**
```bash
# Verify patient exists
curl http://localhost:5000/api/patients?search=1234567890

# Check medical data
curl http://localhost:5000/api/medical/conditions?patient={patientId}
```

### Issue: OpenMRS module can't connect

**Check:**
1. Backend API URL is correct
2. Network connectivity
3. CORS settings

**Fix:**
```java
// In PatientPassportDataServiceImpl.java
private static final String PASSPORT_API_BASE_URL = 
  "http://localhost:5000/api";  // Update this
```

### Issue: Observations not created

**Check:**
1. Concept UUIDs exist in OpenMRS
2. User has permissions
3. Encounter type exists

**Fix:**
```sql
-- Check concepts exist
SELECT * FROM concept WHERE uuid IN (
  '159947AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  '1282AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
);

-- If not, use your actual concept UUIDs
```

## Success Criteria

✅ Patient data flows from Passport → OpenMRS  
✅ Diagnosis populates as observations  
✅ Medications populate as observations  
✅ Multi-hospital data is properly attributed  
✅ Doctors don't need to manually enter historical data  
✅ System is performant (< 2s response time)  
✅ Error handling works correctly  
✅ Audit logs are created  

## Next Steps

After successful testing:
1. Deploy to production environments
2. Train doctors on using the integration
3. Monitor performance and errors
4. Collect feedback for improvements
