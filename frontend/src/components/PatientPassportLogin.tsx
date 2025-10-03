import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const success = await login(formData);
      
      if (success) {
        showNotification({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome back! Redirecting to patient dashboard...'
        });
        
        setTimeout(() => {
          navigate('/patient-passport');
        }, 1500);
      } else {
        showNotification({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid credentials. Please try again.'
        });
      }
    } catch {
      showNotification({
        type: 'error',
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const handleForgotPassword = () => {
    showNotification({
      type: 'info',
      title: 'Password Reset',
      message: 'Password reset functionality will be implemented soon.'
    });
  };

  const handleRegister = () => {
    navigate('/patient-register');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="form-container w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="xl" className="justify-center mb-4" />
          <h2 className="heading-md text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="body-sm text-gray-600">
            Patient login portal - Hospital staff can access the hospital login page
          </p>
        </div>

        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
          <div className="flex-1 py-3 px-4 rounded-lg font-semibold bg-white text-green-600 shadow-md">
            Patient Login
          </div>
          <button
            onClick={() => navigate('/hospital-login')}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          >
            Hospital Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="form-group">
            <label htmlFor="nationalId" className="form-label">
              National ID
            </label>
            <input
              type="text"
              id="nationalId"
              name="nationalId"
              value={formData.nationalId || ''}
              onChange={handleChange}
              placeholder="Enter your National ID"
              className={`form-input ${errors.nationalId ? 'form-input-error' : ''}`}
              aria-describedby={errors.nationalId ? "nationalId-error" : undefined}
              disabled={isLoading}
            />
            {errors.nationalId && (
              <p id="nationalId-error" className="mt-2 text-sm text-red-600">
                {errors.nationalId}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ''}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isLoading}
            />
            {errors.password && (
              <p id="password-error" className="mt-2 text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Login to Patient Passport"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-8 space-y-3 text-center">
          <button
            onClick={handleForgotPassword}
            className="block w-full text-sm text-gray-600 hover:text-green-600 transition-colors"
            disabled={isLoading}
          >
            Forgot Password?
          </button>
          
          <div className="flex items-center justify-center space-x-4 text-sm">
            <button
              onClick={handleRegister}
              className="text-gray-600 hover:text-green-600 transition-colors"
              disabled={isLoading}
            >
              Need to Register?
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleBackToHome}
              className="text-gray-600 hover:text-green-600 transition-colors"
              disabled={isLoading}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPassportLogin;