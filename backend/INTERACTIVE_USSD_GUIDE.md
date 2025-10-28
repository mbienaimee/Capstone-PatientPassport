# Interactive USSD Medical Passport System

## 🎉 NEW FEATURE: Interactive Menu Navigation!

The USSD system has been completely redesigned to provide an interactive, menu-driven experience where patients can navigate through their medical records step by step.

---

## 📱 Complete USSD Flow

### **Level 0: Language Selection**
```
Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

### **Level 1: Access Method**
```
View my Patient Passport
1. Use National ID
2. Use Email
```

### **Level 2: Identity Input**
```
Enter your National ID:
[User types: 1234567891012345]
```

### **Level 3: Main Menu** ⭐ NEW!
```
Welcome Marie Reine!
Select an option:
1. View Summary
2. Medical History
3. Current Medications
4. Hospital Visits
5. Test Results
0. Send Full Passport via SMS
```

### **Level 4+: Detailed Views** ⭐ NEW!

#### **Option 1: View Summary**
```
END PATIENT SUMMARY
Name: Marie Reine
ID: 1234567891012345
Blood: O+
DOB: 1/15/1990

Allergies: Penicillin, Peanuts
```

#### **Option 2: Medical History**
```
CON MEDICAL CONDITIONS (3)
1. Hypertension [active]
2. Diabetes Type 2 [chronic]
3. Asthma [active]

0. Back to Main Menu

[User selects 1]

END CONDITION DETAILS
Name: Hypertension
Status: active
Diagnosed: 3/20/2020
By: Dr. Smith
Notes: Controlled with medication
```

#### **Option 3: Current Medications**
```
CON CURRENT MEDICATIONS (4)
1. Lisinopril
   10mg Once daily
2. Metformin
   500mg Twice daily
3. Albuterol
   2 puffs As needed
4. Aspirin
   81mg Once daily

0. Back to Main Menu

[User selects 1]

END MEDICATION DETAILS
Name: Lisinopril
Dosage: 10mg
Frequency: Once daily
Prescribed by: Dr. Smith
Start date: 3/20/2020
```

#### **Option 4: Hospital Visits**
```
CON HOSPITAL VISITS (5)
1. King Faisal Hospital - 10/15/2024
2. CHUK - 8/5/2024
3. Kibagabaga Hospital - 6/12/2024
4. King Faisal Hospital - 4/3/2024
5. CHUK - 2/18/2024

0. Back to Main Menu

[User selects 1]

END VISIT DETAILS
Hospital: King Faisal Hospital
Date: 10/15/2024
Doctor: Dr. Johnson
Reason: Follow-up check
Diagnosis: Blood pressure controlled
```

#### **Option 5: Test Results**
```
CON TEST RESULTS (6)
1. Blood Glucose [normal] - 10/1/2024
2. Blood Pressure [normal] - 10/1/2024
3. HbA1c [normal] - 9/15/2024
4. Lipid Panel [normal] - 8/10/2024
5. Complete Blood Count [normal] - 7/5/2024

Showing 5 of 6
0. Back to Main Menu

[User selects 1]

END TEST DETAILS
Type: Blood Glucose
Date: 10/1/2024
Status: normal
Result: 95 mg/dL
Range: 70-100 mg/dL
```

#### **Option 0: Send Full Passport via SMS**
```
END Your full Patient Passport has been sent to your phone via SMS. Thank you!

[OR if SMS fails]

END Passport Summary:
Name: Marie Reine
ID: 1234567891012345
Blood: O+

Visit: https://jade-pothos-e432d0.netlify.app/patient-passport
```

---

## 🔢 Navigation Examples

### Example 1: View Medical History
```
Dial: *384*40767#
Path: 1*1*1234567891012345*2
→ English → National ID → Enter ID → Medical History

Then select a condition:
Path: 1*1*1234567891012345*2*1
→ View details of first condition
```

### Example 2: View Current Medications
```
Dial: *384*40767#
Path: 1*1*1234567891012345*3
→ English → National ID → Enter ID → Current Medications

Then select a medication:
Path: 1*1*1234567891012345*3*2
→ View details of second medication
```

### Example 3: View Hospital Visits
```
Dial: *384*40767#
Path: 1*1*1234567891012345*4
→ English → National ID → Enter ID → Hospital Visits

Then select a visit:
Path: 1*1*1234567891012345*4*1
→ View details of first hospital visit
```

### Example 4: Quick Summary
```
Dial: *384*40767#
Path: 1*2*m.bienaimee@alustudent.com*1
→ English → Email → Enter Email → View Summary
```

---

## 🌍 Kinyarwanda Examples

### Reba Amateka y'ubuzima (Medical History)
```
Hamagara: *384*40767#
Inzira: 2*1*1234567891012345*2
→ Kinyarwanda → Irangamuntu → Andika ID → Amateka y'ubuzima

Hanyuma hitamo indwara:
Inzira: 2*1*1234567891012345*2*1
→ Reba ibisobanuro by'indwara ya mbere
```

### Reba Imiti ukoresha (Current Medications)
```
Hamagara: *384*40767#
Inzira: 2*1*1234567891012345*3
→ Kinyarwanda → Irangamuntu → Andika ID → Imiti ukoresha

