# 🧪 Testing the OpenMRS Sync - Step by Step

## Based on Your Screenshot

Your OpenMRS shows:
- **Patient:** Miguel Ishimwe
- **Question Concept:** "Malaria smear impression"
- **Value:** "dgdggdf 200mg"
- **Creator:** Super User

This will sync to Patient Passport as:
- **Diagnosis:** "Malaria smear impression"
- **Treatment:** "dgdggdf 200mg"
- **Doctor:** Dr. Super User

---

## 🚀 Step-by-Step Testing

### Step 1: Ensure Patient Exists in Patient Passport

First, verify Miguel Ishimwe is registered in Patient Passport with a National ID.

```javascript
// In MongoDB Atlas or Compass
use patientpassport

// Find patient by name
db.users.findOne({ 
  name: /Miguel Ishimwe/i,
  role: "patient"
})

// Should return something like:
{
  _id: ObjectId("..."),
  name: "Miguel Ishimwe",
  email: "miguel@example.com",
  role: "patient"
}

// Now find patient record
db.patients.findOne({ 
  user: ObjectId("...") // Use the ID from above
})

// Should show:
{
  _id: ObjectId("..."),
  user: ObjectId("..."),
  nationalId: "1234567890123",  // ← This MUST match OpenMRS
  medicalHistory: [],
  medications: [],
  testResults: []
}
```

### Step 2: Verify National ID Matches in OpenMRS

In OpenMRS MySQL database:

```sql
-- Find Miguel's patient record
SELECT 
  p.patient_id,
  pn.given_name,
  pn.family_name,
  pi.identifier as national_id
FROM person_name pn
JOIN person p ON pn.person_id = p.person_id
JOIN patient_identifier pi ON p.person_id = pi.patient_id
JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
WHERE pn.given_name LIKE '%Miguel%'
  AND pn.family_name LIKE '%Ishimwe%'
  AND pit.name LIKE '%National%ID%'
  AND pi.voided = 0;

-- Expected result:
-- patient_id | given_name | family_name | national_id
-- 123        | Miguel     | Ishimwe     | 1234567890123
```

**CRITICAL:** The `national_id` from OpenMRS MUST exactly match the `nationalId` in Patient Passport!

### Step 3: Configure Sync Service

Edit `backend/.env`:

```bash
# Auto-sync configuration
OPENMRS_AUTO_START_SYNC=true
OPENMRS_SYNC_INTERVAL=5
OPENMRS_DETAILED_LOGS=true

# Hospital configuration (replace with your actual values)
HOSPITAL_1_ID=<your_hospital_mongodb_id>
HOSPITAL_1_NAME=Your Hospital Name
HOSPITAL_1_DB_HOST=localhost
HOSPITAL_1_DB_PORT=3306
HOSPITAL_1_DB_NAME=openmrs
HOSPITAL_1_DB_USER=openmrs_readonly
HOSPITAL_1_DB_PASSWORD=<your_password>
HOSPITAL_1_ENABLED=true
```

### Step 4: Create Read-Only MySQL User

On your OpenMRS MySQL server:

```sql
mysql -u root -p

CREATE USER 'openmrs_readonly'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON openmrs.* TO 'openmrs_readonly'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Test the connection:

```bash
mysql -h localhost -u openmrs_readonly -p openmrs

# If successful, try:
SELECT COUNT(*) FROM obs;
```

### Step 5: Start Patient Passport Backend

```bash
cd backend
npm run dev
```

Look for these logs:

```
🔄 ═══════════════════════════════════════════════════════
🔄 Initializing OpenMRS Auto-Sync Service
🔄 ═══════════════════════════════════════════════════════

🔌 Initializing OpenMRS database connections for 1 hospitals...
✅ Connected to Your Hospital Name OpenMRS database
✅ Initialized 1 database connections

🔄 Auto-starting sync service with 5 minute interval...

PatientPassport API Server is running!
Server: http://localhost:5000
OpenMRS Sync: ENABLED
```

### Step 6: Trigger Manual Sync (Optional)

Don't want to wait 5 minutes? Trigger immediately:

```bash
# Using curl or Postman
POST http://localhost:5000/api/openmrs-sync/sync-all
Authorization: Bearer <your_admin_token>

# Or sync specific patient
POST http://localhost:5000/api/openmrs-sync/sync-patient/1234567890123
Authorization: Bearer <your_doctor_or_admin_token>
```

### Step 7: Monitor Sync Logs

Watch the terminal for sync activity:

```
🔄 ═══════════════════════════════════════════════════════
🔄 Starting Multi-Hospital Observation Sync
🔄 ═══════════════════════════════════════════════════════

🏥 Syncing hospital: Your Hospital Name
   Last sync: Never
   Found 1 new observations
   ✅ Synced: Malaria smear impression for patient 1234567890123
   ✅ Synced: 1, Errors: 0

✅ ═══════════════════════════════════════════════════════
✅ Sync Complete - Summary:
   Hospital Your Hospital Name: 1 observations
✅ ═══════════════════════════════════════════════════════
```

### Step 8: Verify in MongoDB

Check that the observation was stored:

```javascript
// In MongoDB
use patientpassport

// Find the medical record
db.medicalrecords.find({
  patientId: ObjectId("...") // Miguel's patient ID
}).sort({ createdAt: -1 })

