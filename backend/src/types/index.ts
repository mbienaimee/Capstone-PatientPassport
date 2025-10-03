import { Document, Model } from 'mongoose';

// Base User Interface
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital';
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): Partial<IUser>;
}

// Patient Interface
export interface IPatient extends Document {
  _id: string;
  user: any; // Reference to User (ObjectId)
  nationalId: string;
  dateOfBirth: Date;
  contactNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bloodType?: string;
  allergies?: string[];
  medicalHistory: string[]; // References to MedicalCondition
  medications: string[]; // References to Medication
  testResults: string[]; // References to TestResult
  hospitalVisits: string[]; // References to HospitalVisit
  assignedDoctors: string[]; // References to Doctor
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  getSummary(): any;
}

// Doctor Interface
export interface IDoctor extends Document {
  _id: string;
  user: any; // Reference to User (ObjectId)
  licenseNumber: string;
  specialization: string;
  hospital: any; // Reference to Hospital (ObjectId)
  patients: string[]; // References to Patient
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getSummary(): any;
}

// Hospital Interface
export interface IHospital extends Document {
  _id: string;
  user: any; // Reference to User (ObjectId)
  name: string;
  address: string;
  contact: string;
  licenseNumber: string;
  adminContact: string;
  doctors: string[]; // References to Doctor
  patients: string[]; // References to Patient
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  getSummary(): any;
}

// Medical Condition Interface
export interface IMedicalCondition extends Document {
  _id: string;
  patient: any; // Reference to Patient (ObjectId)
  doctor: any; // Reference to Doctor (ObjectId)
  name: string;
  details: string;
  diagnosed: Date;
  procedure?: string;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Medication Interface
export interface IMedication extends Document {
  _id: string;
  patient: any; // Reference to Patient (ObjectId)
  doctor: any; // Reference to Doctor (ObjectId)
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'discontinued';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Test Result Interface
export interface ITestResult extends Document {
  _id: string;
  patient: any; // Reference to Patient (ObjectId)
  doctor: any; // Reference to Doctor (ObjectId)
  hospital: any; // Reference to Hospital (ObjectId)
  name: string;
  date: Date;
  status: 'normal' | 'critical' | 'abnormal';
  findings: string;
  notes?: string;
  attachments?: string[]; // File URLs
  createdAt: Date;
  updatedAt: Date;
}

// Hospital Visit Interface
export interface IHospitalVisit extends Document {
  _id: string;
  patient: any; // Reference to Patient (ObjectId)
  doctor: any; // Reference to Doctor (ObjectId)
  hospital: any; // Reference to Hospital (ObjectId)
  reason: string;
  date: Date;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types
export interface LoginRequest {
  email?: string;
  nationalId?: string;
  hospitalName?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital';
  nationalId?: string;
  dateOfBirth?: string;
  contactNumber?: string;
  address?: string;
  hospitalName?: string;
  adminContact?: string;
  licenseNumber?: string;
  specialization?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Partial<IUser>;
    token: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// File Upload
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Dashboard Statistics
export interface DashboardStats {
  totalPatients: number;
  totalHospitals: number;
  totalDoctors: number;
  newRegistrations: number;
  activePatients: number;
  pendingHospitals: number;
  recentActivity: any[];
}

// Search and Filter
export interface SearchQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Validation Error
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Model Interfaces with Static Methods
export interface IPatientModel extends Model<IPatient> {
  findByNationalId(nationalId: string): any;
  findActive(): any;
}

export interface IHospitalModel extends Model<IHospital> {
  findByLicenseNumber(licenseNumber: string): any;
  findPending(): any;
  findActive(): any;
}

export interface IDoctorModel extends Model<IDoctor> {
  findByLicenseNumber(licenseNumber: string): any;
  findByHospital(hospitalId: string): any;
  findActive(): any;
}

export interface IMedicalConditionModel extends Model<IMedicalCondition> {
  findByPatient(patientId: string): any;
}

export interface IMedicationModel extends Model<IMedication> {
  findByPatient(patientId: string): any;
}

export interface ITestResultModel extends Model<ITestResult> {
  findByPatient(patientId: string): any;
}

export interface IHospitalVisitModel extends Model<IHospitalVisit> {
  findByPatient(patientId: string): any;
}







