import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Logo from "./Logo";
import LoadingSpinner from './ui/LoadingSpinner';

const HospitalLogin = () => {
  const navigate = useNavigate();
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const hasRedirected = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in as staff (hospital, doctor, admin, receptionist)
  useEffect(() => {
    const staffRoles = ['hospital', 'doctor', 'admin', 'receptionist'];
    if (isAuthenticated && user && staffRoles.includes(user.role) && !hasRedirected.current) {
      console.log(`✅ ${user.role} user already logged in, redirecting to dashboard`);
      hasRedirected.current = true;
      
      // Redirect to appropriate dashboard based on role
      if (user.role === 'hospital') {
        navigate('/hospital-dashboard', { replace: true });
      } else if (user.role === 'doctor') {
        navigate('/doctor-dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'receptionist') {
        navigate('/receptionist-dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: ''
    };

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      
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
            userType: 'hospital',
            loginData: formData
          } 
        });
      } else if (result) {
        // Login successful without OTP
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = userData.name || 'User';
        const roleTitle = userData.role === 'hospital' ? 'Hospital Admin' : 
                         userData.role === 'doctor' ? 'Doctor' :
                         userData.role === 'admin' ? 'Administrator' :
                         userData.role === 'receptionist' ? 'Receptionist' : 'Staff';
        
        showNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${userName}! (${roleTitle})`
        });
        
        // Redirect based on user role
        if (userData.role === 'patient') {
          navigate('/patient-passport', { replace: true });
        } else if (userData.role === 'doctor') {
          navigate('/doctor-dashboard', { replace: true });
        } else if (userData.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (userData.role === 'hospital') {
          navigate('/hospital-dashboard', { replace: true });
        } else if (userData.role === 'receptionist') {
          navigate('/receptionist-dashboard', { replace: true });
        } else {
          navigate('/hospital-dashboard', { replace: true }); // fallback
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
          
          if (apiError.status === 500) {
            errorMessage = 'Server error. Please try again later or contact support if the problem persists.';
          } else if (apiError.status === 401) {
            errorMessage = 'Invalid credentials. Please check your email and password.';
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
    navigate('/hospital-register');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Show loading spinner while checking auth or redirecting
  const staffRoles = ['hospital', 'doctor', 'admin', 'receptionist'];
  if (isLoading || (isAuthenticated && user && staffRoles.includes(user.role))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Checking authentication..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Logo size="xl" className="justify-center mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Hospital Login
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Access portal for hospital staff, doctors, and administrators
          </p>
        </div>

        <div className="flex gap-2 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => navigate('/patient-login')}
            className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-sm sm:text-base"
          >
            Patient Login
          </button>
          <div className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold bg-white text-green-600 shadow-md text-sm sm:text-base">
            Hospital Login
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="username"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isLoading}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600">
                {errors.email}
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
              value={formData.password}
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
            aria-label="Login to Hospital Dashboard"
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
            <button
              onClick={() => navigate('/verify-email')}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors"
              disabled={isLoading}
            >
              Resend Verification
            </button>
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
              Register Hospital
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

export default HospitalLogin;