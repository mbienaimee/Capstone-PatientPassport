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

  // Admin dashboard methods
  async getAdminAllPatients(): Promise<Patient[]> {
    try {
      const response = await apiService.getAllPatients();
      console.log('🔍 API Response for patients:', response);
      console.log('🔍 Patients data:', response.data?.patients);
      return response.data?.patients || [];
    } catch (error) {
      console.error('Error fetching all patients:', error);
      return [];
    }
  }

  async getAdminAllHospitals(): Promise<Hospital[]> {
    try {
      const response = await apiService.getAllHospitals();
      return response.data?.hospitals || [];
    } catch (error) {
      console.error('Error fetching all hospitals:', error);
      return [];
    }
  }

  async getAdminOverview(): Promise<any> {
    try {
      const response = await apiService.getAdminOverview();
      return response.data || {
        stats: {
          totalPatients: 0,
          totalHospitals: 0,
          totalDoctors: 0,
          pendingHospitals: 0,
          newRegistrations: 0,
          systemStatus: 'Unknown'
        },
        recentPatients: [],
        recentHospitals: []
      };
    } catch (error) {
      console.error('Error fetching admin overview:', error);
      return {
        stats: {
          totalPatients: 0,
          totalHospitals: 0,
          totalDoctors: 0,
          pendingHospitals: 0,
          newRegistrations: 0,
          systemStatus: 'Error'
        },
        recentPatients: [],
        recentHospitals: []
      };
    }
  }

  // Admin status update methods
  async updateHospitalStatus(hospitalId: string, status: 'active' | 'inactive' | 'pending') {
    try {
      console.log('🔄 Updating hospital status:', { hospitalId, status });
      const response = await apiService.updateHospitalStatus(hospitalId, status);
      console.log('✅ Hospital status update response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating hospital status:', error);
      throw error;
    }
  }

  async updatePatientStatus(patientId: string, status: 'active' | 'inactive') {
    try {
      console.log('🔄 Updating patient status:', { patientId, status });
      const response = await apiService.updatePatientStatus(patientId, status);
      console.log('✅ Patient status update response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating patient status:', error);
      throw error;
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
