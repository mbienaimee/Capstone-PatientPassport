/**
 * API Configuration
 * Centralized configuration for API endpoints and integration settings
 */

// Deployed API Base URL
export const DEPLOYED_API_BASE_URL = 'https://patientpassport-api.azurewebsites.net/api';
export const DEPLOYED_API_URL = 'https://patientpassport-api.azurewebsites.net';
export const DEPLOYED_SWAGGER_URL = 'https://patientpassport-api.azurewebsites.net/api-docs';

// Get API base URL from environment or use deployed URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEPLOYED_API_BASE_URL;

// Get Socket URL from environment or use deployed URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || DEPLOYED_API_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REQUEST_OTP: '/auth/request-otp',
    VERIFY_OTP: '/auth/verify-otp',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    VERIFY_REGISTRATION_OTP: '/auth/verify-registration-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // Patient endpoints
  PATIENTS: {
    BASE: '/patients',
    BY_ID: (id: string) => `/patients/${id}`,
    PASSPORT: (id: string) => `/patients/passport/${id}`,
  },
  // Hospital endpoints
  HOSPITALS: {
    BASE: '/hospitals',
    BY_ID: (id: string) => `/hospitals/${id}`,
    PATIENTS: (id: string) => `/hospitals/${id}/patients`,
  },
  // Medical endpoints
  MEDICAL: {
    CONDITIONS: (patientId: string) => `/medical/conditions/${patientId}`,
    TEST_RESULTS: (patientId: string) => `/medical/test-results/${patientId}`,
    MEDICATIONS: (patientId: string) => `/medical/medications/${patientId}`,
    HOSPITAL_VISITS: (patientId: string) => `/medical/hospital-visits/${patientId}`,
  },
  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_PATIENTS: '/dashboard/recent-patients',
    RECENT_HOSPITALS: '/dashboard/recent-hospitals',
    ADMIN: {
      PATIENTS: '/dashboard/admin/patients',
      HOSPITALS: '/dashboard/admin/hospitals',
      OVERVIEW: '/dashboard/admin/overview',
      HOSPITAL_STATUS: (id: string) => `/dashboard/admin/hospitals/${id}/status`,
      PATIENT_STATUS: (id: string) => `/dashboard/admin/patients/${id}/status`,
    },
  },
  // Access Control endpoints
  ACCESS_CONTROL: {
    REQUEST: '/access-control/request',
    PATIENT_PENDING: '/access-control/patient/pending',
    DOCTOR_REQUESTS: '/access-control/doctor/requests',
    RESPOND: (id: string) => `/access-control/respond/${id}`,
    BY_ID: (id: string) => `/access-control/${id}`,
    EMERGENCY: '/access-control/emergency',
  },
  // Passport Access endpoints
  PASSPORT_ACCESS: {
    REQUEST_OTP: '/passport-access/request-otp',
    VERIFY_OTP: '/passport-access/verify-otp',
    GET_PASSPORT: (patientId: string) => `/passport-access/patient/${patientId}/passport`,
    UPDATE_PASSPORT: (patientId: string) => `/passport-access/patient/${patientId}/passport`,
  },
  // Emergency Access endpoints
  EMERGENCY_ACCESS: {
    REQUEST: '/emergency-access/request',
    LOGS: '/emergency-access/logs',
    AUDIT: (patientId: string) => `/emergency-access/audit/${patientId}`,
    MY_HISTORY: '/emergency-access/my-history',
  },
  // Medical Records endpoints
  MEDICAL_RECORDS: {
    PATIENT: (patientId: string) => `/medical-records/patient/${patientId}`,
    BASE: '/medical-records',
    BY_ID: (id: string) => `/medical-records/${id}`,
  },
  // Notifications endpoints
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id: string) => `/notifications/${id}`,
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    STATS: '/notifications/stats',
  },
  // OpenMRS Sync endpoints
  OPENMRS_SYNC: {
    SYNC_PATIENT: (nationalId: string) => `/openmrs-sync/sync-patient/${nationalId}`,
  },
  // Health check
  HEALTH: '/health',
};

