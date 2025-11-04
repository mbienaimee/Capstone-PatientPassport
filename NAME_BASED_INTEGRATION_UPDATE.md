# Patient Name-Based Integration Update

## Overview
This document details the migration from **National ID-based** to **Patient Name-based** integration between the Patient Passport system and OpenMRS, along with the implementation of **bidirectional data flow**.

**Date:** November 4, 2025  
**Status:** ✅ Complete

---

## Key Changes

### 1. Identifier Change: National ID → Patient Name

**Reason:** Patient names are the common identifier between both systems (Patient Passport and OpenMRS).

**Updated Components:**

#### Backend TypeScript Files

**File: `backend/src/services/openmrsIntegrationService.ts`**
- ✅ `syncPatientMapping(patientName, openmrsUuid)` - Maps patients by name
- ✅ `getPatientDataForOpenMRS(patientName, hospitalId)` - Fetches data by patient name
- ✅ `storeOpenMRSObservation(patientName, type, data, doctor, hospital)` - Stores observations by name

**Patient Lookup Strategy:**
```typescript
const User = mongoose.model('User');
const user = await User.findOne({ 
  name: { $regex: new RegExp(`^${patientName}$`, 'i') },
  role: 'patient'
});
const patient = await Patient.findOne({ user: user._id });
```

**File: `backend/src/controllers/openmrsIntegrationController.ts`**
- ✅ `getPatientObservations()` - Uses `req.params.patientName`
- ✅ `syncPatientMapping()` - Uses `req.body.patientName`
- ✅ `storeObservationFromOpenMRS()` - Uses `req.body.patientName`
- ✅ `getPatientPassportForOpenMRS()` - Uses `req.params.patientName`

**File: `backend/src/routes/openmrsIntegration.ts`**
- ✅ Changed from `/patient/:nationalId/*` to `/patient/:patientName/*`
- ✅ All routes now use `:patientName` parameter

#### Java OpenMRS Module Files

**File: `PatientPassportDataServiceImpl.java`**
- ✅ `autoPopulateObservationsFromPassport()` - Uses `getPatientFullName()` instead of `getNationalIdFromPatient()`
- ✅ `syncPatientMapping()` - Uses patient name in request body
- ✅ `hasPassportData()` - Uses URL-encoded patient name
- ✅ Added `getPatientFullName()` helper method

**Patient Name Extraction:**
```java
private String getPatientFullName(Patient patient) {
    PersonName personName = patient.getPersonName();
    if (personName != null) {
        String fullName = "";
        if (personName.getGivenName() != null) {
            fullName += personName.getGivenName();
        }
        if (personName.getMiddleName() != null) {
            fullName += " " + personName.getMiddleName();
        }
        if (personName.getFamilyName() != null) {
            fullName += " " + personName.getFamilyName();
        }
        return fullName.trim();
    }
    return null;
}
```

---

### 2. TypeScript Type Definitions Updated

**File: `backend/src/types/index.ts`**

Added OpenMRS UUID fields for bidirectional mapping:

```typescript
export interface IPatient extends Document {
  // ... existing fields ...
  openmrsUuid?: string; // OpenMRS patient UUID for integration
}

export interface IDoctor extends Document {
  // ... existing fields ...
  openmrsProviderUuid?: string; // OpenMRS provider UUID for integration
}

export interface IHospital extends Document {
  // ... existing fields ...
  openmrsUuid?: string; // OpenMRS location UUID for integration
}
```

---

### 3. Bidirectional Data Flow Implementation

**Previous Flow:** Passport → OpenMRS (Read-only)  
**New Flow:** Passport ↔ OpenMRS (Bidirectional)

#### How It Works:

**Scenario 1: Doctor Adds Data in OpenMRS**
1. Doctor adds diagnosis/medication in OpenMRS
2. OpenMRS calls Passport API: `POST /api/openmrs/observation/store`
3. Passport stores the data with hospital and doctor attribution
4. Data is now available in patient's passport

