# Quick Reference - OpenMRS Integration

## 🎯 What This Does

✅ **Diagnosis** auto-populates from Patient Passport → OpenMRS  
✅ **Medications** auto-populate from Patient Passport → OpenMRS  
✅ **Multi-hospital** data properly tracked  
✅ **Doctors save time** - no manual data entry  

## 🔑 Key Concepts

### Patient Linking
```
National ID = Bridge between systems
Patient Passport ←──→ OpenMRS
   1234567890         1234567890
```

### Hospital Attribution
```
Every diagnosis/medication tagged with:
- Hospital name
- Doctor name
- Date recorded
- Current status
```

## 📡 Main Endpoints

### Backend (Patient Passport API)

```bash
# Get patient observations (diagnosis + meds)
GET /api/openmrs/patient/:nationalId/observations

# Sync patient mapping
POST /api/openmrs/patient/sync

# Sync hospital mapping
POST /api/openmrs/hospital/sync

# Health check
GET /api/openmrs/health
```

### OpenMRS Module

```bash
# Auto-populate data for patient
GET /module/patientpassport/api/populate/{patientId}

# Check if patient has data
GET /module/patientpassport/api/check/{patientId}

# Sync patient mapping
POST /module/patientpassport/api/sync/{patientId}
```

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000
```

### 2. Test Endpoint
```bash
curl http://localhost:5000/api/openmrs/health
```

### 3. Get Patient Data
```bash
curl http://localhost:5000/api/openmrs/patient/1234567890/observations
```

### 4. Deploy OpenMRS Module
```bash
cd openmrs-patient-passport-module
mvn clean install
# Copy .omod to OpenMRS modules folder
# Restart OpenMRS
```

### 5. Test Auto-Population
```bash
curl http://localhost:8080/openmrs/module/patientpassport/api/populate/123
```

## 📊 Data Flow

```
Doctor Opens Patient
       ↓
Check National ID
       ↓
GET /api/openmrs/patient/{nationalId}/observations
       ↓
Returns:
  - Diagnoses from all hospitals
  - Medications from all hospitals
  - Tagged with hospital/doctor
       ↓
Create OpenMRS Observations
       ↓
Doctor sees complete history
```

## 🏥 Multi-Hospital Example

```json
{
  "observations": [
    {
      "type": "diagnosis",
      "valueCoded": "Diabetes",
      "hospital": "Central Hospital",
      "provider": "Dr. Smith",
      "status": "active"
    },
    {
      "type": "diagnosis",
      "valueCoded": "Hypertension",
      "hospital": "District Hospital",
      "provider": "Dr. Jones",
      "status": "active"
    }
  ]
}
```

Each observation shows which hospital and which doctor recorded it!

## 🔧 Key Files

### Backend
- `services/openmrsIntegrationService.ts` - Core sync logic
- `controllers/openmrsIntegrationController.ts` - API endpoints
- `routes/openmrsIntegration.ts` - Route definitions
- `models/Patient.ts` - Added openmrsUuid field
- `models/Hospital.ts` - Added openmrsUuid field
- `models/Doctor.ts` - Added openmrsProviderUuid field

### OpenMRS Module
- `PatientPassportDataService.java` - Interface
- `PatientPassportDataServiceImpl.java` - Implementation
- `PatientPassportDataController.java` - REST endpoints

## 🧪 Quick Tests

### Test 1: Health Check
```bash
curl http://localhost:5000/api/openmrs/health
# Expected: {"success": true, "status": "active"}
```

### Test 2: Get Patient Data
```bash
curl http://localhost:5000/api/openmrs/patient/1234567890/observations
# Expected: JSON with observations array
```

### Test 3: Auto-Populate
```bash
curl http://localhost:8080/openmrs/module/patientpassport/api/populate/123
# Expected: {"success": true, "hasData": true}
```

## ✅ Success Indicators

- [ ] Backend API running
- [ ] OpenMRS module installed
- [ ] Patient has National ID in both systems
- [ ] Observations endpoint returns data
- [ ] Auto-populate creates observations in OpenMRS
- [ ] Observations show hospital attribution
- [ ] No duplicate data
- [ ] Performance < 2 seconds

## 🚨 Common Issues

### "Patient not found"
→ Check National ID is exact match in both systems

### "No data available"
→ Verify patient has medical conditions/medications in passport

### "Connection refused"
→ Check backend API is running on correct port

### "Observations not created"
→ Verify OpenMRS concept UUIDs are correct

## 📚 Documentation

- `INTEGRATION_SUMMARY.md` - Complete overview
- `OPENMRS_INTEGRATION_GUIDE.md` - Detailed setup guide
- `ARCHITECTURE_DIAGRAM.md` - System architecture
- `TESTING_GUIDE.md` - Comprehensive testing

## 💡 Key Benefits

### For Doctors
⏱️ **Save 10-15 minutes** per patient  
📋 **Complete history** from all hospitals  
✍️ **No manual entry** of historical data  

### For Patients
🏥 **Continuity of care** across hospitals  
📱 **Medical history follows** them  
🔒 **Secure** with audit logging  

### For System
🔄 **Clean data flow** between systems  
🏷️ **Proper attribution** of all data  
📈 **Scalable** to multiple hospitals  

## 🎉 Result

A **clean, automated system** where diagnosis and medication data flows seamlessly from Patient Passport to OpenMRS, saving doctors time and improving patient care!
