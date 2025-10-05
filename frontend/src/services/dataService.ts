import { apiService } from './api';

// Define types locally to avoid import issues
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

interface DashboardStats {
  totalPatients: number;
  activeHospitals: number;
  newRegistrations: number;
  systemStatus: string;
}

class DataService {
  // Dashboard data
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiService.getDashboardStats();
      return response.data || {
        totalPatients: 0,
        activeHospitals: 0,
        newRegistrations: 0,
        systemStatus: 'Unknown'
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalPatients: 0,
        activeHospitals: 0,
        newRegistrations: 0,
        systemStatus: 'Error'
      };
    }
  }

  async getRecentPatients(): Promise<Patient[]> {
    try {
      const response = await apiService.getRecentPatients();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching recent patients:', error);
      return [];
    }
  }

  async getRecentHospitals(): Promise<Hospital[]> {
    try {
      const response = await apiService.getRecentHospitals();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching recent hospitals:', error);
      return [];
    }
  }

  // Patient data
  async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await apiService.getPatients();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const response = await apiService.getPatient(id);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching patient:', error);
      return null;
    }
  }

  // Hospital data
  async getAllHospitals(): Promise<Hospital[]> {
    try {
      const response = await apiService.getHospitals();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      return [];
    }
  }

  async getHospitalById(id: string): Promise<Hospital | null> {
    try {
      const response = await apiService.getHospital(id);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching hospital:', error);
      return null;
    }
  }
}

export const dataService = new DataService();