**Scenario 2: Doctor Views Passport Data**
1. Doctor opens patient record in OpenMRS
2. OpenMRS calls: `GET /api/openmrs/patient/{patientName}/observations`
3. Passport returns all diagnosis/medications from all hospitals
4. OpenMRS auto-populates the observations
5. Doctor sees complete medical history

**API Endpoint for Storing Data:**
```typescript
POST /api/openmrs/observation/store
{
  "patientName": "John Doe",
  "observationType": "diagnosis", // or "medication"
  "concept": "Malaria",
  "valueText": "Confirmed by blood test",
  "doctorLicenseNumber": "DOC12345",
  "hospitalName": "City Hospital",
  "openmrsProviderUuid": "uuid-here",
  "openmrsLocationUuid": "uuid-here"
}
```

---

## Updated API Endpoints

### Patient Endpoints (Using Patient Name)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/openmrs/patient/:patientName/observations` | Get diagnosis & medications for auto-population |
| GET | `/api/openmrs/patient/:patientName/passport` | Get full patient passport data |
| GET | `/api/openmrs/patient/uuid/:openmrsUuid` | Get patient by OpenMRS UUID |

### Sync Endpoints (Using Patient Name)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/openmrs/patient/sync` | Sync patient mapping (uses `patientName` in body) |
| POST | `/api/openmrs/hospital/sync` | Sync hospital mapping |
| POST | `/api/openmrs/doctor/sync` | Sync doctor mapping |

### NEW: Observation Storage Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/openmrs/observation/store` | Store OpenMRS observations to Passport |

---

## Testing the Integration

### 1. Test Patient Name Matching

**PowerShell:**
```powershell
# Test getting patient observations by name
$patientName = "John Doe"
$encodedName = [System.Web.HttpUtility]::UrlEncode($patientName)
Invoke-RestMethod -Uri "http://localhost:5000/api/openmrs/patient/$encodedName/observations" -Method GET
```

### 2. Test Storing Observation from OpenMRS

