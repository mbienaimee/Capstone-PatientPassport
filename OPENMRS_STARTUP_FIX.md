# OpenMRS Startup Error Fix

## Problem

OpenMRS is failing to start with this error:
```
ClassNotFoundException: org.openmrs.module.patientpassport.listener.ObservationEventListener
```

## Root Cause

You have an **old version** of the Patient Passport module installed that includes the problematic `ObservationEventListener` class. This class was removed in the latest version because it was causing OpenMRS to crash.

## Solution

Follow these steps **in order**:

---

## Step 1: Stop OpenMRS

**IMPORTANT:** Make sure OpenMRS is completely stopped before proceeding.

1. Close any OpenMRS/Tomcat windows
2. Check Task Manager for any running Java processes related to OpenMRS
3. If found, end the process

---

## Step 2: Run the Reinstallation Script

Open PowerShell and navigate to the module directory:

```powershell
cd 'c:\Users\user\OneDrive\Desktop\capp\New folder\Capstone-PatientPassport\Capstone-PatientPassport\openmrs-patient-passport-module'
```

Run the reinstall script:

```powershell
.\reinstall-module.ps1
```

The script will:
- ✅ Verify OpenMRS is stopped
- ✅ Remove old module files from `C:\Users\user\openmrs\server\modules`
- ✅ Clear the cached module from `C:\Users\user\openmrs\server\.openmrs-lib-cache\patientpassport`
- ✅ Install the new module version (without event listener)

---

## Step 3: Start OpenMRS

After the script completes:

1. Start OpenMRS normally
2. OpenMRS will detect the new module
3. The module will load **without the event listener**
4. OpenMRS should start successfully

---

## What Changed?

### Old Module (Causing Error)
- ❌ Had `ObservationEventListener` class
- ❌ Tried to intercept observations automatically
- ❌ Caused ClassNotFoundException crash

### New Module (Fixed)
- ✅ Removed `ObservationEventListener` completely
- ✅ Module loads without interfering with OpenMRS startup
- ✅ Sync happens via backend's direct database polling instead

---

## How Sync Works Now

Since we removed the automatic event listener from the OpenMRS module:

1. **Doctor adds observation in OpenMRS** → Saved to MySQL database
2. **Backend polls database every 5 minutes** → Detects new observations
3. **Backend syncs to Patient Passport** → Stores in MongoDB
4. **Patient accesses via USSD/web** → Sees the observation

**Sync Delay:** Maximum 5 minutes (average 2.5 minutes)

---

## Verification

After OpenMRS starts successfully:

### 1. Check Module Status in OpenMRS

1. Log in to OpenMRS: http://localhost:8080/openmrs
2. Go to **Administration** → **Manage Modules**
3. Find **Patient Passport Module**
4. Status should be: **Started** ✅

### 2. Check Backend Sync

Make sure your backend is running:

```powershell
cd 'c:\Users\user\OneDrive\Desktop\capp\New folder\Capstone-PatientPassport\Capstone-PatientPassport\backend'
npm run dev
```

You should see:
```
🔄 Starting Direct Database Observation Sync Service
🚀 Starting direct database OpenMRS observation sync service
   Sync interval: 300 seconds
   Database: localhost:3306/openmrs
```

### 3. Test End-to-End

1. Add an observation in OpenMRS for Betty Williams
2. Wait up to 5 minutes
3. Check backend logs for: "✓ Synced: [observation] for patient Betty Williams"
4. Verify observation appears in Patient Passport

---

## Troubleshooting

### If OpenMRS Still Fails to Start

**Problem:** Same ClassNotFoundException error

**Solution:**
1. Stop OpenMRS completely
2. Manually delete these folders:
   ```
   C:\Users\user\openmrs\server\modules\patientpassport-1.0.0.omod
   C:\Users\user\openmrs\server\.openmrs-lib-cache\patientpassport
   ```
3. Run the reinstall script again
4. Restart OpenMRS

### If Module Doesn't Load

**Problem:** Module not appearing in Manage Modules

**Solution:**
1. Check the module file exists:
   ```
   C:\Users\user\openmrs\server\modules\patientpassport-1.0.0.omod
   ```
2. Check OpenMRS logs for errors
3. Verify module was built correctly:
   ```powershell
   cd openmrs-patient-passport-module
   mvn clean package -DskipTests
   ```

### If Observations Don't Sync

**Problem:** Backend not detecting new observations

**Solution:**
1. Verify backend is running: `npm run dev`
2. Check `.env` has correct OpenMRS database credentials:
   ```
   OPENMRS_DB_HOST=localhost
   OPENMRS_DB_PORT=3306
   OPENMRS_DB_USER=openmrs_user
   OPENMRS_DB_PASSWORD=OpenMRSPass123!
   OPENMRS_DB_NAME=openmrs
   ```
3. Test database connection manually
4. Check backend logs for sync errors

---

## Key Points

✅ **Module is working** - Just remove old cached version  
✅ **No code changes needed** - We already fixed the module  
✅ **Sync is operational** - Backend handles it via direct database access  
✅ **Safe for production** - No interference with OpenMRS stability  

---

## Files Created/Modified

- `reinstall-module.ps1` - Automated cleanup and reinstall script
- `omod/target/patientpassport-1.0.0.omod` - Fixed module (already built)
- `moduleApplicationContext.xml` - Already has event listener removed

---

## Summary

The error you're seeing is from an **old cached version** of the module. The new version we built is correct and doesn't have the problematic class. Simply run the `reinstall-module.ps1` script to:

1. Remove old module files
2. Clear OpenMRS cache
3. Install the new fixed version

Then OpenMRS will start successfully! 🎉
