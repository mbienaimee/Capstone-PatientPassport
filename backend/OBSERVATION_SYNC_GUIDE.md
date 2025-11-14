# OpenMRS Observation Sync Guide

## Overview

This guide explains how observations recorded by doctors in OpenMRS are automatically synced to the Patient Passport system without manual intervention.

## How It Works

### 1. **Real-Time Sync via OpenMRS Module** (Primary Method)

When a doctor records an observation in OpenMRS:

1. **OpenMRS Module Triggers Event**: The Patient Passport OpenMRS module listens for observation save events
2. **Automatic API Call**: The module automatically sends the observation to Patient Passport API endpoint: `POST /api/openmrs/observation/store`
3. **Data Processing**: Patient Passport receives and processes the observation
4. **Storage**: The observation is stored in the Patient Passport database as:
   - **Medical Condition** (for diagnoses)
   - **Medication** (for medications)
   - **Medical Record** (for other types)

**Endpoint**: `POST /api/openmrs/observation/store`

**Request Body**:
```json
{
  "patientName": "John Doe",
  "observationType": "diagnosis" | "medication",
  "observationData": {
    "diagnosis": "Malaria",
    "details": "Positive test result",
    "date": "2024-01-15T10:30:00Z"
  },
  "doctorLicenseNumber": "DOC123",
  "hospitalName": "General Hospital"
}
```

### 2. **Automatic Database Sync** (Backup Method)

The system also runs automatic database sync services:

- **Direct DB Sync Service**: Queries OpenMRS database every 30 seconds (configurable) for new observations
- **OpenMRS Sync Service**: Multi-hospital sync service that runs every 5 minutes (configurable)

These services:
- Connect directly to OpenMRS MySQL/MariaDB databases
- Query for new observations since last sync
- Automatically match patients by name or National ID
- Store observations in Patient Passport

## Configuration

### Enable Automatic Sync

1. **Set Environment Variables** in `.env`:

```bash
# Enable automatic sync on server start
OPENMRS_AUTO_START_SYNC=true

# Sync interval in minutes (default: 5)
OPENMRS_SYNC_INTERVAL=5

# Direct DB sync interval in seconds (default: 30)
OPENMRS_SYNC_INTERVAL_SECONDS=30

# OpenMRS Database Configuration (for direct DB sync)
OPENMRS_DB_HOST=localhost
OPENMRS_DB_PORT=3306
OPENMRS_DB_NAME=openmrs
OPENMRS_DB_USER=openmrs_user
OPENMRS_DB_PASSWORD=your_password
```

2. **Restart the Server**: The sync services will start automatically

### Multi-Hospital Configuration

For multiple hospitals, configure each hospital:

```bash
# Hospital 1
HOSPITAL_1_ENABLED=true
HOSPITAL_1_ID=<mongodb-hospital-id>
HOSPITAL_1_NAME=General Hospital
HOSPITAL_1_DB_HOST=hospital1-db.example.com
HOSPITAL_1_DB_PORT=3306
HOSPITAL_1_DB_NAME=openmrs
HOSPITAL_1_DB_USER=openmrs_readonly
HOSPITAL_1_DB_PASSWORD=password

# Hospital 2
HOSPITAL_2_ENABLED=true
HOSPITAL_2_ID=<mongodb-hospital-id>
HOSPITAL_2_NAME=City Hospital
HOSPITAL_2_DB_HOST=hospital2-db.example.com
# ... similar configuration
```

## Verification

### Check Observations in Database

Run the verification script:

```bash
cd backend
node check-observations-in-db.js
```

This will show:
- All medical conditions (diagnoses)
- All medications
- All medical records
- Statistics on synced observations
- Recent observations (last 24 hours)

### Check Sync Status

1. **Check Server Logs**: Look for sync activity in server console:
   ```
   🔄 Syncing observations from OpenMRS database...
   ✓ Synced: Malaria for patient John Doe (ID: 12345)
   📊 DB Sync complete: 5 successful, 0 errors
   ```

2. **Check Health Endpoint**: `GET /health`
   - Shows email service status
   - Shows OpenMRS sync service status

3. **Check API Endpoint**: `GET /api/openmrs/health`
   - Verifies OpenMRS integration is active

### Manual Sync Trigger

You can manually trigger a sync:

1. **Direct DB Sync**: 
   ```bash
   # Via API (if endpoint exists)
   POST /api/openmrs-sync/trigger
   ```

2. **Patient-Specific Sync**:
   ```bash
   POST /api/openmrs-sync/patient/:nationalId
   ```

## Data Flow

```
┌─────────────────┐
│  Doctor in      │
│  OpenMRS        │
│  Records        │
│  Observation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenMRS Module │
│  (Java)         │
│  Detects Event   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Call       │
│  POST /api/     │
│  openmrs/       │
│  observation/   │
│  store          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Patient        │
│  Passport       │
│  Backend        │
│  Processes &     │
│  Stores         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB        │
│  Database       │
│  (Stored as     │
│   Medical       │
│   Condition/    │
│   Medication)   │
└─────────────────┘
```

## Troubleshooting

### Observations Not Appearing

1. **Check OpenMRS Module**: Ensure the Patient Passport module is installed and active in OpenMRS
2. **Check API URL**: Verify the module is configured with correct Patient Passport API URL
3. **Check Logs**: Look for errors in both OpenMRS logs and Patient Passport logs
4. **Check Patient Name**: Ensure patient name in OpenMRS matches exactly with Patient Passport
5. **Check Database Connection**: Verify direct DB sync can connect to OpenMRS database

### Common Issues

**Issue**: "Patient not found" error
- **Solution**: Ensure patient exists in Patient Passport with matching name

**Issue**: Observations not syncing
- **Solution**: 
  1. Check if sync services are running (check server logs)
  2. Verify environment variables are set correctly
  3. Check database connectivity

**Issue**: Duplicate observations
- **Solution**: The system automatically prevents duplicates by checking OpenMRS obs_id

## Testing

### Test Observation Sync

1. **Record an observation in OpenMRS**:
   - Login to OpenMRS as a doctor
   - Find a patient
   - Record a diagnosis or medication

2. **Check Patient Passport**:
   - Wait a few seconds (for real-time sync)
   - Or wait for next sync cycle (30 seconds for DB sync)
   - Run verification script: `node check-observations-in-db.js`

3. **Verify in Frontend**:
   - Login to Patient Passport
   - View patient's medical history
   - Check if the observation appears

## API Endpoints

### Store Observation
- **Endpoint**: `POST /api/openmrs/observation/store`
- **Auth**: Public (OpenMRS API key recommended)
- **Purpose**: Receive observations from OpenMRS module

### Get Patient Observations
- **Endpoint**: `GET /api/openmrs/patient/:patientName/observations`
- **Auth**: Public (OpenMRS API key recommended)
- **Purpose**: OpenMRS can fetch patient data from Passport

### Health Check
- **Endpoint**: `GET /api/openmrs/health`
- **Auth**: Public
- **Purpose**: Verify integration is active

## Support

For issues or questions:
1. Check server logs for error messages
2. Run verification script to check database
3. Verify configuration in `.env` file
4. Check OpenMRS module logs

## Summary

✅ **Automatic Sync**: Observations are synced automatically when doctors record them in OpenMRS
✅ **No Manual Entry**: Doctors don't need to manually add observations to Patient Passport
✅ **Real-Time**: Observations appear within seconds via API sync
✅ **Backup Sync**: Database sync ensures no observations are missed
✅ **Multi-Hospital**: Supports multiple OpenMRS instances
✅ **Duplicate Prevention**: System prevents duplicate entries


