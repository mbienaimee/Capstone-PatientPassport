import React, { useState } from "react";

const HospitalLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    hospitalName: "",
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

    if (!formData.hospitalName.trim()) {
      newErrors.hospitalName = "Hospital name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validateForm()) {
      console.log("Hospital login attempt:", formData);
      alert("Hospital login successful!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <svg
            className="w-6 h-6 text-green-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
          </svg>
          <h1 className="text-2xl font-bold text-green-600">PatientPassport</h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
          Hospital Login
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6">
          Welcome back! Please enter your hospital credentials.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="hospitalName"
              className="block text-xs font-medium text-gray-700 mb-1.5"
            >
              Hospital Name
            </label>
            <input
              type="text"
              id="hospitalName"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your hospital name"
              className={`w-full px-3 py-2.5 border ${
                errors.hospitalName ? "border-red-500" : "border-gray-300"
              } rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
            {errors.hospitalName && (
              <p className="mt-1 text-xs text-red-500">{errors.hospitalName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-700 mb-1.5"
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
              className={`w-full px-3 py-2.5 border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>

        <div className="mt-6 space-y-1 text-center">
          <a
            href="#"
            className="block text-xs text-gray-600 hover:text-green-600"
          >
            Forgot Password?
          </a>
          <p className="text-xs text-gray-600">Need to Register?</p>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;
