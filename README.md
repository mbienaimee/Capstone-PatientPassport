# Patient Passport System

Digital patient passport platform with patient profiles, doctor/hospital workflows, real-time notifications, and OTP-protected passport access.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

Patient Passport is a comprehensive medical records management system that enables:

- Secure patient medical record storage and access
- Doctor and hospital management workflows
- Real-time notifications and updates
- OTP-protected passport access
- Multi-language support (English and Kinyarwanda)
- Role-based access control (Patient, Doctor, Hospital, Admin)

## Technology Stack

### Backend
- Node.js (v18+)
- TypeScript
- Express.js
- MongoDB with Mongoose
- Socket.io (real-time communication)
- JWT (authentication)
- Nodemailer (email services)

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- React Router
- Socket.io Client
- Framer Motion

## Prerequisites

Before installing and running the project, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **MongoDB Atlas account** (or local MongoDB instance) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Email service account** (Gmail with App Password or SendGrid)

Optional:
- **Docker** (for containerized deployment)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/mbienaimee/Capstone-PatientPassport
cd Capstone-PatientPassport
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

Open a new terminal window:

```bash
cd frontend
npm install
```

## Environment Configuration

### Backend Environment Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the environment example file:
```bash
copy env.example .env
```

On Linux/Mac:
```bash
cp env.example .env
```

3. Edit the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000
HOST=localhost

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key-here-REPLACE-WITH-128-CHAR-HEX
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-REPLACE-WITH-128-CHAR-HEX
JWT_REFRESH_EXPIRE=30d
JWT_RESET_SECRET=your-reset-secret-key-here-REPLACE-WITH-128-CHAR-HEX
JWT_RESET_EXPIRE=10m

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=PatientPassport <your-email@gmail.com>

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here-REPLACE-WITH-64-CHAR-HEX
```

**Important Security Notes:**
- Generate secure JWT secrets using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- For Gmail, use App Password (not regular password) from [Google App Passwords](https://myaccount.google.com/apppasswords)
- Never commit `.env` files to version control

**Optional Configuration:**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend Environment Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Copy the environment example file:
```bash
copy env.example .env
```

On Linux/Mac:
```bash
cp env.example .env
```

3. Edit the `.env` file:

For local development:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Patient Passport
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCKET_IO=true
```

For production:
```env
VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net
VITE_APP_NAME=Patient Passport
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCKET_IO=true
```

## Running the Project

### Development Mode

#### Start Backend Server

1. Open a terminal and navigate to the backend directory:
```bash
cd backend
```

2. Start the development server:
```bash
npm run dev
```

The backend server will start on `http://localhost:5000`
API base URL: `http://localhost:5000/api`

Expected output:
```
MongoDB Connected: ...
Server running on port 5000
```

#### Start Frontend Server

1. Open a **new terminal** and navigate to the frontend directory:
```bash
cd frontend
```

2. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

Expected output:
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Production Mode

#### Build and Run Backend

```bash
cd backend
npm run build
npm start
```

#### Build and Run Frontend

```bash
cd frontend
npm run build
npm run preview
```

The production build will be available in the `frontend/dist` directory.

## Project Structure

```
Capstone-PatientPassport/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript definitions
│   │   ├── app.ts             # Application setup
│   │   └── server.ts          # Server entry point
│   ├── docs/                  # API documentation
│   ├── scripts/               # Utility scripts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # Environment variables (create from env.example)
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript definitions
│   │   ├── config/            # Configuration files
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── public/                # Static assets
│   ├── dist/                  # Production build output
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env                   # Environment variables (create from env.example)
│
└── openmrs-patient-passport-module/
    └── ...                    # OpenMRS integration module
```

## Available Scripts

### Backend Scripts

```bash
npm run dev          # Start development server with hot reload
npm run dev:mock     # Start with mock data
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm test            # Run test suite
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run docs        # Serve API documentation
```

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint        # Run ESLint
npm run build:prod   # Build with production environment variables
```

## Deployment

### Backend Deployment

#### Docker Deployment

```bash
cd backend
docker build -t patient-passport-api .
docker run -p 5000:5000 --env-file .env patient-passport-api
```

#### Azure App Service

1. Build the application:
```bash
cd backend
npm run build
```

2. Deploy to Azure App Service using Azure CLI or portal

3. Configure environment variables in Azure Portal

#### Environment Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set in production
- [ ] Email service configured (SendGrid recommended for production)
- [ ] JWT secrets generated and secured
- [ ] CORS origins configured
- [ ] SSL certificates installed
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented

### Frontend Deployment

#### Netlify

1. Build the application:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to Netlify

3. Configure environment variables in Netlify dashboard

#### Vercel

1. Connect your repository to Vercel
2. Configure build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in Vercel dashboard

#### Docker Deployment

```bash
cd frontend
docker build -t patient-passport-frontend .
docker run -p 5173:5173 patient-passport-frontend
```

## Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:watch
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Integration Tests

```bash
cd frontend
npm run test:integration
```

## Troubleshooting

### Backend Issues

**Backend won't start:**
- Check MongoDB connection string in `.env`
- Verify all required environment variables are set
- Check if port 5000 is available: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Mac/Linux)
- Review terminal output for specific error messages

**MongoDB connection failed:**
- Verify MongoDB Atlas connection string
- Check network firewall settings
- Ensure IP address is whitelisted in MongoDB Atlas
- Verify database credentials

**JWT errors:**
- Ensure JWT_SECRET is set and is at least 64 characters
- Verify JWT secrets are different for access and refresh tokens
- Check token expiration settings

### Frontend Issues

**Frontend can't connect to API:**
- Verify `VITE_API_BASE_URL` in `.env` matches backend URL
- Check backend server is running
- Verify CORS settings in backend
- Check browser console for specific errors

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npm run build`

**Socket connection errors:**
- Verify `VITE_SOCKET_URL` is set correctly
- Check backend Socket.io is running
- Review browser console for connection errors

**OTP not received:**
- Check email service configuration
- Verify patient email address is correct
- Check spam folder
- Review email service logs
- For Gmail, ensure App Password is used (not regular password)

### General Issues

**Port already in use:**
Windows:
```powershell
$processId = (Get-NetTCPConnection -LocalPort 5000).OwningProcess
Stop-Process -Id $processId -Force
```

Mac/Linux:
```bash
lsof -ti:5000 | xargs kill -9
```

**Dependencies installation fails:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Reinstall: `npm install`
- Check Node.js version: `node --version` (should be v18+)

**TypeScript errors:**
- Run: `npm run build` to see all TypeScript errors
- Check `tsconfig.json` configuration
- Verify all type definitions are installed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new functionality
- Maintain test coverage above 80%
- Never commit sensitive information
- Use environment variables for configuration
- Implement proper input validation

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Quick Links

- **Deployed Frontend**: https://patient-passpo.netlify.app/
- **Deployed Backend API**: https://patientpassport-api.azurewebsites.net/api
- **Demo Video**: https://drive.google.com/drive/home

## Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.
