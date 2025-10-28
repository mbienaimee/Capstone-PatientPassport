# Patient Passport Backend API

A robust, scalable backend API built with Node.js, TypeScript, and Express.js for the Patient Passport healthcare management system.

## Overview

The Patient Passport Backend API provides secure, RESTful endpoints for managing patient medical records, doctor-patient interactions, hospital workflows, and real-time communication features. Built with enterprise-grade security and performance optimizations.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Patient Management**: Complete CRUD operations for patient profiles and medical records
- **Doctor Management**: Doctor registration, authentication, and patient assignment
- **Hospital Management**: Multi-hospital support with administrative controls
- **Medical Records**: Secure storage and retrieval of medical information
- **Access Control**: Granular permissions for medical record access
- **Real-time Communication**: WebSocket support for live updates
- **Email Services**: OTP verification and notification system
- **USSD Integration**: Patient Passport access via Africa's Talking USSD (works on any phone!)
- **SMS Notifications**: Real-time SMS alerts and passport delivery
- **Audit Logging**: Comprehensive activity tracking

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: Joi schema validation
- **Rate Limiting**: Configurable request rate limiting
- **CORS Protection**: Cross-origin resource sharing controls
- **Helmet Security**: Security headers middleware
- **Data Encryption**: Sensitive data encryption
- **Audit Trail**: Complete activity logging

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **Validation**: Joi
- **Security**: Helmet, bcryptjs
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Linting**: ESLint

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts
│   │   ├── patientController.ts
│   │   ├── doctorController.ts
│   │   ├── hospitalController.ts
│   │   └── ...
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── rateLimiter.ts
│   │   └── ...
│   ├── models/            # Database models
│   │   ├── Patient.ts
│   │   ├── Doctor.ts
│   │   ├── Hospital.ts
│   │   └── ...
│   ├── routes/            # API routes
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── doctors.ts
│   │   └── ...
│   ├── services/          # Business logic
│   │   ├── emailService.ts
│   │   ├── authService.ts
│   │   └── ...
│   ├── utils/             # Utility functions
│   │   ├── email.ts
│   │   ├── otp.ts
│   │   └── logger.ts
│   ├── types/             # TypeScript definitions
│   ├── app.ts             # Application entry point
│   └── server.ts          # Server configuration
├── docs/                  # API documentation
├── scripts/               # Utility scripts
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Email service account (Gmail/SendGrid)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # JWT Secrets
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification

### Patient Endpoints
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/medical-records` - Get patient medical records

### Doctor Endpoints
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Create new doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor
- `GET /api/doctors/:id/patients` - Get doctor's patients

### Hospital Endpoints
- `GET /api/hospitals` - Get all hospitals
- `POST /api/hospitals` - Create new hospital
- `GET /api/hospitals/:id` - Get hospital by ID
- `PUT /api/hospitals/:id` - Update hospital

### Access Control Endpoints
- `POST /api/access-requests` - Request patient access
- `GET /api/access-requests` - Get access requests
- `PUT /api/access-requests/:id` - Update access request
- `POST /api/access-requests/:id/approve` - Approve access request

## Database Models

### User Model
```typescript
interface User {
  _id: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'hospital' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Patient Model
```typescript
interface Patient {
  _id: string;
  user: User;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  contactNumber: string;
  address: string;
  emergencyContact: EmergencyContact;
  medicalConditions: MedicalCondition[];
  medications: Medication[];
  status: 'active' | 'inactive';
}
```

### Doctor Model
```typescript
interface Doctor {
  _id: string;
  user: User;
  licenseNumber: string;
  specialization: string;
  hospital: Hospital;
  patients: Patient[];
  isActive: boolean;
}
```

## Security Implementation

### Authentication Flow
1. User registers with email and password
2. System sends OTP for email verification
3. User verifies email and receives JWT tokens
4. Access tokens expire in 7 days
5. Refresh tokens expire in 30 days

### Authorization Levels
- **Patient**: Access to own medical records
- **Doctor**: Access to assigned patients' records
- **Hospital**: Access to hospital data and doctors
- **Admin**: Full system access

### Data Protection
- All passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted at rest
- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS protection enabled

## Development Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run dev:mock     # Start with mock data

# Production
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Testing
npm test            # Run test suite
npm run test:watch  # Run tests in watch mode

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues

# Documentation
npm run docs        # Serve API documentation
npm run docs:dev    # Serve docs with hot reload
```

## Environment Variables

### Required Variables
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Optional Variables
```env
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
LOG_LEVEL=info
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

## Testing

### Unit Tests
```bash
npm test
```

### API Testing
Use the Swagger documentation at `http://localhost:5000/api-docs` for interactive API testing.

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t patient-passport-api .

# Run container
docker run -p 5000:5000 patient-passport-api
```

### Environment Setup
1. Set production environment variables
2. Configure MongoDB Atlas cluster
3. Set up email service (SendGrid recommended)
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates
6. Configure monitoring and logging
7. Set up Africa's Talking for USSD/SMS (see USSD guide below)

## USSD Integration 📱

Patient Passport now supports USSD access via Africa's Talking! Patients can access their medical passport using any mobile phone (no internet required).

### Features
- 🌍 **Universal Access**: Works on any phone (feature phones included)
- 🗣️ **Multi-language**: English and Kinyarwanda support
- 📨 **SMS Delivery**: Passport sent via SMS
- 🔐 **Secure**: National ID or email verification

### Quick Setup

1. **Install Africa's Talking SDK**
   ```bash
   npm install africastalking
   ```

2. **Configure Environment**
   ```env
   AFRICASTALKING_API_KEY=your-api-key
   AFRICASTALKING_USERNAME=your-username
   AFRICASTALKING_USSD_CODE=*123#
   ```

3. **Test USSD Flow**
   ```bash
   curl -X POST http://localhost:5000/api/ussd/callback \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-123",
       "phoneNumber": "+250788123456",
       "text": ""
     }'
   ```

### USSD Endpoints

- `POST /api/ussd/callback` - Africa's Talking webhook (public)
- `POST /api/ussd/test` - Test USSD flow (admin only)
- `GET /api/ussd/stats` - USSD statistics (admin only)

### Documentation
- **Complete Guide**: [docs/USSD_GUIDE.md](./docs/USSD_GUIDE.md)
- **Deployment**: [docs/USSD_DEPLOYMENT.md](./docs/USSD_DEPLOYMENT.md)
- **Quick Start**: [docs/USSD_QUICKSTART.md](./docs/USSD_QUICKSTART.md)
- **Postman Collection**: [docs/Patient_Passport_USSD.postman_collection.json](./docs/Patient_Passport_USSD.postman_collection.json)

### How It Works

1. Patient dials USSD code (e.g., `*123#`)
2. Selects language (English/Kinyarwanda)
3. Chooses access method (National ID/Email)
4. Enters credentials
5. Receives passport via SMS

## Monitoring & Logging

### Health Check
```bash
GET /health
```

### Metrics Endpoint
```bash
GET /metrics
```

### Log Levels
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug-level messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Patient Passport Backend API** - Secure, scalable healthcare data management.