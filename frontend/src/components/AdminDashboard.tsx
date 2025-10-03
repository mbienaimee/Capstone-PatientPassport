import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Logo from "./Logo";

interface Registration {
  id: string;
  facilityType: "Hospital" | "Clinic";
  name: string;
  admin: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "Admin Dashboard" | "Hospitals" | "Patients" | "Activity Status"
  >("Admin Dashboard");

  const registrations: Registration[] = [
    {
      id: "HOS321-CA",
      facilityType: "Hospital",
      name: "Anya Johnson",
      admin: "Dr. Emily White",
    },
    {
      id: "SAN567-ID",
      facilityType: "Hospital",
      name: "Bob Williams",
      admin: "Dr. Michael Brown",
    },
    {
      id: "SAN789-AZ",
      facilityType: "Hospital",
      name: "Guy Hansen",
      admin: "Dr. Sarah Kim",
    },
    {
      id: "SHA456-PA",
      facilityType: "Clinic",
      name: "Charles Davis",
      admin: "Dr. Michael Brown",
    },
    {
      id: "SHA456-FL",
      facilityType: "Clinic",
      name: "Diana Miller",
      admin: "Dr. Emily White",
    },
  ];

  const trendData = [
    { month: "Jan", registrations: 45 },
    { month: "Feb", registrations: 52 },
    { month: "Mar", registrations: 48 },
    { month: "Apr", registrations: 61 },
    { month: "May", registrations: 55 },
    { month: "Jun", registrations: 67 },
    { month: "Jul", registrations: 72 },
    { month: "Aug", registrations: 68 },
    { month: "Sep", registrations: 75 },
    { month: "Oct", registrations: 82 },
    { month: "Nov", registrations: 79 },
    { month: "Dec", registrations: 88 },
  ];

  const regionData = [
    { name: "North Region", value: 35, color: "#4ECDC4" },
    { name: "South Region", value: 30, color: "#95E1D3" },
    { name: "East Region", value: 25, color: "#FFE66D" },
    { name: "West Region", value: 10, color: "#C7CEEA" },
  ];

  return (
    <div className="dashboard-container flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="card-container">
          <Logo size="md" />

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("Admin Dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "Admin Dashboard"
                  ? "nav-link-active"
                  : "nav-link"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/hospital-list")}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors nav-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Hospitals</span>
            </button>

            <button
              onClick={() => navigate("/patient-list")}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors nav-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Patients</span>
            </button>

            <button
              onClick={() => setActiveTab("Activity Status")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "Activity Status"
                  ? "nav-link-active"
                  : "nav-link"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Activity Status</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="heading-md text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/patient-list')}
                className="btn-primary text-sm px-4 py-2"
              >
                Patients
              </button>
              <button 
                onClick={() => navigate('/doctor-dashboard')}
                className="btn-outline text-sm px-4 py-2"
              >
                Doctors
              </button>
              <button 
                onClick={() => navigate('/')}
                className="btn-secondary text-sm px-4 py-2"
              >
                Logout
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="dashboard-card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">1,250</p>
            </div>

            <div className="dashboard-card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Active Hospitals</p>
              <p className="text-2xl font-bold text-gray-900">75</p>
            </div>

            <div className="dashboard-card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">New Registrations</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>

            <div className="dashboard-card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">System Status</p>
              <p className="text-2xl font-bold text-gray-900">Excellent</p>
            </div>
          </div>

          {/* Recent Registrations & Updates */}
          <div className="dashboard-card mb-8">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">
                Recent Registrations & Updates
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {reg.id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge-success">
                          {reg.facilityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {reg.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {reg.admin}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate('/patient-passport')}
                            className="text-green-600 hover:text-green-700 font-medium transition-colors"
                            aria-label={`View passport for ${reg.name}`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate('/update-passport')}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            aria-label={`Edit passport for ${reg.name}`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Patient Registration Trends */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">
                  Patient Registration Trends
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Hospital Distribution by Region */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">
                  Hospital Distribution by Region
                </h2>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {regionData.map((region, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: region.color }}
                    ></div>
                    <span className="text-xs text-gray-600">{region.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="dashboard-card text-center hover-lift">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manage Patients
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                View, edit, and update patient records within the system.
              </p>
            </div>

            <div className="dashboard-card text-center hover-lift">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manage Hospitals
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add/remove hospital details, affiliations, and access permissions.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-900">
                About
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-900">
                Support
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-900">
                Legal
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 PatientPassport. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;