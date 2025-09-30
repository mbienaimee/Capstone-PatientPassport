import React, { useState } from 'react';
import { Home, Search, Users, FileText, Facebook, Twitter, Instagram, Linkedin, Menu } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  nationalId: string;
  status: 'Stable' | 'Needs Review' | 'Critical';
}

const MyPatients: React.FC = () => {
  const [patients] = useState<Patient[]>([
    { id: 1, name: 'Aisha Rahman', nationalId: '123-456-7890', status: 'Stable' },
    { id: 2, name: 'Benjamin Chen', nationalId: '987-654-3210', status: 'Needs Review' },
    { id: 3, name: 'Chloe Dubois', nationalId: '111-222-3333', status: 'Critical' },
    { id: 4, name: 'David Garcia', nationalId: '444-555-6666', status: 'Stable' },
    { id: 5, name: 'Emily White', nationalId: '777-888-9999', status: 'Needs Review' },
  ]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Stable':
        return 'bg-green-500 text-white';
      case 'Needs Review':
        return 'bg-orange-500 text-white';
      case 'Critical':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

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
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors group">
              <Search className="w-5 h-5" />
              <span className="font-medium">Search Patient</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-600 rounded-lg transition-colors">
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

              <div className="flex items-center space-x-4 ml-auto">
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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Patients</h1>
            <p className="text-gray-600">
              Overview of patients currently assigned to you, including their status and quick actions.
            </p>
          </div>

          {/* Patient List Card */}
          <div className="bg-gray-100 rounded-2xl p-6 lg:p-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="px-6 lg:px-8 py-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Patient List</h2>
                <p className="text-sm text-gray-600">Click on actions to manage patient records.</p>
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
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 lg:px-8 py-5 text-gray-900 font-medium">
                          {patient.name}
                        </td>
                        <td className="px-6 lg:px-8 py-5 text-gray-600">
                          {patient.nationalId}
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(patient.status)}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="px-4 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg font-medium transition-colors border border-transparent hover:border-green-200">
                              View Passport
                            </button>
                            <button className="px-4 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg font-medium transition-colors border border-green-600 hover:border-green-700">
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

export default MyPatients;