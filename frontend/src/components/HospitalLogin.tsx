import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const HospitalLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

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
        const userName = userData.name || 'Hospital Admin';
        
        showNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${userName}! Redirecting to dashboard...`
        });
        
        setTimeout(() => {
          // Redirect based on user role
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          if (userData.role === 'admin') {
            navigate('/admin-dashboard');
          } else if (userData.role === 'hospital') {
            navigate('/hospital-dashboard');
          } else {
            navigate('/hospital-dashboard'); // fallback
          }
        }, 1500);
      } else {
        showNotification({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid credentials. Please try again.'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification({
        type: 'error',
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset functionality would be implemented here');
  };

  const handleRegister = () => {
    navigate('/hospital-register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg 
              className="w-10 h-10 text-green-600" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-1.05-6.5-4.73-6.5-8.5V8.29L12 4.65l6.5 3.64V11.5c0 3.77-2.64 7.45-6.5 8.5z"/>
              <path d="M11 7h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            <h1 className="text-4xl font-bold text-green-600" style={{ fontStyle: 'italic' }}>
              PatientPassport
            </h1>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-12 max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
            Hospital Login
          </h2>
          
          <p className="text-center text-gray-600 mb-8">
            Welcome back! Please enter your hospital credentials.
          </p>

          <div className="space-y-6">
            {/* Hospital Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Hospital Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your hospital email"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Login
            </button>

            {/* Links */}
            <div className="text-center space-y-2">
              <button
                onClick={handleForgotPassword}
                className="block w-full text-gray-600 hover:text-green-600 transition-colors text-sm"
              >
                Forgot Password?
              </button>
              <button
                onClick={handleRegister}
                className="block w-full text-gray-600 hover:text-green-600 transition-colors text-sm"
              >
                Need to Register?
              </button>
              <button
                onClick={() => navigate('/verify-email')}
                className="block w-full text-blue-600 hover:text-blue-700 transition-colors text-sm mt-2"
              >
                Resend Verification
              </button>
              <button
                onClick={() => navigate('/')}
                className="block w-full text-gray-500 hover:text-green-600 transition-colors text-sm mt-4"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;