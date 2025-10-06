# PatientPassport Backend API

A comprehensive backend API for managing patient medical records and hospital operations built with Express.js, TypeScript, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Patient Management**: Complete patient profile and medical record management
- **Hospital Management**: Hospital registration, approval, and management system
- **Medical Records**: Medical conditions, medications, test results, and hospital visits
- **Dashboard Analytics**: Comprehensive dashboards for different user roles
- **Security**: Rate limiting, input validation, CORS, and security headers
- **Documentation**: Swagger/OpenAPI documentation
- **Email Notifications**: Automated email notifications for various events
- **Logging**: Comprehensive logging system with file and console output

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Email**: Nodemailer
- **Logging**: Custom logger with file output

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/patient-passport
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Route controllers
│   │   ├── authController.ts
│   │   ├── patientController.ts
│   │   ├── hospitalController.ts
│   │   ├── medicalController.ts
│   │   └── dashboardController.ts
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── rateLimiter.ts
│   ├── models/              # Database models
│   │   ├── User.ts
│   │   ├── Patient.ts
│   │   ├── Doctor.ts
│   │   ├── Hospital.ts
│   │   ├── MedicalCondition.ts
│   │   ├── Medication.ts
│   │   ├── TestResult.ts
│   │   └── HospitalVisit.ts
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   ├── patients.ts
│   │   ├── hospitals.ts
│   │   ├── medical.ts
│   │   └── dashboard.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── email.ts
│   │   └── logger.ts
│   ├── app.ts              # Application entry point
│   └── server.ts           # Server configuration
├── logs/                   # Log files
├── dist/                   # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user
- `DELETE /api/auth/account` - Delete account

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/search` - Search patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/medical-history` - Get medical history
- `GET /api/patients/:id/medications` - Get medications
- `GET /api/patients/:id/test-results` - Get test results
- `GET /api/patients/:id/hospital-visits` - Get hospital visits
- `GET /api/patients/:id/summary` - Get patient summary

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/pending` - Get pending hospitals
- `GET /api/hospitals/search` - Search hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create new hospital
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital
- `PATCH /api/hospitals/:id/approve` - Approve hospital
- `PATCH /api/hospitals/:id/reject` - Reject hospital
- `GET /api/hospitals/:id/doctors` - Get hospital doctors
- `GET /api/hospitals/:id/patients` - Get hospital patients
- `GET /api/hospitals/:id/summary` - Get hospital summary

### Medical Records
- `GET /api/medical/conditions` - Get medical conditions
- `POST /api/medical/conditions` - Create medical condition
- `PUT /api/medical/conditions/:id` - Update medical condition
- `DELETE /api/medical/conditions/:id` - Delete medical condition
- `GET /api/medical/medications` - Get medications
- `POST /api/medical/medications` - Create medication
- `PUT /api/medical/medications/:id` - Update medication
- `DELETE /api/medical/medications/:id` - Delete medication
- `GET /api/medical/test-results` - Get test results
- `POST /api/medical/test-results` - Create test result
- `PUT /api/medical/test-results/:id` - Update test result
- `DELETE /api/medical/test-results/:id` - Delete test result
- `GET /api/medical/hospital-visits` - Get hospital visits
- `POST /api/medical/hospital-visits` - Create hospital visit
- `PUT /api/medical/hospital-visits/:id` - Update hospital visit
- `DELETE /api/medical/hospital-visits/:id` - Delete hospital visit

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard
- `GET /api/dashboard/hospital` - Hospital dashboard
- `GET /api/dashboard/doctor` - Doctor dashboard
- `GET /api/dashboard/patient` - Patient dashboard
- `GET /api/dashboard/stats` - General statistics

## 🔒 Authentication & Authorization

The API uses JWT-based authentication with role-based access control:

- **Patient**: Can access their own medical records and dashboard
- **Doctor**: Can access assigned patients' records and medical management
- **Hospital**: Can access hospital-specific data and patients
- **Admin**: Full access to all resources and management functions

## 📊 Database Schema

### Core Models
- **User**: Base user information and authentication
- **Patient**: Patient-specific medical information
- **Doctor**: Doctor credentials and specializations
- **Hospital**: Hospital information and management

### Medical Models
- **MedicalCondition**: Patient medical conditions and diagnoses
- **Medication**: Patient medications and prescriptions
- **TestResult**: Laboratory and diagnostic test results
- **HospitalVisit**: Patient hospital visits and consultations

## 🛡️ Security Features

- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive validation for all inputs
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers and protection
- **Password Hashing**: bcrypt for secure password storage
- **JWT Security**: Secure token-based authentication

## 📝 API Documentation

Interactive API documentation is available at:
- Development: `http://localhost:5000/api-docs`
- Production: `https://api.patientpassport.com/api-docs`

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection strings
- JWT secrets
- Email configuration
- CORS origins
- Security settings

## 📈 Monitoring & Logging

- **Application Logs**: Stored in `logs/app.log`
- **Error Logs**: Stored in `logs/error.log`
- **Health Check**: Available at `/health`
- **Metrics**: Built-in performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@patientpassport.com
- Documentation: `/api-docs`
- Issues: GitHub Issues

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - User authentication and authorization
  - Patient and hospital management
  - Medical records management
  - Dashboard analytics
  - API documentation































