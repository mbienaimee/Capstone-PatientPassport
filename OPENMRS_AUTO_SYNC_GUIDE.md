# 🔄 OpenMRS Automatic Synchronization System

## 📋 Overview

This system automatically retrieves observations from **multiple OpenMRS databases** across different hospitals and synchronizes them to the Patient Passport system **in real-time**, eliminating the need for manual doctor entry.

## 🎯 Key Features

✅ **Automatic Database-to-Database Sync**
- Direct connection to OpenMRS MySQL databases
- Real-time observation retrieval
- No manual data entry required

✅ **Multi-Hospital Support**
- Connect to multiple OpenMRS instances simultaneously
- Each hospital maintains its own OpenMRS database
- Centralized patient passport with data from all hospitals

✅ **Intelligent Data Mapping**
- Automatic patient matching using National ID
- Smart categorization of observations (diagnosis, medication, tests, visits)
- Doctor and hospital auto-creation

✅ **Real-Time Updates**
- Configurable sync intervals (default: every 5 minutes)
- Manual sync on-demand
- Patient-specific sync capability

✅ **Comprehensive Auditing**
- All syncs logged
- Track data flow from source to destination
- Performance monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT PASSPORT BACKEND                 │
│                                                             │
│   ┌───────────────────────────────────────────────────┐   │
│   │         OpenMRS Sync Service                      │   │
│   │   (Auto-polls every 5 minutes)                    │   │
│   └───────────────┬───────────────────────────────────┘   │
│                   │                                         │
│                   ├─────────────┬─────────────┬────────    │
│                   ▼             ▼             ▼             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌─────────  │
│   │ Hospital 1       │  │ Hospital 2       │  │ Hospital  │
│   │ Connection Pool  │  │ Connection Pool  │  │ 3 Pool    │
│   └─────────┬────────┘  └─────────┬────────┘  └────┬──    │
└─────────────┼─────────────────────┼────────────────┼───────┘
              │                     │                │
              │ MySQL               │ MySQL          │ MySQL
              ▼                     ▼                ▼
    ┌───────────────────┐ ┌───────────────────┐ ┌─────────
    │  Hospital 1       │ │  Hospital 2       │ │ Hospital
    │  OpenMRS Database │ │  OpenMRS Database │ │ 3 OpenMRS
    │                   │ │                   │ │ Database
    │  ┌─────────────┐  │ │  ┌─────────────┐  │ │  ┌──────
    │  │ obs         │  │ │  │ obs         │  │ │  │ obs
    │  │ person      │  │ │  │ person      │  │ │  │ perso
    │  │ encounter   │  │ │  │ encounter   │  │ │  │ encou
    │  │ location    │  │ │  │ location    │  │ │  │ locat
    │  │ provider    │  │ │  │ provider    │  │ │  │ provi
    │  └─────────────┘  │ │  └─────────────┘  │ │  └──────
    └───────────────────┘ └───────────────────┘ └─────────
```

### Data Flow

```
Doctor saves observation in OpenMRS Hospital 1
                ↓
Observation stored in obs table (MySQL)
                ↓
Patient Passport Sync Service polls (every 5 min)
                ↓
Retrieves new observations from obs table
                ↓
Matches patient using National ID
                ↓
Categorizes observation type (diagnosis/medication/test)
                ↓
Gets/creates doctor and hospital records
                ↓
Stores in Patient Passport MongoDB
                ↓
Updates patient medical history
                ↓
Patient sees observation in their passport INSTANTLY
```

---

## 📦 Installation & Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install mysql2
```

This installs the MySQL client library for connecting to OpenMRS databases.

### Step 2: Get Hospital IDs from MongoDB

Connect to your Patient Passport MongoDB and get hospital IDs:

```javascript
// In MongoDB Compass or mongosh
use patientpassport

db.hospitals.find({}, { _id: 1, name: 1, registrationNumber: 1 })

// Example output:
// { "_id": ObjectId("60a7c2f5e4b0c1a2d3e4f5a6"), "name": "Central Hospital" }
// { "_id": ObjectId("60a7c2f5e4b0c1a2d3e4f5a7"), "name": "District Hospital" }
```

### Step 3: Get OpenMRS Database Connection Details

