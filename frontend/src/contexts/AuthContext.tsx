import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService, ApiError } from '../services/api';

// Define types locally to avoid import issues
interface User {
  _id: string;
  id?: string; // For compatibility
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital' | 'receptionist';
}

export interface LoginFormData {
  email?: string;
  nationalId?: string;
  hospitalName?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (formData: LoginFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== CHECKING AUTH ON MOUNT ===');
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('Token in localStorage:', token ? 'Present' : 'Missing');
        console.log('User in localStorage:', user ? 'Present' : 'Missing');
        
        if (token) {
          console.log('Token found, calling getCurrentUser...');
          const response = await apiService.getCurrentUser();
          console.log('getCurrentUser response:', response);
          
      if (response.success && response.data) {
        console.log('Setting user from getCurrentUser:', response.data);
        // Handle nested user structure
        const userData = response.data.user || response.data;
        console.log('Extracted user data:', userData);
        setUser(userData);
          } else {
            console.log('getCurrentUser failed, clearing localStorage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          console.log('No token found, user will remain null');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
        console.log('=== AUTH CHECK COMPLETE ===');
      }
    };

    checkAuth();
  }, []);

  const login = async (formData: LoginFormData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('=== AUTH CONTEXT LOGIN START ===');
      console.log('Attempting login with:', { email: formData.email, role: 'checking...' });
      const response = await apiService.login(formData);
      console.log('Login response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        console.log('Login successful, user data:', userData);
        console.log('Token received:', token ? 'Present' : 'Missing');
        console.log('User role:', userData.role);
        
        console.log('Setting user in context...');
        setUser(userData);
        
        console.log('Storing in localStorage...');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        console.log('Verifying storage...');
        console.log('Token stored in localStorage:', localStorage.getItem('token') ? 'Yes' : 'No');
        console.log('User stored in localStorage:', localStorage.getItem('user') ? 'Yes' : 'No');
        
        console.log('=== AUTH CONTEXT LOGIN SUCCESS ===');
        return true;
      }
      console.log('Login failed - no success or data:', response);
      console.log('=== AUTH CONTEXT LOGIN FAILED ===');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.status);
      }
      console.log('=== AUTH CONTEXT LOGIN ERROR ===');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
