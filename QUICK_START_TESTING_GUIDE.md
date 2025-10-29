# Quick Start Guide - Hospital & Doctor Workflow Testing

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Application

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🏥 Test Hospital Workflow

### 1. Login as Hospital
```
URL: http://localhost:5173/hospital-login

Credentials:
- Email: [your hospital email]
- Password: [your hospital password]

Expected: Redirect to Hospital Dashboard
```

### 2. View Hospital Dashboard
```
After login, you should see:
✅ Hospital name and details
✅ Statistics (Total Doctors, Total Patients, Active Cases)
✅ Three tabs: Overview | Doctors | Patients
```

### 3. Manage Doctors

**Add a Doctor:**
```
1. Click on "Doctors" tab
2. Click "Add Doctor" button
3. Fill the form:
   - Name: Dr. Jane Smith
   - Email: jane.smith@test.com
   - Password: Doctor@123
   - License Number: LIC-2025-001
   - Specialization: Cardiology
4. Click Submit

Expected Result:
✅ Success notification
✅ Doctor appears in the list
✅ Doctor can now login with these credentials
```

**Delete a Doctor:**
```
1. Find the doctor in the list
2. Click the delete icon (trash icon)
3. Confirm deletion

Expected Result:
✅ Doctor removed from list
✅ Doctor account deactivated
```

### 4. View Patients
```
1. Click on "Patients" tab
2. You should see:
   ✅ List of all patients from database
   ✅ Patient details (Name, National ID, Contact, etc.)
   ✅ Search functionality
   ✅ Filter by status
```

---

## 👨‍⚕️ Test Doctor Workflow

### 1. Login as Doctor
```
URL: http://localhost:5173/doctor-login

Credentials (use the doctor created by hospital):
- Email: jane.smith@test.com
- Password: Doctor@123

Steps:
1. Enter email and password
2. Check email for OTP
3. Enter OTP code
4. Click Verify

Expected: Redirect to Doctor Dashboard
```

### 2. View Doctor Dashboard
```
After login, you should see:
✅ Welcome message with doctor name
✅ Dashboard statistics (Total Patients, Medical Conditions, etc.)
✅ Complete list of ALL patients in the database
✅ Search and filter options
```

### 3. Request Patient Passport Access

**Full Workflow:**
```
1. On Doctor Dashboard, find a patient
2. Click "Request Access" button
3. OTP Request Modal appears

Expected:
✅ Notification: "OTP sent to patient's email"
✅ Modal shows patient name and email

4. Check patient's email for OTP code (6 digits)
5. Enter OTP in the modal
6. Click "Verify Access"

Expected:
✅ OTP verified successfully
✅ Patient Passport View opens
✅ Complete medical history displayed
```

### 4. View Patient Passport
```
In the Passport View, verify you can see:
✅ Personal Information
   - Name, National ID, Date of Birth
   - Contact details
   - Blood type, Allergies
   
✅ Medical History
   - Medical Conditions
   - Medications
   - Test Results
   - Hospital Visits
   - Immunizations
   
✅ Close button to exit the view
```

---

## 🧪 Complete Test Scenarios

### Scenario 1: Hospital Adds Doctor and Doctor Accesses Patient
```
Time Required: ~5 minutes

1. Login as Hospital
2. Add Doctor:
   - Name: Dr. Test User
   - Email: doctor.test@hospital.com
   - Password: Test@2025
   - License: LIC-TEST-999
   - Specialization: General Practice
3. Logout from Hospital
4. Login as Doctor (use above credentials)
5. View patient list (should show all patients)
6. Select a patient
7. Request passport access
8. Get OTP from patient email
9. Verify OTP
10. View patient passport

Success Criteria:
✅ Doctor created successfully
✅ Doctor can login
✅ Doctor sees all patients
✅ OTP sent and verified
✅ Passport displayed correctly
```

### Scenario 2: Hospital Manages Multiple Doctors
```
Time Required: ~3 minutes

1. Login as Hospital
2. Add 3 doctors with different specializations:
   - Dr. A - Cardiology
   - Dr. B - Neurology
   - Dr. C - Pediatrics
3. Verify all 3 appear in the doctor list
4. Delete Dr. C
5. Verify only Dr. A and Dr. B remain
6. Check total doctor count is 2

Success Criteria:
✅ All doctors added successfully
✅ All doctors visible in list
✅ Deletion works correctly
✅ Statistics updated correctly
```

### Scenario 3: Doctor Requests Multiple Patient Access
```
Time Required: ~10 minutes

1. Login as Doctor
2. Request access to Patient A
3. Verify OTP for Patient A
4. View Patient A's passport
5. Close passport view
6. Request access to Patient B
7. Verify OTP for Patient B
8. View Patient B's passport

Success Criteria:
✅ Can request access to different patients
✅ Each patient gets unique OTP
✅ OTPs don't interfere with each other
✅ Can view multiple passports in sequence
```

