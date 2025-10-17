# PatientPassport Full Integration Guide

## 🚀 Complete Frontend-Backend Integration

This guide provides step-by-step instructions for setting up and testing the complete PatientPassport system with your Azure-deployed backend.

## 📋 Prerequisites

- ✅ Backend deployed on Azure: `https://patientpassport-api.azurewebsites.net`
- ✅ Frontend code updated with Azure backend URLs
- ✅ Node.js and npm installed
- ✅ Git repository cloned

## 🔧 Configuration Updates Made

### Backend Configuration
- ✅ Fixed rate limiter IP validation for Azure
- ✅ Fixed performance monitor headers issue
- ✅ Updated Swagger documentation server URLs
- ✅ Enhanced CSP for Swagger UI compatibility

### Frontend Configuration
- ✅ Updated API base URL to Azure backend
- ✅ Updated Socket.IO connection URL
- ✅ Updated Vite proxy configuration
- ✅ Updated build scripts for production

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Integration Test
```bash
node integration-test.js
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Application
- Frontend: `http://localhost:3000`
- Backend API: `https://patientpassport-api.azurewebsites.net/api`
- Swagger Docs: `https://patientpassport-api.azurewebsites.net/api-docs`

## 🧪 Testing the Integration

### Backend Health Check
```bash
curl https://patientpassport-api.azurewebsites.net/health
```

### API Endpoints Test
```bash
# Test authentication endpoint
curl -X POST https://patientpassport-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test patients endpoint
curl https://patientpassport-api.azurewebsites.net/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend-Backend Communication
1. Open browser developer tools
2. Navigate to `http://localhost:3000`
3. Check Network tab for API calls to Azure backend
4. Verify WebSocket connection in Console

## 🔐 Authentication Flow

### 1. User Registration
- Frontend: Registration form → Azure backend `/api/auth/register`
- Backend: Creates user, sends verification email
- Frontend: Handles OTP verification

### 2. User Login
- Frontend: Login form → Azure backend `/api/auth/login`
- Backend: Validates credentials, returns JWT token
- Frontend: Stores token, redirects to dashboard

### 3. Hospital Login
- Frontend: Hospital login form → Azure backend `/api/auth/hospital-login`
- Backend: Validates hospital credentials
- Frontend: Stores hospital auth, enables hospital features

## 📊 Features Integration

### Patient Management
- ✅ Create/Read/Update/Delete patients
- ✅ Patient search and filtering
- ✅ Patient status management

### Medical Records
- ✅ Medical conditions tracking
- ✅ Medication management
- ✅ Test results recording
- ✅ Hospital visit history

### Hospital Management
- ✅ Hospital registration and approval
- ✅ Hospital-specific patient access
- ✅ Hospital dashboard and statistics

### Passport Access Control
- ✅ OTP-based access requests
- ✅ Secure passport viewing
- ✅ Access logging and tracking

## 🌐 Production Deployment

### Frontend Deployment (Netlify/Vercel)
```bash
# Build for production
npm run build:prod

# Deploy to your hosting platform
# Update environment variables:
# VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
# VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net
```

### Environment Variables
Create `.env.production` file:
```env
VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net
VITE_APP_NAME=PatientPassport
VITE_APP_VERSION=1.0.0
```

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Problem**: Frontend can't access backend API
- **Solution**: Backend CORS is configured for all origins in development

#### 2. Authentication Errors
- **Problem**: 401 Unauthorized errors
- **Solution**: Check token storage and API headers

#### 3. WebSocket Connection Issues
- **Problem**: Real-time features not working
- **Solution**: Verify Socket.IO URL configuration

#### 4. Swagger Documentation Not Loading
- **Problem**: CSP blocking Swagger UI
- **Solution**: Updated CSP to allow blob URLs and inline scripts

### Debug Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test backend endpoints directly
4. Check Azure App Service logs

## 📱 Mobile Responsiveness

The frontend is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Tablet devices
- ✅ Mobile phones
- ✅ Progressive Web App (PWA) features

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Rate limiting on API endpoints
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Secure password hashing
- ✅ OTP-based access control

## 📈 Performance Optimizations

- ✅ API response caching
- ✅ Image optimization
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Database query optimization

## 🎯 Next Steps

1. **Test Complete User Journey**
   - Register as patient
   - Login and access dashboard
   - Add medical records
   - Test hospital access

2. **Deploy Frontend**
   - Choose hosting platform (Netlify/Vercel)
   - Configure custom domain
   - Set up CI/CD pipeline

3. **Monitor and Maintain**
   - Set up error tracking (Sentry)
   - Monitor API performance
   - Regular security updates

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review Azure App Service logs
3. Test individual components
4. Verify environment configuration

## 🎉 Success Indicators

Your integration is working correctly when:
- ✅ Backend health check returns success
- ✅ Swagger documentation loads properly
- ✅ Frontend can authenticate users
- ✅ API calls return expected responses
- ✅ WebSocket connections establish
- ✅ All features work end-to-end

---

**Backend URL**: https://patientpassport-api.azurewebsites.net
**Swagger Docs**: https://patientpassport-api.azurewebsites.net/api-docs
**Health Check**: https://patientpassport-api.azurewebsites.net/health
