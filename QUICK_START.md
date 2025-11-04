# 🎯 Quick Start: Patient Name-Based Integration

## ✅ What Was Done

### Summary
Successfully migrated the Patient Passport ↔ OpenMRS integration from **National ID-based** to **Patient Name-based** identification with **bidirectional data flow**.

### Key Changes

1. **Identifier Changed:** National ID → Patient Name
2. **Data Flow:** Read-only → Bidirectional (OpenMRS ↔ Passport)
3. **All Files Updated:** TypeScript backend + Java OpenMRS module
4. **Type Definitions Fixed:** Added `openmrsUuid` fields to Patient, Doctor, Hospital interfaces

---

## 📁 Files Modified

### Backend TypeScript Files
- ✅ `backend/src/services/openmrsIntegrationService.ts`
- ✅ `backend/src/controllers/openmrsIntegrationController.ts`
- ✅ `backend/src/routes/openmrsIntegration.ts`
- ✅ `backend/src/types/index.ts`

### Java OpenMRS Module Files
- ✅ `openmrs-patient-passport-module/omod/src/main/java/.../PatientPassportDataServiceImpl.java`

### Documentation Files Created
- ✅ `NAME_BASED_INTEGRATION_UPDATE.md` - Complete technical documentation
- ✅ `QUICK_START.md` - This file

---

## 🚀 How to Use

### 1. Doctor Adds Data in OpenMRS

When a doctor adds a diagnosis or medication in OpenMRS:

```
Doctor → OpenMRS → Auto-stores in Passport
```

**What happens automatically:**
- Diagnosis/medication is saved in OpenMRS
- OpenMRS calls Passport API: `POST /api/openmrs/observation/store`
- Data is stored in Passport with:
  - Patient name
  - Hospital name
  - Doctor information
  - Timestamp

### 2. Doctor Views Patient Passport in OpenMRS

When a doctor opens a patient record in OpenMRS:

```
OpenMRS → Fetches from Passport → Auto-populates observations
```

**What happens automatically:**
- OpenMRS calls: `GET /api/openmrs/patient/{patientName}/observations`
- Passport returns ALL diagnosis/medications from ALL hospitals
- OpenMRS displays complete medical history
- Doctor sees data from multiple hospitals

### 3. Other Doctors View Passport (OTP Required)

When other doctors need to view the full passport:

```
Doctor → Requests OTP from Patient → Views Passport
```

**Security maintained:**
- Patient gives OTP to doctor
- Doctor uses OTP to access passport
- Audit log records all access

---

## 🔑 Key API Endpoints

### Get Patient Data (for OpenMRS)
```
GET /api/openmrs/patient/{patientName}/observations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientName": "John Doe",
    "observations": [
      {
        "type": "diagnosis",
        "concept": "Malaria",
        "hospital": "City Hospital A",
        "provider": "Dr. Smith"
      },
      {
        "type": "medication",
        "valueDrug": "Paracetamol 500mg",
        "hospital": "City Hospital B",
        "provider": "Dr. Johnson"
      }
    ]
  }
}
```

### Store Observation (from OpenMRS to Passport)
```
POST /api/openmrs/observation/store
```

**Request Body:**
```json
{
  "patientName": "John Doe",
  "observationType": "diagnosis",
  "doctorLicenseNumber": "DOC12345",
  "hospitalName": "City Hospital",
  "observationData": {
    "diagnosis": "Hypertension",
    "details": "Stage 1",
    "status": "active"
  }
}
```

---

## 🧪 Testing

### Test 1: Get Patient Observations

**PowerShell:**
```powershell
$name = [System.Web.HttpUtility]::UrlEncode("John Doe")
Invoke-RestMethod -Uri "http://localhost:5000/api/openmrs/patient/$name/observations"
```

### Test 2: Store Diagnosis from OpenMRS

**PowerShell:**
```powershell
$body = @{
    patientName = "John Doe"
    observationType = "diagnosis"
    doctorLicenseNumber = "DOC12345"
    hospitalName = "City Hospital"
    observationData = @{
        diagnosis = "Malaria"
        details = "Confirmed by blood test"
        status = "active"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/openmrs/observation/store" `
    -Method POST -Body $body -ContentType "application/json"