### Scenario 4: OTP Security Test
```
Time Required: ~5 minutes

Test Invalid OTP:
1. Login as Doctor
2. Request access to patient
3. Enter WRONG OTP code
Expected: ✅ Error message "Invalid OTP"

Test Expired OTP:
1. Request access to patient
2. Wait 11 minutes
3. Enter OTP
Expected: ✅ Error message "OTP has expired"

Test OTP Reuse:
1. Request access and verify with OTP
2. Try to use same OTP again
Expected: ✅ Error message (OTP already used)

Test Wrong Doctor:
1. Doctor A requests OTP for patient
2. Doctor B tries to use that OTP
Expected: ✅ Error message "OTP not requested by this doctor"
```

---

## 📋 Test Checklist

### Hospital Features
- [ ] Hospital login successful
- [ ] Hospital dashboard loads with correct data
- [ ] Hospital can see overview tab with details
- [ ] Hospital can add doctor
- [ ] Hospital can view all doctors
- [ ] Hospital can delete doctor
- [ ] Hospital can view all patients
- [ ] Hospital can search patients
- [ ] Hospital can filter patients by status
- [ ] Statistics update correctly

### Doctor Features
- [ ] Doctor login successful
- [ ] Doctor receives 2FA OTP
- [ ] Doctor dashboard loads with correct data
- [ ] Doctor can see all patients
- [ ] Doctor can search patients
- [ ] Doctor can filter patients
- [ ] Doctor can request patient access
- [ ] OTP sent to patient email
- [ ] Doctor can verify OTP
- [ ] Patient passport displays correctly
- [ ] Doctor can close passport view
- [ ] Logout works correctly

### Security Features
- [ ] Invalid OTP rejected
- [ ] Expired OTP rejected
- [ ] OTP can't be reused
- [ ] OTP is doctor-specific
- [ ] Unauthorized access blocked
- [ ] Role-based permissions enforced
- [ ] Session timeout works
- [ ] Audit logs created

---

## 🐛 Troubleshooting

### Issue: Cannot login
**Solution:**
```
1. Check if backend is running (port 5000)
2. Check if frontend is running (port 5173)
3. Check browser console for errors
4. Verify database connection
5. Check credentials are correct
```

### Issue: OTP not received
**Solution:**
```
1. Check patient email address is correct
2. Check spam/junk folder
3. Verify email service is configured
4. Check backend logs for email errors
5. Try requesting OTP again
```

### Issue: Doctor not in list after adding
**Solution:**
```
1. Refresh the page
2. Check browser console for errors
3. Verify form was submitted successfully
4. Check database for doctor record
5. Ensure no validation errors
```

### Issue: Empty patient list
**Solution:**
```
1. Verify patients exist in database
2. Check hospital ID is correct
3. Check API endpoint permissions
4. Look at network tab for API errors
5. Verify data relationships in database
```

---

## 📊 Expected Results Summary

### Hospital Dashboard
```
✅ Shows hospital name and details
✅ Displays correct statistics
✅ Lists all doctors belonging to hospital
✅ Lists all patients who visited hospital
✅ Add/Delete doctor functions work
✅ Search and filter work
```

### Doctor Dashboard
```
✅ Shows doctor name and welcome message
✅ Displays dashboard statistics
✅ Lists ALL patients in database (not just assigned ones)
✅ Request access button visible for each patient
✅ OTP modal works correctly
✅ Passport view displays complete medical history
```

### Security & Access Control
```
✅ Only hospitals can add/delete doctors
✅ Only doctors can request patient access
✅ OTP required for passport access
✅ OTP expires after 10 minutes
✅ OTP is single-use
✅ All actions are logged
```

---

## 🎯 Success Metrics

After completing all tests, you should have:

1. ✅ Successfully logged in as hospital
2. ✅ Added at least 1 doctor
3. ✅ Viewed hospital's doctor list
4. ✅ Viewed hospital's patient list
5. ✅ Successfully logged in as doctor
6. ✅ Viewed all patients from doctor dashboard
7. ✅ Requested passport access for a patient
8. ✅ Received and verified OTP
9. ✅ Viewed complete patient passport
10. ✅ All security validations working

---

## 📞 Need Help?

Check these resources:
- Full Implementation Doc: `HOSPITAL_DOCTOR_WORKFLOW_IMPLEMENTATION.md`
- Backend API Docs: `backend/swagger.json`
- Frontend Components: `frontend/src/components/`
- Database Models: `backend/src/models/`

Console Commands for Debugging:
```javascript
// Check current user in browser console
localStorage.getItem('user')

// Check auth token
localStorage.getItem('token')

// Clear all local storage
localStorage.clear()
```

---

**Quick Start Guide Version**: 1.0  
**Last Updated**: October 28, 2025
