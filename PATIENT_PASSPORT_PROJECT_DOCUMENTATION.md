# Patient Passport - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [OpenMRS Integration](#openmrs-integration)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Usage Guide](#usage-guide)
10. [Troubleshooting](#troubleshooting)
11. [File Structure](#file-structure)
12. [Commands Reference](#commands-reference)

---

## 🏥 Project Overview

**Patient Passport** is a comprehensive healthcare management system that provides a unified platform for managing patient records across different healthcare facilities. The system integrates with OpenMRS (Open Medical Record System) to enable seamless data sharing and patient record management.

### Key Objectives:
- **Universal Patient Identification**: Generate unique patient IDs across healthcare systems
- **Cross-Facility Data Sharing**: Enable secure sharing of patient records between hospitals
- **Emergency Access**: Provide emergency override capabilities for critical situations
- **Audit Trail**: Maintain comprehensive logs of all patient data access
- **FHIR Compliance**: Support Fast Healthcare Interoperability Resources standards

---

## 🏗️ Architecture

### System Components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   OpenMRS       │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Integration   │
│   Port: 3000    │    │   Port: 3000    │    │   Port: 8084    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │   MongoDB       │    │   MySQL         │
│   Deployment    │    │   Database      │    │   Database      │
│   (Production)  │    │   Port: 27017   │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack:
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Databases**: MongoDB, MySQL
- **Integration**: OpenMRS, FHIR
- **Deployment**: Docker, Netlify
- **Authentication**: JWT, bcrypt

---

## ✨ Features

### 1. Patient Management
- **Patient Registration**: Create new patient records
- **Patient Search**: Find patients by various criteria
- **Patient Profiles**: Comprehensive patient information management
- **Universal ID Generation**: Generate unique patient identifiers

### 2. Medical Records
- **Medical History**: Track patient medical history
- **Vital Signs**: Record and monitor vital signs
- **Medications**: Manage patient medications
- **Allergies**: Track patient allergies and reactions

### 3. OpenMRS Integration
- **Module Installation**: Seamless OpenMRS module integration
- **Data Synchronization**: Real-time data sync between systems
- **REST API**: RESTful API endpoints for data exchange
- **FHIR Support**: FHIR R4 compliance for interoperability

### 4. Emergency Features
- **Emergency Override**: Override restrictions in critical situations
- **Emergency Access Logs**: Track emergency access events
- **Audit Trail**: Comprehensive logging of all activities

### 5. Dashboard & Analytics
- **Admin Dashboard**: System administration interface
- **Patient Dashboard**: Patient-specific information view
- **Statistics**: System usage and patient statistics
- **Reports**: Generate various healthcare reports

---

## 🔧 Prerequisites

### System Requirements:
- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 10GB free space
- **Network**: Internet connection for dependencies

### Software Requirements:
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **Docker**: Version 20.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: For version control

### Optional (for OpenMRS):
- **Java**: Version 11 or higher
- **Maven**: Version 3.6 or higher

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Capstone-PatientPassport
```

### Step 2: Install Dependencies

#### Frontend Dependencies:
```bash
cd frontend
npm install
```

#### Backend Dependencies:
```bash
cd backend
npm install
```

#### Patient Passport Service Dependencies:
```bash
cd patient-passport-service
npm install
```

### Step 3: Environment Configuration

#### Backend Environment (.env):
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/patient-passport
DB_HOST=localhost
DB_PORT=3306
DB_NAME=openmrs
DB_USER=openmrs
DB_PASSWORD=openmrs

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# API Configuration
PORT=3000
NODE_ENV=development

# OpenMRS Integration
OPENMRS_URL=http://localhost:8084/openmrs
OPENMRS_USERNAME=admin
OPENMRS_PASSWORD=Admin123

# Patient Passport Service
PATIENT_PASSPORT_SERVICE_URL=http://localhost:3000
```

#### Frontend Environment (.env):
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_OPENMRS_URL=http://localhost:8084/openmrs
```

### Step 4: Database Setup

#### Start MongoDB:
```bash
# Using Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Or using local MongoDB installation
mongod
```

#### Start MySQL (for OpenMRS):
```bash
# Using Docker
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=openmrs mysql:5.7
```

---

## 🏥 OpenMRS Integration

### Step 1: Start OpenMRS with Docker
```bash
# Start OpenMRS Platform
docker run -d --name openmrs-platform -p 8084:8080 --link mysql:mysql openmrs/openmrs-distro-platform:2.5.0

# Start OpenMRS Reference Application
docker-compose up -d
```

### Step 2: Install Patient Passport Module

#### Method 1: Web Interface
1. Go to `http://localhost:8084/openmrs`
2. Login with admin credentials
3. Navigate to Administration → Manage Modules
4. Upload `patientpassportcore-1.0.0.omod`

#### Method 2: Command Line
```bash
# Copy module to OpenMRS
docker cp patientpassportcore-1.0.0.omod openmrs-platform:/usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
docker restart openmrs-platform
```

### Step 3: Verify Integration
```bash
# Check module status
curl http://localhost:8084/openmrs/ws/rest/v1/module

# Test Patient Passport API
curl http://localhost:8084/openmrs/ws/rest/v1/patientpassport/generate-universal-id
```

---

## 📚 API Documentation

### Patient Passport API Endpoints

#### Base URL: `http://localhost:3000/api`

#### Authentication Endpoints:
```http
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/profile
```

#### Patient Endpoints:
```http
GET    /patients              # Get all patients
POST   /patients              # Create new patient
GET    /patients/:id          # Get patient by ID
PUT    /patients/:id          # Update patient
DELETE /patients/:id          # Delete patient
GET    /patients/search       # Search patients
```

#### Medical Records Endpoints:
```http
GET    /medical-records       # Get all medical records
POST   /medical-records       # Create medical record
GET    /medical-records/:id   # Get medical record by ID
PUT    /medical-records/:id   # Update medical record
DELETE /medical-records/:id   # Delete medical record
```

#### OpenMRS Integration Endpoints:
```http
POST   /openmrs/sync-patient     # Sync patient to OpenMRS
GET    /openmrs/patients         # Get patients from OpenMRS
POST   /openmrs/generate-id      # Generate universal ID
GET    /openmrs/audit-logs       # Get audit logs
```

### OpenMRS Module API Endpoints

#### Base URL: `http://localhost:8084/openmrs/ws/rest/v1/patientpassport`

```http
POST   /generate-universal-id        # Generate universal patient ID
GET    /find-by-universal-id         # Find patient by universal ID
POST   /emergency-override           # Emergency override access
GET    /audit-logs                   # Get audit logs
GET    /emergency-override-logs      # Get emergency override logs
```

---

## 🚀 Deployment

### Frontend Deployment (Netlify)

#### Method 1: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd frontend
npm run build
netlify deploy --prod --dir=build
```

#### Method 2: Git Integration
1. Push code to GitHub repository
2. Connect repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

### Backend Deployment

#### Using Docker:
```bash
# Build Docker image
docker build -t patient-passport-api .

# Run container
docker run -d -p 3000:3000 --name patient-passport-api patient-passport-api
```

#### Using PM2:
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start backend/src/server.ts --name patient-passport-api

# Save PM2 configuration
pm2 save
pm2 startup
```

### OpenMRS Module Deployment

#### Manual Deployment:
```bash
# Copy module file
cp patientpassportcore-1.0.0.omod /path/to/openmrs/modules/

# Restart OpenMRS
systemctl restart openmrs
```

#### Docker Deployment:
```bash
# Copy module to container
docker cp patientpassportcore-1.0.0.omod openmrs-platform:/usr/local/tomcat/.OpenMRS/modules/

# Restart container
docker restart openmrs-platform
```

---

## 📖 Usage Guide

### 1. Starting the Application

#### Development Mode:
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:frontend    # Frontend on port 3000
npm run dev:backend     # Backend on port 3000
npm run dev:openmrs     # OpenMRS on port 8084
```

#### Production Mode:
```bash
# Build and start
npm run build
npm start
```

### 2. Accessing the Application

#### Frontend:
- **URL**: `http://localhost:3000`
- **Default Login**: admin@example.com / password123

#### Backend API:
- **URL**: `http://localhost:3000/api`
- **Documentation**: `http://localhost:3000/api-docs`

#### OpenMRS:
- **URL**: `http://localhost:8084/openmrs`
- **Default Login**: admin / Admin123

### 3. Key Workflows

#### Patient Registration:
1. Login to Patient Passport
2. Navigate to Patients → Add New Patient
3. Fill in patient details
4. Generate universal ID
5. Sync with OpenMRS

#### Medical Record Management:
1. Search for patient
2. Select patient profile
3. Add medical records
4. Update vital signs
5. Manage medications

#### Emergency Access:
1. Navigate to Emergency Override
2. Enter emergency credentials
3. Access patient records
4. Log emergency access reason

---

## 🔧 Troubleshooting

### Common Issues:

#### 1. Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
docker ps | grep mongo

# Restart MongoDB
docker restart mongodb
```

#### 3. OpenMRS Module Not Loading
```bash
# Check OpenMRS logs
docker logs openmrs-platform

# Verify module file
docker exec openmrs-platform ls -la /usr/local/tomcat/.OpenMRS/modules/
```

#### 4. CORS Issues
```bash
# Check CORS configuration in backend
# Ensure frontend URL is whitelisted
```

### Log Locations:
- **Frontend**: Browser Developer Tools Console
- **Backend**: `backend/logs/`
- **OpenMRS**: Docker logs (`docker logs openmrs-platform`)

---

## 📁 File Structure

```
Capstone-PatientPassport/
├── frontend/                          # React frontend application
│   ├── public/                        # Static assets
│   ├── src/                          # Source code
│   │   ├── components/               # React components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API services
│   │   ├── utils/                    # Utility functions
│   │   └── App.tsx                   # Main app component
│   ├── package.json                  # Frontend dependencies
│   └── tailwind.config.js           # Tailwind CSS config
├── backend/                          # Node.js backend API
│   ├── src/                         # Source code
│   │   ├── controllers/             # Route controllers
│   │   ├── models/                  # Database models
│   │   ├── routes/                  # API routes
│   │   ├── middleware/              # Custom middleware
│   │   └── server.ts                # Server entry point
│   ├── docs/                        # API documentation
│   └── package.json                 # Backend dependencies
├── patient-passport-service/         # Core service
│   ├── src/                         # Source code
│   ├── Dockerfile                   # Docker configuration
│   └── package.json                 # Service dependencies
├── openmrs-modules/                  # OpenMRS integration
│   └── patient-passport-core/       # OpenMRS module
│       └── omod/                    # Module source
├── docker-compose.yml               # Docker services
├── netlify.toml                     # Netlify configuration
└── README.md                        # Project documentation
```

---

## 🛠️ Commands Reference

### Development Commands:

#### Frontend:
```bash
npm start                    # Start development server
npm run build               # Build for production
npm run test                # Run tests
npm run lint                # Run linter
```

#### Backend:
```bash
npm run dev                 # Start development server
npm run build               # Build TypeScript
npm run start               # Start production server
npm run test                # Run tests
```

#### Docker:
```bash
docker-compose up           # Start all services
docker-compose down         # Stop all services
docker-compose logs         # View logs
docker-compose restart      # Restart services
```

#### OpenMRS Module:
```bash
# Create module file
.\create-omod-file.ps1

# Deploy module
docker cp patientpassportcore-1.0.0.omod openmrs-platform:/usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
docker restart openmrs-platform
```

### Database Commands:

#### MongoDB:
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/patient-passport

# Backup database
mongodump --db patient-passport --out backup/

# Restore database
mongorestore --db patient-passport backup/patient-passport/
```

#### MySQL (OpenMRS):
```bash
# Connect to MySQL
mysql -h localhost -u openmrs -p openmrs

# Backup database
mysqldump -u openmrs -p openmrs > openmrs_backup.sql

# Restore database
mysql -u openmrs -p openmrs < openmrs_backup.sql
```

---

## 📞 Support & Contact

### Documentation:
- **API Documentation**: `http://localhost:3000/api-docs`
- **OpenMRS Documentation**: `http://localhost:8084/openmrs/help`
- **Project README**: `./README.md`

### Issues & Bug Reports:
- Create an issue in the project repository
- Include error logs and system information
- Provide steps to reproduce the issue

### Development Team:
- **Project Lead**: [Your Name]
- **Backend Developer**: [Developer Name]
- **Frontend Developer**: [Developer Name]
- **OpenMRS Integration**: [Developer Name]

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenMRS Community** for the excellent medical record system
- **React Team** for the powerful frontend framework
- **Node.js Community** for the robust backend platform
- **MongoDB** for the flexible database solution
- **Docker** for containerization support

---

*Last Updated: October 6, 2025*
*Version: 1.0.0*