For each hospital running OpenMRS, you need:

1. **MySQL Host**: IP address or hostname (e.g., `192.168.1.10` or `openmrs-central.hospital.com`)
2. **MySQL Port**: Usually `3306`
3. **Database Name**: Usually `openmrs`
4. **MySQL Username**: Create a read-only user
5. **MySQL Password**: Password for that user

#### Creating Read-Only MySQL User (RECOMMENDED)

```sql
-- Connect to OpenMRS MySQL as admin
mysql -u root -p

-- Create read-only user for sync
CREATE USER 'passport_sync'@'%' IDENTIFIED BY 'your_secure_password';

-- Grant read permissions on OpenMRS database
GRANT SELECT ON openmrs.* TO 'passport_sync'@'%';

-- Apply changes
FLUSH PRIVILEGES;
```

### Step 4: Configure Environment Variables

Add to `backend/.env`:

```bash
# OpenMRS Sync Configuration
OPENMRS_AUTO_START_SYNC=true
OPENMRS_SYNC_INTERVAL=5
OPENMRS_MAX_RECORDS=1000
OPENMRS_DETAILED_LOGS=true

# Hospital 1 - Central Hospital
HOSPITAL_1_ID=60a7c2f5e4b0c1a2d3e4f5a6
HOSPITAL_1_NAME=Central Hospital
HOSPITAL_1_DB_HOST=192.168.1.10
HOSPITAL_1_DB_PORT=3306
HOSPITAL_1_DB_NAME=openmrs
HOSPITAL_1_DB_USER=passport_sync
HOSPITAL_1_DB_PASSWORD=secure_password_1
HOSPITAL_1_ENABLED=true

# Hospital 2 - District Hospital
HOSPITAL_2_ID=60a7c2f5e4b0c1a2d3e4f5a7
HOSPITAL_2_NAME=District Hospital
HOSPITAL_2_DB_HOST=192.168.1.20
HOSPITAL_2_DB_PORT=3306
HOSPITAL_2_DB_NAME=openmrs
HOSPITAL_2_DB_USER=passport_sync
HOSPITAL_2_DB_PASSWORD=secure_password_2
HOSPITAL_2_ENABLED=true

# Hospital 3 - Regional Hospital
HOSPITAL_3_ID=60a7c2f5e4b0c1a2d3e4f5a8
HOSPITAL_3_NAME=Regional Hospital
HOSPITAL_3_DB_HOST=192.168.1.30
HOSPITAL_3_DB_PORT=3306
HOSPITAL_3_DB_NAME=openmrs
HOSPITAL_3_DB_USER=passport_sync
HOSPITAL_3_DB_PASSWORD=secure_password_3
HOSPITAL_3_ENABLED=true
```

### Step 5: Test Database Connectivity

Before starting the sync, test if you can connect to OpenMRS databases:

```bash
# Test from Patient Passport server
mysql -h 192.168.1.10 -P 3306 -u passport_sync -p openmrs

# If successful, test a query
SELECT COUNT(*) FROM obs;
```

### Step 6: Start the Backend

```bash
cd backend
npm run dev
```

Look for these logs:

```
🔄 ═══════════════════════════════════════════════════════
🔄 Initializing OpenMRS Auto-Sync Service
🔄 ═══════════════════════════════════════════════════════

🔌 Initializing OpenMRS database connections for 3 hospitals...
✅ Connected to Central Hospital OpenMRS database
✅ Connected to District Hospital OpenMRS database
✅ Connected to Regional Hospital OpenMRS database
✅ Initialized 3 database connections

🔄 Auto-starting sync service with 5 minute interval...

PatientPassport API Server is running!
Server: http://localhost:5000
OpenMRS Sync: ENABLED
```

---

## 🎮 Usage

### Automatic Synchronization

Once configured, the system automatically:

1. **Polls all OpenMRS databases** every 5 minutes (configurable)
2. **Retrieves new observations** created since last sync
3. **Matches patients** using National ID
4. **Creates doctor/hospital** records if they don't exist
5. **Stores observations** in Patient Passport MongoDB
6. **Updates patient records** with new data

### Manual Synchronization

#### Via API Endpoints

