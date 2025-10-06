import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import Logo from './Logo';
import { useNotification } from '../contexts/NotificationContext';
import { apiService, ApiError } from '../services/api';

interface OTPVerificationProps {
  email: string;
  userType: 'patient' | 'hospital';
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, userType }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtpCode(value);
      setError('');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      setError('Please enter the OTP code');
      return;
    }
    
    if (otpCode.length !== 6) {
      setError('OTP code must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.verifyRegistrationOTP(email, otpCode);
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Email Verified!',
          message: 'Your email has been verified successfully. You are now logged in.'
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
        }, 2000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      if (error instanceof ApiError) {
        setError(error.message || 'Invalid OTP code');
        showNotification({
          type: 'error',
          title: 'Verification Failed',
          message: error.message || 'Invalid OTP code. Please try again.'
        });
      } else {
        setError('An unexpected error occurred');
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'An unexpected error occurred. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    setError('');
    
    try {
      const response = await apiService.requestOTP(email, 'email');
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'OTP Resent!',
          message: 'A new OTP has been sent to your email address.'
        });
        setCountdown(60); // 60 seconds countdown
        
        // OTP will be sent via email
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Resend OTP',
        message: 'Failed to resend OTP. Please try again.'
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToRegistration = () => {
    if (userType === 'patient') {
      navigate('/patient-register');
    } else {
      navigate('/hospital-register');
    }
  };

  const handleGoToLogin = () => {
    if (userType === 'patient') {
      navigate('/patient-login');
    } else {
      navigate('/hospital-login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to your email address
          </p>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {email}
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-2">
              <label 
                htmlFor="otpCode" 
                className="block text-sm font-semibold text-gray-700"
              >
                Enter Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest font-mono ${
                    error 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {error}
                </p>
              )}
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || isResending}
                className={`text-sm flex items-center justify-center gap-2 mx-auto ${
                  countdown > 0 || isResending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-700 font-medium'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                {countdown > 0 
                  ? `Resend code in ${countdown}s` 
                  : isResending 
                    ? 'Sending...' 
                    : 'Resend code'
                }
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Verify Email</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isResending}
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors hover:underline"
                >
                  Resend Code
                </button>
              </p>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={handleBackToRegistration}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-green-600 transition-colors"
                >
                  Back to Registration
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleGoToLogin}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-green-600 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
