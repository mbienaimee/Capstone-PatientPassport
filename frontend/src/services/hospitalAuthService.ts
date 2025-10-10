// Hospital Authentication Service
import { apiService } from './api';

interface HospitalAuthData {
  token: string;
  hospital: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

class HospitalAuthService {
  private readonly STORAGE_KEY = 'hospitalAuth';

  // Store hospital authentication data
  storeAuth(authData: HospitalAuthData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
  }

  // Get stored hospital authentication data
  getAuth(): HospitalAuthData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing hospital auth data:', error);
      return null;
    }
  }

  // Clear hospital authentication data
  clearAuth(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Check if hospital is authenticated
  isAuthenticated(): boolean {
    const auth = this.getAuth();
    return !!(auth && auth.token);
  }

  // Get current hospital token
  getToken(): string | null {
    const auth = this.getAuth();
    return auth?.token || null;
  }

  // Get current hospital data (alias for getHospital)
  getHospitalAuthData(): HospitalAuthData['hospital'] | null {
    return this.getHospital();
  }

  // Get current hospital data
  getHospital(): HospitalAuthData['hospital'] | null {
    const auth = this.getAuth();
    return auth?.hospital || null;
  }

  // Login hospital
  async login(credentials: { email: string; password: string }): Promise<HospitalAuthData> {
    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        const authData: HospitalAuthData = {
          token: response.data.token,
          hospital: response.data.user
        };
        
        this.storeAuth(authData);
        return authData;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Hospital login error:', error);
      throw error;
    }
  }

  // Logout hospital
  logout(): void {
    this.clearAuth();
  }
}

export const hospitalAuthService = new HospitalAuthService();
