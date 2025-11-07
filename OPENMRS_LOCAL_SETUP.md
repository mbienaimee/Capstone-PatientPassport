# 🔧 OpenMRS Sync Setup Guide - Local Installation

## ✅ Detected Configuration
- **OpenMRS:** Running on http://localhost:8080
- **MySQL:** Running on localhost:3306
- **Setup Method:** Maven SDK (`mvn openmrs-sdk:run`)

---

## 📋 Step 1: Get Hospital MongoDB ID

Open MongoDB Compass or MongoDB Atlas and run:

```javascript
use CapstonePassportSystem
db.hospitals.find({}, { _id: 1, name: 1 })
```

**Example Output:**
```json
{
  "_id": "673b1a2b3c4d5e6f7a8b9c0d",
  "name": "Central Hospital"
}
```

📝 **Copy the `_id` value** - you'll need it in Step 3.

---

## 📋 Step 2: Get OpenMRS MySQL Credentials

### Option A: Check OpenMRS Runtime Properties

1. Navigate to your OpenMRS server data directory:
   ```powershell
   # Usually located at:
   C:\Users\YOUR_USERNAME\openmrs\YOUR_SERVER_NAME\openmrs-runtime.properties
   ```

2. Open `openmrs-runtime.properties` and look for:
   ```properties
   connection.url=jdbc:mysql://localhost:3306/openmrs?autoReconnect=true
   connection.username=openmrs
   connection.password=YOUR_PASSWORD_HERE
   ```

### Option B: Default Maven SDK Credentials

OpenMRS SDK typically uses:
- **Database:** `openmrs`
- **Username:** `openmrs`
- **Password:** `openmrs` (or `Admin123` or what you set during setup)

### Test Your Credentials

Try connecting to MySQL:
```powershell
mysql -h localhost -u openmrs -p
# Enter password when prompted
```

Once connected, verify the database:
```sql
SHOW DATABASES LIKE 'openmrs%';
USE openmrs;
SHOW TABLES;
SELECT COUNT(*) FROM obs;  -- Should show observation count
EXIT;
```

---

## 📋 Step 3: Create Read-Only MySQL User (Recommended)

For security, create a read-only user:

```sql
mysql -u root -p
# Or use your admin credentials

CREATE USER 'openmrs_readonly'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT SELECT ON openmrs.* TO 'openmrs_readonly'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Test the new user:
```powershell
mysql -h localhost -u openmrs_readonly -p
# Enter: SecurePassword123!
```

---

## 📋 Step 4: Update backend/.env File

Open `backend/.env` and update the OpenMRS section:

```bash
# ═══════════════════════════════════════════════════════
# OPENMRS AUTO-SYNC CONFIGURATION
# ═══════════════════════════════════════════════════════

# Enable automatic sync
OPENMRS_AUTO_START_SYNC=true

# Sync every 5 minutes
OPENMRS_SYNC_INTERVAL=5

# Enable detailed logging
OPENMRS_DETAILED_LOGS=true

# ═══════════════════════════════════════════════════════
# HOSPITAL 1 - OpenMRS Configuration
# ═══════════════════════════════════════════════════════

# Enable this hospital
HOSPITAL_1_ENABLED=true

# Paste your Hospital MongoDB ID from Step 1
HOSPITAL_1_ID=673b1a2b3c4d5e6f7a8b9c0d

# Your hospital name
HOSPITAL_1_NAME=Central Hospital

# OpenMRS MySQL Database Connection
HOSPITAL_1_DB_HOST=localhost
HOSPITAL_1_DB_PORT=3306
HOSPITAL_1_DB_NAME=openmrs

# MySQL Credentials from Step 2 or Step 3
HOSPITAL_1_DB_USER=openmrs_readonly
HOSPITAL_1_DB_PASSWORD=SecurePassword123!
```

---

## 📋 Step 5: Restart Backend Server

```powershell
cd backend
npm run dev
```

### ✅ Expected Output (Success):

```
🔄 Initializing OpenMRS Auto-Sync Service
🔌 Initializing OpenMRS database connections for 1 hospitals...
✅ Connected to Central Hospital OpenMRS database
✅ Initialized 1 database connections
🔄 Auto-starting sync service with 5 minute interval...

