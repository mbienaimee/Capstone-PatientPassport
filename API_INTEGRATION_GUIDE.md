# API Integration Guide

## Overview

This document provides comprehensive information about the API integration with the deployed Patient Passport API at:
- **API Base URL**: `https://patientpassport-api.azurewebsites.net/api`
- **Swagger Documentation**: `https://patientpassport-api.azurewebsites.net/api-docs/`
- **Socket URL**: `https://patientpassport-api.azurewebsites.net`

## Configuration

### Environment Variables

The frontend is configured to use the deployed API by default. Environment variables can be set in a `.env` file in the `frontend` directory:

```env
# Production Backend URL (Azure) - Default
VITE_API_BASE_URL=https://patientpassport-api.azurewebsites.net/api

# Socket URL for WebSocket connections
VITE_SOCKET_URL=https://patientpassport-api.azurewebsites.net

# For local development, uncomment and use:
# VITE_API_BASE_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
```

### Configuration Files

#### 1. API Configuration (`frontend/src/config/api.config.ts`)

Centralized configuration file that:
- Defines all API endpoints
- Provides health check utilities
- Includes integration verification functions
- Exports constants for API URLs

#### 2. API Service (`frontend/src/services/api.ts`)

Main API service that:
- Handles all HTTP requests to the backend
- Manages authentication tokens
- Provides error handling
- Uses the configured API base URL

#### 3. Socket Service (`frontend/src/services/socketService.ts`)

WebSocket service for real-time features:
- Connects to the deployed Socket.IO server
- Handles reconnection logic
- Manages socket events

## API Endpoints

All API endpoints are prefixed with `/api`. Key endpoint categories:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/passport/:id` - Get patient passport

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create hospital
- `PUT /api/hospitals/:id` - Update hospital

### Medical Records
- `GET /api/medical-records/patient/:patientId` - Get patient medical records
- `POST /api/medical-records` - Add medical record
- `PUT /api/medical-records/:id` - Update medical record
- `DELETE /api/medical-records/:id` - Delete medical record

### Access Control
- `POST /api/access-control/request` - Create access request
- `GET /api/access-control/patient/pending` - Get pending requests
- `POST /api/access-control/respond/:id` - Respond to request
- `POST /api/access-control/emergency` - Emergency access

### Emergency Access
- `POST /api/emergency-access/request` - Request emergency access
- `GET /api/emergency-access/logs` - Get emergency access logs
- `GET /api/emergency-access/audit/:patientId` - Get patient audit

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/stats` - Get notification stats

For a complete list of endpoints, visit the [Swagger Documentation](https://patientpassport-api.azurewebsites.net/api-docs/).

## Integration Verification

### Using the API Integration Status Component

A React component is available to verify API integration:

```tsx
import ApiIntegrationStatus from './components/ApiIntegrationStatus';

// Use in your component
<ApiIntegrationStatus />
```

This component:
- Automatically verifies API connectivity on mount
- Checks API health endpoint
- Verifies Swagger documentation accessibility
- Validates configuration
- Provides detailed status reports

### Programmatic Verification

You can also verify integration programmatically:

```typescript
import { verifyApiIntegration, checkApiHealth } from './config/api.config';

// Quick health check
const health = await checkApiHealth();
console.log(health);

// Comprehensive verification
const verification = await verifyApiIntegration();
console.log(verification);
```

## Health Check Endpoints

### API Health
- **Endpoint**: `GET https://patientpassport-api.azurewebsites.net/health`
- **Purpose**: Check if the API is running and healthy
- **Response**: JSON with health status

### API Root
- **Endpoint**: `GET https://patientpassport-api.azurewebsites.net/`
- **Purpose**: Get API information and available endpoints
- **Response**: JSON with API metadata

## Authentication

### Token Management

The API uses JWT tokens for authentication:

1. **Login/Register**: Returns a token in the response
2. **Token Storage**: Stored in `localStorage` as `token`
3. **Token Usage**: Automatically included in request headers as `Authorization: Bearer <token>`
4. **Token Refresh**: Handled automatically by the API service

### Hospital Authentication

Hospitals use a separate authentication flow:
- Token stored in `localStorage` as `hospitalAuth`
- Automatically used when making API requests
- Managed by `hospitalAuthService`

## Error Handling

The API service includes comprehensive error handling:

1. **Network Errors**: Caught and reported with user-friendly messages
2. **HTTP Errors**: Status codes are checked and appropriate errors thrown
3. **401 Unauthorized**: Automatically clears auth data and redirects
4. **500 Server Errors**: Detailed error messages provided

## WebSocket Integration

Real-time features use Socket.IO:

1. **Connection**: Automatically connects when user authenticates
2. **Reconnection**: Automatic reconnection with exponential backoff
3. **Events**: 
   - `access_request` - New access request
   - `access_response` - Access request response
   - `notification` - General notifications
   - `emergency_access` - Emergency access events

## Testing Integration

### Manual Testing

1. **Check API Health**:
   ```bash
   curl https://patientpassport-api.azurewebsites.net/health
   ```

2. **View Swagger Docs**:
   Open `https://patientpassport-api.azurewebsites.net/api-docs/` in browser

3. **Test Authentication**:
   - Try logging in through the frontend
   - Check browser console for API calls
   - Verify token is stored in localStorage

### Automated Testing

Use the integration verification component or programmatic checks:

```typescript
import { verifyApiIntegration } from './config/api.config';

const result = await verifyApiIntegration();
if (result.success) {
  console.log('✅ All integration checks passed');
} else {
  console.error('❌ Some checks failed:', result.checks);
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the API has CORS configured for your frontend domain
   - Check browser console for specific CORS errors

2. **401 Unauthorized**
   - Token may have expired
   - Check if token is being sent in headers
   - Verify token format in localStorage

3. **Network Errors**
   - Check internet connection
   - Verify API URL is correct
   - Check if API is accessible (visit health endpoint)

4. **Socket Connection Issues**
   - Verify Socket.IO is enabled on the backend
   - Check WebSocket support in browser
   - Review socket service logs

### Debug Mode

Enable debug logging:

```typescript
// In api.ts, debug logs are already enabled
// Check browser console for:
// - API Request Debug
// - Response status
// - Response data
```

## Deployment Checklist

Before deploying, ensure:

- [ ] API base URL is set to deployed URL
- [ ] Socket URL is set to deployed URL
- [ ] Environment variables are configured
- [ ] Health check passes
- [ ] Swagger documentation is accessible
- [ ] Authentication flow works
- [ ] All API endpoints are accessible
- [ ] WebSocket connection works
- [ ] Error handling is working

## Support

For issues or questions:
1. Check the [Swagger Documentation](https://patientpassport-api.azurewebsites.net/api-docs/)
2. Review API health endpoint
3. Check browser console for errors
4. Use the API Integration Status component

## Version Information

- **API Version**: 1.0.0
- **Frontend Version**: See `package.json`
- **Last Updated**: 2024

