import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="dashboard-container flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="card-container">
          <Logo size="md" />
        </div>

        <nav className="mt-6">
          <div className="px-6 space-y-2">
            <button
              onClick={() => setActiveTab("Dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "Dashboard"
                  ? "nav-link-active"
                  : "nav-link"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/my-patients')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors nav-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>My Patients</span>
            </button>
            <button
              onClick={() => navigate('/search-patient')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors nav-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Patient</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="heading-md text-gray-900">Doctor Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/admin-dashboard')}
                className="btn-outline text-sm px-4 py-2"
              >
                Admin
              </button>
              <button 
                onClick={() => navigate('/')}
                className="btn-secondary text-sm px-4 py-2"
              >
                Logout
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                DR
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="dashboard-card hover-lift">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card hover-lift">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card hover-lift">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Recent Patient Activity</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">JD</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900">John Doe</p>
                    <p className="text-xs text-gray-600">Updated medical records</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500">2 hours ago</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate('/patient-passport')}
                      className="text-green-600 hover:text-green-700 text-xs font-medium transition-colors"
                      aria-label="View John Doe's passport"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate('/update-passport')}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                      aria-label="Edit John Doe's passport"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">MS</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900">Mary Smith</p>
                    <p className="text-xs text-gray-600">New appointment scheduled</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500">4 hours ago</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate('/patient-passport')}
                      className="text-green-600 hover:text-green-700 text-xs font-medium transition-colors"
                      aria-label="View Mary Smith's passport"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate('/update-passport')}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                      aria-label="Edit Mary Smith's passport"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">RJ</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900">Robert Johnson</p>
                    <p className="text-xs text-gray-600">Lab results available</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-500">1 day ago</div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate('/patient-passport')}
                      className="text-green-600 hover:text-green-700 text-xs font-medium transition-colors"
                      aria-label="View Robert Johnson's passport"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate('/update-passport')}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                      aria-label="Edit Robert Johnson's passport"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;