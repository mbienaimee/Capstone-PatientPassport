# Patient Passport - Endpoint Configuration & Verification

## 🌐 Deployed URLs

### Backend (Azure Web App)
- **API Base URL**: `https://patientpassport-api.azurewebsites.net/api`
- **Socket URL**: `https://patientpassport-api.azurewebsites.net`
- **API Documentation**: `https://patientpassport-api.azurewebsites.net/api-docs/`
- **Health Check**: `https://patientpassport-api.azurewebsites.net/health`

### Frontend (Netlify)
- **Application URL**: `https://jade-pothos-e432d0.netlify.app`

## ✅ Configuration Status

### Frontend Configuration Files

All frontend configuration files are correctly pointing to the deployed backend:

#### 1. `.env` (Development & Local)
```properties
VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net
```

#### 2. `.env.production` (Production Build)
```bash
VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net
```

#### 3. `netlify.toml` (Netlify Deployment)
```toml
[build.environment]
  VITE_API_BASE_URL = "https://patientpassport-api.azurewebsites.net/api"
  VITE_SOCKET_URL = "https://patientpassport-api.azurewebsites.net"
```

#### 4. `vite.config.ts` (Build Configuration)
```typescript
define: {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
    env.VITE_API_BASE_URL || 'https://patientpassport-api.azurewebsites.net/api'
  ),
  'import.meta.env.VITE_SOCKET_URL': JSON.stringify(
    env.VITE_SOCKET_URL || 'https://patientpassport-api.azurewebsites.net'
  ),
}
```

#### 5. `frontend/src/services/api.ts` (API Service)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://patientpassport-api.azurewebsites.net/api';
```

#### 6. `frontend/src/services/socketService.ts` (Socket Service)
```typescript
this.socket = io(import.meta.env.VITE_SOCKET_URL || 'https://patientpassport-api.azurewebsites.net', {
  auth: { token: token }
});
```

## 🔗 API Endpoints Reference

### Authentication Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/logout` | POST | Logout user | Yes |
| `/api/auth/me` | GET | Get current user | Yes |
| `/api/auth/request-otp` | POST | Request OTP code | No |
| `/api/auth/verify-otp` | POST | Verify OTP for login | No |
| `/api/auth/verify-registration-otp` | POST | Verify OTP for registration | No |
| `/api/auth/verify-email` | GET | Verify email address | No |
| `/api/auth/resend-verification` | POST | Resend verification email | No |

### Patient Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/patients` | GET | Get all patients | Yes |
| `/api/patients` | POST | Create new patient | Yes (Admin/Hospital) |
| `/api/patients/:id` | GET | Get patient by ID | Yes |
| `/api/patients/:id` | PUT | Update patient | Yes |
| `/api/patients/:id` | DELETE | Delete patient | Yes (Admin) |
| `/api/patients/passport/:id` | GET | Get patient passport | Yes |
| `/api/patients/search` | GET | Search patients | Yes |

### Hospital Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/hospitals` | GET | Get all hospitals | Yes |
| `/api/hospitals` | POST | Create new hospital | Yes (Admin) |
| `/api/hospitals/:id` | GET | Get hospital by ID | Yes |
| `/api/hospitals/:id` | PUT | Update hospital | Yes |
| `/api/hospitals/:id/patients` | GET | Get hospital patients | Yes |
| `/api/hospitals/pending` | GET | Get pending hospitals | Yes (Admin) |
| `/api/hospitals/:id/approve` | POST | Approve hospital | Yes (Admin) |

### Medical Records Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/medical/conditions` | GET | Get medical conditions | Yes |
| `/api/medical/conditions` | POST | Create medical condition | Yes |
| `/api/medical/conditions/:patientId` | GET | Get patient conditions | Yes |
| `/api/medical/medications` | GET | Get medications | Yes |
| `/api/medical/medications` | POST | Create medication | Yes |
| `/api/medical/medications/:patientId` | GET | Get patient medications | Yes |
| `/api/medical/test-results` | GET | Get test results | Yes |
| `/api/medical/test-results` | POST | Create test result | Yes |
| `/api/medical/test-results/:patientId` | GET | Get patient test results | Yes |
| `/api/medical/hospital-visits` | GET | Get hospital visits | Yes |
| `/api/medical/hospital-visits` | POST | Create hospital visit | Yes |
| `/api/medical/hospital-visits/:patientId` | GET | Get patient visits | Yes |

### Medical Records Management
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/medical-records` | POST | Add medical record | Yes |
| `/api/medical-records/:id` | PUT | Update medical record | Yes |
| `/api/medical-records/:id` | DELETE | Delete medical record | Yes |
| `/api/medical-records/patient/:patientId` | GET | Get patient records | Yes |

### Passport Access Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/passport-access/request-otp` | POST | Request passport access OTP | Yes |
| `/api/passport-access/verify-otp` | POST | Verify passport access OTP | Yes |
| `/api/passport-access/patient/:patientId/passport` | GET | Get patient passport with access token | Yes + Token |
| `/api/passport-access/patient/:patientId/passport` | PUT | Update patient passport with access token | Yes + Token |
| `/api/passport-access/:patientId` | PUT | Update patient passport | Yes |

