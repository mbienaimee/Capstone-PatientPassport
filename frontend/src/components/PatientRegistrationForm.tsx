import React, { useState } from "react";
import { Calendar, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useNotification } from "../contexts/NotificationContext";
import { apiService, ApiError } from "../services/api";

// Define types locally to avoid import issues
interface RegistrationFormData {
  fullName: string;
  nationalId: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  contactNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  bloodType: string;
}

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: "",
    nationalId: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    contactNumber: "",
    address: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    bloodType: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'National ID is required';
    } else if (!/^\d{11,16}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'National ID must be between 11 and 16 digits';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContactRelationship.trim()) {
      newErrors.emergencyContactRelationship = 'Emergency contact relationship is required';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors below'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiService.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'patient',
        nationalId: formData.nationalId,
        dateOfBirth: formData.dateOfBirth,
        contactNumber: formData.contactNumber,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone
        },
        bloodType: formData.bloodType || undefined
      });

      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Registration Successful!',
          message: 'Your account has been created. Redirecting to your passport...'
        });
        
        // Store user data and token for immediate login
        const { user: userData, token } = response.data;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        setTimeout(() => {
          navigate('/patient-passport');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof ApiError) {
        showNotification({
          type: 'error',
          title: 'Registration Failed',
          message: error.message || 'An error occurred during registration'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Registration Failed',
          message: 'An unexpected error occurred. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="app-container bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Main Form Card */}
          <div className="form-container rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <Logo size="lg" className="justify-center mb-4" />
              <h1 className="heading-lg mb-2">
                <span className="text-green-600">
                  Create Your Patient Passport
                </span>
                <br />
                <span className="text-gray-800">Account</span>
              </h1>
              <p className="body-md text-gray-600 mt-3">
                Patient registration portal - Hospitals can register on the hospital registration page
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
              <div className="flex-1 py-3 px-6 rounded-lg font-semibold bg-white text-green-600 shadow-md">
                Patient Registration
              </div>
              <button
                onClick={() => navigate('/hospital-register')}
                className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              >
                Hospital Registration
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.fullName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* National ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  National ID
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  placeholder="e.g., 1234567890123456"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.nationalId 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.nationalId ? (
                  <p className="text-xs text-red-500 mt-1">{errors.nationalId}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    National ID must be 16 digits
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border focus:ring-2 outline-none transition-all ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border focus:ring-2 outline-none transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border focus:ring-2 outline-none transition-all ${
                      errors.dateOfBirth 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    errors.contactNumber 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street, City, State 12345"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 resize-none ${
                    errors.address 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                )}
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Emergency Contact Information
                </h3>
                
                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      errors.emergencyContactName 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-xs text-red-500 mt-1">{errors.emergencyContactName}</p>
                  )}
                </div>

                {/* Emergency Contact Relationship */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      errors.emergencyContactRelationship 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.emergencyContactRelationship && (
                    <p className="text-xs text-red-500 mt-1">{errors.emergencyContactRelationship}</p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="+1234567891"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      errors.emergencyContactPhone 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-xs text-red-500 mt-1">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>

              {/* Blood Type (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Blood Type (Optional)
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-green-200 transition-all duration-300"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl transform hover:-translate-y-1'
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Register as Patient'}
              </button>

              {/* Login Link */}
              <p className="text-center text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/patient-login"
                  className="text-green-600 font-semibold hover:text-green-700 hover:underline"
                >
                  Log In Here
                </Link>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/patient-login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign In
              </Link>
            </p>
            <Link
              to="/"
              className="block text-xs text-gray-600 hover:text-green-600"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientRegistrationForm;