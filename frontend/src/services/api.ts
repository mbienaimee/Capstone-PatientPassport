// Define all types locally to avoid import issues
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL = API_BASE_URL;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data
        );
      }

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
    return this.request('/patients');
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
}

export const apiService = new ApiService();

export { ApiError };
