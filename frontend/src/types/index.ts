// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// API Error Types
export class ApiError extends Error {
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

// User Types
export interface User {
  _id: string;
  id?: string; // For compatibility
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital' | 'receptionist';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

// Auth Response Types
export interface AuthResponse {
  user: User;
  token: string;
}

// Form Types
export interface LoginFormData {
  email?: string;
  nationalId?: string;
  hospitalName?: string;
  password: string;
}

export interface RegistrationFormData {
  fullName: string;
  nationalId: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
}

export interface HospitalRegistrationFormData {
  hospitalName: string;
  adminContact: string;
  password: string;
  confirmPassword: string;
}

// Error Types
export interface FormErrors {
  [key: string]: string;
}

// Patient Types
export interface Patient {
  id: string;
  nationalId: string;
  name: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  address: string;
  registrationDate: string;
  status: 'active' | 'inactive';
  medicalHistory?: MedicalCondition[];
  medications?: Medication[];
  testResults?: TestResult[];
  hospitalVisits?: HospitalVisit[];
}

// Medical Types
export interface MedicalCondition {
  id: string;
  name: string;
  details: string;
  diagnosed?: string;
  procedure?: string;
  status: 'active' | 'resolved' | 'chronic';
}

export interface Medication {
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

export interface TestResult {
  id: string;
  name: string;
  date: string;
  status: 'normal' | 'critical' | 'abnormal';
  findings: string;
  doctor: string;
}

export interface HospitalVisit {
  id: string;
  hospital: string;
  reason: string;
  date: string;
  doctor: string;
  notes?: string;
}

// Hospital Types
export interface Hospital {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  adminContact: string;
  registrationDate: string;
}

// Navigation Types
export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalPatients: number;
  activeHospitals: number;
  newRegistrations: number;
  systemStatus: string;
}

// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TrendData {
  month: string;
  registrations: number;
}