PatientPassport API Server is running!
OpenMRS Sync: ENABLED ✅
```

### ❌ Common Errors:

**Error:** `Access denied for user 'openmrs_readonly'@'localhost'`
- **Fix:** Double-check username and password in `.env`

**Error:** `Connection refused`
- **Fix:** Make sure MySQL is running: `netstat -ano | findstr :3306`

**Error:** `Unknown database 'openmrs'`
- **Fix:** Verify OpenMRS database exists: `SHOW DATABASES;`

---

## 📋 Step 6: Test the Sync

### Create Test Observation in OpenMRS

1. Go to http://localhost:8080/openmrs
2. Login with your OpenMRS credentials
3. Register a patient with **National ID** (important!)
4. Add an observation (e.g., diagnosis)

### Verify Patient in Patient Passport

Make sure the patient exists in Patient Passport with the **same National ID**:
```javascript
db.patients.findOne({ nationalId: "1234567890123" })
```

### Wait for Sync (or Trigger Manually)

**Option 1:** Wait 5 minutes for automatic sync

**Option 2:** Trigger manual sync via API:
```powershell
# Using PowerShell
$headers = @{ "Authorization" = "Bearer YOUR_ADMIN_TOKEN" }
Invoke-WebRequest -Uri "http://localhost:5000/api/openmrs-sync/sync-all" -Method POST -Headers $headers
```

### Check Logs

Watch the backend console for:
```
🔄 Starting Multi-Hospital Observation Sync
🏥 Syncing hospital: Central Hospital
   Found X new observations
   ✅ Synced: [Observation details]
✅ Sync Complete
```

---

## 🔍 Troubleshooting

### Issue: "Patient not found for person_id X"

**Problem:** Patient exists in OpenMRS but not in Patient Passport

**Solution:**
1. Get patient's National ID from OpenMRS
2. Register the patient in Patient Passport with **exact same National ID**

### Issue: "No new observations found"

**Problem:** Either no new observations or they were already synced

**Solution:**
1. Create a new observation in OpenMRS
2. Wait 5 minutes or trigger manual sync
3. Check `sync_status` table in Patient Passport

### Issue: Observations not appearing in Patient Passport

**Check:**
1. Patient exists in both systems with matching National ID
2. Observation has proper concept and value
3. Check backend logs for errors
4. Verify doctor exists or is auto-created

---

## 📊 Verification Checklist

- [ ] MySQL running on port 3306
- [ ] OpenMRS running on port 8080
- [ ] OpenMRS database accessible
- [ ] Hospital MongoDB ID obtained
- [ ] `.env` file updated with credentials
- [ ] `HOSPITAL_1_ENABLED=true`
- [ ] Backend server restarted
- [ ] "✅ Connected to [Hospital]" message appears
- [ ] Test patient has same National ID in both systems
- [ ] Test observation created in OpenMRS
- [ ] Observation synced to Patient Passport

---

## 🎯 Quick Reference

### Common MySQL Commands
```sql
-- Show OpenMRS databases
SHOW DATABASES LIKE 'openmrs%';

-- Use OpenMRS database
USE openmrs;

-- Count observations
SELECT COUNT(*) FROM obs WHERE voided = 0;

-- Check recent observations
SELECT obs_id, concept_id, value_text, date_created 
FROM obs 
WHERE voided = 0 
ORDER BY date_created DESC 
LIMIT 10;

-- Find patient by identifier
SELECT patient_id, identifier 
FROM patient_identifier 
WHERE voided = 0 
LIMIT 10;
```

### Environment Variables
```bash
OPENMRS_AUTO_START_SYNC=true       # Enable auto-sync
OPENMRS_SYNC_INTERVAL=5            # Sync interval (minutes)
OPENMRS_DETAILED_LOGS=true         # Detailed logging
HOSPITAL_1_ENABLED=true            # Enable hospital
HOSPITAL_1_ID=<mongodb_id>         # Hospital MongoDB ID
HOSPITAL_1_NAME=<name>             # Hospital name
HOSPITAL_1_DB_HOST=localhost       # MySQL host
HOSPITAL_1_DB_PORT=3306            # MySQL port
HOSPITAL_1_DB_NAME=openmrs         # Database name
HOSPITAL_1_DB_USER=<username>      # MySQL username
HOSPITAL_1_DB_PASSWORD=<password>  # MySQL password
```

---

## 📞 Next Steps

1. **Get your MySQL credentials** from OpenMRS runtime properties
2. **Get your Hospital MongoDB ID** from Patient Passport database
3. **Update `.env` file** with actual values
4. **Restart backend server**
5. **Test the sync** by creating observations in OpenMRS

**Need help?** Check `TESTING_OPENMRS_SYNC.md` for detailed testing guide!
