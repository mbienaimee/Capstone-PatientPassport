// Define all types locally to avoid import issues
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

interface User {
  _id: string;
  id?: string; // For compatibility
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital' | 'receptionist';
}

interface AuthResponse {
  user: User;
  token: string;
}

interface LoginFormData {
  email?: string;
  nationalId?: string;
  hospitalName?: string;
  password: string;
}

interface Patient {
  id: string;
  nationalId: string;
  name: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  address: string;
  registrationDate: string;
  status: 'active' | 'inactive';
}

interface Hospital {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  adminContact: string;
}

interface MedicalCondition {
  id: string;
  name: string;
  details: string;
  diagnosed?: string;
  procedure?: string;
  status: 'active' | 'resolved' | 'chronic';
}

interface TestResult {
  id: string;
  name: string;
  date: string;
  status: 'normal' | 'critical' | 'abnormal';
  findings: string;
  doctor: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  status: 'active' | 'past';
  prescribingDoctor: string;
  datePrescribed: string;
  endDate?: string;
  startTime?: string; // Time in HH:MM format (24-hour)
  endTime?: string; // Time in HH:MM format (24-hour)
  frequency?: string;
  notes?: string;
}

interface HospitalVisit {
  id: string;
  hospital: string;
  reason: string;
  date: string;
  doctor: string;
  notes?: string;
}