```

### Test 3: Store Medication from OpenMRS

**PowerShell:**
```powershell
$body = @{
    patientName = "John Doe"
    observationType = "medication"
    doctorLicenseNumber = "DOC12345"
    hospitalName = "City Hospital"
    observationData = @{
        medicationName = "Amoxicillin 500mg"
        dosage = "1 tablet"
        frequency = "3 times daily"
        status = "active"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/openmrs/observation/store" `
    -Method POST -Body $body -ContentType "application/json"
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     BIDIRECTIONAL FLOW                       │
└──────────────────────────────────────────────────────────────┘

  OpenMRS System                    Patient Passport DB
  (Hospital EMR)                    (Central System)
        │                                   │
        │  1. Doctor adds diagnosis         │
        │     in OpenMRS                    │
        │                                   │
        ├──POST /observation/store─────────►│
        │   {patientName, diagnosis}        │
        │                                   │
        │                         2. Data stored with:
        │                            - Hospital name
        │                            - Doctor info
        │                            - Timestamp
        │                                   │
        │  3. Doctor opens patient          │
        │     record in OpenMRS             │
        │                                   │
        │◄──GET /patient/{name}/obs─────────┤
        │                                   │
        │  4. Auto-populate all            │
        │     diagnosis/medications         │
        │     from all hospitals            │
        │                                   │
```

---

## 📋 Patient Name Matching

### How It Works

**Case-Insensitive Matching:**
```typescript
// Backend finds patient by name
const user = await User.findOne({ 
  name: { $regex: new RegExp(`^${patientName}$`, 'i') },
  role: 'patient'
});
```

**Java URL Encoding:**
```java
// OpenMRS encodes patient name for API call
String encodedName = java.net.URLEncoder.encode(patientName, "UTF-8");
String url = PASSPORT_API_BASE_URL + "/openmrs/patient/" + encodedName + "/observations";
```

**Examples:**
- "John Doe" matches "john doe", "JOHN DOE", "John Doe"
- "Mary Jane Smith" matches "mary jane smith"
- Spaces and special characters are URL-encoded automatically

---

## 🏥 Multi-Hospital Support

### How It Works

Each observation includes hospital and doctor attribution:

```json
{
  "type": "diagnosis",
  "concept": "Malaria",
  "hospital": "City Hospital A",     ← Which hospital
  "provider": "Dr. Smith",            ← Which doctor
  "obsDatetime": "2025-11-01T10:00:00Z"  ← When recorded
}
```

**Benefits:**
- ✅ Doctors see patient's complete medical history
- ✅ Data from all hospitals is visible
- ✅ Each record shows source hospital and doctor
- ✅ Timestamps show when data was added

---

## 🔐 Security

### OTP Protection (Maintained)

**For viewing full passport:**
```
1. Patient → Generates OTP in Patient Passport app
2. Patient → Gives OTP to Doctor verbally
3. Doctor → Enters OTP in system
4. System → Verifies OTP and grants access
5. System → Logs access in audit trail
```

**For storing data (NEW):**
```
1. Doctor → Adds diagnosis/medication in OpenMRS
2. OpenMRS → Automatically stores in Passport
3. No OTP required (doctor is adding data, not viewing)
4. System → Logs the operation
```

---

## ⚠️ Important Notes

### 1. Patient Names Must Match Exactly
- The patient name in Passport must match OpenMRS
- Use full names (First + Middle + Last)
- Case doesn't matter (case-insensitive matching)

### 2. Doctor License Numbers Must Exist
- Doctor must be registered in Passport system
- License number must match exactly
- Use uppercase for consistency

### 3. Hospital Names Must Exist
- Hospital must be registered in Passport system
- Name matching is case-insensitive
- Use exact hospital name from database

---

## 🛠️ Next Steps

### 1. Rebuild OpenMRS Module

```powershell
cd openmrs-patient-passport-module
mvn clean install
```

### 2. Restart Backend

```powershell
cd backend
npm install
npm run dev
```

### 3. Test Integration

1. Create test patient in both systems with same name
2. Add diagnosis in OpenMRS
3. Verify data appears in Passport
4. Check hospital and doctor attribution
5. Test viewing from other hospital (with OTP)

### 4. Deploy

1. Deploy updated backend to Azure
2. Install updated OpenMRS module
3. Test in production
4. Monitor audit logs

---

## 📞 Support

**If patient not found:**
- Check patient name matches exactly between systems
- Verify patient has role 'patient' in User model
- Check case-insensitive regex is working

**If doctor not found:**
- Verify doctor license number exists in database
- Check license number format (use uppercase)
- Ensure doctor is linked to hospital

**If hospital not found:**
- Verify hospital name exists in database
- Check hospital name spelling
- Use case-insensitive matching

**Check logs:**
- Backend: `backend/logs/`
- OpenMRS: `openmrs-server/logs/`
- MongoDB: `AuditLog` collection

---

## ✨ Benefits

### For Doctors
- ✅ Complete patient history from all hospitals automatically
- ✅ No manual data entry required
- ✅ Add data in familiar OpenMRS interface
- ✅ Data flows to centralized passport automatically

### For Patients
- ✅ Medical records accessible across all hospitals
- ✅ No need to carry physical documents
- ✅ Control access via OTP
- ✅ Complete audit trail of who accessed data

### For Hospitals
- ✅ Reduced duplicate tests and procedures
- ✅ Better informed medical decisions
- ✅ Improved patient care coordination
- ✅ Compliance with data sharing regulations

---

**Last Updated:** November 4, 2025  
**Version:** 2.0 (Name-Based Bidirectional Integration)  
**Status:** ✅ Ready for Testing
