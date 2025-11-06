# ✅ OpenMRS → Patient Passport Integration (FINAL)

## 🎯 Correct Data Flow

```
┌─────────────────────┐                    ┌─────────────────────┐
│   OpenMRS System    │  DATA FLOWS TO →   │  Patient Passport   │
│   (Hospital EMR)    │ ←───────────────── │  (Central System)   │
│  SOURCE OF TRUTH    │   (ONE WAY)        │   STORAGE ONLY      │
└─────────────────────┘                    └─────────────────────┘
```

## 📋 What Was Updated

### ✅ Removed (Wrong Direction):
- ❌ `autoPopulateObservationsFromPassport()` - Removed (wrong direction)
- ❌ `hasPassportData()` - Removed (not needed)
- ❌ Auto-fetch endpoints - Removed (data doesn't flow FROM Passport)

### ✅ Kept (Correct Direction - OpenMRS → Passport):
- ✅ `sendObservationToPassport()` - Sends data TO Passport
- ✅ `syncPatientMapping()` - Syncs patient mapping

## 🔧 Updated Files

### 1. PatientPassportDataService.java (Interface)
**Location:** `omod/src/main/java/.../service/PatientPassportDataService.java`

**Methods:**
```java
// Send observation from OpenMRS to Passport
boolean sendObservationToPassport(Patient patient, Obs obs, String observationType);

// Sync patient mapping
boolean syncPatientMapping(Patient patient);
```

### 2. PatientPassportDataServiceImpl.java (Implementation)
**Location:** `omod/src/main/java/.../service/impl/PatientPassportDataServiceImpl.java`

**Key Method:**
```java
public boolean sendObservationToPassport(Patient patient, Obs obs, String observationType) {
    // Extract patient name
    String patientName = getPatientFullName(patient);
    
    // Build request body
    Map<String, Object> requestBody = new HashMap<>();
    requestBody.put("patientName", patientName);
    requestBody.put("observationType", observationType); // "diagnosis" or "medication"
    requestBody.put("doctorLicenseNumber", doctorLicense);
    requestBody.put("hospitalName", hospitalName);
    requestBody.put("observationData", observationData);
    
    // POST to Passport API
    POST https://patientpassport-api.azurewebsites.net/api/openmrs/observation/store
    
    return success;
}
```

### 3. PatientPassportDataController.java (REST Controller)
**Location:** `omod/src/main/java/.../web/controller/PatientPassportDataController.java`

**Endpoints:**
- `POST /module/patientpassport/api/send/{obsId}?type=diagnosis` - Send diagnosis
- `POST /module/patientpassport/api/send/{obsId}?type=medication` - Send medication  
- `POST /module/patientpassport/api/sync/{patientId}` - Sync patient mapping
- `GET /module/patientpassport/api/health` - Health check

## 🚀 How To Use After Upload

### Step 1: Upload Module to OpenMRS
1. Build the module:
   ```bash
   cd openmrs-patient-passport-module
   mvn clean install
   ```

2. Upload `omod/target/patientpassport-*.omod` to OpenMRS
   - Admin → Manage Modules → Add/Update Module

### Step 2: Manual Integration (For Now)

Since auto-sending is not implemented yet, doctors will need to manually trigger sending data to Passport.

**Option A: Via REST API Call**
```bash
# Send a diagnosis observation
curl -X POST "http://openmrs-server:8080/openmrs/module/patientpassport/api/send/123?type=diagnosis"

# Send a medication observation
curl -X POST "http://openmrs-server:8080/openmrs/module/patientpassport/api/send/456?type=medication"
```

**Option B: Future Implementation (Recommended)**
Create an OpenMRS event listener that automatically calls `sendObservationToPassport()` whenever:
- A doctor saves a new diagnosis
- A doctor saves a new medication

### Step 3: Sync Patient Mapping
```bash
# Sync patient mapping (one-time per patient)
curl -X POST "http://openmrs-server:8080/openmrs/module/patientpassport/api/sync/789"
```

## 📊 Data Flow Example

### Doctor Adds Diagnosis in OpenMRS:

1. **Doctor enters in OpenMRS:**
   - Patient: "John Doe"
   - Diagnosis: "Malaria"
   - Details: "Confirmed by blood test"

2. **OpenMRS saves to MySQL database**

3. **Doctor (or system) calls:**
   ```
   POST /module/patientpassport/api/send/123?type=diagnosis
   ```

4. **Module extracts data and calls Passport API:**
   ```json
   POST https://patientpassport-api.azurewebsites.net/api/openmrs/observation/store
   {
     "patientName": "John Doe",
     "observationType": "diagnosis",
     "doctorLicenseNumber": "OPENMRS_PROVIDER",
     "hospitalName": "City Hospital",
     "observationData": {
       "diagnosis": "Malaria",
       "details": "Confirmed by blood test",
       "status": "active",
       "date": "2025-11-04T10:30:00Z"
     }
   }
   ```

5. **Passport stores in MongoDB with:**
   - Patient name: "John Doe"
   - Hospital: "City Hospital"
   - Doctor: "OPENMRS_PROVIDER"
   - Timestamp: "2025-11-04T10:30:00Z"

6. **Data now available for other doctors** (with OTP from patient)

## 🔐 Security & Access

### Adding Data (No OTP Required):
- Doctor adds data in OpenMRS → Automatically stored in Passport
- No OTP needed because doctor is **adding** data, not viewing

### Viewing Data (OTP Required):
- Doctor wants to view full passport → Patient gives OTP → Doctor accesses passport
- This ensures patient privacy and control

## ⚠️ Important Notes

### Patient Names Must Match:
- OpenMRS: "John Doe"
- Passport: "John Doe" ✅
- Case-insensitive matching works

### Hospital Must Exist in Passport:
- Hospital name from OpenMRS must exist in Passport database
- Use exact hospital names

### Doctor License Numbers:
- Currently uses OpenMRS username as fallback
- For production, map to actual license numbers

## 🧪 Testing

### Test 1: Health Check
```bash
curl http://openmrs-server:8080/openmrs/module/patientpassport/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OpenMRS Patient Passport module is running",
  "dataFlow": "OpenMRS → Patient Passport"
}
```

### Test 2: Send Diagnosis
```bash
# Assuming observation ID 123 exists
curl -X POST "http://openmrs-server:8080/openmrs/module/patientpassport/api/send/123?type=diagnosis"
```

**Check OpenMRS Logs:**
```
📤 Sending diagnosis to Patient Passport for patient: 123
📡 Sending to: https://patientpassport-api.azurewebsites.net/api/openmrs/observation/store
📦 Patient: John Doe, Hospital: City Hospital
✅ Successfully sent diagnosis to Patient Passport
```

### Test 3: Verify in Passport
```bash
# Check data in Passport database
curl "https://patientpassport-api.azurewebsites.net/api/openmrs/patient/John%20Doe/observations"
```

## 🔄 Future Enhancements

### Auto-Send Feature (Recommended):
Create an OpenMRS event listener to automatically send observations:

```java
@Component
public class ObservationEventListener {
    
    @EventListener
    public void onObservationSaved(ObsSavedEvent event) {
        Obs obs = event.getObs();
        
        // Determine type
        String type = isDiagnosis(obs) ? "diagnosis" : "medication";
        
        // Send to Passport
        dataService.sendObservationToPassport(obs.getPerson().getPatient(), obs, type);
    }
}
```

This would make it fully automatic - no manual API calls needed!

## 📞 Support

**Check Logs:**
- OpenMRS: `openmrs-server/logs/openmrs.log`
- Passport: MongoDB AuditLog collection

**Common Issues:**
- "Patient not found" → Names don't match
- "Connection refused" → Passport API not accessible
- "Hospital not found" → Hospital doesn't exist in Passport DB

---

**Version:** 3.0 (Correct One-Way Flow)  
**Date:** November 4, 2025  
**Status:** ✅ Ready for Testing
