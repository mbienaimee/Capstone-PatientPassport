# USSD Quick Reference Guide

## Access Code
**Main Code**: `*384*40767#` (or your configured USSD code in `.env`)

## Navigation Flow

### Level 0: Language Selection
```
Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

### Level 1: Access Method (English)
```
View my Patient Passport
1. Use National ID
2. Use Email
```

### Level 1: Access Method (Kinyarwanda)
```
Reba Passport yawe y'ubuzima
1. Koresha Irangamuntu
2. Koresha Email
```

### Level 2: Input Prompt

#### National ID (English)
```
Enter your National ID:
```

#### National ID (Kinyarwanda)
```
Shyiramo Irangamuntu ryawe:
```

#### Email (English)
```
Enter your Email address:
```

#### Email (Kinyarwanda)
```
Shyiramo Email yawe:
```

### Level 3: Result
Success message and SMS sent to phone.

## Example Sessions

### Example 1: English + National ID
```
Dial: *384*40767#
Screen 1: Choose a language / Hitamo ururimi
         1. English
         2. Kinyarwanda
Enter: 1

Screen 2: View my Patient Passport
         1. Use National ID
         2. Use Email
Enter: 1

Screen 3: Enter your National ID:
Enter: 1234567890123456

Screen 4: Your Patient Passport has been sent to your phone via SMS. Thank you!
```

### Example 2: English + Email
```
Dial: *384*40767#
Enter: 1 (English)
Enter: 2 (Email)
Enter: patient@example.com

Result: Your Patient Passport has been sent to your phone via SMS. Thank you!
```

### Example 3: Kinyarwanda + National ID
```
Dial: *384*40767#
Enter: 2 (Kinyarwanda)
Enter: 1 (Irangamuntu)
Enter: 1234567890123456

Result: Passport yawe y'ubuzima yoherejwe kuri telephone yawe binyuze kuri SMS. Murakoze!
```

## Input Formats

### National ID
- **Length**: 10-16 digits
- **Format**: Numeric only
- **Note**: Spaces and dashes are automatically removed
- **Examples**:
  - ✅ `1234567890123456`
  - ✅ `1234567890` (10 digits)
  - ✅ `1234 5678 9012 3456` (spaces removed automatically)
  - ❌ `123` (too short)
  - ❌ `12345abc` (contains letters)

### Email
- **Format**: Standard email format
- **Case**: Case-insensitive (PATIENT@EXAMPLE.COM = patient@example.com)
- **Examples**:
  - ✅ `patient@example.com`
  - ✅ `PATIENT@EXAMPLE.COM`
  - ✅ `Patient@Example.Com`
  - ❌ `patient` (missing domain)
  - ❌ `patient@` (incomplete)
  - ❌ `@example.com` (missing user)

## Testing URLs

### Postman/API Testing
```http
POST http://localhost:5000/api/ussd/test
Content-Type: application/json

{
  "sessionId": "test-session-123",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567890123456"
}
```

### Africa's Talking Simulator
URL: https://simulator.africastalking.com:1517/

## Text Parameter Encoding

The `text` parameter represents the user's navigation path:
- Empty string `""` = Initial screen (language selection)
- `"1"` = Selected option 1 at level 0
- `"1*1"` = Selected option 1, then option 1
- `"1*2*patient@example.com"` = English, Email, entered email

## Success SMS Format

### English
```
PATIENT PASSPORT
Name: John Doe
ID: 1234567890123456
DOB: 1/1/1990
Blood: O+
Allergies: Penicillin
Emergency: Jane Doe (+250788999888)

For full details, visit: https://your-frontend.com/patient-passport
Passport ID: 507f1f77bcf86cd799439011
```

### Kinyarwanda
```
PASSPORT Y'UBUZIMA
Amazina: John Doe
Irangamuntu: 1234567890123456
Itariki y'amavuko: 1/1/1990
Ubwoko bw'amaraso: O+
Imiti itemewe: Penicillin
Uhamagarwa mu byihutirwa: Jane Doe (+250788999888)

Kugira ngo ubone ibisobanuro byuzuye, sura: https://your-frontend.com/patient-passport
ID ya Passport: 507f1f77bcf86cd799439011
```

## Error Messages

### English
- `Error: Invalid National ID. Must be 10-16 digits.`
- `Error: Invalid email format.`
- `Error: Patient not found with this National ID. Please check and try again.`
- `Error: User not found with this email. Please check and try again.`
- `Error: Patient record not found for this user.`
- `Error: Patient passport not found. Please contact your healthcare provider.`
- `Error: Unable to process your request. Please try again later.`

### Kinyarwanda
- `Ikosa: Invalid National ID. Must be 10-16 digits.` (validation errors stay in English)
- `Ikosa: Ntiwabonye umurwayi ufite iri rangamuntu. Suzuma hanyuma ugerageze.`
- `Ikosa: Ntiwabonye umukoresha ufite iyi email. Suzuma hanyuma ugerageze.`
- `Ikosa: Ntabwo haboneka inyandiko y'umurwayi kuri uyu mukoresha.`
- `Ikosa: Ntabwo haboneka passport y'umurwayi. Nyamuneka vugana n'inzego z'ubuzima.`
- `Ikosa: Ntidushobora gutunganya icyifuzo cyawe. Ongera ugerageze nyuma.`

## Troubleshooting

### "Patient not found"
1. Verify the national ID exists in the database
2. Check if it's exactly 10-16 digits
3. Ensure Patient collection has the correct nationalId field

### "User not found with this email"
1. Verify the email exists in the User collection
2. Email search is case-insensitive
3. Check for typos in email address

### "Patient passport not found"
1. Patient exists but doesn't have a passport created
2. Need to create PatientPassport record for this patient
3. Check if `isActive: true` on the passport

### SMS not received
1. Check Africa's Talking API credentials
2. Verify phone number format (+250...)
3. Check Africa's Talking balance (if not sandbox)
4. Review Africa's Talking delivery logs

## Database Queries

### Find Patient by National ID
```javascript
await Patient.findOne({ nationalId: "1234567890123456" })
  .populate('user', 'name email phone')
  .lean();
```

### Find User by Email (case-insensitive)
```javascript
const emailRegex = new RegExp(`^${email}$`, 'i');
await User.findOne({ email: emailRegex }).lean();
```

### Find Patient Passport
```javascript
await PatientPassport.findByPatientId(patientId);
// or
await PatientPassport.findOne({ patient: patientId, isActive: true });
```

## Security Notes

1. **No Authentication**: USSD access doesn't require login
2. **SMS Delivery**: Passport sent to registered phone only
3. **Access Logging**: All USSD access is logged in passport.accessHistory
4. **Rate Limiting**: Consider implementing rate limits on USSD endpoint
5. **Data Sensitivity**: Only summary information sent via SMS

## Next Steps

1. Test with real patient data
2. Configure proper SMS gateway (production)
3. Set up monitoring and alerts
4. Add analytics for USSD usage
5. Consider implementing PIN verification for added security
