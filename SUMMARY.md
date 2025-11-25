# 📋 Patient Passport System - Complete Technical Summary

## Table of Contents
1. [Terminology Glossary](#terminology-glossary)
2. [System Architecture](#system-architecture)
3. [How the System Works](#how-the-system-works)
4. [Technical Interview Questions](#technical-interview-questions)
5. [Code Structure & File Explanations](#code-structure--file-explanations)
6. [Key Technologies & Patterns](#key-technologies--patterns)

---

## Terminology Glossary

### Core Concepts

**Patient Passport**
- A digital medical record containing a patient's complete health history
- Includes personal info, medical conditions, medications, test results, hospital visits
- Accessible via web, mobile, and USSD (feature phones)
- Protected by OTP (One-Time Password) authentication

**USSD (Unstructured Supplementary Service Data)**
- Text-based communication protocol for mobile phones
- Works on all phones (including feature phones without internet)
- Uses short codes like `*384*123#`
- Implemented via Africa's Talking API
- Supports English and Kinyarwanda languages

**OTP (One-Time Password)**
- Temporary password sent via email/SMS
- Used for secure passport access by doctors
- Expires after a set time (typically 10-15 minutes)
- Prevents unauthorized access

**OpenMRS Integration**
- OpenMRS: Open-source medical record system
- Bidirectional sync: Patient Passport ↔ OpenMRS
- Syncs observations, diagnoses, medications
- Supports multiple hospitals with separate OpenMRS instances

**Access Control**
- Role-based access control (RBAC)
- Roles: Patient, Doctor, Hospital Admin, Receptionist, System Admin
- Request-approval workflow for doctor access
- Audit logging for all access attempts

**Emergency Access**
- Break-glass mechanism for emergency situations
- Bypasses normal approval process
- Requires justification and creates audit trail
- Time-limited access

### Technical Terms

**JWT (JSON Web Token)**
- Authentication token format
- Contains user ID, role, expiration
- Signed with secret key
- Stateless authentication

**MongoDB**
- NoSQL document database
- Stores patient data, passports, medical records
- Uses Mongoose ODM (Object Document Mapper)

**Express.js**
- Node.js web framework
- Handles HTTP requests/responses
- Middleware-based architecture

**React**
- Frontend JavaScript library
- Component-based UI
- State management via Context API

**TypeScript**
- Typed superset of JavaScript
- Compile-time type checking
- Better IDE support and error detection

**REST API**
- Representational State Transfer
- HTTP methods: GET, POST, PUT, DELETE
- JSON data format

**CORS (Cross-Origin Resource Sharing)**
- Allows frontend to call backend from different domain
- Configured to allow specific origins
- Required for web applications

**Middleware**
- Functions that run between request and response
- Examples: authentication, validation, error handling
- Chain of responsibility pattern

**Webhook**
- HTTP callback from external service
- Africa's Talking sends USSD requests via webhook
- OpenMRS can send data updates via webhook

**Session Management**
- USSD sessions stored in memory (Map)
- Tracks user navigation through menus
- Session expires after inactivity

**Rate Limiting**
- Prevents API abuse
- Limits requests per IP/user
- Uses express-rate-limit

**Audit Logging**
- Records all access attempts
- Tracks who accessed what and when
- Required for compliance (HIPAA-like)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - Patient Portal    - Doctor Dashboard                     │
│  - Hospital Admin    - Receptionist Interface              │
│  - USSD Simulator    - Admin Panel                         │
└──────────────────────┬──────────────────────────────────────┘
                        │ HTTP/REST API
                        │ JWT Authentication
┌───────────────────────▼──────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │  Middleware  │      │
│  │ - Auth       │  │ - USSD       │  │ - Auth      │      │
│  │ - Patients   │  │ - SMS        │  │ - Validation│      │
│  │ - Doctors    │  │ - Email      │  │ - Rate Limit│      │
│  │ - Hospitals  │  │ - OpenMRS    │  │ - Error     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   MongoDB    │ │  OpenMRS    │ │ Africa's   │
│   Database   │ │   (MySQL)    │ │  Talking   │
│              │ │              │ │   API      │
│ - Patients   │ │ - Observations│ │ - USSD    │
│ - Passports  │ │ - Encounters │ │ - SMS     │
│ - Users      │ │ - Concepts   │ │            │
│ - Records    │ │              │ │            │
└──────────────┘ └──────────────┘ └────────────┘
```

### Component Architecture

**Frontend Structure:**
```
frontend/src/
├── components/          # React components
│   ├── PatientPassport.tsx
│   ├── DoctorDashboard.tsx
│   ├── HospitalDashboard.tsx
│   └── ...
├── contexts/            # React Context (state management)
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
├── services/            # API communication
│   ├── api.ts
│   ├── dataService.ts
│   └── ...
└── types/               # TypeScript types
    └── index.ts
```

**Backend Structure:**
```
backend/src/
├── controllers/         # Request handlers
│   ├── authController.ts
│   ├── patientController.ts
│   └── ...
├── services/            # Business logic
│   ├── ussdService.ts
│   ├── smsService.ts
│   └── ...
├── models/              # Database models
│   ├── Patient.ts
│   ├── PatientPassport.ts
│   └── ...
├── middleware/          # Request processing
│   ├── auth.ts
│   ├── validation.ts
│   └── ...
└── routes/              # API endpoints
    ├── auth.ts
    ├── patients.ts
    └── ...
```

---

## How the System Works

### 1. User Registration & Authentication Flow

```
User Registration:
1. User fills registration form (Patient/Hospital/Doctor)
2. Frontend sends POST /api/auth/register
3. Backend validates data, creates User record
4. Email verification OTP sent
5. User verifies email
6. Account activated

Authentication:
1. User logs in with email/password
2. Backend validates credentials
3. JWT token generated (contains userId, role)
4. Token sent to frontend
5. Frontend stores token in localStorage
6. Token included in all API requests (Authorization header)
```

### 2. Patient Passport Creation

```
1. Patient registers account
2. Patient fills passport form (personal info, medical history)
3. POST /api/patients/passport
4. Backend creates:
   - Patient record (linked to User)
   - PatientPassport record (contains all medical data)
5. Passport accessible via:
   - Web: /patient-passport
   - USSD: *384*123#
   - API: /api/patients/:id/passport
```

### 3. Doctor Access Request Flow

```
1. Doctor searches for patient
2. Doctor requests access (with reason)
3. POST /api/access-control/request
4. Backend creates AccessRequest record
5. Notification sent to patient (email + in-app)
6. Patient receives OTP via email
7. Patient approves/denies request
8. If approved:
   - OTP generated and sent to doctor's email
   - Doctor enters OTP to view passport
   - Access logged in audit trail
```

### 4. USSD Flow (Feature Phone Access)

```
User dials *384*123#:
1. Phone network routes to Africa's Talking
2. Africa's Talking sends HTTP POST to /api/ussd/callback
3. Backend processes request:
   - Parses user input (text parameter)
   - Determines menu level (path length)
   - Shows appropriate menu
4. User navigates:
   - Level 0: Language selection
   - Level 1: Access method (National ID/Email)
   - Level 2: Enter identifier
   - Level 3: Main menu (view summary, history, etc.)
5. Backend returns USSD response (CON or END)
6. Response displayed on phone
```

**USSD Response Format:**
- `CON` = Continue (show menu, wait for input)
- `END` = End session (final message)

### 5. OpenMRS Integration Flow

```
Bidirectional Sync:

Patient Passport → OpenMRS:
1. Doctor views patient in OpenMRS
2. OpenMRS requests observations: GET /api/openmrs/patient/:name/observations
3. Backend queries PatientPassport database
4. Returns formatted observations (diagnosis, medications)
5. OpenMRS displays in patient chart

OpenMRS → Patient Passport:
1. OpenMRS sync service runs (scheduled or manual)
2. Connects to OpenMRS MySQL database
3. Queries observations table
4. Matches patients by National ID or UUID
5. Creates MedicalRecord entries in Patient Passport
6. Updates PatientPassport with new data
```

### 6. Emergency Access Flow

```
1. Doctor initiates emergency access
2. Provides justification (required)
3. POST /api/emergency-access/override
4. Backend:
   - Creates EmergencyOverride record
   - Bypasses normal approval
   - Grants immediate access
   - Logs in audit trail
5. Doctor can view passport immediately
6. Patient notified of emergency access
7. Access expires after set time (e.g., 1 hour)
```

### 7. SMS Service Flow

```
1. Patient requests passport via SMS (USSD option 0)
2. Backend formats passport summary
3. Calls Africa's Talking SMS API
4. SMS sent to patient's phone
5. Includes link to web portal
```

---

## Technical Interview Questions

### General System Questions

**Q1: Explain the overall architecture of the Patient Passport system.**
```
Answer:
- Three-tier architecture: Frontend (React), Backend (Node.js/Express), Database (MongoDB)
- RESTful API for communication
- JWT for stateless authentication
- Integration with OpenMRS (MySQL) and Africa's Talking (USSD/SMS)
- Role-based access control with audit logging
```

**Q2: How does the system ensure data security?**
```
Answer:
- JWT tokens for authentication
- OTP for sensitive operations (passport access)
- Role-based access control (RBAC)
- Audit logging for all access attempts
- Input validation and sanitization
- Rate limiting to prevent abuse
- HTTPS in production
- Password hashing with bcrypt
```

**Q3: How does USSD work in this system?**
```
Answer:
- USSD uses HTTP POST requests (not WebSockets)
- Africa's Talking gateway sends requests to /api/ussd/callback
- Backend parses user input (text parameter with * separators)
- State machine tracks menu navigation
- Returns CON (continue) or END (terminate) responses
- Session data stored in memory (Map)
- Supports English and Kinyarwanda
```

### Database & Data Modeling

**Q4: Explain the database schema and relationships.**
```
Answer:
- User: Base user account (email, password, role)
- Patient: Extends User, contains medical identifiers (nationalId, openmrsUuid)
- PatientPassport: Complete medical record (linked 1:1 with Patient)
- MedicalRecord: Individual records (conditions, medications) - can sync from OpenMRS
- Doctor: Extends User, linked to Hospital
- Hospital: Organization with multiple doctors
- AccessRequest: Tracks doctor access requests
- AuditLog: Records all access attempts
```

**Q5: How do you handle data synchronization between Patient Passport and OpenMRS?**
```
Answer:
- Bidirectional sync:
  - Patient Passport → OpenMRS: REST API endpoint provides observations
  - OpenMRS → Patient Passport: Scheduled sync service queries OpenMRS MySQL
- Matching patients by National ID or OpenMRS UUID
- Creates MedicalRecord entries for observations
- Filters duplicate entries
- Supports multiple hospitals with separate OpenMRS instances
```

### Authentication & Authorization

**Q6: Explain the authentication flow.**
```
Answer:
1. User logs in with email/password
2. Backend validates credentials against User model
3. JWT token generated (contains userId, role, expiration)
4. Token sent to frontend
5. Frontend stores token
6. Token included in Authorization header for all requests
7. Middleware (auth.ts) validates token on each request
8. User object attached to request for authorization checks
```

**Q7: How does OTP-based passport access work?**
```
Answer:
1. Doctor requests access to patient passport
2. AccessRequest created with 'pending' status
3. Patient receives notification
4. If patient approves:
   - OTP generated (6-digit random number)
   - OTP stored in database with expiration (10-15 min)
   - OTP sent to doctor's email
5. Doctor enters OTP
6. Backend validates OTP (checks code and expiration)
7. If valid, doctor can view passport
8. Access logged in audit trail
```

### API Design

**Q8: How are REST API endpoints structured?**
```
Answer:
- Base URL: /api
- Resource-based URLs: /api/patients, /api/doctors, /api/hospitals
- HTTP methods:
  - GET: Retrieve data
  - POST: Create new resource
  - PUT: Update entire resource
  - PATCH: Partial update
  - DELETE: Remove resource
- Consistent response format: { success, message, data }
- Error handling with proper HTTP status codes
```

**Q9: How do you handle errors in the API?**
```
Answer:
- Custom error class (CustomError) with status codes
- Error handling middleware (errorHandler.ts)
- Try-catch blocks in async handlers
- Validation middleware for input validation
- Returns consistent error format: { success: false, message, error }
- Logs errors for debugging
```

### Frontend Architecture

**Q10: Explain the React component structure.**
```
Answer:
- Functional components with TypeScript
- React Router for navigation
- Context API for global state (AuthContext, NotificationContext)
- Service layer for API calls (api.ts, dataService.ts)
- Reusable UI components (button, card, badge)
- Component composition pattern
- Props for data flow
```

**Q11: How is state managed in the frontend?**
```
Answer:
- React Context API for global state (auth, notifications)
- Local component state with useState for UI state
- useEffect for side effects (API calls, subscriptions)
- Custom hooks for reusable logic
- No Redux (kept simple with Context)
```

### Integration & Services

**Q12: How does the OpenMRS integration work?**
```
Answer:
- Two sync methods:
  1. REST API: OpenMRS calls Patient Passport API to get observations
  2. Direct DB Sync: Patient Passport queries OpenMRS MySQL database
- Scheduled sync service runs periodically
- Matches patients by National ID or UUID
- Creates MedicalRecord entries
- Supports multiple hospitals
```

**Q13: Explain the Africa's Talking integration.**
```
Answer:
- USSD: HTTP POST webhook to /api/ussd/callback
- SMS: Uses Africa's Talking SDK to send SMS
- Configuration via environment variables (API key, username)
- Supports sandbox (testing) and production
- Webhook URL must be publicly accessible (ngrok for local testing)
```

### Performance & Scalability

**Q14: How do you optimize database queries?**
```
Answer:
- Mongoose populate for related data
- Indexes on frequently queried fields (nationalId, email, userId)
- Pagination for large result sets
- Lean queries when possible (returns plain objects, not Mongoose documents)
- Connection pooling
- Query optimization (select only needed fields)
```

**Q15: How would you scale this system?**
```
Answer:
- Horizontal scaling: Multiple backend instances behind load balancer
- Database: MongoDB replica set for read scaling
- Caching: Redis for session data and frequently accessed data
- CDN: For static frontend assets
- Message queue: For async tasks (email, SMS)
- Microservices: Split into smaller services (auth, patients, USSD)
```

### Security

**Q16: How do you prevent SQL injection and other attacks?**
```
Answer:
- Mongoose parameterized queries (prevents NoSQL injection)
- Input validation and sanitization
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT token expiration
- Password hashing (bcrypt)
- HTTPS in production
```

**Q17: How is sensitive data protected?**
```
Answer:
- Passwords: Hashed with bcrypt (never stored in plain text)
- JWT tokens: Signed with secret key
- OTP: Time-limited, single-use
- Audit logging: Tracks all access
- Role-based access: Users can only access authorized data
- Encryption middleware for sensitive fields (optional)
```

### Testing

**Q18: How would you test this system?**
```
Answer:
- Unit tests: Individual functions/services
- Integration tests: API endpoints
- E2E tests: Complete user flows
- USSD testing: Test script (test-ussd-comprehensive.js)
- Manual testing: Local simulator
- Load testing: For performance
```

---

## Code Structure & File Explanations

### Backend Files

#### `backend/src/server.ts`
**Purpose:** Main Express server configuration
**Key Features:**
- Express app setup
- Middleware configuration (CORS, helmet, compression, morgan)
- Static file serving
- Route registration
- Error handling middleware
- Health check endpoint

**Important Code:**
```typescript
// CORS configuration allows Africa's Talking domains
app.use(cors({
  origin: (origin, callback) => {
    if (origin && (origin.includes('africastalking.com'))) {
      return callback(null, true);
    }
    // ... other origins
  }
}));
```

#### `backend/src/app.ts`
**Purpose:** Application entry point
**Key Features:**
- MongoDB connection
- HTTP server creation
- Socket.io initialization (disabled)
- OpenMRS sync service startup
- Graceful shutdown handling

#### `backend/src/models/Patient.ts`
**Purpose:** Patient database model
**Key Fields:**
- `user`: Reference to User model
- `nationalId`: Unique identifier (10-16 digits)
- `openmrsUuid`: OpenMRS patient UUID
- `dateOfBirth`, `gender`, `contactNumber`
- `emergencyContact`: Name, relationship, phone
- `assignedDoctors`: Array of Doctor references

**Methods:**
- `getSummary()`: Returns patient summary

#### `backend/src/models/PatientPassport.ts`
**Purpose:** Complete medical record model
**Key Sections:**
- `personalInfo`: Name, ID, DOB, blood type, emergency contact
- `medicalInfo`: Allergies, medications, conditions, immunizations, surgeries
- `testResults`: Lab tests with results
- `hospitalVisits`: Visit history
- `insurance`: Insurance information

**Methods:**
- `addAccessRecord()`: Logs access attempts
- `findByPatientId()`: Static method to find passport

#### `backend/src/models/MedicalRecord.ts`
**Purpose:** Individual medical records (conditions, medications)
**Key Features:**
- `type`: 'condition', 'medication', 'test', etc.
- `data`: Flexible object for record-specific data
- `openmrsData`: Stores OpenMRS sync metadata
- Links to Patient and createdBy (Doctor)

#### `backend/src/controllers/ussdController.ts`
**Purpose:** Handles USSD callback requests
**Key Functions:**
- `handleUSSDCallback()`: Main USSD request handler
  - Validates request
  - Calls ussdService.processUSSDRequest()
  - Returns USSD-formatted response (CON/END)
  - Handles errors gracefully

**USSD Response Format:**
```typescript
// Continue session (show menu)
"CON Choose a language\n1. English\n2. Kinyarwanda"

// End session (final message)
"END Thank you for using Patient Passport"
```

#### `backend/src/services/ussdService.ts`
**Purpose:** USSD business logic
**Key Methods:**
- `processUSSDRequest()`: Main processing function
  - Parses user input (text parameter)
  - Determines menu level from path length
  - Routes to appropriate handler
- `showLanguageMenu()`: Language selection
- `showAccessMethodMenu()`: National ID vs Email
- `getPassportByIdentifier()`: Finds patient by ID/email
- `showMainMenu()`: Main options menu
- `handleMenuSelection()`: Processes menu choices
- `sendPassportViaSMS()`: Sends passport via SMS

**Session Management:**
```typescript
// In-memory session storage
const sessionData: Map<string, any> = new Map();

// Store session
sessionData.set(sessionId, { passport, language });

// Retrieve session
const storedSession = sessionData.get(sessionId);
```

#### `backend/src/services/openmrsSyncService.ts`
**Purpose:** Syncs data from OpenMRS to Patient Passport
**Key Methods:**
- `initializeConnections()`: Connects to OpenMRS MySQL databases
- `syncObservations()`: Syncs observations from OpenMRS
- `processObservation()`: Converts OpenMRS observation to MedicalRecord
- `syncPatient()`: Manual sync for specific patient

**Sync Process:**
1. Connect to OpenMRS MySQL
2. Query observations table
3. Match patients by National ID or UUID
4. Create MedicalRecord entries
5. Update PatientPassport

#### `backend/src/services/accessControlService.ts`
**Purpose:** Manages doctor access requests
**Key Methods:**
- `createAccessRequest()`: Creates new access request
- `approveAccessRequest()`: Patient approves request
- `denyAccessRequest()`: Patient denies request
- `generateOTP()`: Creates OTP for approved requests
- `validateOTP()`: Validates OTP code

**Access Request Flow:**
1. Doctor creates request
2. Notification sent to patient
3. Patient approves/denies
4. If approved, OTP generated
5. Doctor enters OTP to access passport

#### `backend/src/middleware/auth.ts`
**Purpose:** Authentication middleware
**Key Functions:**
- `authenticate()`: Validates JWT token
  - Extracts token from Authorization header
  - Verifies token signature
  - Loads user from database
  - Attaches user to request object
  - Validates user role matches account type

**Usage:**
```typescript
// Protect route
router.get('/patients', authenticate, getPatients);

// Access user in controller
const userId = req.user._id;
```

#### `backend/src/middleware/errorHandler.ts`
**Purpose:** Centralized error handling
**Key Features:**
- `CustomError` class for custom errors
- `asyncHandler` wrapper for async route handlers
- Error middleware formats error responses
- Logs errors for debugging

**Usage:**
```typescript
export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }
  res.json({ success: true, data: patient });
});
```

#### `backend/src/routes/ussd.ts`
**Purpose:** USSD API routes
**Routes:**
- `POST /callback`: Public endpoint for Africa's Talking webhook
- `GET /health`: Health check
- `POST /test`: Admin test endpoint (protected)

### Frontend Files

#### `frontend/src/App.tsx`
**Purpose:** Main React application component
**Key Features:**
- React Router setup
- Route definitions
- Context providers (Auth, Notification)
- Protected routes

**Routes:**
- `/`: Landing page
- `/patient-passport`: Patient view
- `/doctor-dashboard`: Doctor dashboard
- `/hospital-dashboard`: Hospital admin
- `/admin-dashboard`: System admin

#### `frontend/src/contexts/AuthContext.tsx`
**Purpose:** Global authentication state
**Key Features:**
- User state management
- Login/logout functions
- Token management
- Protected route checking

**Usage:**
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

#### `frontend/src/services/api.ts`
**Purpose:** API communication layer
**Key Features:**
- Axios instance configuration
- Request/response interceptors
- Token attachment
- Error handling

**Usage:**
```typescript
import api from '@/services/api';
const response = await api.get('/patients');
```

#### `frontend/src/components/PatientPassport.tsx`
**Purpose:** Patient passport display component
**Key Features:**
- Fetches passport data
- Displays all sections (personal, medical, tests, visits)
- Edit functionality
- Responsive design

#### `frontend/src/components/DoctorDashboard.tsx`
**Purpose:** Doctor's main dashboard
**Key Features:**
- Patient search
- Access request creation
- OTP entry for approved requests
- Patient list view

### Configuration Files

#### `backend/.env`
**Purpose:** Environment variables
**Key Variables:**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing
- `AFRICASTALKING_API_KEY`: Africa's Talking API key
- `AFRICASTALKING_USERNAME`: Africa's Talking username
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: Email service config

#### `frontend/vite.config.ts`
**Purpose:** Vite build configuration
**Key Features:**
- Build settings
- Path aliases (@/ for src/)
- Proxy configuration for development

---

## Key Technologies & Patterns

### Design Patterns Used

**1. MVC (Model-View-Controller)**
- Models: Database schemas (Mongoose)
- Views: React components
- Controllers: Request handlers

**2. Middleware Pattern**
- Express middleware chain
- Authentication, validation, error handling

**3. Service Layer Pattern**
- Business logic in services
- Controllers call services
- Separation of concerns

**4. Repository Pattern (implicit)**
- Models act as repositories
- Abstract database operations

**5. Factory Pattern**
- Model creation
- Service instantiation

### Key Libraries

**Backend:**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT handling
- `bcrypt`: Password hashing
- `helmet`: Security headers
- `cors`: Cross-origin requests
- `express-rate-limit`: Rate limiting
- `africastalking`: USSD/SMS SDK

**Frontend:**
- `react`: UI library
- `react-router-dom`: Routing
- `axios`: HTTP client
- `tailwindcss`: Styling
- `typescript`: Type safety

### Best Practices Implemented

1. **TypeScript**: Type safety throughout
2. **Error Handling**: Centralized error handling
3. **Validation**: Input validation middleware
4. **Security**: JWT, bcrypt, helmet, CORS
5. **Logging**: Comprehensive logging
6. **Documentation**: Code comments and JSDoc
7. **Environment Variables**: Sensitive data in .env
8. **Code Organization**: Clear folder structure
9. **Separation of Concerns**: Controllers, services, models
10. **RESTful API**: Standard HTTP methods and status codes

---

## Summary

This Patient Passport system is a comprehensive digital health record platform that:

- **Provides multiple access methods**: Web, mobile, USSD (feature phones)
- **Ensures security**: OTP authentication, role-based access, audit logging
- **Integrates with existing systems**: OpenMRS for hospital records
- **Supports multiple languages**: English and Kinyarwanda
- **Handles emergency access**: Break-glass mechanism for urgent situations
- **Maintains compliance**: Audit trails, access controls, data protection

The architecture is scalable, maintainable, and follows industry best practices for healthcare applications.

---

**Last Updated:** 2024
**Version:** 1.0.0

