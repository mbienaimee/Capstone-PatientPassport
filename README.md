#  Patient Passport - Healthcare Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![OpenMRS](https://img.shields.io/badge/OpenMRS-2.5.0-orange.svg)](https://openmrs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

<<<<<<< HEAD
A comprehensive healthcare management system that provides unified patient record management across different healthcare facilities with OpenMRS integration.
=======
##  Architecture Overview
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

##  Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **Docker** and **Docker Compose**
- **Git**

### One-Command Setup
```powershell
# Windows PowerShell
.\setup-patient-passport.ps1

<<<<<<< HEAD
# Or manually:
git clone <repository-url>
cd Capstone-PatientPassport
npm install
=======
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
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0
docker-compose up -d
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **OpenMRS**: http://localhost:8084/openmrs
- **OpenMRS Reference**: http://localhost

<<<<<<< HEAD
**Default Login**: `admin@example.com` / `password123`
=======
##  Data Flow
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

##  Features

<<<<<<< HEAD
###  Patient Management
- Universal patient identification
- Cross-facility data sharing
- Comprehensive patient profiles
- Advanced search capabilities
=======
##  Security & Compliance
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

###  Medical Records
- Medical history tracking
- Vital signs monitoring
- Medication management
- Allergy tracking

<<<<<<< HEAD
###  OpenMRS Integration
- Seamless module integration
- Real-time data synchronization
- FHIR R4 compliance
- REST API endpoints
=======
##  Additional Services
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

###  Emergency Features
- Emergency access override
- Audit trail logging
- Critical situation handling

##  Architecture

<<<<<<< HEAD
```
Frontend (React) ←→ Backend API (Node.js) ←→ OpenMRS Integration
       ↓                    ↓                        ↓
   Netlify              MongoDB                 MySQL
  (Production)        (Database)            (OpenMRS DB)
```

##  Documentation
=======
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
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

- **[Complete Documentation](PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md)** - Comprehensive project guide
- **[API Documentation](http://localhost:3000/api-docs)** - Backend API reference
- **[OpenMRS Integration Guide](OPENMRS_PLUGIN_INTEGRATION_GUIDE.md)** - Module integration details

<<<<<<< HEAD
##  Development
=======
##  Deployment
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

### Start Development Servers
```bash
# Start all services
npm run dev

# Or individually
npm run dev:frontend    # Frontend on port 3000
npm run dev:backend     # Backend on port 3000
npm run dev:openmrs     # OpenMRS on port 8084
```

### Build for Production
```bash
npm run build
npm start
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

<<<<<<< HEAD
# Stop all services
docker-compose down
=======
##  Key Benefits
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

# View logs
docker-compose logs

<<<<<<< HEAD
# Restart specific service
docker restart openmrs-platform
```

##  OpenMRS Module

### Install Patient Passport Module
1. Go to OpenMRS Administration → Manage Modules
2. Upload `patientpassportcore-1.0.0.omod`
3. Start the module

### Module Features
- Universal ID generation
- Patient synchronization
- Emergency override capabilities
- Audit logging
- FHIR resource support

##  API Endpoints

### Patient Passport API
```http
POST /api/auth/login              # User authentication
GET  /api/patients               # Get all patients
POST /api/patients               # Create new patient
GET  /api/medical-records        # Get medical records
POST /api/openmrs/sync-patient   # Sync with OpenMRS
```

### OpenMRS Module API
```http
POST /openmrs/ws/rest/v1/patientpassport/generate-universal-id
GET  /openmrs/ws/rest/v1/patientpassport/find-by-universal-id
POST /openmrs/ws/rest/v1/patientpassport/emergency-override
```

##  Deployment

### Frontend (Netlify)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
npm run build
netlify deploy --prod --dir=build
```

### Backend (Docker)
```bash
# Build image
docker build -t patient-passport-api .

# Run container
docker run -d -p 3000:3000 patient-passport-api
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F
```

#### Database Connection Issues
```bash
# Check MongoDB
docker ps | grep mongo

# Restart MongoDB
docker restart mongodb
```

#### OpenMRS Module Not Loading
```bash
# Check OpenMRS logs
docker logs openmrs-platform

# Verify module
docker exec openmrs-platform ls -la /usr/local/tomcat/.OpenMRS/modules/
```

##  Project Structure

```
Capstone-PatientPassport/
├── frontend/                 # React frontend
├── backend/                  # Node.js backend API
├── patient-passport-service/ # Core service
├── openmrs-modules/          # OpenMRS integration
├── docker-compose.yml        # Docker services
├── setup-patient-passport.ps1 # Setup script
└── README.md                 # This file
```

=======
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0
##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<<<<<<< HEAD
##  Acknowledgments
=======
##  Support
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0

- **OpenMRS Community** for the excellent medical record system
- **React Team** for the powerful frontend framework
- **Node.js Community** for the robust backend platform
- **MongoDB** for the flexible database solution

##  Support

- **Documentation**: [PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md](PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md)
- **Issues**: Create an issue in the repository
- **Email**: [your-email@example.com]

---

<<<<<<< HEAD
**Made with for better healthcare management**



 ## Github Link: https://github.com/mbienaimee/Capstone-PatientPassport

## Figma Design: https://www.figma.com/design/ahkyDa0vNjqqGVXt7QQRs0/Capstone--Patient-passport?node-id=1-34&m=dev&t=IcE3VVhUfSW3Otr8-1 

## Youtube Video:https://www.youtube.com/watch?v=rFiWLIaFlUE
=======
**PatientPassport** represents a comprehensive digital health solution that puts patients in control of their medical data while enabling secure, efficient collaboration between healthcare providers.
>>>>>>> b95b84da5cbf0398ffd5b589916502af87b352c0