class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(
    message: string,
    status: number,
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://patientpassport-api.azurewebsites.net/api';

class ApiService {
  private baseURL = API_BASE_URL;

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    // Check for hospital authentication
    const hospitalAuth = localStorage.getItem('hospitalAuth');
    let authToken = token;
    
    if (hospitalAuth) {
      try {
        const hospitalData = JSON.parse(hospitalAuth);
        authToken = hospitalData.token;
      } catch (error) {
        console.error('Error parsing hospital auth data:', error);
      }
    }

    // Debug logging
    console.log('API Request Debug:', {
      endpoint,
      url,
      hasToken: !!token,
      hasHospitalAuth: !!hospitalAuth,
      authToken: authToken ? 'Present' : 'Missing'
    });

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making request to:', url, 'with config:', config);
      const response = await fetch(url, config);
      console.log('Response status:', response.status, 'OK:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.log('Request failed with status:', response.status, 'Message:', data.message);
        // Handle authentication errors by clearing stored auth data
        if (response.status === 401 && data.message?.includes('user no longer exists')) {
          console.warn('User no longer exists, clearing authentication data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('hospitalAuth');
          // Optionally redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/hospital-login';
          }
        }
        
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data
        );
      }

      console.log('Request successful, returning data');
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0);
    }
  }

  // Auth endpoints
  async login(credentials: LoginFormData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: any): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  // Patient endpoints
  async getPatients(): Promise<ApiResponse<Patient[]>> {
    const response = await this.request<Patient[]>('/patients?limit=100'); // Changed from 1000 to 100
    return response;
  }

  async getPatient(id: string): Promise<ApiResponse<Patient>> {
    return this.request(`/patients/${id}`);
  }

  async createPatient(data: Partial<Patient>): Promise<ApiResponse<Patient>> {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id: string, data: Partial<Patient>): Promise<ApiResponse<Patient>> {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePatient(id: string): Promise<ApiResponse<void>> {
    return this.request(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Hospital endpoints
  async getHospitals(): Promise<ApiResponse<Hospital[]>> {
    return this.request('/hospitals');
  }

  async getHospital(id: string): Promise<ApiResponse<Hospital>> {
    return this.request(`/hospitals/${id}`);
  }

  async createHospital(data: Partial<Hospital>): Promise<ApiResponse<Hospital>> {
    return this.request('/hospitals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHospital(id: string, data: Partial<Hospital>): Promise<ApiResponse<Hospital>> {
    return this.request(`/hospitals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Medical endpoints
  async getMedicalConditions(patientId: string): Promise<ApiResponse<MedicalCondition[]>> {
    return this.request(`/medical/conditions/${patientId}`);
  }

  async createMedicalCondition(data: Partial<MedicalCondition>): Promise<ApiResponse<MedicalCondition>> {
    return this.request('/medical/conditions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTestResults(patientId: string): Promise<ApiResponse<TestResult[]>> {
    return this.request(`/medical/test-results/${patientId}`);
  }

  async createTestResult(data: Partial<TestResult>): Promise<ApiResponse<TestResult>> {
    return this.request('/medical/test-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMedications(patientId: string): Promise<ApiResponse<Medication[]>> {
    return this.request(`/medical/medications/${patientId}`);
  }

  async createMedication(data: Partial<Medication>): Promise<ApiResponse<Medication>> {
    return this.request('/medical/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHospitalVisits(patientId: string): Promise<ApiResponse<HospitalVisit[]>> {
    return this.request(`/medical/hospital-visits/${patientId}`);
  }

  async createHospitalVisit(data: Partial<HospitalVisit>): Promise<ApiResponse<HospitalVisit>> {
    return this.request('/medical/hospital-visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/stats');
  }

  async getRecentPatients(): Promise<ApiResponse<Patient[]>> {
    return this.request('/dashboard/recent-patients');
  }

  async getRecentHospitals(): Promise<ApiResponse<Hospital[]>> {
    return this.request('/dashboard/recent-hospitals');
  }

  // Admin dashboard endpoints
  async getAllPatients(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/admin/patients');
  }

  async getAllHospitals(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/admin/hospitals');
  }

  async getAdminOverview(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/admin/overview');
  }

  // Admin status update methods
  async updateHospitalStatus(hospitalId: string, status: 'active' | 'inactive' | 'pending'): Promise<ApiResponse<any>> {
    return this.request(`/dashboard/admin/hospitals/${hospitalId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async updatePatientStatus(patientId: string, status: 'active' | 'inactive'): Promise<ApiResponse<any>> {
    return this.request(`/dashboard/admin/patients/${patientId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Hospital-specific endpoints
  async getHospitalPatients(hospitalId: string): Promise<ApiResponse<Patient[]>> {
    return this.request<Patient[]>(`/hospitals/${hospitalId}/patients`);
  }

  // OTP Methods
  async requestOTP(identifier: string, type: 'email' | 'phone'): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseURL}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to request OTP', response.status);
    }

    return data;
  }

  async verifyOTPLogin(identifier: string, otpCode: string, type: 'email' | 'phone'): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, otpCode, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to verify OTP', response.status);
    }

    return data;
  }

  // Email verification methods
  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    return this.request(`/auth/verify-email?token=${token}`, {
      method: 'GET'
    });
  }

  async resendEmailVerification(email: string): Promise<ApiResponse<any>> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // OTP verification for registration
  async verifyRegistrationOTP(email: string, otpCode: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/verify-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode })
    });
  }

  // Medical Records Methods
  async getPatientMedicalRecords(patientId: string): Promise<ApiResponse<any>> {
    return this.request(`/medical-records/patient/${patientId}`);
  }

  async addMedicalRecord(recordData: any): Promise<ApiResponse<any>> {
    return this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(recordData)
    });
  }

  async updateMedicalRecord(recordId: string, recordData: any): Promise<ApiResponse<any>> {
    return this.request(`/medical-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData)
    });
  }

  async deleteMedicalRecord(recordId: string): Promise<ApiResponse<any>> {
    return this.request(`/medical-records/${recordId}`, {
      method: 'DELETE'
    });
  }

  // Passport Access Methods
  async requestPassportAccessOTP(patientId: string): Promise<ApiResponse<any>> {
    return this.request('/passport-access/request-otp', {
      method: 'POST',
      body: JSON.stringify({ patientId })
    });
  }

  async verifyPassportAccessOTP(patientId: string, otpCode: string): Promise<ApiResponse<any>> {
    return this.request('/passport-access/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ patientId, otpCode })
    });
  }

  async getPatientPassportWithAccess(patientId: string, accessToken: string): Promise<ApiResponse<any>> {
    return this.request(`/passport-access/patient/${patientId}/passport`, {
      method: 'GET',
      headers: {
        'X-Access-Token': accessToken
      }
    });
  }

  async updatePatientPassportWithAccess(patientId: string, accessToken: string, updateData: any): Promise<ApiResponse<any>> {
    return this.request(`/passport-access/patient/${patientId}/passport`, {
      method: 'PUT',
      headers: {
        'X-Access-Token': accessToken
      },
      body: JSON.stringify(updateData)
    });
  }

  // Patient Passport Methods
  async getPatientPassport(patientId: string): Promise<ApiResponse<any>> {
    return this.request(`/patients/passport/${patientId}`);
  }

  async updatePatientPassport(patientId: string, updateData: any): Promise<ApiResponse<any>> {
    return this.request(`/passport-access/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }
}

export const apiService = new ApiService();

// Default export for backward compatibility
export default apiService;

export { ApiError };
