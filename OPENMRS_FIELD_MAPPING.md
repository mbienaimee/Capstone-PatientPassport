# 🔄 OpenMRS to Patient Passport - Exact Field Mapping

## 📋 OpenMRS Observation Structure (From Screenshot)

### OpenMRS Encounter Form Shows:

| Field | Example Value | Description |
|-------|---------------|-------------|
| **Question Concept** | "Malaria smear impression" | The diagnosis/observation name |
| **Value** | "dgdggdf 200mg" | The medication/treatment prescribed |
| **Creator/Changed By** | "Super User - Nov 6, 2025" | Who added the observation |

---

## 🗄️ OpenMRS Database Structure

### `obs` Table (Observations)

```sql
SELECT 
  o.obs_id,
  o.person_id,              -- Patient identifier
  o.concept_id,             -- Links to concept (Question Concept)
  o.value_text,             -- The Value field (e.g., "dgdggdf 200mg")
  o.value_coded,            -- Coded value (alternative to value_text)
  o.value_numeric,          -- Numeric value
  o.obs_datetime,           -- When observation was made
  o.creator,                -- User who created it (links to users table)
  o.location_id,            -- Where it was created
  o.comments                -- Additional comments
FROM obs o
WHERE o.voided = 0;
```

### `concept_name` Table (Question Concept)

```sql
SELECT 
  cn.concept_id,
  cn.name                   -- e.g., "Malaria smear impression"
FROM concept_name cn
WHERE cn.locale = 'en'
  AND cn.concept_name_type = 'FULLY_SPECIFIED';
```

### `users` and `person_name` Tables (Creator)

```sql
SELECT 
  u.user_id,
  u.username,               -- e.g., "Super User"
  pn.given_name,
  pn.family_name
FROM users u
LEFT JOIN person_name pn ON u.person_id = pn.person_id;
```

---

## ➡️ Mapping to Patient Passport

### MedicalRecord Collection Structure

```javascript
{
  _id: ObjectId("..."),
  patientId: "patient_id_here",
  type: "condition",        // Observation type
  data: {
    name: "...",            // ← Question Concept
    details: "...",         // ← Value (medication/treatment)
    diagnosed: "...",       // ← obs_datetime
    procedure: "..."        // ← Creator + Location info
  },
  createdBy: "doctor_id",   // ← Creator (mapped to Doctor)
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Exact Field Mapping

### Example from Screenshot

**OpenMRS Data:**
```
Question Concept: "Malaria smear impression"
Value: "dgdggdf 200mg"
Creator/Changed By: "Super User - Nov 6, 2025"
```

**Maps to Patient Passport:**
```javascript
{
  type: "condition",
  data: {
    name: "Malaria smear impression",           // ← Question Concept
    details: "Treatment: dgdggdf 200mg",        // ← Value
    diagnosed: "2025-11-06T12:00:00.000Z",      // ← Encounter Date
    procedure: "Synced from OpenMRS - Diagnosis: Malaria smear impression, Treatment: dgdggdf 200mg | Doctor: Super User | Hospital: [Hospital Name]"
  },
  createdBy: "[Doctor ObjectId]"                // ← Creator (Super User)
}
```

---

## 📊 Complete Data Flow

### Step 1: OpenMRS Doctor Creates Observation

```
Doctor Interface:
┌─────────────────────────────────────────┐
│ Question Concept: Malaria smear         │
│                   impression            │
│ Value: dgdggdf 200mg                    │
│ Creator: Super User                     │
│ Date: 11/06/2025 12:00 AM               │
└─────────────────────────────────────────┘
         ↓ [Save Encounter]
