# 🏗️ OpenMRS-Patient Passport Integration Architecture

## System Overview

This document describes the **automatic, real-time synchronization** between multiple OpenMRS installations and the centralized Patient Passport system.

## Architecture Principles

1. **Direct Database Access**: Patient Passport directly reads OpenMRS MySQL databases
2. **Multi-Hospital Support**: Each hospital runs its own OpenMRS instance
3. **Read-Only**: Patient Passport only reads from OpenMRS (never writes)
4. **Automatic Sync**: Periodic polling retrieves new observations
5. **No Manual Entry**: Doctors work only in OpenMRS, data flows automatically

## System Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                    PATIENT PASSPORT SYSTEM                         │
│                                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   Frontend   │◄───┤   Backend    │◄───┤  MongoDB Atlas   │   │
│  │  (React)     │    │  (Node.js)   │    │  (Passport Data) │   │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘   │
│                              │                                     │
│                      ┌───────▼──────────┐                         │
│                      │  OpenMRS Sync    │                         │
│                      │     Service      │                         │
│                      │                  │                         │
│                      │  - Connection    │                         │
│                      │    Pool Manager  │                         │
│                      │  - Observation   │                         │
│                      │    Fetcher       │                         │
│                      │  - Data Mapper   │                         │
│                      │  - Patient       │                         │
│                      │    Matcher       │                         │
│                      └─┬─────┬────┬────┘                         │
│                        │     │    │                               │
└────────────────────────┼─────┼────┼───────────────────────────────┘
                         │     │    │
          ┌──────────────┘     │    └──────────────┐
          │ MySQL              │ MySQL             │ MySQL
          │ Read-Only          │ Read-Only         │ Read-Only
          ▼                    ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  HOSPITAL 1     │  │  HOSPITAL 2     │  │  HOSPITAL 3     │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │  OpenMRS    │ │  │ │  OpenMRS    │ │  │ │  OpenMRS    │ │
│ │  (Tomcat)   │ │  │ │  (Tomcat)   │ │  │ │  (Tomcat)   │ │
│ └──────┬──────┘ │  │ └──────┬──────┘ │  │ └──────┬──────┘ │
│        │        │  │        │        │  │        │        │
│ ┌──────▼──────┐ │  │ ┌──────▼──────┐ │  │ ┌──────▼──────┐ │
│ │   MySQL     │ │  │ │   MySQL     │ │  │ │   MySQL     │ │
│ │             │ │  │ │             │ │  │ │             │ │
│ │ • obs       │ │  │ │ • obs       │ │  │ │ • obs       │ │
│ │ • person    │ │  │ │ • person    │ │  │ │ • person    │ │
│ │ • encounter │ │  │ │ • encounter │ │  │ │ • encounter │ │
│ │ • concept   │ │  │ │ • concept   │ │  │ │ • concept   │ │
│ │ • provider  │ │  │ │ • provider  │ │  │ │ • provider  │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Data Flow Sequence

### 1. Doctor Creates Observation in OpenMRS

```
Doctor (Hospital 1)
    ↓
Opens Patient: John Doe
    ↓
Adds Observation:
- Type: Diagnosis
- Value: Malaria
- Date: 2025-11-06
    ↓
Saves in OpenMRS
    ↓
Stored in MySQL obs table:
  obs_id: 12345
  person_id: 789
  concept_id: 102 (Diagnosis)
  value_coded: 456 (Malaria)
  obs_datetime: 2025-11-06 10:30:00
  location_id: 5
  creator: 100
```

### 2. Sync Service Polls (Every 5 Minutes)

```
OpenMRS Sync Service Timer
    ↓
Iterate through all hospitals
    ↓
For Hospital 1:
    ↓
Execute Query:
  SELECT * FROM obs 
  WHERE date_created > last_sync_time
    AND voided = 0
  ORDER BY date_created ASC
  LIMIT 1000
    ↓
Fetches 1 new observation (ID: 12345)
```

### 3. Data Enrichment

