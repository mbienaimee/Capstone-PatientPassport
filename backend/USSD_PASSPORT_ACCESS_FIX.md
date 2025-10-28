# USSD Passport Access Fix

## Problem
The USSD functionality was not working correctly for accessing patient passports from the database using either National ID or Email.

## Changes Made

### 1. **Flexible National ID Validation** (`ussdService.ts`)
- **Before**: Required exactly 16 digits for National ID
- **After**: Accepts 10-16 digits (matching the Patient model validation)
- **Benefit**: Now handles various national ID formats correctly

### 2. **Input Normalization**
- **National ID**: Strips all non-numeric characters before database lookup
- **Email**: Converts to lowercase and trims whitespace for consistent matching

### 3. **Case-Insensitive Email Search**
- **Before**: Exact match on email (case-sensitive)
- **After**: Case-insensitive regex search
- **Benefit**: Users can enter email in any case format

### 4. **Enhanced Logging**
Added detailed console logs at each step:
- 🔍 Search parameters
- 📋 Patient lookup results
- 📧 User lookup results
- 📄 Passport lookup results
- ✅ Success confirmation

### 5. **Improved Error Messages**
More specific error messages in both English and Kinyarwanda:
- "Patient not found with this National ID. Please check and try again."
- "User not found with this email. Please check and try again."
- "Patient record not found for this user."
- "Patient passport not found. Please contact your healthcare provider."

### 6. **Updated Access Logging**
Changed access type from `'ussd_access'` to `'view'` to match the schema enum values.

## How It Works

### USSD Flow:
1. **Level 0**: User chooses language (English/Kinyarwanda)
2. **Level 1**: User selects access method (National ID/Email)
3. **Level 2**: User enters their National ID or Email
4. **Level 3**: System processes request:
   - Validates and normalizes input
   - Searches database for patient record
   - Retrieves patient passport
   - Sends passport summary via SMS
   - Logs access in passport history

### Database Lookup Process:

#### Using National ID:
```
Input: "1234567890123456" (or with spaces/dashes)
↓ Clean: "1234567890123456" (numeric only)
↓ Query: Patient.findOne({ nationalId: "1234567890123456" })
↓ Populate: user details (name, email, phone)
↓ Query: PatientPassport.findByPatientId(patient._id)
```

#### Using Email:
```
Input: "User@Example.COM" (any case)
↓ Normalize: "user@example.com" (lowercase, trimmed)
↓ Query: User.findOne({ email: /^user@example.com$/i })
↓ Query: Patient.findOne({ user: user._id })
↓ Populate: user details
↓ Query: PatientPassport.findByPatientId(patient._id)
```

## Testing

### Using Africa's Talking Simulator:
1. Go to: https://simulator.africastalking.com:1517/
2. Enter your phone number
3. Service Code: `*384*40767#` (or your configured USSD code)
4. Follow the prompts

### Test Cases:

#### Test 1: Access with National ID
```
Session: *384*40767#
1. Select language: 1 (English)
2. Select method: 1 (National ID)
3. Enter National ID: 1234567890123456
Expected: Success message + SMS with passport
```

#### Test 2: Access with Email
```
Session: *384*40767#
1. Select language: 1 (English)
2. Select method: 2 (Email)
3. Enter email: patient@example.com
Expected: Success message + SMS with passport
```

#### Test 3: Case-Insensitive Email
```
Session: *384*40767#
1. Select language: 1 (English)
2. Select method: 2 (Email)
3. Enter email: PATIENT@EXAMPLE.COM
Expected: Success message + SMS with passport
```

#### Test 4: Invalid National ID
```
Session: *384*40767#
1. Select language: 1 (English)
2. Select method: 1 (National ID)
3. Enter National ID: 123 (too short)
Expected: Error message - "Invalid National ID. Must be 10-16 digits."
```

### Using Postman/API:
```http
POST http://localhost:5000/api/ussd/test
Content-Type: application/json

{
  "sessionId": "test-session-123",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567890123456"
}
```

## Monitoring

Check the console logs for detailed information:
- Request parameters
- Database query results
- Success/failure at each step

Example log output:
```
📱 USSD Request - Session: ATUid_..., Phone: +250788123456, Text: "1*1*1234567890123456"
   Path: [1, 1, 1234567890123456]
🔍 Searching for patient using nationalId: 1234567890123456
📋 Patient found by National ID: Yes
🔍 Searching for passport for patient ID: 507f1f77bcf86cd799439011
📄 Passport found: Yes
✅ Passport access completed for patient 507f1f77bcf86cd799439011
✅ Passport SMS sent to +250788123456
```

## Configuration

Ensure these environment variables are set in `.env`:
```env
# Africa's Talking Configuration (Sandbox)
AFRICASTALKING_API_KEY=sandbox
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_USSD_CODE=*384*40767#

# Frontend URL (for passport link in SMS)
FRONTEND_URL=https://jade-pothos-e432d0.netlify.app
```

## SMS Content

### English Example:
```
PATIENT PASSPORT
Name: John Doe
ID: 1234567890123456
DOB: 1/1/1990
Blood: O+
Allergies: Penicillin
Emergency: Jane Doe (+250788999888)

For full details, visit: https://jade-pothos-e432d0.netlify.app/patient-passport
Passport ID: 507f1f77bcf86cd799439011
```

### Kinyarwanda Example:
```
PASSPORT Y'UBUZIMA
Amazina: John Doe
Irangamuntu: 1234567890123456
Itariki y'amavuko: 1/1/1990
Ubwoko bw'amaraso: O+
Imiti itemewe: Penicillin
Uhamagarwa mu byihutirwa: Jane Doe (+250788999888)

Kugira ngo ubone ibisobanuro byuzuye, sura: https://jade-pothos-e432d0.netlify.app/patient-passport
ID ya Passport: 507f1f77bcf86cd799439011
```

## Troubleshooting

### Issue: "Patient not found"
- **Check**: Does the patient exist in the database?
- **Verify**: National ID matches exactly (after cleaning)
- **Solution**: Ensure patient record is created with correct nationalId

### Issue: "User not found with this email"
- **Check**: Is the email correct in the User collection?
- **Verify**: Email case doesn't matter (now case-insensitive)
- **Solution**: Verify user exists with `User.findOne({ email: /pattern/i })`

### Issue: "Patient passport not found"
- **Check**: Does a PatientPassport exist for this patient?
- **Verify**: `PatientPassport.findOne({ patient: patientId })`
- **Solution**: Create passport for the patient if missing

### Issue: SMS not received
- **Check**: Africa's Talking API credentials
- **Verify**: Phone number format (+250...)
- **Check**: SMS service is working: `smsService.sendSMS()`
- **Solution**: Check Africa's Talking dashboard for delivery status

## Files Modified
- `backend/src/services/ussdService.ts` - Main USSD logic and database queries

## Next Steps
1. Test thoroughly with real patient data
2. Monitor logs for any edge cases
3. Consider adding rate limiting for USSD requests
4. Add analytics to track USSD usage patterns
5. Consider caching frequently accessed passports
