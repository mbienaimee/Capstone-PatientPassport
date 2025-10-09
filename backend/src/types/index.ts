import { Document, Model } from 'mongoose';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      apiKey?: string;
    }
  }
}

// Base User Interface
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital' | 'receptionist';
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
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
  universalId?: string; // Universal patient ID for federated access
  insuranceNumber?: string; // Insurance number for identification
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contactNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[]; // References to MedicalCondition
  currentMedications?: string[]; // Current medications
  medications: string[]; // References to Medication
  testResults: string[]; // References to TestResult
  hospitalVisits: string[]; // References to HospitalVisit
  medicalImages?: string[]; // References to medical images/files
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
  hospitalId: string; // Unique hospital identifier for federated system
  fhirEndpoint?: string; // FHIR endpoint for data exchange
  apiKey?: string; // API key for central registry communication
  doctors: string[]; // References to Doctor
  patients: string[]; // References to Patient
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  getSummary(): any;
}

// Receptionist Interface
export interface IReceptionist extends Document {
  _id: string;
  user: any; // Reference to User (ObjectId)
  employeeId: string;
  hospital: any; // Reference to Hospital (ObjectId)
  department: string;
  shift: string;
  isActive: boolean;
  permissions: {
    canAssignDoctors: boolean;
    canViewPatientRecords: boolean;
    canScheduleAppointments: boolean;
    canAccessEmergencyOverride: boolean;
  };
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
  role: 'patient' | 'doctor' | 'admin' | 'hospital' | 'receptionist';
  nationalId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contactNumber?: string;
  address?: string;
  hospitalName?: string;
  adminContact?: string;
  licenseNumber?: string;
  specialization?: string;
  employeeId?: string;
  department?: string;
  shift?: string;
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

// Federated System Types
export interface EmergencyOverride {
  _id: string;
  user: string; // Reference to User
  patient: string; // Reference to Patient
  justification: string;
  accessTime: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  _id: string;
  user: string; // Reference to User
  patient: string; // Reference to Patient
  accessType: 'regular' | 'emergency' | 'consent';
  action: 'view' | 'create' | 'update' | 'delete';
  details: string;
  accessTime: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentToken {
  _id: string;
  universalId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FederatedPatientData {
  universalId: string;
  patientName: string;
  gender: string;
  birthdate: Date;
  hospitalData: HospitalData[];
  lastUpdated: Date;
}

export interface HospitalData {
  hospitalId: string;
  hospitalName: string;
  fhirData: string;
  lastSync: Date;
  availableResources: string[];
}

export interface CentralRegistryResponse {
  success: boolean;
  message: string;
  data?: any;
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

export interface IReceptionistModel extends Model<IReceptionist> {
  findByEmployeeId(employeeId: string): any;
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







