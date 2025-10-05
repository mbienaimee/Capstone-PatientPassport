// Mock database for development when MongoDB is not available
import { IUser, IPatient, IHospital } from './types';

// In-memory storage
const mockUsers: IUser[] = [];
const mockPatients: IPatient[] = [];
const mockHospitals: IHospital[] = [];

export const mockDatabase = {
  users: {
    async create(userData: Partial<IUser>): Promise<IUser> {
      const user = {
        _id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as IUser;
      mockUsers.push(user);
      return user;
    },
    
    async findById(id: string): Promise<IUser | null> {
      return mockUsers.find(user => user._id === id) || null;
    },
    
    async findByEmail(email: string): Promise<IUser | null> {
      return mockUsers.find(user => user.email === email) || null;
    },
    
    async findAll(): Promise<IUser[]> {
      return [...mockUsers];
    }
  },
  
  patients: {
    async create(patientData: Partial<IPatient>): Promise<IPatient> {
      const patient = {
        _id: `patient_${Date.now()}`,
        ...patientData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as IPatient;
      mockPatients.push(patient);
      return patient;
    },
    
    async findById(id: string): Promise<IPatient | null> {
      return mockPatients.find(patient => patient._id === id) || null;
    },
    
    async findByUserId(userId: string): Promise<IPatient | null> {
      return mockPatients.find(patient => patient.user === userId) || null;
    },
    
    async findAll(): Promise<IPatient[]> {
      return [...mockPatients];
    }
  },
  
  hospitals: {
    async create(hospitalData: Partial<IHospital>): Promise<IHospital> {
      const hospital = {
        _id: `hospital_${Date.now()}`,
        ...hospitalData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as IHospital;
      mockHospitals.push(hospital);
      return hospital;
    },
    
    async findById(id: string): Promise<IHospital | null> {
      return mockHospitals.find(hospital => hospital._id === id) || null;
    },
    
    async findAll(): Promise<IHospital[]> {
      return [...mockHospitals];
    }
  }
};

export default mockDatabase;




