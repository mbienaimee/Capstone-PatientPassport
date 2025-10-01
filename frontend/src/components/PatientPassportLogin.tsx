import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const PatientPassportLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<"patient" | "hospital">("patient");
  const [formData, setFormData] = useState({
    nationalId: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = "National ID is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validateForm()) {
      console.log("Login attempt:", { loginType, ...formData });
      // Navigate based on login type
      if (loginType === "patient") {
        navigate('/patient-passport');
      } else {
        navigate('/admin-dashboard');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="app-container bg-gray-50 flex items-center justify-center">
      <div className="form-container w-full max-w-md">
        <h2 className="heading-md text-gray-800 text-center mb-2">
          Welcome Back
        </h2>
        <p className="body-sm text-gray-600 text-center mb-6">
          Choose your login type to access Patient Passport.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginType("patient")}
            className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-colors duration-200 ${
              loginType === "patient"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Patient Login
          </button>
          <button
            onClick={() => setLoginType("hospital")}
            className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-colors duration-200 ${
              loginType === "hospital"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Hospital Login
          </button>
        </div>

        <div className="space-y-4">
          <div className="form-group">
            <label
              htmlFor="nationalId"
              className="form-label"
            >
              National ID
            </label>
            <input
              type="text"
              id="nationalId"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your National ID"
              className={`form-input ${
                errors.nationalId ? "border-red-500" : ""
              }`}
            />
            {errors.nationalId && (
              <p className="mt-1 text-sm text-red-500">{errors.nationalId}</p>
            )}
          </div>

          <div className="form-group">
            <label
              htmlFor="password"
              className="form-label"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className={`form-input ${
                errors.password ? "border-red-500" : ""
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>

        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/patient-register"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Register
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

export default PatientPassportLogin;