**Start Auto-Sync:**
```bash
POST http://localhost:5000/api/openmrs-sync/start
Authorization: Bearer <admin_token>

Body:
{
  "intervalMinutes": 5
}
```

**Stop Auto-Sync:**
```bash
POST http://localhost:5000/api/openmrs-sync/stop
Authorization: Bearer <admin_token>
```

**Sync All Hospitals Now:**
```bash
POST http://localhost:5000/api/openmrs-sync/sync-all
Authorization: Bearer <admin_token>
```

**Sync Specific Patient:**
```bash
POST http://localhost:5000/api/openmrs-sync/sync-patient/1234567890123
Authorization: Bearer <doctor_or_admin_token>
```

**Check Sync Status:**
```bash
GET http://localhost:5000/api/openmrs-sync/status
Authorization: Bearer <admin_token>
```

---

## 📊 OpenMRS Database Schema Reference

The sync service reads from these OpenMRS tables:

### `obs` table (Observations)
```sql
obs_id          - Primary key
person_id       - Patient identifier
concept_id      - Type of observation
encounter_id    - Link to encounter
obs_datetime    - When observation was made
location_id     - Where observation was made
value_coded     - Coded value (references concept)
value_text      - Text value
value_numeric   - Numeric value
comments        - Additional notes
creator         - Who created the observation
date_created    - Timestamp
voided          - Deleted flag
```

### `concept_name` table (Concept Definitions)
```sql
concept_id      - Links to obs.concept_id
name            - Concept name (e.g., "Diagnosis", "Medication")
locale          - Language
concept_name_type - Type (FULLY_SPECIFIED, SHORT, etc.)
```

### `patient_identifier` table (Patient IDs)
```sql
patient_id      - Patient ID
identifier      - National ID or other identifier
identifier_type - Type of identifier
voided          - Deleted flag
```

### `person_name` table (Person Names)
```sql
person_id       - Links to patient
given_name      - First name
family_name     - Last name
```

### `provider` table (Healthcare Providers)
```sql
provider_id     - Primary key
person_id       - Links to person
identifier      - Provider identifier
retired         - Inactive flag
```

### `location` table (Facilities)
```sql
location_id     - Primary key
name            - Location name
```

---

## 🔄 How Observations Are Mapped

### Observation Type Detection

The sync service categorizes observations automatically:

| OpenMRS Concept Contains | Patient Passport Type |
|--------------------------|----------------------|
| DIAGNOSIS, CONDITION, DISEASE, PROBLEM | `condition` |
| MEDICATION, DRUG, PRESCRIPTION | `medication` |
| TEST, LAB, INVESTIGATION, SCAN | `test` |
| VISIT, ENCOUNTER, ADMISSION | `visit` |

### Value Extraction

```javascript
if (obs.value_coded) {
  // Coded value - look up concept name
  value = getConceptName(obs.value_coded)
} else if (obs.value_text) {
  // Text value - use as is
  value = obs.value_text
} else if (obs.value_numeric) {
  // Numeric value - convert to string
  value = obs.value_numeric.toString()
}
```

### Patient Matching

```sql
-- Find patient by National ID
SELECT pi.identifier, pi.patient_id
FROM patient_identifier pi
JOIN patient_identifier_type pit 
  ON pi.identifier_type = pit.patient_identifier_type_id
WHERE pit.name LIKE '%National%ID%'
  AND pi.identifier = '1234567890123'
  AND pi.voided = 0
```

### Doctor/Hospital Auto-Creation

If doctor doesn't exist:
```typescript
// Create placeholder user
User.create({
  name: "Dr. John Doe",
  email: "PROVIDER_123@openmrs.auto",
  password: randomPassword(),
  role: "doctor"
})

// Create doctor record
Doctor.create({
  user: userId,
  specialization: "General Practice",
  licenseNumber: "PROVIDER_123",
  hospital: hospitalId,
  openmrsProviderUuid: "PROVIDER_123"
})
```

---

## 🎯 Example Sync Flow

### Scenario: Doctor records diagnosis in OpenMRS

1. **Doctor Action:**
   ```
   - Opens patient record in OpenMRS (Hospital 1)
   - Patient: Marie Reine (National ID: 1234567890123)
   - Adds diagnosis: "Diabetes Type 2"
   - Saves observation
   ```

