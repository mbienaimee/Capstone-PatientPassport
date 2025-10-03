import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

interface Hospital {
  id: number;
  name: string;
  address: string;
  contact: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

const HospitalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  // const [currentPage, setCurrentPage] = useState(1); // Will be used for pagination
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const hospitals: Hospital[] = [
    {
      id: 1,
      name: 'Greenwood Medical Center',
      address: '123 Oak Ave, Metropolis, IL',
      contact: '(555) 123-4567',
      status: 'Active'
    },
    {
      id: 2,
      name: 'City General Hospital',
      address: '456 Elm St, Gotham, NY',
      contact: '(555) 987-6543',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Northwood Clinic',
      address: '789 Pine Ln, Star City, CA',
      contact: '(555) 234-7890',
      status: 'Pending'
    },
    {
      id: 4,
      name: 'Sunrise Health System',
      address: '101 Maple Rd, Central City, MO',
      contact: '(555) 345-1234',
      status: 'Active'
    },
    {
      id: 5,
      name: 'Riverbend Hospital',
      address: '202 Willow Way, Harmony, GA',
      contact: '(555) 876-5432',
      status: 'Inactive'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Inactive':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200">
        <div className="p-4">
          <Logo size="md" />
          
          <nav className="space-y-1">
            <button 
              onClick={() => navigate('/admin-dashboard')}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Admin Dashboard</span>
            </button>
            
            <button 
              onClick={() => navigate('/patient-list')}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Patients</span>
            </button>
            
            <button className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Hospitals</span>
            </button>
            
            <button className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>System Status</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <nav className="flex items-center space-x-6 text-xs">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="text-green-600 font-medium">Admin Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Logout</a>
            </nav>
            <div className="flex items-center space-x-3">
              <button className="p-1.5 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <div className="w-7 h-7 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hospital List</h1>
            <p className="text-sm text-gray-600">
              Manage all registered hospitals within the Patient Passport system. View, filter, and update hospital details.
            </p>
          </div>

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search hospitals by name or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filter Status</span>
                  </button>
                </div>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Hospital</span>
              </button>
            </div>
          </div>

          {/* Hospitals Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Hospital Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{hospital.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{hospital.address}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{hospital.contact}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(hospital.status)}`}>
                        {hospital.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded">1</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">2</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  Next
                  <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-900">About</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Support</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Legal</a>
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

export default HospitalListPage;