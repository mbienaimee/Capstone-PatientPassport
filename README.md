# Patient Passport System

A comprehensive digital healthcare platform that enables secure management of patient medical records, doctor-patient interactions, and hospital workflows with advanced access control and real-time communication.

## Overview

The Patient Passport System is a modern, secure, and scalable healthcare management platform built with cutting-edge technologies. It provides a unified interface for patients, doctors, hospitals, and administrators to manage medical records, appointments, and healthcare workflows efficiently.

## Key Features

### Patient Management
- **Digital Patient Profiles**: Comprehensive patient information management
- **Medical Records**: Secure storage and retrieval of medical history
- **Passport Access Control**: Granular permissions for medical record access
- **OTP Verification**: Multi-factor authentication for enhanced security
- **Real-time Notifications**: Instant updates on medical record access

### Doctor Dashboard
- **Patient List Management**: View and manage assigned patients
- **Medical Record Access**: Secure access to patient medical histories
- **Passport Request System**: Request access to patient records with OTP verification
- **Real-time Updates**: Live notifications and status updates
- **Responsive Interface**: Optimized for desktop and mobile devices

### Hospital Management
- **Multi-hospital Support**: Manage multiple hospital locations
- **Doctor Management**: Add, edit, and manage doctor profiles
- **Patient Registration**: Streamlined patient onboarding process
- **Access Control**: Comprehensive permission management system
- **Analytics Dashboard**: Real-time insights and reporting

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions for different user types
- **OTP Verification**: Two-factor authentication for sensitive operations
- **Audit Logging**: Comprehensive logging of all system activities
- **Data Encryption**: End-to-end encryption for sensitive medical data

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe development
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **Socket.io**: Real-time communication
- **Nodemailer**: Email service integration
- **Swagger**: API documentation

### Frontend
- **React**: User interface library
- **TypeScript**: Type-safe development
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API requests

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Docker**: Containerization
- **Git**: Version control

## Project Structure

```
PatientPassport/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── docs/               # API documentation
│   ├── scripts/            # Utility scripts
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript type definitions
│   └── package.json        # Frontend dependencies
└── openmrs-modules/        # OpenMRS integration modules
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PatientPassport/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database Configuration
   MONGODB_URI=your-mongodb-connection-string
   
   # JWT Configuration
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## API Documentation

The API documentation is available at `http://localhost:5000/api-docs` when the backend server is running. The documentation includes:

- Authentication endpoints
- Patient management APIs
- Doctor management APIs
- Hospital management APIs
- Medical record APIs
- Access control APIs

## User Roles & Permissions

### Patient
- View personal medical records
- Grant/revoke access to doctors
- Receive notifications about record access
- Update personal information

### Doctor
- View assigned patients
- Request access to patient records
- Update patient medical information
- Receive real-time notifications

### Hospital Admin
- Manage hospital information
- Add/edit doctor profiles
- View hospital analytics
- Manage patient registrations

### System Admin
- Full system access
- User management
- System configuration
- Audit log access

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- OTP verification for sensitive operations
- Session management with secure cookies

### Data Protection
- End-to-end encryption for sensitive data
- Secure password hashing with bcrypt
- Input validation and sanitization
- Rate limiting to prevent abuse

### Audit & Compliance
- Comprehensive audit logging
- Data access tracking
- Compliance with healthcare data standards
- Regular security updates

## Deployment

### Production Deployment

1. **Environment Setup**
   - Configure production environment variables
   - Set up MongoDB Atlas cluster
   - Configure email service (SendGrid recommended)

2. **Backend Deployment**
   ```bash
   npm run build
   npm start
   ```

3. **Frontend Deployment**
   ```bash
   npm run build
   # Deploy dist/ folder to your hosting service
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for functions
- Use meaningful variable and function names

### Testing
- Write unit tests for business logic
- Test API endpoints
- Test React components
- Maintain test coverage above 80%

### Security
- Never commit sensitive information
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines

## Support & Documentation

- **API Documentation**: Available at `/api-docs` endpoint
- **Component Documentation**: Inline JSDoc comments
- **Database Schema**: MongoDB models in `backend/src/models/`
- **Type Definitions**: TypeScript interfaces in `types/` directories

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions, support, or contributions, please contact the development team or create an issue in the repository.

---

**Patient Passport System** - Empowering healthcare through secure, efficient, and user-friendly digital solutions.