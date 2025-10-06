import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Logo from './Logo';
import { useNotification } from '../contexts/NotificationContext';
import { apiService } from '../services/api';

interface OTPFormData {
  identifier: string;
  type: 'email' | 'phone';
  otpCode: string;
}

const OTPLogin: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState<OTPFormData>({
    identifier: '',
    type: 'email',
    otpCode: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateRequestForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (formData.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email address';
    } else if (formData.type === 'phone' && !/^\+?[\d\s-()]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTPForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.otpCode.trim()) {
      newErrors.otpCode = 'OTP code is required';
    } else if (!/^\d{6}$/.test(formData.otpCode)) {
      newErrors.otpCode = 'OTP code must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequestForm()) return;

    setIsLoading(true);
    try {
      const response = await apiService.requestOTP(formData.identifier, formData.type);
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'OTP Sent!',
          message: `OTP sent to your ${formData.type}`
        });
        
        setStep('verify');
        setCountdown(60); // 60 seconds countdown
      }
    } catch (error: any) {
      console.error('OTP request error:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Send OTP',
        message: error.message || 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateOTPForm()) return;

    setIsLoading(true);
    try {
      const response = await apiService.verifyOTPLogin(
        formData.identifier, 
        formData.otpCode, 
        formData.type
      );
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Login Successful!',
          message: 'Welcome back! Redirecting to your passport...'
        });
        
        // Store user data and token
        const { user: userData, token } = response.data!;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        // Redirect based on user role
        setTimeout(() => {
          if (userData.role === 'patient') {
            navigate('/patient-passport');
          } else if (userData.role === 'hospital') {
            navigate('/hospital-dashboard');
          } else if (userData.role === 'doctor') {
            navigate('/doctor-dashboard');
          } else if (userData.role === 'receptionist') {
            navigate('/receptionist-dashboard');
          } else if (userData.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/patient-passport'); // Default fallback
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showNotification({
        type: 'error',
        title: 'Verification Failed',
        message: error.message || 'Invalid OTP. Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.requestOTP(formData.identifier, formData.type);
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'OTP Resent!',
          message: `New OTP sent to your ${formData.type}`
        });
        setCountdown(60);
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Resend OTP',
        message: error.message || 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'verify') {
      setStep('request');
      setFormData(prev => ({ ...prev, otpCode: '' }));
      setErrors({});
    } else {
      navigate('/patient-login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {step === 'request' ? 'OTP Login' : 'Verify OTP'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'request' 
              ? 'Enter your email or phone number to receive OTP' 
              : 'Enter the 6-digit code sent to your ' + formData.type
            }
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'request' ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Login Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'email' }))}
                    className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      formData.type === 'email'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'phone' }))}
                    className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      formData.type === 'phone'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Phone
                  </button>
                </div>
              </div>

              {/* Identifier Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.type === 'email' ? 'Email Address' : 'Phone Number'} *
                </label>
                <input
                  type={formData.type === 'email' ? 'email' : 'tel'}
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder={formData.type === 'email' ? 'john@example.com' : '+1234567890'}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    errors.identifier 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.identifier && (
                  <p className="text-xs text-red-500 mt-1">{errors.identifier}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl transform hover:-translate-y-1'
                }`}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter 6-digit OTP Code *
                </label>
                <input
                  type="text"
                  name="otpCode"
                  value={formData.otpCode}
                  onChange={handleInputChange}
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 text-center text-2xl tracking-widest ${
                    errors.otpCode 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.otpCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.otpCode}</p>
                )}
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className={`text-sm ${
                    countdown > 0 || isLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-green-600 hover:text-green-700 font-medium'
                  }`}
                >
                  {countdown > 0 
                    ? `Resend OTP in ${countdown}s` 
                    : 'Resend OTP'
                  }
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl transform hover:-translate-y-1'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}

          {/* Alternative Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Prefer password login?{' '}
              <button
                onClick={() => navigate('/patient-login')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Use Password Instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;