```

### Step 2: Stored in OpenMRS MySQL

```sql
INSERT INTO obs (
  obs_id,
  person_id,        -- 123 (patient's person_id)
  concept_id,       -- 456 (links to "Malaria smear impression")
  value_text,       -- "dgdggdf 200mg"
  obs_datetime,     -- 2025-11-06 12:00:00
  creator,          -- 789 (Super User's user_id)
  location_id,      -- 10 (clinic location)
  voided            -- 0 (not deleted)
) VALUES (...);
```

### Step 3: Sync Service Retrieves (Every 5 Minutes)

```javascript
// Query OpenMRS
const observations = await connection.query(`
  SELECT 
    o.obs_id,
    o.person_id,
    o.concept_id,
    o.value_text,
    o.obs_datetime,
    o.creator,
    o.location_id
  FROM obs o
  WHERE o.date_created > ?
    AND o.voided = 0
  ORDER BY o.date_created ASC
`, [lastSyncTime]);

// Result:
[
  {
    obs_id: 12345,
    person_id: 123,
    concept_id: 456,
    value_text: "dgdggdf 200mg",
    obs_datetime: "2025-11-06T12:00:00",
    creator: 789,
    location_id: 10
  }
]
```

### Step 4: Enrich Data

```javascript
// Get Question Concept name
const conceptName = await getConceptName(456);
// Result: "Malaria smear impression"

// Get Creator info
const creator = await getProviderInfo(789);
// Result: { name: "Super User", identifier: "PROVIDER_789" }

// Get Location
const location = await getLocationName(10);
// Result: "Outpatient Clinic"
```

### Step 5: Match Patient

```javascript
// Get National ID from OpenMRS
const nationalId = await getNationalId(123);
// Result: "1234567890123"

// Find in Patient Passport
const patient = await Patient.findOne({ 
  nationalId: "1234567890123" 
});
// Result: Found patient (ObjectId: xyz789)
```

### Step 6: Store in Patient Passport

```javascript
const record = await MedicalRecord.create({
  patientId: "xyz789",
  type: "condition",
  data: {
    name: "Malaria smear impression",        // ← Question Concept
    details: "Treatment: dgdggdf 200mg",     // ← Value
    diagnosed: "2025-11-06T12:00:00.000Z",   // ← obs_datetime
    procedure: "Synced from OpenMRS - Diagnosis: Malaria smear impression, Treatment: dgdggdf 200mg | Doctor: Super User | Hospital: Central Hospital"
  },
  createdBy: doctorId  // ← Mapped from Super User
});

// Update patient's medical history
await patient.updateOne({
  $push: { medicalHistory: record._id }
});
```

### Step 7: Patient Views in Passport

```javascript
// Frontend Request
GET /api/patients/me

// Response includes:
{
  medicalHistory: [
    {
      _id: "record123",
      type: "condition",
      data: {
        name: "Malaria smear impression",
        details: "Treatment: dgdggdf 200mg",
        diagnosed: "2025-11-06T12:00:00.000Z",
        procedure: "..."
      },
      createdBy: {
        name: "Dr. Super User",
        hospital: "Central Hospital"
      },
      createdAt: "2025-11-06T12:05:00.000Z"
    }
  ]
}

// Displays as:
"Malaria smear impression - Treatment: dgdggdf 200mg"
"By: Dr. Super User - Central Hospital"
"Date: Nov 6, 2025"
```

---

## 🎯 Key Mappings Summary

| OpenMRS Field | OpenMRS Example | Patient Passport | Passport Example |
|---------------|-----------------|------------------|------------------|
| **Question Concept** | "Malaria smear impression" | `data.name` | "Malaria smear impression" |
| **Value** | "dgdggdf 200mg" | `data.details` | "Treatment: dgdggdf 200mg" |
| **obs_datetime** | "2025-11-06 12:00" | `data.diagnosed` | "2025-11-06T12:00:00Z" |
| **Creator** | "Super User" (ID: 789) | `createdBy` | Doctor ObjectId |
| **Location** | "Outpatient Clinic" | `data.procedure` | Included in notes |
| **person_id** | 123 | `patientId` | Patient ObjectId (via National ID) |

---

## 🔍 SQL Queries Used

### Get All Observations for Patient

```sql
-- Get patient's National ID
SELECT pi.identifier, pi.patient_id
FROM patient_identifier pi
JOIN patient_identifier_type pit 
  ON pi.identifier_type = pit.patient_identifier_type_id
WHERE pit.name LIKE '%National%ID%'
  AND pi.identifier = '1234567890123'
  AND pi.voided = 0;

-- Get observations with full details
SELECT 
  o.obs_id,
  o.obs_datetime,
  cn.name as question_concept,
  o.value_text as value,
  CONCAT(pn.given_name, ' ', pn.family_name) as creator,
  l.name as location
FROM obs o
JOIN concept_name cn 
  ON o.concept_id = cn.concept_id 
  AND cn.locale = 'en'
  AND cn.concept_name_type = 'FULLY_SPECIFIED'
LEFT JOIN users u ON o.creator = u.user_id
LEFT JOIN person_name pn ON u.person_id = pn.person_id
LEFT JOIN location l ON o.location_id = l.location_id
WHERE o.person_id = (
  SELECT patient_id FROM patient_identifier 
  WHERE identifier = '1234567890123' 
  LIMIT 1
)
AND o.voided = 0
ORDER BY o.obs_datetime DESC;
```

### Expected Result:

| obs_id | obs_datetime | question_concept | value | creator | location |
|--------|-------------|------------------|-------|---------|----------|
| 12345 | 2025-11-06 12:00 | Malaria smear impression | dgdggdf 200mg | Super User | Outpatient Clinic |

---

## ✅ Validation Checklist

After sync completes, verify:

### In OpenMRS:
- [ ] Observation exists in obs table
- [ ] concept_id links to correct concept
- [ ] value_text contains medication
- [ ] creator links to provider
- [ ] voided = 0

### In Patient Passport MongoDB:
- [ ] Record exists in medicalrecords collection
- [ ] `data.name` = Question Concept from OpenMRS
- [ ] `data.details` contains "Treatment: [value]"
- [ ] `data.diagnosed` matches obs_datetime
- [ ] `createdBy` links to correct doctor
- [ ] Patient's medicalHistory array includes record ID

### In Patient Portal:
- [ ] Diagnosis name displays correctly
- [ ] Treatment/medication shows in details
- [ ] Doctor name appears
- [ ] Hospital name appears
- [ ] Date/time is correct

---

## 🎨 Frontend Display Example

```jsx
// Patient views medical history
{medicalHistory.map(record => (
  <div className="medical-record">
    <h3>{record.data.name}</h3>
    {/* Shows: "Malaria smear impression" */}
    
    <p>{record.data.details}</p>
    {/* Shows: "Treatment: dgdggdf 200mg" */}
    
    <small>
      By: Dr. {record.createdBy.name} - {record.createdBy.hospital}
    </small>
    {/* Shows: "By: Dr. Super User - Central Hospital" */}
    
    <small>
      Date: {new Date(record.data.diagnosed).toLocaleDateString()}
    </small>
    {/* Shows: "Date: 11/6/2025" */}
  </div>
))}
```

---

## 🚨 Important Notes

1. **Question Concept is the Diagnosis**
   - Not the concept type
   - This is what the patient was diagnosed with
   - Example: "Malaria smear impression", "Diabetes Type 2", "Hypertension"

2. **Value is the Treatment/Medication**
   - What was prescribed or administered
   - Example: "dgdggdf 200mg", "Metformin 500mg", "Insulin"

3. **Both are stored together**
   - Diagnosis → `data.name`
   - Medication → `data.details`
   - This gives complete picture: "What was diagnosed + How it was treated"

4. **Creator becomes Doctor**
   - Sync service auto-creates doctor record if not exists
   - Links using OpenMRS provider identifier
   - Shows who made the diagnosis

5. **Empty Fields**
   - Other passport sections remain empty until populated
   - Only medical history (conditions) gets populated from OpenMRS
   - Medications list, test results remain separate

---

**Last Updated:** November 6, 2025  
**Based on:** OpenMRS 2.x observation structure  
**Patient Passport Version:** 1.0.0
