import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { LoginFormData } from '../contexts/AuthContext';
import Logo from "./Logo";
import LoadingSpinner from './ui/LoadingSpinner';

interface FormErrors {
  [key: string]: string;
}

const PatientPassportLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState<LoginFormData>({
    nationalId: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Clear any existing auth data when component mounts (patient login page)
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // If there's a doctor/hospital session active, warn and clear
        if (userData.role && userData.role !== 'patient') {
          console.warn(`⚠️ Clearing cached ${userData.role} session for patient login`);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: LoginFormData) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = "National ID is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors below'
      });
      return;
    }

    try {
      const result = await login(formData);
      
      if (result && typeof result === 'object' && result.requiresOTP) {
        // OTP verification required
        showNotification({
          type: 'info',
          title: 'OTP Verification Required',
          message: 'Please check your email for OTP code to complete login.'
        });
        
        // Redirect to OTP verification page
        navigate('/otp-login', { 
          state: { 
            email: result.email,
            userType: 'patient',
            loginData: formData
          } 
        });
      } else if (result) {
        // Login successful without OTP - redirect based on role
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = userData.name || 'User';
        
        showNotification({
          type: 'success',
          title: 'Login Successful!',
          message: `Welcome back, ${userName}!`
        });
        
        // Redirect based on user role
        if (userData.role === 'patient') {
          navigate('/patient-passport');
        } else if (userData.role === 'doctor') {
          navigate('/doctor-dashboard');
        } else if (userData.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (userData.role === 'hospital') {
          navigate('/hospital-dashboard');
        } else if (userData.role === 'receptionist') {
          navigate('/receptionist-dashboard');
        } else {
          navigate('/patient-passport'); // fallback for patients
        }
      } else {
        showNotification({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid credentials. Please try again.'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any stale authentication data on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        // Check if it's an API error
        if ('status' in error) {
          const apiError = error as any;
          console.log('API Error status:', apiError.status);
          console.log('API Error message:', apiError.message);
          
          if (apiError.status === 500) {
            errorMessage = 'Server error. Please try again later or contact support if the problem persists.';
          } else if (apiError.status === 401) {
            errorMessage = 'Invalid credentials. Please check your National ID and password.';
          } else if (apiError.status === 400) {
            errorMessage = 'Please check your input and try again.';
          } else if (apiError.status === 0) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else {
            errorMessage = apiError.message || errorMessage;
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      showNotification({
        type: 'error',
        title: 'Login Error',
        message: errorMessage
      });
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleRegister = () => {
    navigate('/patient-register');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Logo size="xl" className="justify-center mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Patient login portal - Hospital staff can access the hospital login page
          </p>
        </div>

        <div className="flex gap-2 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-xl">
          <div className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold bg-white text-green-600 shadow-md text-sm sm:text-base">
            Patient Login
          </div>
          <button
            onClick={() => navigate('/hospital-login')}
            className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-sm sm:text-base"
          >
            Hospital Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
              National ID
            </label>
            <input
              type="text"
              id="nationalId"
              name="nationalId"
              value={formData.nationalId || ''}
              onChange={handleChange}
              placeholder="Enter your National ID"
              autoComplete="username"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.nationalId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-describedby={errors.nationalId ? "nationalId-error" : undefined}
              disabled={isLoading}
            />
            {errors.nationalId && (
              <p id="nationalId-error" className="text-sm text-red-600">
                {errors.nationalId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ''}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isLoading}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            aria-label="Login to Patient Passport"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 space-y-3 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleForgotPassword}
              className="text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors"
              disabled={isLoading}
            >
              Forgot Password?
            </button>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <Link
              to="/otp-login"
              className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              Login with OTP
            </Link>
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">
              Don't have an account?
            </p>
            <button
              onClick={handleRegister}
              className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-semibold transition-colors"
              disabled={isLoading}
            >
              Register as Patient
            </button>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleBackToHome}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center space-x-1"
              disabled={isLoading}
            >
              <span>←</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPassportLogin;