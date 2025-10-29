# Role-Based Navigation Testing Guide

## Quick Test Instructions

### Test Scenario 1: Patient Login
1. Navigate to `/patient-login`
2. Enter patient credentials (email and password)
3. Complete OTP verification if required
4. **Expected Result:** Automatically redirected to `/patient-passport`
5. **Verify:** Patient can see their medical passport

### Test Scenario 2: Doctor Login
1. Navigate to `/hospital-login` or `/doctor-login`
2. Enter doctor credentials (email and password provided by hospital)
3. Complete OTP verification if required
4. **Expected Result:** Automatically redirected to `/doctor-dashboard`
5. **Verify:** Doctor can see list of patients and "Add New Patient" button

### Test Scenario 3: Hospital Login
1. Navigate to `/hospital-login`
2. Enter hospital credentials
3. Complete OTP verification if required
4. **Expected Result:** Automatically redirected to `/hospital-dashboard`
5. **Verify:** Hospital can see dashboard with doctors list and patients list

### Test Scenario 4: Admin Login
1. Navigate to `/hospital-login`
2. Enter admin credentials
3. Complete OTP verification if required
4. **Expected Result:** Automatically redirected to `/admin-dashboard`
5. **Verify:** Admin can access system-wide management features

## User Credentials for Testing

### Sample Patient
- **Email:** patient@example.com
- **Password:** [patient's national ID or set password]
- **Expected Route:** `/patient-passport`

### Sample Doctor
- **Email:** [doctor email created by hospital]
- **Password:** [password set by hospital]
- **Expected Route:** `/doctor-dashboard`

### Sample Hospital
- **Email:** hospital@example.com
- **Password:** [hospital password]
- **Expected Route:** `/hospital-dashboard`

## What to Verify

### For Each Role:
1. ✅ Login is successful
2. ✅ OTP verification works (if enabled)
3. ✅ User is redirected to correct dashboard
4. ✅ Welcome message shows correct user name
5. ✅ Dashboard displays appropriate features for that role
6. ✅ User cannot access other role's dashboards without proper authorization

## Navigation Flow Chart

```
Login Page
    |
    v
Enter Credentials
    |
    v
OTP Required? ----No----> Store Token & User Data
    |                              |
   Yes                             v
    |                      Check User Role
    v                              |
OTP Verification          +--------+--------+
    |                     |        |        |
    v                  patient  doctor  hospital/admin
Store Token              |        |        |
    |                    v        v        v
    v              /patient-  /doctor-  /hospital-
Check User Role    passport   dashboard dashboard
```

## Troubleshooting

### Issue: User redirected to wrong page
**Solution:** 
1. Check localStorage for user data: `localStorage.getItem('user')`
2. Verify role field is correct in user object
3. Clear localStorage and login again

### Issue: Redirect doesn't happen
**Solution:**
1. Check browser console for errors
2. Verify token is stored: `localStorage.getItem('token')`
3. Ensure React Router is working correctly

### Issue: Access denied on dashboard
**Solution:**
1. Verify user has correct role in database
2. Check backend authorization middleware
3. Ensure JWT token is valid

## Test Coverage

- [x] PatientPassportLogin.tsx - role-based redirect implemented
- [x] HospitalLogin.tsx - role-based redirect implemented
- [x] DoctorLoginPage.tsx - role-based redirect implemented
- [x] OTPLogin.tsx - role-based redirect implemented
- [x] OTPVerificationPage.tsx - role-based redirect implemented

## Success Criteria

✅ All 5 login components redirect based on user role
✅ Patients go to their passport
✅ Doctors go to patient list
✅ Hospitals go to dashboard with doctor/patient management
✅ Admins go to admin dashboard
✅ Receptionists go to receptionist dashboard
✅ Fallback routes work when role is undefined

## Next Steps After Testing

1. If tests pass → Document and close this feature
2. If tests fail → Debug specific login flow
3. Consider adding route guards for extra security
4. Implement "Remember me" functionality
5. Add role-based navigation menu