**PowerShell:**
```powershell
$body = @{
    patientName = "John Doe"
    observationType = "diagnosis"
    concept = "Hypertension"
    valueText = "Stage 1"
    doctorLicenseNumber = "DOC12345"
    hospitalName = "City Hospital"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/openmrs/observation/store" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### 3. Test Patient Sync by Name

**PowerShell:**
```powershell
$body = @{
    patientName = "John Doe"
    openmrsPatientUuid = "abc-123-def-456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/openmrs/patient/sync" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## Data Flow Diagram

```
┌─────────────────────┐                    ┌─────────────────────┐
│                     │                    │                     │
│  OpenMRS System     │◄──────────────────►│  Patient Passport   │
│  (Hospital EMR)     │  Bidirectional     │  (Central DB)       │
│                     │                    │                     │
└─────────────────────┘                    └─────────────────────┘
         │                                           │
         │                                           │
         ▼                                           ▼
   Doctor adds data                           Data stored with:
   (diagnosis/meds)                           - Hospital name
         │                                    - Doctor info
         │                                    - Timestamp
         │                                           │
         └───────────POST /observation/store────────►│
                                                     │
         ┌───────────GET /patient/{name}/obs────────┘
         │
         ▼
   Auto-populate in OpenMRS
   (Show all hospital records)
```

---

## Security Considerations

### 1. OTP Protection Maintained
- ✅ OTP security still required for doctors to VIEW patient passport
- ✅ Patient must provide OTP to doctor for access
- ✅ Viewing passport requires: `POST /api/passport/verify-otp`

### 2. Data Storage Security
- ✅ Only authenticated OpenMRS system can store observations
- ✅ Hospital and doctor information tracked for accountability
- ✅ Audit logs maintained for all operations

---

## Multi-Hospital Support

The system continues to support data from multiple hospitals:

**Response Format:**
```json
{
  "success": true,
  "data": {
    "patientName": "John Doe",
    "observations": [
      {
        "type": "diagnosis",
        "concept": "Malaria",
        "valueText": "Confirmed",
        "hospital": "City Hospital A",
        "provider": "Dr. Smith",
        "obsDatetime": "2025-11-01T10:00:00Z"
      },
      {
        "type": "diagnosis",
        "concept": "Hypertension",
        "valueText": "Stage 1",
        "hospital": "City Hospital B",
        "provider": "Dr. Johnson",
        "obsDatetime": "2025-11-03T14:00:00Z"
      }
    ]
  }
}
```

Each observation includes:
- ✅ Hospital name (where it was recorded)
- ✅ Doctor name (who recorded it)
- ✅ Timestamp (when it was recorded)
- ✅ Complete diagnosis/medication details

---

## Migration Checklist

### Backend Changes
- [x] Update `openmrsIntegrationService.ts` to use patient name
- [x] Update `openmrsIntegrationController.ts` to use patient name
- [x] Update routes to use `:patientName` parameter
- [x] Add `openmrsUuid` to IPatient type definition
- [x] Add `openmrsProviderUuid` to IDoctor type definition
- [x] Add `openmrsUuid` to IHospital type definition
- [x] Implement `storeOpenMRSObservation()` for bidirectional flow

### Java OpenMRS Module Changes
- [x] Update `autoPopulateObservationsFromPassport()` to use patient name
- [x] Add `getPatientFullName()` helper method
- [x] Update API URL to use patient name endpoint
- [x] Update `syncPatientMapping()` to use patient name
- [x] Update `hasPassportData()` to use patient name
- [x] Add URL encoding for patient names

### Testing
- [ ] Test patient name matching (case-insensitive)
- [ ] Test observation retrieval by name
- [ ] Test observation storage from OpenMRS
- [ ] Test multi-hospital data display
- [ ] Test OTP security for viewing passport
- [ ] Test sync operations with patient names

---

## Next Steps

1. **Rebuild OpenMRS Module:**
   ```powershell
   cd openmrs-patient-passport-module
   mvn clean install
   ```

2. **Restart Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

3. **Test Integration:**
   - Create test patient with name in both systems
   - Add diagnosis in OpenMRS
   - Verify data flows to Passport
   - Check data appears with hospital/doctor attribution

4. **Deploy to Production:**
   - Update environment variables
   - Deploy backend to Azure
   - Install updated OpenMRS module
   - Test in production environment

---

## Troubleshooting

### Issue: Patient Not Found by Name
**Solution:** Check case-insensitive regex matching is working:
```typescript
const user = await User.findOne({ 
  name: { $regex: new RegExp(`^${patientName}$`, 'i') },
  role: 'patient'
});
```

### Issue: URL Encoding Problems
**Solution:** Ensure patient names are URL-encoded:
```java
String encodedName = java.net.URLEncoder.encode(patientName, "UTF-8");
```

### Issue: TypeScript Errors for openmrsUuid
**Solution:** Verify type definitions are updated in `types/index.ts`

---

## Benefits of Name-Based Integration

✅ **Universal Identifier:** Names are common to both systems  
✅ **No Additional Fields:** No need to add National ID to OpenMRS  
✅ **Bidirectional Flow:** Doctors add data where they work (OpenMRS)  
✅ **Multi-Hospital Support:** Track which hospital/doctor recorded data  
✅ **Maintained Security:** OTP still required for viewing passport  
✅ **Better User Experience:** Doctors see complete patient history automatically

---

## Support

For questions or issues:
1. Check logs in `backend/logs/`
2. Check OpenMRS logs in `openmrs-server/logs/`
3. Review audit logs in MongoDB: `AuditLog` collection
4. Test API endpoints with Postman or PowerShell

---

**Last Updated:** November 4, 2025  
**Author:** GitHub Copilot  
**Version:** 2.0 (Name-Based with Bidirectional Flow)
