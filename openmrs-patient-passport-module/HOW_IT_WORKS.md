# How OpenMRS → Patient Passport Integration Works

## Your Question:
> "So does that mean that I have a patient in OpenMRS and have him in the Patient Passport, means when the observation the doctor saves will directly go to the passport?"

## Answer: YES, but you need to trigger it! Here's how:

---

## 🔄 Current Flow (Semi-Automatic)

### Step 1: Patient Must Exist in BOTH Systems
- **OpenMRS**: Patient registered with name (e.g., "John Doe")
- **Patient Passport**: Patient registered with same name (case-insensitive matching)

### Step 2: Doctor Adds Data in OpenMRS
Doctor saves observations like:
- 🩺 Diagnosis (e.g., "Diabetes", "Hypertension")
- 💊 Medications (e.g., "Metformin 500mg", "Lisinopril 10mg")

### Step 3: Send to Patient Passport
**Option A: Use REST API** (Manual trigger)
```bash
# After doctor saves observation with ID 123
POST http://localhost:8080/openmrs/module/patientpassport/api/send/123?type=diagnosis
```

**Option B: From OpenMRS UI** (Button click)
- Add a button in OpenMRS form
- Calls the API when clicked
- Sends observation to Patient Passport

---

## 🎯 What Happens Automatically:

Once you trigger the send, the module **AUTOMATICALLY**:

1. ✅ **Finds the patient** by name in both systems
2. ✅ **Extracts observation data** (diagnosis name, medication details, dosage)
3. ✅ **Gets hospital name** from OpenMRS location
4. ✅ **Gets doctor name** from OpenMRS provider
5. ✅ **Sends to Patient Passport API** via HTTPS
6. ✅ **Stores with attribution** (who, where, when)

---

## 📋 Example Scenario

### Initial Setup:
```
OpenMRS Patient:        "Jane Smith"
Passport Patient:       "Jane Smith" ✅ (Same name - will match!)
```

### Doctor Action in OpenMRS:
```
Doctor: Dr. Williams
Hospital: Kigali Hospital
Patient: Jane Smith
Diagnosis: "Type 2 Diabetes"
Medication: "Metformin 500mg twice daily"
```

### Trigger the Sync:
```bash
# Get the observation ID from OpenMRS (e.g., 456)
POST /openmrs/module/patientpassport/api/send/456?type=diagnosis
```

### Result in Patient Passport:
```json
{
  "patient": "Jane Smith",
  "diagnosis": "Type 2 Diabetes",
  "hospital": "Kigali Hospital",
  "doctor": "Dr. Williams",
  "date": "2025-11-04",
  "source": "OpenMRS"
}
```

---

## 🚀 How to Make It FULLY Automatic

To make observations sync **without manual API calls**, you can:

### Option 1: OpenMRS HTML Form
Add JavaScript to your OpenMRS form:
```javascript
// When form is saved
jQuery(document).ready(function() {
    jQuery('form').on('submit', function() {
        // Get the observation ID from the saved form
        var obsId = /* get from form */;
        
        // Send to Patient Passport
        jQuery.post('/openmrs/module/patientpassport/api/send/' + obsId + '?type=diagnosis');
    });
});
```

### Option 2: Scheduled Task
Create a scheduled task that runs every few minutes:
```bash
# Cron job or OpenMRS scheduled task
# Finds new observations and sends them to Patient Passport
```

### Option 3: Custom OpenMRS Module Extension
Create a button in the patient dashboard:
```
[Patient Dashboard]
  - Diagnoses
    - "Type 2 Diabetes" [Send to Passport] ← Click here
```

---

## ✅ What You Have NOW:

| Feature | Status |
|---------|--------|
| Patient matching by name | ✅ Working |
| Send diagnosis to Passport | ✅ Working |
| Send medication to Passport | ✅ Working |
| Hospital attribution | ✅ Working |
| Doctor attribution | ✅ Working |
| Data security (HTTPS) | ✅ Working |
| OTP for viewing passport | ✅ Working |
| **Automatic sync on save** | ⚠️ Needs trigger |

---

## 🎬 Next Steps to Use It:

### 1. Upload the Module
```bash
# Go to OpenMRS
Administration → Manage Modules → Add or Upgrade Module
# Upload: patientpassport-1.0.0.omod
```

### 2. Test the Integration
```bash
# Create observation in OpenMRS (get observation ID)
# Send to Patient Passport
curl -X POST http://localhost:8080/openmrs/module/patientpassport/api/send/123?type=diagnosis
```

### 3. Check Patient Passport
```bash
# Login to Patient Passport
# View patient medical history
# Should see the new diagnosis/medication with hospital & doctor info
```

---

## 🔐 Security Flow

```
OpenMRS (Doctor adds data)
    ↓
[Trigger Send]
    ↓
OpenMRS Module → HTTPS → Patient Passport API
    ↓
Patient Passport (Stores with attribution)
    ↓
Patient views with OTP verification ✅
```

---

## ❓ FAQ

**Q: Does the patient need the same ID in both systems?**  
A: No! We use **patient NAME** to match, not ID or National ID.

**Q: What if names don't match exactly?**  
A: Matching is case-insensitive. "John Doe" = "john doe" ✅

**Q: Can I send old observations?**  
A: Yes! Use the API with any observation ID at any time.

**Q: Do I need to manually sync patients?**  
A: No, patient mapping happens automatically when you send the first observation.

**Q: What if the patient doesn't exist in Passport?**  
A: The sync will fail. Patient must be registered in both systems first.

---

## 📞 Support

Need help? Check the logs:
- OpenMRS: `openmrs.log`
- Patient Passport: Backend console logs

Look for:
- 📤 "Sending diagnosis to Patient Passport"
- ✅ "Successfully sent to Patient Passport"
- ❌ "Failed to send" (with error details)