Hanyuma hitamo umuti:
Inzira: 2*1*1234567891012345*3*1
→ Reba ibisobanuro by'umuti wa mbere
```

---

## 🎯 Key Features

### ✅ **1. Interactive Navigation**
- Multi-level menu system
- Easy back navigation with "0"
- Context preserved across screens

### ✅ **2. Rich Medical Data Access**
- **Summary**: Quick overview of patient info
- **Medical History**: List of all conditions with details
- **Current Medications**: Active prescriptions with dosages
- **Hospital Visits**: Recent visits with diagnosis
- **Test Results**: Lab results with normal ranges

### ✅ **3. Smart Display**
- Shows up to 5 items per page
- Indicates total count
- Clear navigation options
- Bilingual support (English/Kinyarwanda)

### ✅ **4. Session Management**
- Patient data cached for the session
- No need to re-enter credentials
- Fast navigation between menus

### ✅ **5. Graceful Fallbacks**
- Works even if SMS fails
- Shows data directly on screen
- Comprehensive error messages

---

## 📊 Data Displayed

| Section | Data Shown | Details Available |
|---------|------------|-------------------|
| **Summary** | Name, ID, Blood Type, DOB, Allergies | Basic patient info |
| **Medical History** | Condition name, status | Diagnosis date, doctor, notes |
| **Current Medications** | Drug name, dosage, frequency | Prescriber, start date |
| **Hospital Visits** | Hospital name, date | Doctor, reason, diagnosis, treatment |
| **Test Results** | Test type, date, status | Results, normal range, technician |

---

## 🧪 Testing Scenarios

### Test 1: Navigate Medical History
```http
POST http://localhost:5000/api/ussd/test
{
  "sessionId": "test-001",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567891012345*2"
}
```
**Expected**: List of medical conditions

### Test 2: View Specific Medication
```http
POST http://localhost:5000/api/ussd/test
{
  "sessionId": "test-002",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567891012345*3*1"
}
```
**Expected**: Details of first medication

### Test 3: View Hospital Visit Details
```http
POST http://localhost:5000/api/ussd/test
{
  "sessionId": "test-003",
  "phoneNumber": "+250788123456",
  "text": "1*1*1234567891012345*4*1"
}
```
**Expected**: Details of first hospital visit

### Test 4: Kinyarwanda Navigation
```http
POST http://localhost:5000/api/ussd/test
{
  "sessionId": "test-004",
  "phoneNumber": "+250788123456",
  "text": "2*1*1234567891012345*2"
}
```
**Expected**: Medical conditions in Kinyarwanda

---

## 🔐 Security Features

1. **Session-based access**: Data stored only for active session
2. **No password required**: Uses National ID/Email verification
3. **Access logging**: All views are logged in passport history
4. **Time-limited sessions**: Session data cleared after inactivity
5. **Phone number validation**: SMS sent only to verified numbers

---

## 💡 User Benefits

### For Patients:
- ✅ **Instant access** to medical records via any phone
- ✅ **No internet required** - works on USSD
- ✅ **Easy navigation** - simple numbered menus
- ✅ **Detailed information** - drill down into any record
- ✅ **Bilingual** - Available in English and Kinyarwanda

### For Healthcare Providers:
- ✅ **Improved patient engagement** - easier access to records
- ✅ **Reduced phone calls** - patients can self-serve
- ✅ **Better medication compliance** - easy to check prescriptions
- ✅ **Access tracking** - know when patients view their records

---

## 🚀 Production Deployment Checklist

- [ ] Test all menu paths thoroughly
- [ ] Verify session data cleanup
- [ ] Configure Africa's Talking production API keys
- [ ] Test with real phone numbers
- [ ] Monitor session storage (consider Redis for scale)
- [ ] Set up analytics to track menu usage
- [ ] Add rate limiting per phone number
- [ ] Test with slow/unreliable networks
- [ ] Verify all error messages are helpful
- [ ] Test data display with long text values

---

## 📈 Analytics to Track

1. **Most accessed sections**: Which menu items are popular?
2. **Session duration**: How long do users spend navigating?
3. **Common paths**: What's the typical user journey?
4. **Error rates**: Where do users encounter problems?
5. **SMS vs screen delivery**: How often does SMS fail?

---

## 🔄 Future Enhancements

### Potential Features:
1. **Pagination**: Navigate through more than 5 items
2. **Search**: Find specific test or medication
3. **Reminders**: Set medication reminders via USSD
4. **Appointments**: View upcoming appointments
5. **Emergency contacts**: Quick access to emergency info
6. **Immunization records**: Vaccination history
7. **Prescriptions**: Request prescription refills
8. **PIN protection**: Optional 4-digit PIN for extra security

---

## 📞 Support

If users need help:
1. **Invalid input**: Clear error message shown
2. **Session expired**: Prompt to start over
3. **No data**: Helpful message to contact provider
4. **Technical issues**: Fallback to showing summary

---

## 🎓 User Guide Summary

**Simple 3-Step Process:**
1. **Dial** `*384*40767#`
2. **Enter** your National ID or Email
3. **Navigate** using numbered menus

**Remember:**
- Press **0** to go back
- Select **1-5** to view different sections
- Select a number to see details
- Sessions expire after inactivity

---

**The USSD Medical Passport System is now FULLY INTERACTIVE! 🎉**

Patients can explore their complete medical history, medications, hospital visits, and test results - all from any basic phone, no internet required!