```
Observation Retrieved (obs_id: 12345)
    ↓
Get Concept Name:
  SELECT name FROM concept_name 
  WHERE concept_id = 102 
    AND locale = 'en'
    AND concept_name_type = 'FULLY_SPECIFIED'
  Result: "DIAGNOSIS"
    ↓
Get Value Name:
  SELECT name FROM concept_name 
  WHERE concept_id = 456
  Result: "Malaria"
    ↓
Get Provider Info:
  SELECT u.username, pn.given_name, pn.family_name
  FROM users u
  JOIN person_name pn ON u.person_id = pn.person_id
  WHERE u.user_id = 100
  Result: Dr. Jane Smith
    ↓
Get Location:
  SELECT name FROM location 
  WHERE location_id = 5
  Result: "Outpatient Clinic"
```

### 4. Patient Matching

```
Get Patient National ID from OpenMRS:
  SELECT pi.identifier
  FROM patient_identifier pi
  JOIN patient_identifier_type pit 
    ON pi.identifier_type = pit.patient_identifier_type_id
  WHERE pi.patient_id = 789
    AND pit.name LIKE '%National%ID%'
    AND pi.voided = 0
  Result: "1234567890123"
    ↓
Search Patient Passport MongoDB:
  db.patients.findOne({ 
    nationalId: "1234567890123" 
  })
  Result: Found patient (ObjectId: xyz123)
```

### 5. Doctor/Hospital Mapping

```
Search for Doctor:
  db.doctors.findOne({
    openmrsProviderUuid: "PROVIDER_100"
  })
  Result: Not found
    ↓
Create Placeholder User:
  db.users.create({
    name: "Dr. Jane Smith",
    email: "provider100@openmrs.auto",
    password: randomHash(),
    role: "doctor",
    isEmailVerified: true
  })
    ↓
Create Doctor Record:
  db.doctors.create({
    user: userId,
    specialization: "General Practice",
    licenseNumber: "PROVIDER_100",
    hospital: hospitalId,
    openmrsProviderUuid: "PROVIDER_100"
  })
```

### 6. Observation Storage

```
Categorize Observation:
  conceptName: "DIAGNOSIS"
  → type: "condition"
    ↓
Store in Patient Passport:
  db.medicalrecords.create({
    patientId: xyz123,
    type: "condition",
    data: {
      name: "DIAGNOSIS",
      details: "Malaria",
      diagnosed: "2025-11-06T10:30:00",
      procedure: "Synced from OpenMRS - Dr. Jane Smith"
    },
    createdBy: doctorId
  })
    ↓
Update Patient:
  db.patients.updateOne(
    { _id: xyz123 },
    { $push: { medicalHistory: recordId } }
  )
    ↓
Create Audit Log:
  db.auditlogs.create({
    action: "openmrs_auto_sync",
    performedBy: "OpenMRS Sync Service",
    targetModel: "MedicalRecord",
    targetId: recordId,
    changes: {
      hospitalId: "Hospital 1",
      providerName: "Dr. Jane Smith",
      conceptName: "DIAGNOSIS"
    }
  })
```

### 7. Patient Views Data

```
Patient logs into Patient Passport
    ↓
Frontend requests:
  GET /api/patients/me
    ↓
Backend queries MongoDB:
  db.patients.findOne({ user: userId })
    .populate('medicalHistory')
    ↓
Returns medical records including:
  {
    type: "condition",
    data: {
      name: "DIAGNOSIS",
      details: "Malaria",
      diagnosed: "2025-11-06T10:30:00"
    },
    createdBy: "Dr. Jane Smith",
    hospital: "Hospital 1",
    createdAt: "2025-11-06T10:35:00"
  }
    ↓
Patient sees: "Malaria - diagnosed by Dr. Jane Smith at Hospital 1"
```

## Database Schema Mapping

### OpenMRS → Patient Passport

