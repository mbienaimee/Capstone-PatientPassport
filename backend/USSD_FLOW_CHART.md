# USSD Navigation Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│                    START: Dial *384*40767#                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 0: LANGUAGE SELECTION                                 │
│                                                              │
│ Choose a language / Hitamo ururimi                          │
│ 1. English                                                   │
│ 2. Kinyarwanda                                              │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
           Press 1                Press 2
               │                      │
               ▼                      ▼
        [English Mode]        [Kinyarwanda Mode]
               │                      │
               └──────────┬───────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 1: ACCESS METHOD                                      │
│                                                              │
│ View my Patient Passport                                    │
│ 1. Use National ID                                          │
│ 2. Use Email                                                │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
           Press 1                Press 2
               │                      │
               ▼                      ▼
     [National ID Mode]        [Email Mode]
               │                      │
               └──────────┬───────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 2: IDENTITY INPUT                                     │
│                                                              │
│ Enter your National ID:                                     │
│ OR                                                           │
│ Enter your Email address:                                   │
│                                                              │
│ [User types identifier]                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                   [Verify]
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 3: MAIN MENU ⭐ INTERACTIVE!                          │
│                                                              │
│ Welcome Marie Reine!                                        │
│ Select an option:                                            │
│ 1. View Summary                                             │
│ 2. Medical History                                          │
│ 3. Current Medications                                      │
│ 4. Hospital Visits                                          │
│ 5. Test Results                                             │
│ 0. Send Full Passport via SMS                               │
└─┬────┬────┬────┬────┬────┬──────────────────────────────────┘
  │    │    │    │    │    │
  1    2    3    4    5    0
  │    │    │    │    │    │
  ▼    ▼    ▼    ▼    ▼    ▼
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  [1]              [2]              [3]                       │
│  VIEW          MEDICAL          CURRENT                      │
│  SUMMARY       HISTORY        MEDICATIONS                    │
│                                                              │
│  Shows:        Shows:           Shows:                       │
│  • Name        • Conditions     • Drug names                 │
│  • ID          • Status         • Dosages                    │
│  • Blood       • Dates          • Frequency                  │
│  • DOB                                                       │
│  • Allergies   Select #:        Select #:                    │
│                View details     View details                 │
│  [END]         ▼                ▼                            │
│                                                              │
│           CONDITION         MEDICATION                       │
│            DETAILS           DETAILS                         │
│                                                              │
│           • Name            • Name                           │
│           • Status          • Dosage                         │
│           • Diagnosed       • Frequency                      │
│           • Doctor          • Prescribed by                  │
│           • Notes           • Start date                     │
│                                                              │
│           [END]             [END]                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  [4]              [5]              [0]                       │
│  HOSPITAL        TEST            SEND VIA                    │
│  VISITS         RESULTS            SMS                       │
│                                                              │
│  Shows:        Shows:           Action:                      │
│  • Hospital    • Test type      • Formats data               │
│  • Date        • Date           • Sends SMS                  │
│  • Doctor      • Status         • Logs access                │
│                                                              │
│  Select #:     Select #:        Result:                      │
│  View details  View details     Success/Fallback             │
│  ▼             ▼                                             │
│                                 [END]                        │
│  VISIT         TEST                                          │
│  DETAILS       DETAILS                                       │
│                                                              │
│  • Hospital    • Type                                        │
│  • Date        • Date                                        │
│  • Doctor      • Status                                      │
│  • Reason      • Result                                      │
│  • Diagnosis   • Range                                       │
│  • Treatment                                                 │
│                                                              │
│  [END]         [END]                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Navigation Path Examples

### Example 1: View Summary
```
*384*40767#
→ 1 (English)
→ 1 (National ID)
→ 1234567891012345
→ 1 (View Summary)
→ [END - Shows summary]
```
**Path**: `1*1*1234567891012345*1`

### Example 2: View Specific Medical Condition
```
*384*40767#
→ 1 (English)
→ 1 (National ID)
→ 1234567891012345
→ 2 (Medical History)
→ 1 (First condition)
→ [END - Shows condition details]
```
**Path**: `1*1*1234567891012345*2*1`

### Example 3: View Specific Medication
```
*384*40767#
→ 1 (English)
→ 2 (Email)
→ m.bienaimee@alustudent.com
→ 3 (Current Medications)
→ 2 (Second medication)
→ [END - Shows medication details]
```
**Path**: `1*2*m.bienaimee@alustudent.com*3*2`

### Example 4: Send Full Passport
```
*384*40767#
→ 2 (Kinyarwanda)
→ 1 (Irangamuntu)
→ 1234567891012345
→ 0 (Ohereza kuri SMS)
→ [END - Confirms SMS sent]
```
**Path**: `2*1*1234567891012345*0`

---

## Session Data Flow

```
┌──────────────────┐
│  User Dials USSD │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Select Language │
│  Select Method   │
│  Enter ID/Email  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  Verify Identity             │
│  • Query Database            │
│  • Find Patient              │
│  • Get Passport              │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Store in Session            │
│  {                           │
│    sessionId: "xxx",         │
│    passport: {...},          │
│    language: "en"            │
│  }                           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  User Navigates Menus        │
│  • Data retrieved from cache │
│  • No re-authentication      │
│  • Fast responses            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Session Cleanup             │
│  • After END response        │
│  • After timeout             │
│  • Memory freed              │
└──────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────┐
│  User Input     │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │Validate│
    └───┬────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
[Valid]   [Invalid]
   │         │
   │         ▼
   │    ┌──────────────┐
   │    │ Show Error   │
   │    │ • Clear msg  │
   │    │ • Try again  │
   │    └──────────────┘
   │
   ▼
┌──────────────┐
│ Query DB     │
└──────┬───────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
[Found]  [Not Found]
  │         │
  │         ▼
  │    ┌──────────────┐
  │    │ Show Error   │
  │    │ • Not found  │
  │    │ • Check ID   │
  │    └──────────────┘
  │
  ▼
┌──────────────┐
│ Success      │
│ Show Menu    │
└──────────────┘
```

---

## Data Display Logic

```
Menu Item Selected
        │
        ▼
┌───────────────────┐
│ Get Array Data    │
│ (conditions,      │
│  medications,     │
│  visits, tests)   │
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[Empty]    [Has Data]
    │         │
    │         ▼
    │    ┌──────────────────┐
    │    │ Sub-selection?   │
    │    └────┬─────────────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │    ▼         ▼
    │  [No]      [Yes]
    │    │         │
    │    │         ▼
    │    │    ┌──────────────┐
    │    │    │ Show Details │
    │    │    │ • Full info  │
    │    │    │ • [END]      │
    │    │    └──────────────┘
    │    │
    │    ▼
    │ ┌──────────────┐
    │ │ Show List    │
    │ │ • Max 5      │
    │ │ • Numbered   │
    │ │ • [CON]      │
    │ └──────────────┘
    │
    ▼
┌──────────────┐
│ Show Empty   │
│ Message      │
│ [END]        │
└──────────────┘
```

---

## Response Type Decision Tree

```
        User Selection
              │
         ┌────┴────┐
         │         │
         ▼         ▼
    [List View] [Detail View]
         │         │
         │         ▼
         │    ┌─────────┐
         │    │  END    │
         │    │ (Final) │
         │    └─────────┘
         │
         ▼
    ┌─────────┐
    │   CON   │
    │(Continue│
    └─────────┘
```

**CON**: Continue - User can make another selection
**END**: End - Session terminates, display final info

---

This interactive system provides a complete, user-friendly medical record access solution via USSD!