// Should show:
{
  _id: ObjectId("..."),
  patientId: ObjectId("..."),
  type: "condition",
  data: {
    name: "Malaria smear impression",
    details: "Treatment: dgdggdf 200mg",
    diagnosed: "2025-11-06T12:00:00.000Z",
    procedure: "Synced from OpenMRS - Diagnosis: Malaria smear impression, Treatment: dgdggdf 200mg | Doctor: Super User | Hospital: Your Hospital Name"
  },
  createdBy: ObjectId("..."), // Doctor record for Super User
  createdAt: ISODate("2025-11-06T12:05:00Z"),
  updatedAt: ISODate("2025-11-06T12:05:00Z")
}

// Check patient's medical history was updated
db.patients.findOne({ 
  nationalId: "1234567890123" 
})

// Should show:
{
  medicalHistory: [
    ObjectId("...")  // ← The medical record ID
  ],
  medications: [],
  testResults: []
}
```

### Step 9: Login as Patient

1. Open Patient Passport frontend: `http://localhost:3000` or `http://localhost:5173`
2. Login as Miguel Ishimwe (use his credentials)
3. Navigate to Medical History
4. You should see:

```
╔═══════════════════════════════════════════════════════╗
║  📋 Medical History                                   ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  🏥 Malaria smear impression                          ║
║  Treatment: dgdggdf 200mg                             ║
║                                                       ║
║  👨‍⚕️ Doctor: Dr. Super User                            ║
║  🏥 Hospital: Your Hospital Name                      ║
║  📅 Date: November 6, 2025                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## ✅ Success Criteria

Your sync is working correctly if:

1. ✅ Server logs show: "✅ Connected to [Hospital] OpenMRS database"
2. ✅ Sync runs every 5 minutes automatically
3. ✅ Logs show: "✅ Synced: Malaria smear impression for patient 1234567890123"
4. ✅ MongoDB shows new record in `medicalrecords` collection
5. ✅ Patient's `medicalHistory` array includes the record ID
6. ✅ Patient can see the observation in their passport
7. ✅ Diagnosis and treatment are both visible
8. ✅ Doctor name appears correctly

---

## 🐛 Troubleshooting

### Issue: "Patient not found for person_id 123"

**Problem:** National ID mismatch between OpenMRS and Patient Passport

**Solution:**
```javascript
// Check OpenMRS
SELECT identifier FROM patient_identifier 
WHERE patient_id = 123 AND voided = 0;

// Check Patient Passport
db.patients.findOne({ nationalId: "1234567890123" })

// Make sure they match exactly!
```

### Issue: "Failed to connect to OpenMRS database"

**Problem:** Connection settings incorrect or firewall blocking

**Solution:**
1. Test MySQL connection: `mysql -h HOST -u USER -p`
2. Check firewall allows port 3306
3. Verify credentials in `.env` are correct

### Issue: "No observations syncing"

**Problem:** Last sync timestamp preventing retrieval

**Solution:**
```javascript
// Reset sync status to fetch everything
db.syncstatus.deleteMany({})

// Trigger manual sync
POST /api/openmrs-sync/sync-all
```

### Issue: "Observation appears multiple times"

**Problem:** Duplicate detection not working

**Solution:**
```javascript
// Check for duplicates
db.medicalrecords.aggregate([
  { $group: { 
    _id: { patientId: "$patientId", name: "$data.name" },
    count: { $sum: 1 }
  }},
  { $match: { count: { $gt: 1 } }}
])

// Delete duplicates manually if needed
```

---

## 📊 What Gets Synced

### From Your Screenshot:

| OpenMRS Field | Value | Syncs To |
|---------------|-------|----------|
| Question Concept | "Malaria smear impression" | `data.name` (Diagnosis) |
| Value | "dgdggdf 200mg" | `data.details` (Treatment) |
| Creator | "Super User" | Doctor record |
| Encounter Date | "11/06/2025 12:00 AM" | `data.diagnosed` |

### What Stays Empty (Until Populated Separately):

- ❌ Medications list (separate from medical history)
- ❌ Test Results list (separate section)
- ❌ Hospital Visits (unless encounter type is "visit")
- ❌ Lab Results (unless concept is "test")
- ❌ Allergies (not in observations)
- ❌ Current Medications (patient's ongoing meds)

**Only Medical History (Conditions) gets populated from OpenMRS observations.**

---

## 🎯 Expected Result

After successful sync, Miguel Ishimwe's Patient Passport will show:

**Medical History Section:**
```
Diagnosis: Malaria smear impression
Treatment: dgdggdf 200mg
Doctor: Dr. Super User
Hospital: Your Hospital Name
Date: Nov 6, 2025
```

**Other Sections:**
- Medications: (empty - only shows if prescribed separately)
- Test Results: (empty - only shows if test concept)
- Hospital Visits: (empty - only shows if visit encounter)

---

## 🔄 Adding More Observations

To test with more data:

1. **In OpenMRS:** Add another observation for Miguel
2. **Wait 5 minutes** (or trigger manual sync)
3. **Check Patient Passport:** New observation should appear

Example:
```
Question Concept: "Hypertension"
Value: "Amlodipine 10mg"
→ Will sync as: "Hypertension - Treatment: Amlodipine 10mg"
```

---

## 📞 Need Help?

If something doesn't work:

1. **Check server logs** for error messages
2. **Verify National ID** matches in both systems
3. **Test MySQL connection** manually
4. **Check MongoDB** for records
5. **Look at sync status**: `GET /api/openmrs-sync/status`

---

**Ready to test? Start with Step 1! 🚀**