| OpenMRS Table | OpenMRS Field | Patient Passport Collection | Patient Passport Field |
|---------------|---------------|----------------------------|----------------------|
| `patient_identifier` | `identifier` (National ID type) | `patients` | `nationalId` |
| `person_name` | `given_name + family_name` | `users` | `name` |
| `obs` | `concept_id` + `value_coded/text` | `medicalrecords` | `type` + `data` |
| `provider` | `identifier` | `doctors` | `openmrsProviderUuid` |
| `location` | `name` | `hospitals` | `name` |
| `encounter` | `encounter_datetime` | `medicalrecords` | `data.diagnosed/visitDate` |

### Observation Type Mapping

| OpenMRS Concept Contains | Patient Passport Type | Stored In Field |
|-------------------------|----------------------|-----------------|
| DIAGNOSIS, CONDITION | `condition` | `data.name`, `data.details` |
| MEDICATION, DRUG | `medication` | `data.medicationName`, `data.dosage` |
| TEST, LAB, INVESTIGATION | `test` | `data.testName`, `data.result` |
| VISIT, ENCOUNTER | `visit` | `data.hospital`, `data.reason` |

## Connection Management

### Connection Pool Architecture

```typescript
class OpenMRSSyncService {
  private connections: Map<string, mysql.Pool>
  
  // Each hospital gets its own connection pool
  initializeConnections(hospitals) {
    for (hospital of hospitals) {
      const pool = mysql.createPool({
        host: hospital.host,
        port: hospital.port,
        database: hospital.database,
        user: hospital.user,
        password: hospital.password,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0
      })
      
      this.connections.set(hospital.id, pool)
    }
  }
}
```

### Connection Lifecycle

```
Server Start
    ↓
Read hospital configs from .env
    ↓
Initialize connection pools (one per hospital)
    ↓
Test connections (SELECT 1)
    ↓
Start sync timer (default: 5 minutes)
    ↓
[Every 5 minutes]
    ↓
For each hospital pool:
    - Get connection from pool
    - Execute sync queries
    - Release connection back to pool
    ↓
[Server Shutdown]
    ↓
Stop sync timer
    ↓
Close all connection pools
    ↓
Exit gracefully
```

## Sync States

### State Tracking

```javascript
// Stored in MongoDB
{
  _id: ObjectId,
  hospitalId: "60a7c2f5e4b0c1a2d3e4f5a6",
  lastSyncTime: ISODate("2025-11-06T10:30:00Z")
}
```

### Sync Logic

```typescript
async syncHospital(hospitalId, connection) {
  // Get last sync time
  const lastSync = await getLastSyncTimestamp(hospitalId)
  
  // Query new observations
  const observations = await connection.query(`
    SELECT * FROM obs 
    WHERE date_created > ? 
      AND voided = 0
    ORDER BY date_created ASC
    LIMIT 1000
  `, [lastSync])
  
  // Process each observation
  for (const obs of observations) {
    await processObservation(obs, hospitalId)
  }
  
  // Update last sync time
  await updateLastSyncTimestamp(hospitalId, new Date())
}
```

## Error Handling

### Retry Logic

```typescript
async processObservation(obs, hospitalId) {
  try {
    // Attempt to process
    await storeObservation(obs)
  } catch (error) {
    if (error.code === 'PATIENT_NOT_FOUND') {
      // Skip and log
      console.warn(`Patient not found for obs ${obs.obs_id}`)
      return
    } else if (error.code === 'DUPLICATE_RECORD') {
      // Already synced, skip
      return
    } else {
      // Serious error, log and continue
      console.error(`Failed to sync obs ${obs.obs_id}:`, error)
      await logSyncError(obs.obs_id, error)
    }
  }
}
```

### Connection Recovery

```typescript
async executeQuery(hospitalId, query) {
  const pool = this.connections.get(hospitalId)
  
  try {
    return await pool.query(query)
  } catch (error) {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      // Reconnect
      console.log(`Reconnecting to ${hospitalId}...`)
      await this.reconnect(hospitalId)
      return await pool.query(query)
    }
    throw error
  }
}
```

## Performance Considerations

### Query Optimization

