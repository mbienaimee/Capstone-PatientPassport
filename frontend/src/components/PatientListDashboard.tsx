import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, ChevronLeft, ChevronRight, Search, User, Menu } from 'lucide-react';
import Logo from './Logo';

interface Patient {
  id: number;
  name: string;
  nationalId: string;
  dateOfBirth: string;
  contactNumber: string;
  registrationDate: string;
}

const PatientListDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Name (A-Z)');
 

  const patients: Patient[] = [
    {
      id: 1,
      name: 'John Doe',
      nationalId: '1234567890',
      dateOfBirth: '1985-04-12',
      contactNumber: '+1-555-123-4567',
      registrationDate: '2022-01-15'
    },
    {
      id: 2,
      name: 'Jane Smith',
      nationalId: '0987654321',
      dateOfBirth: '1990-11-23',
      contactNumber: '+1-555-987-6543',
      registrationDate: '2022-02-20'
    },
    {
      id: 3,
      name: 'David Lee',
      nationalId: '1122334455',
      dateOfBirth: '1978-07-01',
      contactNumber: '+1-555-234-5678',
      registrationDate: '2022-03-10'
    },
    {
      id: 4,
      name: 'Maria Garcia',
      nationalId: '5544332211',
      dateOfBirth: '1995-02-29',
      contactNumber: '+1-555-345-6789',
      registrationDate: '2022-04-05'
    },
    {
      id: 5,
      name: 'Ahmed Khan',
      nationalId: '6677889900',
      dateOfBirth: '1965-09-10',
      contactNumber: '+1-555-456-7890',
      registrationDate: '2022-05-18'
    },
    {
      id: 6,
      name: 'Emily White',
      nationalId: '9988776655',
      dateOfBirth: '2000-01-05',
      contactNumber: '+1-555-567-9001',
      registrationDate: '2022-06-22'
    },
    {
      id: 7,
      name: 'Chris Brown',
      nationalId: '4455667788',
      dateOfBirth: '1982-03-17',
      contactNumber: '+1-555-678-9012',
      registrationDate: '2022-07-30'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Logo size="md" />
        </div>
        
        <nav className="px-4 space-y-1">
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
            <span>Admin Dashboard</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium">
            <User className="w-5 h-5" />
            <span>Patients</span>
          </button>
          <button 
            onClick={() => navigate('/hospital-list')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Hospitals</span>
          </button>
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>System Status</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-6">
              <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Admin Dashboard</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Logout</a>
            </nav>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Patient List</h1>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option>Name (A-Z)</option>
              <option>Name (Z-A)</option>
              <option>Date (Newest)</option>
              <option>Date (Oldest)</option>
            </select>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Apply Filters
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Name ↕
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    National ID ↕
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Contact Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Registration Date ↕
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.nationalId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.dateOfBirth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.contactNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.registrationDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => navigate('/patient-passport')}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Passport</span>
                        </button>
                        <button 
                          onClick={() => navigate('/update-passport')}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1 rounded-lg transition-colors border border-green-600 hover:border-green-700"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">1</button>
            <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">2</button>
            <button className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">3</button>
            <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900">About</a>
              <a href="#" className="hover:text-gray-900">Support</a>
              <a href="#" className="hover:text-gray-900">Legal</a>
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

export default PatientListDashboard;