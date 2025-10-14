import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { X, Eye, EyeOff } from 'lucide-react';
import OTPVerification from './OTPVerification';

interface DoctorLoginProps {
  doctor: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    licenseNumber: string;
    specialization: string;
  };
  onClose: () => void;
}

const DoctorLogin: React.FC<DoctorLoginProps> = ({ doctor, onClose }) => {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your password'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Login as doctor using email and password
      const result = await login({
        email: doctor.user.email,
        password: password
      });
      
      if (result.success) {
        if (result.requiresOTP) {
          // Show OTP verification modal for doctors
          setShowOTPVerification(true);
        } else {
          // Login completed successfully (shouldn't happen for doctors)
          showNotification({
            type: 'success',
            title: 'Login Successful',
            message: `Welcome Dr. ${doctor.user.name}! Redirecting to patient list...`
          });
          
          // Close the modal and redirect to doctor dashboard
          onClose();
          
          // Redirect to doctor dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/doctor-dashboard';
          }, 1500);
        }
      } else {
        showNotification({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid password. Please try again.'
        });
      }
    } catch (error) {
      console.error('Doctor login error:', error);
      showNotification({
        type: 'error',
        title: 'Login Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (data: any) => {
    showNotification({
      type: 'success',
      title: 'Login Successful',
      message: `Welcome Dr. ${doctor.user.name}! Redirecting to doctor dashboard...`
    });
    
    // Close the modal and redirect to doctor dashboard
    onClose();
    
    // Redirect to doctor dashboard after a short delay
    setTimeout(() => {
      window.location.href = '/doctor-dashboard';
    }, 1500);
  };

  const handleOTPCancel = () => {
    setShowOTPVerification(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Doctor Login</h2>
              <p className="text-sm text-gray-600">Enter your password to access patient records</p>
              <p className="text-xs text-green-600 mt-1">🔐 You'll be redirected to the doctor dashboard to view patients</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Doctor Info */}
          <div className="p-6 bg-green-50 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-semibold text-lg">
                  {doctor.user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dr. {doctor.user.name}</h3>
                <p className="text-sm text-gray-600">{doctor.specialization}</p>
                <p className="text-xs text-gray-500">License: {doctor.licenseNumber}</p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPVerification && (
        <OTPVerification
          email={doctor.user.email}
          type="login"
          onSuccess={handleOTPSuccess}
          onCancel={handleOTPCancel}
          title="Complete Login"
          subtitle="Enter OTP code to complete login"
        />
      )}
    </>
  );
};

export default DoctorLogin;