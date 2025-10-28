# USSD Integration Testing Guide

## Overview

This guide provides step-by-step instructions for testing the USSD Patient Passport integration.

## Prerequisites

- Backend server running
- Africa's Talking account (sandbox or production)
- Test patient data in database
- Postman (optional, for API testing)

## Test Environments

### 1. Local Development

```bash
# Start backend server
cd backend
npm run dev

# Server should start on http://localhost:5000
```

### 2. Sandbox Testing (Africa's Talking)

- Use sandbox credentials
- Test USSD code: `*384*40767#`
- No real SMS charges
- Limited to test phone numbers

### 3. Production Testing

- Requires purchased USSD code
- Real SMS charges apply
- Live phone testing

## Test Cases

### Test Case 1: Language Selection

**Objective**: Verify language menu displays correctly

**Steps**:
1. Dial USSD code or POST to `/api/ussd/callback`
2. Send empty text: `""`

**Expected Response**:
```
CON Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": ""
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 2: English Access Method

**Objective**: Verify English menu displays correctly

**Steps**:
1. Select English (1)

**Expected Response**:
```
CON View my Patient Passport
1. Use National ID
2. Use Email
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-2",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 3: National ID Input Prompt

**Objective**: Verify National ID input prompt

**Steps**:
1. Select English (1)
2. Select National ID (1)

**Expected Response**:
```
CON Enter your National ID (16 digits):
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-3",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*1"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 4: Valid National ID Submission

**Objective**: Verify successful passport retrieval with valid National ID

**Prerequisites**:
- Patient with National ID `1234567890123456` exists in database

**Steps**:
1. Select English (1)
2. Select National ID (1)
3. Enter valid National ID

**Expected Response**:
```
END Your Patient Passport has been sent to your phone via SMS. Thank you!
```

**Expected SMS**:
```
PATIENT PASSPORT
Name: [Patient Name]
ID: 1234567890123456
DOB: [Date]
Blood: [Type]
Allergies: [List]
Emergency: [Name] ([Phone])
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-4",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*1*1234567890123456"
  }'
```

**Status**: [ ] Pass [ ] Fail
**SMS Received**: [ ] Yes [ ] No

---

### Test Case 5: Invalid National ID Format

**Objective**: Verify error handling for invalid National ID

**Steps**:
1. Select English (1)
2. Select National ID (1)
3. Enter invalid National ID (less than 16 digits)

**Expected Response**:
```
END Error: Invalid National ID. Must be 16 digits.
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-5",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*1*12345"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 6: Patient Not Found

**Objective**: Verify error handling when patient doesn't exist

**Steps**:
1. Select English (1)
2. Select National ID (1)
3. Enter valid format but non-existent National ID

**Expected Response**:
```
END Error: Patient not found with this National ID.
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-6",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*1*9999999999999999"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 7: Email Input Prompt

**Objective**: Verify email input prompt

**Steps**:
1. Select English (1)
2. Select Email (2)

**Expected Response**:
```
CON Enter your Email address:
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-7",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*2"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 8: Valid Email Submission

**Objective**: Verify successful passport retrieval with valid email

**Prerequisites**:
- Patient with email exists in database

**Steps**:
1. Select English (1)
2. Select Email (2)
3. Enter valid email

**Expected Response**:
```
END Your Patient Passport has been sent to your phone via SMS. Thank you!
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-8",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*2*patient@example.com"
  }'
```

**Status**: [ ] Pass [ ] Fail
**SMS Received**: [ ] Yes [ ] No

---

### Test Case 9: Invalid Email Format

**Objective**: Verify error handling for invalid email

**Steps**:
1. Select English (1)
2. Select Email (2)
3. Enter invalid email

**Expected Response**:
```
END Error: Invalid email format.
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-9",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*2*notanemail"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 10: Kinyarwanda Flow

**Objective**: Verify Kinyarwanda language flow

**Steps**:
1. Select Kinyarwanda (2)

**Expected Response**:
```
CON Reba Passport yawe y'ubuzima
1. Koresha Irangamuntu
2. Koresha Email
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-10",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "2"
  }'
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 11: Complete Kinyarwanda Flow

**Objective**: Verify complete Kinyarwanda flow with National ID

**Steps**:
1. Select Kinyarwanda (2)
2. Select National ID (1)
3. Enter valid National ID

**Expected Response**:
```
END Passport yawe y'ubuzima yoherejwe kuri telephone yawe binyuze kuri SMS. Murakoze!
```

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-11",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "2*1*1234567890123456"
  }'
