# PatientPassport - Complete Full-Stack Healthcare Management System

A comprehensive medical records management system built with React, Node.js, TypeScript, and MongoDB. This application enables patients to maintain control of their medical records while facilitating secure data sharing between healthcare providers.

##  Architecture Overview

The application follows a **microservices architecture** with multiple interconnected services:

### **Core Services:**
1. **Frontend** (React + TypeScript + Vite)
2. **Backend API** (Node.js + Express + TypeScript)
3. **Central Registry** (Patient registry service)
4. **Patient Passport Service** (USSD/SMS service)
5. **OpenMRS Integration** (Healthcare management system)

### **Infrastructure:**
- **MongoDB** - Primary database for patient records
- **PostgreSQL** - Central registry database
- **Redis** - Caching and session management
- **Docker** - Containerized deployment
- **Nginx** - Reverse proxy and load balancer

##  Key Features

### **Patient Management**
- Complete patient registration, login, and passport management
- Personal medical dashboard with comprehensive health overview
- Medical history tracking with expandable condition details
- Medication management (active and past medications)
- Test results with status indicators and report viewing
- Hospital visit history and tracking
- Medical image storage and management (X-rays, scans, etc.)

### **Hospital Management**
- Hospital registration, authentication, and dashboard
- Patient search and management capabilities
- Medical record updates and management
- Statistics and analytics dashboard
- Administrative functions and controls

### **Medical Records System**
- Track medical conditions, test results, medications, and hospital visits
- Encrypted data storage for sensitive medical information
- Comprehensive audit logging for compliance
- Data validation and sanitization
- Relationship mapping between patients, doctors, and hospitals

### **Security & Compliance**
- JWT-based authentication with role-based access control
- Data encryption at rest and in transit
- Rate limiting and DDoS protection
- CORS security and input validation
- Complete audit trails for all actions

### **User Experience**
- Modern, responsive design built with Tailwind CSS
- Role-based dashboards (Patient, Doctor, Hospital, Admin)
- Mobile-friendly interface
- Real-time data synchronization
- Intuitive navigation and user flows

##  Authentication & User Management

### **User Roles:**
- **Patient** - Can view and update their own medical records
- **Doctor** - Can view and update patient records
- **Hospital** - Can manage patient records and hospital operations
- **Admin** - Full system access and management capabilities

### **Authentication Flow:**
1. **Registration**: Users register with email/password and role-specific information
2. **Login**: Multiple login methods (email, national ID, hospital name)
3. **JWT Tokens**: Secure authentication with access and refresh tokens
4. **Role-based Access**: Different dashboards and permissions based on user role

##  Data Models & Structure

### **Core Entities:**
- **User** - Base user information (name, email, role, authentication)
- **Patient** - Medical profile (national ID, DOB, contact, medical history)
- **Hospital** - Healthcare facility information
- **Doctor** - Medical professional profiles
- **Medical Records** - Conditions, medications, test results, visits

### **Key Features:**
- **Encrypted Data Storage** - Sensitive medical data is encrypted
- **Audit Logging** - All actions are logged for compliance
- **Data Validation** - Comprehensive input validation and sanitization
- **Relationship Mapping** - Patients linked to doctors, hospitals, and medical records

##  Frontend User Experience

### **Landing Page:**
- Modern, responsive design with Tailwind CSS
- Clear value proposition and call-to-action
- Separate login/registration for patients and hospitals
- Feature highlights and benefits section

### **Patient Dashboard:**
- **Personal Information** - Name, national ID, contact details
- **Medical History** - Expandable list of conditions and procedures
- **Medications** - Active and past medications with dosages
- **Test Results** - Lab results with status indicators
- **Hospital Visits** - Visit history and reasons
- **Medical Images** - X-rays, scans, and diagnostic images

### **Hospital/Doctor Dashboards:**
- Patient search and management
- Medical record updates
- Statistics and analytics
- Administrative functions

##  Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- Lucide React for icons
- Framer Motion for animations

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Swagger for API documentation
- Helmet for security
- CORS for cross-origin requests
- bcryptjs for password hashing
- Express Rate Limit for API protection

### Additional Services
- **Central Registry** - Patient identification across hospitals
- **Patient Passport Service** - USSD/SMS mobile access
- **OpenMRS Integration** - Healthcare management system
- **Redis** - Caching and session management
- **PostgreSQL** - Central registry database

##  Backend API Structure

### **API Endpoints:**

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `DELETE /api/auth/account` - Delete user account

#### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

#### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create new hospital
- `PUT /api/hospitals/:id` - Update hospital

