# Patient Passport System

Digital patient passport platform with: patient profiles, doctor/hospital workflows, real-time notifications, OTP-protected passport access, and USSD support for feature phones.

## 🚀 Quick Links

- **🌐 Live Application**: [https://patient-passpo.netlify.app/](https://patient-passpo.netlify.app/)
- **🔗 Alternate Frontend URL**: [https://jade-pothos-e432d0.netlify.app/patient-passport](https://jade-pothos-e432d0.netlify.app/patient-passport)
- **⚙️ Backend API**: [https://patientpassport-api.azurewebsites.net/api](https://patientpassport-api.azurewebsites.net/api)
- **📹 Demo Video**: [demo-video.mp4](./demo-video.mp4) (located in project root)

---

## 📋 Table of Contents

1. [Installation & Setup](#-installation--setup-step-by-step)
2. [Running the Application](#-running-the-application)
3. [Related Files](#-related-files)
4. [Demo Video](#-demo-video)
5. [Deployed Version](#-deployed-version)
6. [Project Overview](#-project-overview)
7. [Additional Documentation](#-additional-documentation)

---

## 🛠️ Installation & Setup (Step-by-Step)

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **MongoDB** - MongoDB Atlas account (recommended) or local MongoDB instance
- **Email Service Account** - Gmail (with App Password) or SendGrid account

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Capstone-PatientPassport
```

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory

```bash
cd backend
```

#### 2.2 Install Dependencies

```bash
npm install
```

#### 2.3 Configure Environment Variables

1. Copy the example environment file:
   ```bash
   # On Windows (PowerShell)
   copy env.example .env
   
   # On Linux/Mac
   cp env.example .env
   ```

2. Open `.env` file and configure the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database Configuration - Replace with your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Configuration - Generate strong random secrets
JWT_SECRET=your-super-secret-jwt-key-here-change-this
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this
JWT_REFRESH_EXPIRE=30d

# Password Reset
JWT_RESET_SECRET=your-reset-secret-key-here-change-this
JWT_RESET_EXPIRE=10m

# Email Configuration - Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=PatientPassport <your-email@gmail.com>

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Optional: Cloudinary for file uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Africa's Talking for USSD/SMS
AFRICASTALKING_API_KEY=your-africastalking-api-key
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_USSD_CODE=*123#
```

**Important Notes:**
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
- Generate strong, random values for JWT secrets (you can use `openssl rand -hex 32`)
- For MongoDB, you can create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

#### 2.4 Build the Project (Optional - for production)

```bash
npm run build
```

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend Directory

Open a **new terminal window** and navigate to the frontend directory:

```bash
cd frontend
```

#### 3.2 Install Dependencies

```bash
npm install
```

#### 3.3 Configure Environment Variables

1. Copy the example environment file:
   ```bash
   # On Windows (PowerShell)
   copy env.example .env
   
   # On Linux/Mac
   cp env.example .env
   ```

2. Open `.env` file and configure:

```env
# Development Backend URL
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Patient Passport
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Comprehensive Medical Records Management System

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCKET_IO=true
```

**Note:** For production deployment, use the production API URLs in the `.env` file.

---

## ▶️ Running the Application

### Development Mode (Recommended)

#### Option 1: Run Backend and Frontend Separately

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   Backend will run on: `http://localhost:5000`
   - API Base URL: `http://localhost:5000/api`
   - API Docs: `http://localhost:5000/api-docs` (if configured)

2. **Start Frontend Server** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   
   Frontend will run on: `http://localhost:5173`
   
   Open your browser and navigate to: `http://localhost:5173`

#### Option 2: Run Production Build Locally

1. **Backend Production Build:**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Frontend Production Build:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

### Docker Deployment (Alternative)

#### Backend Docker

```bash
cd backend
docker build -t patient-passport-api .
docker run -p 5000:5000 --env-file .env patient-passport-api
```

#### Frontend Docker

```bash
cd frontend
docker build -t patient-passport-frontend .
docker run -p 5173:5173 patient-passport-frontend
```

### Verification

After starting both servers, you should see:

- ✅ Backend: Server running on port 5000
- ✅ Frontend: Development server running on port 5173
- ✅ MongoDB: Connection established

**Test the setup:**
1. Open `http://localhost:5173` in your browser
2. Check browser console for any connection errors
3. Visit `http://localhost:5000/api/health` (if health endpoint exists) to verify backend

---

## 📁 Related Files

### Project Structure

```
Capstone-PatientPassport/
├── backend/                          # Backend API Server
│   ├── src/                         # Source code
│   │   ├── controllers/             # Request handlers
│   │   ├── middleware/              # Authentication, validation, etc.
│   │   ├── models/                  # MongoDB models
│   │   ├── routes/                  # API routes
│   │   ├── services/                # Business logic
│   │   ├── utils/                   # Utility functions
│   │   └── app.ts                   # Application entry point
│   ├── docs/                        # API documentation
│   │   ├── USSD_GUIDE.md           # USSD implementation guide
│   │   ├── USSD_DEPLOYMENT.md      # USSD deployment guide
│   │   ├── USSD_QUICKSTART.md      # Quick start for USSD
│   │   └── swagger.yml              # Swagger API documentation
│   ├── test/                        # Test files
│   │   └── ussd.test.js            # USSD testing
│   ├── Dockerfile                   # Docker configuration
│   ├── package.json                 # Backend dependencies
│   ├── env.example                  # Environment variables template
│   └── README.md                    # Backend-specific documentation
│
├── frontend/                         # React Frontend Application
│   ├── src/                         # Source code
│   │   ├── components/             # React components
│   │   ├── contexts/               # React contexts
│   │   ├── services/               # API services
│   │   ├── types/                  # TypeScript types
│   │   └── App.tsx                 # Main App component
│   ├── public/                      # Static assets
│   ├── Dockerfile                   # Docker configuration
│   ├── package.json                 # Frontend dependencies
│   ├── env.example                  # Environment variables template
│   └── README.md                    # Frontend-specific documentation
│
├── openmrs-patient-passport-module/  # OpenMRS Integration Module
│   ├── api/                         # OpenMRS API module
│   ├── omod/                        # OpenMRS module
│   ├── README.md                    # OpenMRS integration docs
│   └── DEPLOYMENT_GUIDE.md          # OpenMRS deployment guide
│
├── demo-video.mp4                    # 5-minute demo video
├── LICENSE                           # License file
└── README.md                         # This file
```

### Key Documentation Files

#### Backend Documentation
- **`backend/README.md`** - Complete backend API documentation
- **`backend/docs/USSD_GUIDE.md`** - Comprehensive USSD implementation guide
- **`backend/docs/USSD_DEPLOYMENT.md`** - Step-by-step USSD deployment
- **`backend/docs/USSD_QUICKSTART.md`** - Quick start guide for USSD features
- **`backend/docs/swagger.yml`** - Swagger/OpenAPI specification

#### Frontend Documentation
- **`frontend/README.md`** - Frontend component architecture and guides

#### Integration Documentation
- **`openmrs-patient-passport-module/README.md`** - OpenMRS integration guide
- **`openmrs-patient-passport-module/DEPLOYMENT_GUIDE.md`** - OpenMRS deployment steps

#### Additional Guides
- **`backend/docs/Patient_Passport_USSD.postman_collection.json`** - Postman collection for API testing
- **`HOSPITAL_DOCTOR_WORKFLOW_IMPLEMENTATION.md`** - Hospital and doctor workflow documentation (if exists)

### Configuration Files

- **`backend/env.example`** - Backend environment variables template
- **`frontend/env.example`** - Frontend environment variables template
- **`backend/tsconfig.json`** - TypeScript configuration for backend
- **`frontend/tsconfig.json`** - TypeScript configuration for frontend
- **`frontend/tailwind.config.js`** - Tailwind CSS configuration
- **`frontend/vite.config.ts`** - Vite build configuration

---

## 🎬 Demo Video

### Video Location

The 5-minute demo video is located at: **`./demo-video.mp4`** (in the project root directory)

### Demo Video Guidelines

The demo video should focus on **core functionalities** and avoid spending time on sign-up and sign-in screens. Here's a suggested structure:

#### Suggested Demo Structure (5 minutes)

| Timestamp | Content | Focus |
|-----------|---------|-------|
| **00:00 - 00:20** | Quick app intro + goals | Overview of what will be demonstrated |
| **00:20 - 01:30** | **Patient Passport** | Open a patient, browse passport summary, show key fields (medical history, medications, allergies) |
| **01:30 - 02:20** | **Doctor Dashboard** | Find a patient, request passport access, show OTP verification flow and result |
| **02:20 - 03:10** | **Hospital Admin** | Add/edit a doctor, show patient assignments, analytics overview |
| **03:10 - 03:50** | **USSD Flow** | Screen-record USSD flow: dial code, language selection, SMS passport delivery |
| **03:50 - 04:30** | **Real-time Notifications** | Trigger an update (new record or access event), show socket notification in action |
| **04:30 - 05:00** | Wrap up | Where code lives, how to reproduce locally, link to deployed app |

#### Recording Tips

- ✅ **Focus on Core Features**: Minimize time on authentication screens
- ✅ **Show Real Data**: Use realistic patient data and medical scenarios
- ✅ **Demonstrate Workflows**: Show complete user journeys, not just features
- ✅ **Clear Audio**: Ensure narration is clear and understandable
- ✅ **Good Quality**: Use screen recording software with good resolution
- ⚠️ **Security**: Keep credentials out of the video; use test/demo accounts or redacted values

### Video Upload Options

You can:
1. **Keep it local**: Reference `./demo-video.mp4` in the README (current approach)
2. **Upload to YouTube**: Upload to YouTube and replace the link above with the YouTube URL
3. **Upload to cloud storage**: Upload to Google Drive, Dropbox, etc., and share the link

---

## 🌐 Deployed Version

### Live Application Links

- **🌐 Primary Frontend**: [https://patient-passpo.netlify.app/](https://patient-passpo.netlify.app/)
- **🔗 Alternate Frontend**: [https://jade-pothos-e432d0.netlify.app/patient-passport](https://jade-pothos-e432d0.netlify.app/patient-passport)
- **⚙️ Backend API**: [https://patientpassport-api.azurewebsites.net/api](https://patientpassport-api.azurewebsites.net/api)
- **📖 API Documentation**: [https://patientpassport-api.azurewebsites.net/api-docs](https://patientpassport-api.azurewebsites.net/api-docs) (if available)

### Installable Packages

Currently, the application is deployed as a web application. If you need installable packages:

**For Android (APK):**
- The application can be packaged as a Progressive Web App (PWA) and installed on Android devices
- Alternatively, a native Android app can be built using React Native

**For Windows (.exe):**
- An Electron wrapper can be built to create a Windows executable
- Build command: `npm run build:electron` (if configured)

**For iOS:**
- React Native build for iOS devices
- Requires Apple Developer account

To request an installable package, specify the target platform and we can provide build instructions.

---

## 🏥 Project Overview

### Technology Stack

- **Backend**: Node.js + TypeScript + Express + MongoDB
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Real-time**: Socket.io for live notifications
- **USSD/SMS**: Africa's Talking integration (optional)
- **Authentication**: JWT-based with OTP verification
- **Database**: MongoDB with Mongoose ODM

### Core Features

1. **Patient Management**
   - Patient registration and profile management
   - Medical record storage and retrieval
   - Passport access control

2. **Doctor Dashboard**
   - Patient list and search
   - Medical record access requests
   - OTP-based access verification

3. **Hospital Administration**
   - Doctor management
   - Patient assignments
   - Analytics and reporting

4. **USSD Support**
   - Access medical passport via feature phones
   - Multi-language support (English/Kinyarwanda)
   - SMS delivery of passport data

5. **Real-time Notifications**
   - Socket.io for live updates
   - Email notifications
   - SMS notifications (optional)

### Security Features

- JWT authentication with refresh tokens
- OTP verification for sensitive operations
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers

---

## 📚 Additional Documentation

### Backend Guides

- **[Backend README](./backend/README.md)** - Complete backend API documentation
- **[USSD Guide](./backend/docs/USSD_GUIDE.md)** - Comprehensive USSD implementation
- **[USSD Deployment](./backend/docs/USSD_DEPLOYMENT.md)** - USSD deployment steps
- **[USSD Quick Start](./backend/docs/USSD_QUICKSTART.md)** - Quick start for USSD

### Frontend Guides

- **[Frontend README](./frontend/README.md)** - Frontend architecture and components

### Integration Guides

- **[OpenMRS Module](./openmrs-patient-passport-module/README.md)** - OpenMRS integration
- **[OpenMRS Deployment](./openmrs-patient-passport-module/DEPLOYMENT_GUIDE.md)** - OpenMRS deployment

### Testing

#### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

#### Frontend Tests
```bash
cd frontend
npm run test          # Run tests (if configured)
```

#### USSD Testing
```bash
cd backend
node test/ussd.test.js
```

---

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
- ✅ Check MongoDB connection string in `.env`
- ✅ Verify all required environment variables are set
- ✅ Ensure port 5000 is not in use
- ✅ Check Node.js version (requires v18+)

**Frontend can't connect to API:**
- ✅ Verify `VITE_API_BASE_URL` in `.env` is correct
- ✅ Check backend server is running
- ✅ Verify CORS settings in backend
- ✅ Check browser console for errors

**MongoDB connection failed:**
- ✅ Verify MongoDB URI in `.env`
- ✅ Check network connectivity
- ✅ Ensure MongoDB Atlas IP whitelist includes your IP
- ✅ Verify MongoDB username and password

**USSD not working:**
- ✅ Verify Africa's Talking credentials
- ✅ Check webhook URL is correct and publicly accessible
- ✅ Ensure server has SSL certificate (HTTPS required)
- ✅ Verify USSD code is configured correctly

**OTP not received:**
- ✅ Check email service configuration (Gmail App Password)
- ✅ Verify patient email address is correct
- ✅ Check spam folder
- ✅ Ensure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS are set correctly

**Port already in use:**
- ✅ Change PORT in backend `.env` file
- ✅ Kill process using the port: `npx kill-port 5000` (or on Linux: `lsof -ti:5000 | xargs kill`)

---

## 🚀 Production Deployment

### Backend Deployment (Azure)

1. **Build the application:**
   ```bash
   cd backend
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Environment Setup:**
   - Configure production environment variables in Azure
   - Set up MongoDB Atlas cluster
   - Configure email service (SendGrid recommended)
   - Set up Africa's Talking for USSD/SMS
   - Configure SSL certificates

### Frontend Deployment (Netlify/Vercel)

1. **Build for production:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy dist/ folder:**
   - Deploy to Netlify, Vercel, or Azure Static Web Apps
   - Configure environment variables in hosting platform
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Environment Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set in production
- [ ] Email service configured
- [ ] JWT secrets generated (strong, random values)
- [ ] CORS origins configured for production URLs
- [ ] SSL certificates installed
- [ ] Africa's Talking configured (if using USSD)
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for functions
- Write tests for new features
- Ensure accessibility compliance

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Credits

**Patient Passport System** - Secure, scalable healthcare data management platform.

For questions or support, please open an issue in the repository or contact the development team.

---

**Last Updated**: 2024