/**
 * API Health Check
 * Verifies connectivity to the deployed API
 */
export const checkApiHealth = async (): Promise<{
  success: boolean;
  message: string;
  apiUrl: string;
  swaggerUrl: string;
  timestamp: string;
}> => {
  const apiUrl = API_BASE_URL;
  const swaggerUrl = DEPLOYED_SWAGGER_URL;
  
  try {
    // Check API health endpoint
    const healthResponse = await fetch(`${DEPLOYED_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const healthData = await healthResponse.json().catch(() => ({}));

    if (healthResponse.ok) {
      return {
        success: true,
        message: 'API is healthy and accessible',
        apiUrl,
        swaggerUrl,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `API health check failed: ${healthData.message || healthResponse.statusText}`,
        apiUrl,
        swaggerUrl,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      apiUrl,
      swaggerUrl,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Verify API Integration
 * Comprehensive check of API connectivity and configuration
 */
export const verifyApiIntegration = async (): Promise<{
  success: boolean;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}> => {
  const checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }> = [];

  // Check 1: API Base URL Configuration
  const apiBaseUrl = API_BASE_URL;
  if (apiBaseUrl === DEPLOYED_API_BASE_URL) {
    checks.push({
      name: 'API Base URL Configuration',
      status: 'pass',
      message: `Correctly configured to use deployed API: ${apiBaseUrl}`,
    });
  } else if (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
    checks.push({
      name: 'API Base URL Configuration',
      status: 'warning',
      message: `Using local development URL: ${apiBaseUrl}. Make sure to use deployed URL for production.`,
    });
  } else {
    checks.push({
      name: 'API Base URL Configuration',
      status: 'pass',
      message: `Using custom API URL: ${apiBaseUrl}`,
    });
  }

  // Check 2: Socket URL Configuration
  const socketUrl = SOCKET_URL;
  if (socketUrl === DEPLOYED_API_URL) {
    checks.push({
      name: 'Socket URL Configuration',
      status: 'pass',
      message: `Correctly configured to use deployed Socket URL: ${socketUrl}`,
    });
  } else {
    checks.push({
      name: 'Socket URL Configuration',
      status: 'warning',
      message: `Using custom Socket URL: ${socketUrl}`,
    });
  }

  // Check 3: API Health Endpoint
  try {
    const healthResponse = await fetch(`${DEPLOYED_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (healthResponse.ok) {
      checks.push({
        name: 'API Health Endpoint',
        status: 'pass',
        message: 'API health endpoint is accessible and responding',
      });
    } else {
      checks.push({
        name: 'API Health Endpoint',
        status: 'fail',
        message: `API health endpoint returned status: ${healthResponse.status}`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'API Health Endpoint',
      status: 'fail',
      message: `Failed to reach API health endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Check 4: Swagger Documentation
  try {
    const swaggerResponse = await fetch(DEPLOYED_SWAGGER_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
      },
    });

    if (swaggerResponse.ok) {
      checks.push({
        name: 'Swagger Documentation',
        status: 'pass',
        message: `Swagger documentation is accessible at: ${DEPLOYED_SWAGGER_URL}`,
      });
    } else {
      checks.push({
        name: 'Swagger Documentation',
        status: 'warning',
        message: `Swagger documentation returned status: ${swaggerResponse.status}`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'Swagger Documentation',
      status: 'warning',
      message: `Could not verify Swagger documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Check 5: API Root Endpoint
  try {
    const rootResponse = await fetch(DEPLOYED_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (rootResponse.ok) {
      const rootData = await rootResponse.json().catch(() => ({}));
      checks.push({
        name: 'API Root Endpoint',
        status: 'pass',
        message: 'API root endpoint is accessible',
      });
    } else {
      checks.push({
        name: 'API Root Endpoint',
        status: 'fail',
        message: `API root endpoint returned status: ${rootResponse.status}`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'API Root Endpoint',
      status: 'fail',
      message: `Failed to reach API root endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
  };

  return {
    success: summary.failed === 0,
    checks,
    summary,
  };
};