2. **OpenMRS Database:**
   ```sql
   INSERT INTO obs (
     person_id, concept_id, obs_datetime, 
     value_coded, location_id, creator
   ) VALUES (
     5678,  -- person_id
     120,   -- concept "DIAGNOSIS"
     NOW(), 
     456,   -- concept "Diabetes Type 2"
     10,    -- location "Outpatient Clinic"
     789    -- provider "Dr. John Doe"
   )
   ```

3. **Sync Service (5 minutes later):**
   ```
   ✓ Connects to Hospital 1 OpenMRS database
   ✓ Queries: SELECT * FROM obs WHERE date_created > last_sync
   ✓ Finds 1 new observation
   ✓ Gets concept name: "DIAGNOSIS"
   ✓ Gets value: "Diabetes Type 2"
   ✓ Gets provider: "Dr. John Doe"
   ✓ Gets location: "Outpatient Clinic"
   ```

4. **Patient Matching:**
   ```
   ✓ Looks up National ID from patient_identifier
   ✓ Finds: 1234567890123
   ✓ Searches Patient Passport: Patient.findOne({ nationalId: '1234567890123' })
   ✓ Match found: Marie Reine
   ```

5. **Doctor Matching:**
   ```
   ✓ Searches for doctor: Doctor.findOne({ openmrsProviderUuid: 'PROVIDER_789' })
   ✓ Not found - creates placeholder:
     - Name: "Dr. John Doe"
     - Email: "provider789@openmrs.auto"
     - License: "PROVIDER_789"
     - Hospital: Hospital 1
   ```

6. **Data Storage:**
   ```javascript
   MedicalRecord.create({
     patientId: marie_reine_id,
     type: 'condition',
     data: {
       name: 'Diagnosis',
       details: 'Diabetes Type 2',
       diagnosed: '2025-11-06T10:30:00',
       procedure: 'Synced from OpenMRS - Provider: Dr. John Doe'
     },
     createdBy: dr_john_doe_id
   })
   
   // Update patient record
   patient.medicalHistory.push(record_id)
   patient.save()
   ```

7. **Result:**
   ```
   ✅ Marie Reine logs into Patient Passport
   ✅ Sees new diagnosis: "Diabetes Type 2"
   ✅ Recorded by: Dr. John Doe (Hospital 1)
   ✅ Date: Nov 6, 2025, 10:30 AM
   ```

---

## 🛠️ Troubleshooting

### Issue: Cannot connect to OpenMRS database

**Symptoms:**
```
❌ Failed to connect to Central Hospital: ER_ACCESS_DENIED_ERROR
```

**Solutions:**
1. Check MySQL user credentials
2. Verify user has SELECT permissions
3. Check firewall allows connection from Patient Passport server
4. Test with `mysql` command line client

### Issue: Patients not found

**Symptoms:**
```
⚠️ Patient not found for person_id 5678, skipping...
```

**Solutions:**
1. Verify National ID format matches in both systems
2. Check `patient_identifier_type` configuration
3. Ensure patients are registered in Patient Passport first

### Issue: No observations syncing

**Symptoms:**
```
Found 0 new observations
```

**Solutions:**
1. Check last sync timestamp: `db.syncstatus.find()`
2. Verify observations exist: `SELECT COUNT(*) FROM obs WHERE voided = 0`
3. Check if sync interval is too short
4. Manually reset last sync: `db.syncstatus.deleteMany({})`

### Issue: Duplicate records

**Symptoms:**
- Same observation appears multiple times

**Solutions:**
1. Check duplicate prevention logic in `storeMedicalRecord()`
2. Verify unique indexes on MedicalRecord collection
3. Clear duplicate records manually

---

## 📈 Performance Optimization

### Recommended Settings

```bash
# For small hospitals (< 1000 patients)
OPENMRS_SYNC_INTERVAL=5
OPENMRS_MAX_RECORDS=500

# For medium hospitals (1000-10000 patients)
OPENMRS_SYNC_INTERVAL=10
OPENMRS_MAX_RECORDS=1000

# For large hospitals (> 10000 patients)
OPENMRS_SYNC_INTERVAL=15
OPENMRS_MAX_RECORDS=2000
```