### Dashboard Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/dashboard/stats` | GET | Get dashboard statistics | Yes |
| `/api/dashboard/recent-patients` | GET | Get recent patients | Yes |
| `/api/dashboard/recent-hospitals` | GET | Get recent hospitals | Yes |
| `/api/dashboard/admin/overview` | GET | Get admin overview | Yes (Admin) |
| `/api/dashboard/admin/patients` | GET | Get all patients (admin) | Yes (Admin) |
| `/api/dashboard/admin/hospitals` | GET | Get all hospitals (admin) | Yes (Admin) |
| `/api/dashboard/admin/patients/:id/status` | PUT | Update patient status | Yes (Admin) |
| `/api/dashboard/admin/hospitals/:id/status` | PUT | Update hospital status | Yes (Admin) |

### Access Control Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/access-control/request` | POST | Create access request | Yes |
| `/api/access-control/patient/pending` | GET | Get pending requests (patient) | Yes |
| `/api/access-control/doctor/requests` | GET | Get doctor requests | Yes |
| `/api/access-control/respond/:requestId` | POST | Respond to access request | Yes |
| `/api/access-control/:requestId` | GET | Get access request details | Yes |
| `/api/access-control/emergency` | POST | Create emergency access | Yes |

### Notification Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/notifications` | GET | Get user notifications | Yes |
| `/api/notifications/:id/read` | PUT | Mark notification as read | Yes |

## 🧪 Backend Health Check

### Test Results
```json
{
  "success": true,
  "message": "PatientPassport API is running",
  "timestamp": "2025-10-20T09:44:41.628Z",
  "environment": "production",
  "version": "1.0.0"
}
```

✅ **Status**: Backend is running and healthy

## 🔍 Frontend Service Configuration

### API Service (`frontend/src/services/api.ts`)
- ✅ Correctly configured with deployed backend URL
- ✅ Proper fallback to deployed URL if env var is missing
- ✅ JWT token handling implemented
- ✅ Hospital authentication support
- ✅ Error handling and logging

### Socket Service (`frontend/src/services/socketService.ts`)
- ✅ Correctly configured with deployed Socket URL
- ✅ Proper authentication with JWT token
- ✅ Event listeners for notifications and access requests

### Hospital Auth Service (`frontend/src/services/hospitalAuthService.ts`)
- ✅ Uses API service (which is configured correctly)
- ✅ LocalStorage management for hospital auth

### Access Control Service (`frontend/src/services/accessControlService.ts`)
- ✅ Uses API service (which is configured correctly)
- ✅ All access control methods properly defined

## 📝 Configuration Checklist

- [x] Backend deployed and accessible at Azure
- [x] Frontend deployed and accessible at Netlify
- [x] API base URL configured in all environment files
- [x] Socket URL configured in all environment files
- [x] Vite config has correct fallback URLs
- [x] API service uses environment variables
- [x] Socket service uses environment variables
- [x] No hardcoded localhost URLs in components
- [x] CORS configured on backend for frontend domain
- [x] SSL/HTTPS enabled on both frontend and backend
- [x] API documentation accessible

## 🚀 Deployment Commands

### Rebuild and Deploy Frontend to Netlify
```bash
cd frontend
npm run build:netlify
# Netlify will auto-deploy on git push
```

### Verify Backend on Azure
```bash
curl https://patientpassport-api.azurewebsites.net/health
```

### Test Frontend Access
```bash
# Open in browser
https://jade-pothos-e432d0.netlify.app
```

## 🔐 Environment Variables Required

### Backend (Azure)
```env
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<your_email>
EMAIL_PASS=<your_email_password>
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://jade-pothos-e432d0.netlify.app
```

### Frontend (Netlify)
```env
VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api
VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net
VITE_APP_NAME=Patient Passport
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCKET_IO=true
```

## 🐛 Troubleshooting

### Issue: CORS Errors
**Solution**: Ensure backend has frontend URL in CORS whitelist:
```javascript
const corsOptions = {
  origin: ['https://jade-pothos-e432d0.netlify.app'],
  credentials: true
};
```

### Issue: API Not Responding
**Checklist**:
1. Check backend health endpoint
2. Verify Azure Web App is running
3. Check Azure logs for errors
4. Verify environment variables are set

### Issue: WebSocket Connection Failed
**Checklist**:
1. Verify VITE_SOCKET_URL is correct
2. Check if backend supports WebSocket
3. Verify SSL/WSS protocol
4. Check firewall/security settings

### Issue: Authentication Not Working
**Checklist**:
1. Verify JWT token is stored in localStorage
2. Check token expiration
3. Verify Authorization header is sent
4. Check backend auth middleware

## 📊 Status Summary

| Component | Status | URL |
|-----------|--------|-----|
| Backend API | ✅ Running | https://patientpassport-api.azurewebsites.net |
| API Documentation | ✅ Accessible | https://patientpassport-api.azurewebsites.net/api-docs/ |
| Frontend App | ✅ Deployed | https://jade-pothos-e432d0.netlify.app |
| Socket Connection | ✅ Configured | wss://patientpassport-api.azurewebsites.net |
| Environment Config | ✅ Correct | All files point to deployed URLs |
| HTTPS/SSL | ✅ Enabled | Both frontend and backend |

## ✅ Conclusion

**All endpoints are properly configured!** 

The frontend is correctly pointing to the deployed backend at `https://patientpassport-api.azurewebsites.net/api`, and all configuration files have been verified. The system is ready for use with the deployed URLs.

No changes are required unless you encounter specific runtime errors. If you do encounter issues, refer to the Troubleshooting section above.
