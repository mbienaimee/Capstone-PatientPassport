# 🏥 Patient Passport - Healthcare Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![OpenMRS](https://img.shields.io/badge/OpenMRS-2.5.0-orange.svg)](https://openmrs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A comprehensive healthcare management system that provides unified patient record management across different healthcare facilities with OpenMRS integration.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **Docker** and **Docker Compose**
- **Git**

### One-Command Setup
```powershell
# Windows PowerShell
.\setup-patient-passport.ps1

# Or manually:
git clone <repository-url>
cd Capstone-PatientPassport
npm install
docker-compose up -d
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **OpenMRS**: http://localhost:8084/openmrs
- **OpenMRS Reference**: http://localhost

**Default Login**: `admin@example.com` / `password123`

## ✨ Features

### 🏥 Patient Management
- Universal patient identification
- Cross-facility data sharing
- Comprehensive patient profiles
- Advanced search capabilities

### 📋 Medical Records
- Medical history tracking
- Vital signs monitoring
- Medication management
- Allergy tracking

### 🔗 OpenMRS Integration
- Seamless module integration
- Real-time data synchronization
- FHIR R4 compliance
- REST API endpoints

### 🚨 Emergency Features
- Emergency access override
- Audit trail logging
- Critical situation handling

## 🏗️ Architecture

```
Frontend (React) ←→ Backend API (Node.js) ←→ OpenMRS Integration
       ↓                    ↓                        ↓
   Netlify              MongoDB                 MySQL
  (Production)        (Database)            (OpenMRS DB)
```

## 📚 Documentation

- **[Complete Documentation](PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md)** - Comprehensive project guide
- **[API Documentation](http://localhost:3000/api-docs)** - Backend API reference
- **[OpenMRS Integration Guide](OPENMRS_PLUGIN_INTEGRATION_GUIDE.md)** - Module integration details

## 🛠️ Development

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

# Stop all services
docker-compose down

# View logs
docker-compose logs

# Restart specific service
docker restart openmrs-platform
```

## 🔧 OpenMRS Module

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

## 📊 API Endpoints

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

## 🚀 Deployment

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

## 📁 Project Structure

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenMRS Community** for the excellent medical record system
- **React Team** for the powerful frontend framework
- **Node.js Community** for the robust backend platform
- **MongoDB** for the flexible database solution

## 📞 Support

- **Documentation**: [PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md](PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md)
- **Issues**: Create an issue in the repository
- **Email**: [your-email@example.com]

---

**Made with ❤️ for better healthcare management**