### Database Indexing

Ensure these indexes exist in OpenMRS:

```sql
CREATE INDEX idx_obs_date_created ON obs(date_created);
CREATE INDEX idx_obs_person_id ON obs(person_id);
CREATE INDEX idx_obs_voided ON obs(voided);
CREATE INDEX idx_patient_identifier ON patient_identifier(identifier);
```

### Connection Pooling

Adjust pool size based on number of hospitals:

```typescript
// openmrsConfig.ts
connectionPoolSize: 10 * numberOfHospitals
```

---

## 🔒 Security Best Practices

1. **Read-Only Database User**
   - Create dedicated MySQL user with SELECT only
   - No INSERT/UPDATE/DELETE permissions

2. **Network Security**
   - Use VPN or private network between servers
   - Implement IP whitelisting on MySQL
   - Use SSL/TLS for MySQL connections (production)

3. **Credential Management**
   - Store passwords in environment variables
   - Use secret management (Azure Key Vault, AWS Secrets Manager)
   - Rotate passwords regularly

4. **Audit Logging**
   - All sync operations logged
   - Monitor for unusual patterns
   - Alert on sync failures

5. **Data Privacy**
   - HIPAA/GDPR compliance
   - Encrypt data in transit
   - Limit data exposure

---

## 📚 API Reference

### POST /api/openmrs-sync/initialize

Initialize database connections.

**Body:**
```json
{
  "hospitals": [
    {
      "hospitalId": "60a7c2f5e4b0c1a2d3e4f5a6",
      "hospitalName": "Central Hospital",
      "host": "192.168.1.10",
      "port": 3306,
      "database": "openmrs",
      "user": "passport_sync",
      "password": "secure_password"
    }
  ]
}
```

### POST /api/openmrs-sync/start

Start automatic synchronization.

**Body:**
```json
{
  "intervalMinutes": 5
}
```

### POST /api/openmrs-sync/stop

Stop automatic synchronization.

### POST /api/openmrs-sync/sync-all

Trigger immediate sync for all hospitals.

### POST /api/openmrs-sync/sync-patient/:nationalId

Sync specific patient from all hospitals.

**Parameters:**
- `nationalId` - Patient's national ID

### GET /api/openmrs-sync/status

Get synchronization status and recent logs.

---

## 🎉 Success Indicators

After successful setup, you should see:

✅ **Server Logs:**
```
✅ Connected to Central Hospital OpenMRS database
✅ Connected to District Hospital OpenMRS database
🔄 Starting automatic sync every 5 minutes...
✅ Synced: 15 observations
   Hospital Central Hospital: 8 observations
   Hospital District Hospital: 7 observations
```

✅ **Patient Experience:**
- Doctor saves observation in OpenMRS
- Within 5 minutes, observation appears in Patient Passport
- No manual entry required
- Data includes source hospital and doctor

✅ **Multi-Hospital View:**
- Patient sees observations from all hospitals
- Each observation tagged with hospital name
- Complete medical history in one place

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Monitor sync logs** (daily)
2. **Check error rates** (weekly)
3. **Review performance** (monthly)
4. **Update credentials** (quarterly)
5. **Database optimization** (annually)

### Monitoring Queries

```javascript
// Check recent syncs
db.auditlogs.find({ 
  action: 'openmrs_auto_sync' 
}).sort({ createdAt: -1 }).limit(10)

// Check sync errors
db.auditlogs.find({ 
  action: 'openmrs_auto_sync',
  'changes.errorCount': { $gt: 0 }
})

// Count synced records by hospital
db.medicalrecords.aggregate([
  {
    $group: {
      _id: '$data.hospital',
      count: { $sum: 1 }
    }
  }
])
```

---

## 🚀 Next Steps

1. ✅ Install dependencies: `npm install mysql2`
2. ✅ Configure `.env` with hospital database details
3. ✅ Test database connectivity
4. ✅ Start backend server
5. ✅ Monitor sync logs
6. ✅ Verify observations appear in Patient Passport
7. ✅ Train hospital staff on automatic sync
8. ✅ Set up monitoring and alerts

---

**Version:** 1.0.0  
**Last Updated:** November 6, 2025  
**Author:** Patient Passport Development Team