```

**Status**: [ ] Pass [ ] Fail
**SMS Received**: [ ] Yes [ ] No

---

### Test Case 12: Admin Test Endpoint

**Objective**: Verify admin test endpoint works

**Prerequisites**:
- Valid admin authentication token

**cURL Command**:
```bash
curl -X POST http://localhost:5000/api/ussd/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "sessionId": "admin-test",
    "phoneNumber": "+250788123456",
    "text": "1*1"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "response": "CON Enter your National ID (16 digits):",
    "sessionId": "admin-test",
    "phoneNumber": "+250788123456",
    "text": "1*1"
  }
}
```

**Status**: [ ] Pass [ ] Fail

---

### Test Case 13: Admin Stats Endpoint

**Objective**: Verify admin stats endpoint works

**Prerequisites**:
- Valid admin authentication token

**cURL Command**:
```bash
curl -X GET http://localhost:5000/api/ussd/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "USSD statistics endpoint",
  "data": {
    "totalSessions": 0,
    "successfulRetrievals": 0,
    "failedAttempts": 0,
    "accessMethods": {
      "nationalId": 0,
      "email": 0
    },
    "languages": {
      "english": 0,
      "kinyarwanda": 0
    }
  }
}
```

**Status**: [ ] Pass [ ] Fail

---

## SMS Delivery Testing

### Verify SMS Content

**Check that SMS contains**:
- [ ] Patient name
- [ ] National ID
- [ ] Date of birth
- [ ] Blood type
- [ ] Allergies (if any)
- [ ] Emergency contact name
- [ ] Emergency contact phone
- [ ] Link to full passport

**Sample SMS Format**:
```
PATIENT PASSPORT
Name: John Doe
ID: 1234567890123456
DOB: 01/01/1990
Blood: O+
Allergies: Penicillin
Emergency: Jane Doe (+250788111222)

For full details, visit: https://your-app.com/patient-passport
Passport ID: 507f1f77bcf86cd799439011
```

---

## Performance Testing

### Response Time

**Acceptable Thresholds**:
- Language menu: < 1 second
- Access method menu: < 1 second
- Input prompts: < 1 second
- Final processing: < 3 seconds
- SMS delivery: < 30 seconds

### Load Testing

```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 -p test-data.json -T application/json \
  http://localhost:5000/api/ussd/callback
```

**Metrics to track**:
- Requests per second
- Average response time
- Error rate
- 95th percentile response time

---

## Integration Testing with Database

### Test Data Setup

```javascript
// Create test patient in MongoDB
db.patients.insertOne({
  user: ObjectId("..."),
  nationalId: "1234567890123456",
  dateOfBirth: ISODate("1990-01-01"),
  gender: "male",
  bloodType: "O+",
  contactNumber: "+250788123456",
  address: "Kigali, Rwanda",
  emergencyContact: {
    name: "Jane Doe",
    relationship: "Spouse",
    phone: "+250788111222"
  }
});

// Create corresponding PatientPassport
db.patientpassports.insertOne({
  patient: ObjectId("..."),
  personalInfo: {
    fullName: "John Doe",
    nationalId: "1234567890123456",
    // ... other fields
  },
  medicalInfo: {
    allergies: ["Penicillin"],
    // ... other fields
  }
});
```

---

## Error Handling Testing

### Test Scenarios

1. **Database Connection Failure**
   - Stop MongoDB
   - Attempt USSD flow
   - Expected: Graceful error message

2. **Africa's Talking API Down**
   - Mock API failure
   - Attempt SMS send
   - Expected: Error logged, user informed

3. **Invalid Session ID**
   - Send invalid session ID
   - Expected: Proper error handling

4. **Malformed Request**
   - Send incomplete request body
   - Expected: Validation error

---

## Security Testing

### Test Cases

1. **SQL Injection Attempt**
   ```
   Input: "1234567890123456'; DROP TABLE patients; --"
   Expected: Input validation blocks malicious input
   ```

2. **XSS Attempt**
   ```
   Input: "<script>alert('XSS')</script>"
   Expected: Input sanitized
   ```

3. **Rate Limiting**
   ```
   Send 100 requests in 1 minute
   Expected: Requests throttled after limit
   ```

---

## Checklist

### Pre-Testing
- [ ] Backend server running
- [ ] Database accessible
- [ ] Test data created
- [ ] Environment variables configured
- [ ] Africa's Talking credentials valid

### During Testing
- [ ] All test cases documented
- [ ] Screenshots captured
- [ ] Errors logged
- [ ] Performance metrics recorded

### Post-Testing
- [ ] Test report generated
- [ ] Issues documented
- [ ] Fixes prioritized
- [ ] Regression tests planned

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Language Selection | [ ] | |
| English Menu | [ ] | |
| National ID Prompt | [ ] | |
| Valid National ID | [ ] | |
| Invalid National ID | [ ] | |
| Patient Not Found | [ ] | |
| Email Prompt | [ ] | |
| Valid Email | [ ] | |
| Invalid Email | [ ] | |
| Kinyarwanda Menu | [ ] | |
| Complete Kinyarwanda Flow | [ ] | |
| Admin Test Endpoint | [ ] | |
| Admin Stats Endpoint | [ ] | |

**Overall Success Rate**: ____%

**Critical Issues**: ___

**Minor Issues**: ___

---

## Issue Tracking Template

### Issue #1

**Title**: 

**Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low

**Description**:

**Steps to Reproduce**:

**Expected Behavior**:

**Actual Behavior**:

**Environment**:

**Fix Priority**: [ ] Immediate [ ] High [ ] Medium [ ] Low

---

**Tested By**: _____________

**Date**: _____________

**Environment**: [ ] Development [ ] Sandbox [ ] Production

**Version**: _____________
