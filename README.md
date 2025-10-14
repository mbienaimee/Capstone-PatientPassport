# Patient Passport - Healthcare Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![OpenMRS](https://img.shields.io/badge/OpenMRS-2.5.0-orange.svg)](https://openmrs.org/)

A comprehensive healthcare management system that provides unified patient record management across different healthcare facilities with OpenMRS integration.

## 🏗️ Project Structure

```
Capstone-PatientPassport/
├── backend/                 # Node.js backend API
│   ├── src/                # TypeScript source code
│   ├── docs/               # API documentation
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
├── frontend/               # React frontend application
│   ├── src/                # React components and pages
│   ├── package.json        # Frontend dependencies
│   └── README.md           # Frontend documentation
├── openmrs-modules/        # OpenMRS integration modules
│   ├── patient-passport-core/
│   │   └── omod/
│   │       └── patientpassportcore-1.0.0.omod  # Ready-to-import module
│   └── patient-passport-interoperability/
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **MongoDB** (local or cloud instance)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mbienaimee/Capstone-PatientPassport.git
   cd Capstone-PatientPassport
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   **Backend Environment** (`backend/.env`):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/patient-passport
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

   **Frontend Environment** (`frontend/.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_APP_NAME=PatientPassport
   ```

4. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api-docs

## 🔑 Default Login Credentials

- **Email**: admin@example.com
- **Password**: password123

## ✨ Key Features

### **Patient Management**
- Complete patient registration and authentication
- Personal medical dashboard with health overview
- Medical history tracking with detailed conditions
- Medication management (active and past medications)
- Test results with status indicators
- Hospital visit history and tracking
- Medical image storage and management

### **Hospital Management**
- Hospital registration and authentication
- Patient search and management capabilities
- Medical record updates and management
- Statistics and analytics dashboard
- Administrative functions and controls

### **Security & Compliance**
- JWT-based authentication with role-based access control
- Data encryption at rest and in transit
- Rate limiting and DDoS protection
- Complete audit trails for all actions
- Input validation and sanitization

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **TypeScript**
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Swagger** for API documentation
- **Helmet** for security

## 📱 OpenMRS Integration

### Import Patient Passport Module

1. **Download OpenMRS Standalone**
   - Go to https://openmrs.org/download/
   - Download OpenMRS Standalone (latest version)

2. **Start OpenMRS**
   ```bash
   java -jar openmrs-standalone.jar
   ```

3. **Access OpenMRS**
   - URL: http://localhost:8081/openmrs-standalone/
   - Login: admin / Admin123

4. **Import Module**
   - Go to Administration → Manage Modules
   - Upload `openmrs-modules/patient-passport-core/omod/patientpassportcore-1.0.0.omod`
   - Install and start the module

### Module Features
- Universal patient ID generation
- Patient data synchronization
- Emergency access override
- FHIR R4 compliance
- REST API endpoints

## 🔧 Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID

### Medical Records
- `GET /api/medical/conditions/:patientId` - Get medical conditions
- `POST /api/medical/conditions` - Create medical condition
- `GET /api/medical/test-results/:patientId` - Get test results

## 🚀 Deployment

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Netlify
```

### Backend (Docker)
```bash
cd backend
docker build -t patient-passport-api .
docker run -d -p 5000:5000 patient-passport-api
```

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :5000
# Kill process
taskkill /PID <process_id> /F
```

**Database Connection Issues**
- Ensure MongoDB is running
- Check connection string in `.env` file
- Verify database permissions

## 📖 Documentation

- **Backend API**: http://localhost:5000/api-docs
- **Frontend Components**: See `frontend/src/components/`
- **OpenMRS Module**: See `openmrs-modules/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub**: https://github.com/mbienaimee/Capstone-PatientPassport
- **Figma Design**: https://www.figma.com/design/ahkyDa0vNjqqGVXt7QQRs0/Capstone--Patient-passport
- **Demo Video**: https://www.youtube.com/watch?v=rFiWLIaFlUE

---

**Made with ❤️ for better healthcare management**