#### Medical Records
- `GET /api/medical/conditions/:patientId` - Get medical conditions
- `POST /api/medical/conditions` - Create medical condition
- `GET /api/medical/test-results/:patientId` - Get test results
- `POST /api/medical/test-results` - Create test result
- `GET /api/medical/medications/:patientId` - Get medications
- `POST /api/medical/medications` - Create medication
- `GET /api/medical/hospital-visits/:patientId` - Get hospital visits
- `POST /api/medical/hospital-visits` - Create hospital visit

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-patients` - Get recent patients
- `GET /api/dashboard/recent-hospitals` - Get recent hospitals

### **Security Features:**
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - HTTP security headers
- **Input Validation** - Joi validation for all inputs
- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based authentication

##  Project Structure

```
patient-passport/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── PatientPassport.tsx
│   │   │   └── ...
│   │   ├── contexts/        # React contexts (Auth, Notifications)
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   └── ...
│   ├── docs/                # API documentation
│   ├── package.json
│   └── tsconfig.json
├── central-registry/         # Central patient registry service
├── patient-passport-service/ # USSD/SMS service
├── openmrs-modules/         # OpenMRS integration modules
├── docker-compose.yml       # Docker services configuration
├── package.json             # Root package.json for scripts
└── README.md
```

##  Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Docker (optional, for containerized deployment)
- npm or yarn

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Environment Setup

#### Backend Environment
Create a `.env` file in the `backend` directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/patient-passport
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
ENCRYPTION_KEY=your-32-character-encryption-key
REDIS_URL=redis://localhost:6379
```

#### Frontend Environment
Create a `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CENTRAL_REGISTRY_URL=http://localhost:3001
VITE_PATIENT_PASSPORT_URL=http://localhost:3002
VITE_APP_NAME=PatientPassport
VITE_APP_VERSION=1.0.0
```

### 4. Start the Application

#### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```

#### Individual Services
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

#### Docker Compose (All Services)
```bash
docker-compose up -d
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health
- **Central Registry**: http://localhost:3001
- **Patient Passport Service**: http://localhost:3002

##  Data Flow

1. **Patient Registration** → User account + Patient profile creation
2. **Medical Record Entry** → Encrypted storage in MongoDB
3. **Data Access** → Role-based permissions and JWT authentication
4. **Data Sharing** → Consent-based sharing between healthcare providers
5. **Audit Logging** → All actions tracked for compliance

##  Security & Compliance

- **Data Encryption** - Sensitive data encrypted at rest and in transit
- **Access Controls** - Role-based permissions
- **Audit Trails** - Complete action logging
- **Input Validation** - Comprehensive data validation
- **Rate Limiting** - API protection
- **CORS Security** - Cross-origin protection
- **Password Security** - bcrypt hashing with salt rounds
- **JWT Security** - Secure token management

##  Additional Services

### **Central Registry:**
- Patient identification across multiple hospitals
- Federated patient data management
- Consent token management for data sharing

### **Patient Passport Service:**
- USSD/SMS integration for mobile access
- Africa's Talking and Twilio integration
- Mobile-friendly patient access

### **OpenMRS Integration:**
- Healthcare management system integration
- Patient data synchronization
- Medical record interoperability

##  Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications
- `npm run start` - Start both applications in production mode
- `npm run install:all` - Install dependencies for all packages
- `npm run test` - Run tests for both applications
- `npm run lint` - Lint both applications

### Backend Only
- `npm run dev:backend` - Start backend in development mode
- `npm run build:backend` - Build backend
- `npm run start:backend` - Start backend in production mode
- `npm run test:backend` - Run backend tests
- `npm run lint:backend` - Lint backend code

### Frontend Only
- `npm run dev:frontend` - Start frontend in development mode
- `npm run build:frontend` - Build frontend
- `npm run start:frontend` - Start frontend in production mode
- `npm run test:frontend` - Run frontend tests
- `npm run lint:frontend` - Lint frontend code

##  Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

##  API Documentation

Once the backend is running, visit http://localhost:5000/api-docs to view the interactive API documentation with Swagger UI.

##  Deployment

### Docker Deployment
1. Build and start all services: `docker-compose up -d`
2. Access the application through the configured ports

### Manual Deployment

#### Backend Deployment
1. Build the backend: `npm run build:backend`
2. Set production environment variables
3. Start the server: `npm run start:backend`

#### Frontend Deployment
1. Build the frontend: `npm run build:frontend`
2. Serve the built files from the `dist` directory

##  Key Benefits

1. **Patient Empowerment** - Patients control their own medical data
2. **Healthcare Coordination** - Seamless data sharing between providers
3. **Data Security** - Enterprise-grade security and encryption
4. **Scalability** - Microservices architecture for growth
5. **Interoperability** - Integration with existing healthcare systems
6. **Mobile Access** - USSD/SMS support for low-resource areas
7. **Compliance** - Audit trails and data protection measures
8. **User Experience** - Modern, intuitive interface design

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

##  Support

For support and questions, please contact the PatientPassport team or create an issue in the repository.

---

**PatientPassport** represents a comprehensive digital health solution that puts patients in control of their medical data while enabling secure, efficient collaboration between healthcare providers.
