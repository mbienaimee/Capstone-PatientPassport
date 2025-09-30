import React, { useState } from 'react';
import { Home, Search, Users, FileText, Facebook, Twitter, Instagram, Linkedin, Menu } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  nationalId: string;
  status: 'Active' | 'Deactivated';
}

const SearchPatient: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients] = useState<Patient[]>([
    { id: 1, name: 'Alice Smith', nationalId: '12345678901', status: 'Active' },
    { id: 2, name: 'Bob Johnson', nationalId: '09876543210', status: 'Deactivated' },
    { id: 3, name: 'Charlie Brown', nationalId: '11223344556', status: 'Active' },
    { id: 4, name: 'Diana Prince', nationalId: '66778899001', status: 'Active' },
    { id: 5, name: 'Eve Adams', nationalId: '99887766554', status: 'Deactivated' },
  ]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">✚</span>
            </div>
            <span className="text-xl font-bold text-green-600">logo</span>
          </div>

          <nav className="space-y-2">
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors group">
              <Home className="w-5 h-5" />
              <span className="font-medium">Doctor Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-600 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
              <span className="font-medium">Search Patient</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors group">
              <Users className="w-5 h-5" />
              <span className="font-medium">My Patients</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors group">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Update Passport</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>

              <nav className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Home</a>
                <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Doctor Dashboard</a>
                <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Logout</a>
              </nav>

              <div className="flex items-center space-x-4">
                <div className="relative hidden lg:block">
                  <input
                    type="text"
                    placeholder="Search for site-wide information..."
                    className="w-64 xl:w-96 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Users className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 lg:px-8 py-8">
          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Search Patient by National ID
            </h1>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter National ID (e.g., 12345678901)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 shadow-md">
                <Search className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 lg:px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Search Results</h2>
              <span className="text-sm text-gray-500 font-medium">
                {patients.length} Patients Found
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Patient Name
                    </th>
                    <th className="px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      National ID
                    </th>
                    <th className="px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 lg:px-8 py-4 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 lg:px-8 py-4 text-gray-900 font-medium">
                        {patient.name}
                      </td>
                      <td className="px-6 lg:px-8 py-4 text-gray-600">
                        {patient.nationalId}
                      </td>
                      <td className="px-6 lg:px-8 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          patient.status === 'Active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 lg:px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors">
                            View Passport
                          </button>
                          <button className="px-4 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors">
                            Update Passport
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-4 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <nav className="flex gap-6">
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  About
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Support
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Legal
                </a>
              </nav>
              
              <div className="flex gap-4">
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SearchPatient;