import React, { useState } from "react";
import { Calendar, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PatientRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"patient" | "hospital">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    // Navigate to login page after successful registration
    navigate('/patient-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-green-600">
                  Create Your Patient Passport
                </span>
                <br />
                <span className="text-gray-800">Account</span>
              </h1>
              <p className="text-gray-600 mt-3">
                Join Patient Passport to manage your medical records securely
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("patient")}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "patient"
                    ? "bg-white text-green-600 shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Patient Registration
              </button>
              <button
                onClick={() => setActiveTab("hospital")}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "hospital"
                    ? "bg-white text-green-600 shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
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
                  placeholder="e.g., 1234567890"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
                <p className="text-xs text-red-500 mt-1">
                  National ID must be 16 digits
                </p>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
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
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
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
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
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
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Register as Patient
              </button>

              {/* Login Link */}
              <p className="text-center text-gray-600 text-sm">
                Already have an account?{" "}
                <a
                  href="#"
                  className="text-green-600 font-semibold hover:text-green-700 hover:underline"
                >
                  Log In Here
                </a>
              </p>
            </div>
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
  );
};

export default PatientRegistrationForm;