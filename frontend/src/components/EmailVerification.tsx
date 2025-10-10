import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import { useNotification } from '../contexts/NotificationContext';
import { apiService, ApiError } from '../services/api';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationStatus('error');
      setMessage('No verification token provided');
      setIsVerifying(false);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await apiService.request(`/auth/verify-email?token=${verificationToken}`, {
        method: 'GET'
      });

      if (response.success) {
        setVerificationStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        showNotification({
          type: 'success',
          title: 'Email Verified!',
          message: 'Your email has been verified. You can now log in to your account.'
        });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      if (error instanceof ApiError) {
        setMessage(error.message || 'Email verification failed');
      } else {
        setMessage('An unexpected error occurred during verification');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      showNotification({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter your email address'
      });
      return;
    }

    setIsResending(true);
    
    try {
      const response = await apiService.request('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Verification Email Sent!',
          message: 'Please check your email for the verification link.'
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      if (error instanceof ApiError) {
        showNotification({
          type: 'error',
          title: 'Failed to Resend',
          message: error.message || 'Failed to resend verification email'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'An unexpected error occurred'
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/patient-login');
  };

  const handleGoToHospitalLogin = () => {
    navigate('/hospital-login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Verification
          </h1>
          <p className="text-gray-600">
            Verify your email address to complete your registration
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {isVerifying ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          ) : (
            <div className="text-center">
              {verificationStatus === 'success' && (
                <div className="mb-6">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Email Verified!
                  </h2>
                  <p className="text-gray-600 mb-6">{message}</p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleGoToLogin}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Go to Patient Login
                    </button>
                    
                    <button
                      onClick={handleGoToHospitalLogin}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Go to Hospital Login
                    </button>
                  </div>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="mb-6">
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-gray-600 mb-6">{message}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter your email to resend verification
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center space-y-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;














