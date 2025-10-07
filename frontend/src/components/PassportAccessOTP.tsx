import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { apiService, ApiError } from '../services/api';

interface PassportAccessOTPProps {
  patientId: string;
  patientName: string;
  patientEmail: string;
  onSuccess: (accessToken: string) => void;
  onCancel: () => void;
}

const PassportAccessOTP: React.FC<PassportAccessOTPProps> = ({
  patientId,
  patientName,
  patientEmail,
  onSuccess,
  onCancel
}) => {
  const { showNotification } = useNotification();
  
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);

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

  const handleRequestOTP = async () => {
    if (countdown > 0) return;
    
    setIsRequestingOTP(true);
    setError('');
    
    try {
      const response = await apiService.requestPassportAccessOTP(patientId);
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'OTP Sent!',
          message: `OTP has been sent to ${patientName}'s email. Please ask them to share the code with you.`
        });
        setCountdown(60); // 60 seconds countdown
      }
    } catch (error) {
      console.error('Request OTP error:', error);
      if (error instanceof ApiError) {
        setError(error.message || 'Failed to send OTP');
        showNotification({
          type: 'error',
          title: 'Failed to Send OTP',
          message: error.message || 'Failed to send OTP. Please try again.'
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
      setIsRequestingOTP(false);
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
      const response = await apiService.verifyPassportAccessOTP(patientId, otpCode);
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Access Granted!',
          message: `You now have access to ${patientName}'s Patient Passport for 1 hour.`
        });
        
        // Call success callback with access token
        onSuccess(response.data.accessToken);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Patient Passport Access</h2>
                <p className="text-green-100 text-sm">Enter OTP from patient</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-green-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Patient Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Name:</strong> {patientName}</p>
              <p><strong>Email:</strong> {patientEmail}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Instructions</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>An OTP has been sent to the patient's email</li>
              <li>Ask the patient to share the 6-digit code with you</li>
              <li>Enter the code below to access their passport</li>
              <li>Access will be valid for 1 hour</li>
            </ol>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-2">
              <label 
                htmlFor="otpCode" 
                className="block text-sm font-semibold text-gray-700"
              >
                Enter OTP Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showOTP ? "text" : "password"}
                  id="otpCode"
                  value={otpCode}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-12 py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest font-mono ${
                    error 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowOTP(!showOTP)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showOTP ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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
                onClick={handleRequestOTP}
                disabled={countdown > 0 || isRequestingOTP}
                className={`text-sm flex items-center justify-center gap-2 mx-auto ${
                  countdown > 0 || isRequestingOTP
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-700 font-medium'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRequestingOTP ? 'animate-spin' : ''}`} />
                {countdown > 0 
                  ? `Resend code in ${countdown}s` 
                  : isRequestingOTP 
                    ? 'Sending...' 
                    : 'Resend OTP'
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
                  <span>Access Patient Passport</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code? Ask the patient to check their email or{' '}
                <button
                  onClick={handleRequestOTP}
                  disabled={countdown > 0 || isRequestingOTP}
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors hover:underline"
                >
                  resend OTP
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportAccessOTP;