1. **Index Usage**
   ```sql
   -- Ensure these indexes exist in OpenMRS
   CREATE INDEX idx_obs_date_created ON obs(date_created);
   CREATE INDEX idx_obs_voided ON obs(voided);
   CREATE INDEX idx_obs_person ON obs(person_id);
   ```

2. **Pagination**
   ```typescript
   // Process in batches to avoid memory issues
   const BATCH_SIZE = 1000
   SELECT * FROM obs 
   WHERE date_created > ?
   ORDER BY date_created ASC
   LIMIT ${BATCH_SIZE}
   ```

3. **Connection Pooling**
   ```typescript
   // Reuse connections instead of creating new ones
   connectionLimit: 10 per hospital
   ```

### Load Distribution

```
Sync Interval: 5 minutes
3 Hospitals × 100 observations = 300 obs/sync
300 obs × 12 syncs/hour = 3,600 obs/hour
3,600 obs × 24 hours = 86,400 obs/day

Average processing time: 100ms per observation
Total sync time: 300 × 0.1s = 30 seconds
Well within 5-minute interval
```

## Security Architecture

### Access Control

```
Patient Passport Backend
    ↓
Read-Only MySQL User
    ↓
SELECT permissions only
    ↓
Cannot INSERT/UPDATE/DELETE
    ↓
Cannot access admin tables
```

### Network Security

```
Patient Passport Server
    ↓
Private Network / VPN
    ↓
Firewall (IP Whitelist)
    ↓
OpenMRS MySQL Server
```

### Data Protection

```
OpenMRS Database
    ↓
MySQL SSL/TLS Connection
    ↓
Encrypted in Transit
    ↓
Patient Passport MongoDB
    ↓
Encrypted at Rest
```

## Monitoring & Observability

### Metrics Tracked

1. **Sync Performance**
   - Observations processed per minute
   - Average sync duration
   - Error rate

2. **Connection Health**
   - Active connections per hospital
   - Connection pool utilization
   - Failed connection attempts

3. **Data Integrity**
   - Patients matched vs not found
   - Duplicate detection rate
   - Data validation failures

### Log Examples

```
[INFO] 🔄 Starting sync for Hospital: Central Hospital
[INFO]    Last sync: 2025-11-06T10:30:00Z
[INFO]    Found 15 new observations
[INFO]    ✅ Synced: DIAGNOSIS - Malaria for patient 1234567890123
[INFO]    ✅ Synced: MEDICATION - Artemether for patient 1234567890123
[WARN]    ⚠️ Patient not found for person_id 999
[INFO]    ✅ Synced: 13, Errors: 2
[INFO] ✅ Sync complete for Central Hospital
```

## Scalability

### Horizontal Scaling

```
Load Balancer
    ↓
┌──────────────┬──────────────┬──────────────┐
│  Backend 1   │  Backend 2   │  Backend 3   │
│              │              │              │
│ Sync Service │ Sync Service │ Sync Service │
│ (Disabled)   │ (ENABLED)    │ (Disabled)   │
└──────────────┴──────────────┴──────────────┘
```

**Strategy**: Only ONE backend instance runs sync service to avoid duplicates.

### Vertical Scaling

- Increase connection pool size
- Add more memory for larger batches
- Optimize database queries

## Disaster Recovery

### Backup Strategy

1. **Sync State Backup**
   ```javascript
   // Backup last sync timestamps
   db.syncstatus.find().forEach(doc => {
     // Save to backup
   })
   ```

2. **Recovery Procedure**
   ```
   1. Restore Patient Passport MongoDB
   2. Reset sync timestamps: db.syncstatus.deleteMany({})
   3. Restart sync service
   4. All historical observations will re-sync
   ```

## Future Enhancements

1. **Real-Time Sync** via MySQL binlog replication
2. **Bi-Directional Sync** (Patient Passport → OpenMRS)
3. **Conflict Resolution** for competing updates
4. **AI-Powered Data Mapping** for better categorization
5. **Multi-Tenant Support** for hospital isolation

---

**Version:** 1.0.0  
**Last Updated:** November 6, 2025  
**Architecture Owner:** Patient Passport Development Team
