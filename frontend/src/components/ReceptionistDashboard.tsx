import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  Stethoscope,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import Logo from './Logo';
import { useNotification } from '../contexts/NotificationContext';

interface Patient {
  id: string;
  name: string;
  nationalId: string;
  age: number;
  status: 'active' | 'inactive';
  assignedDoctors: string[];
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  currentPatientCount: number;
  isAvailable: boolean;
}

const ReceptionistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load patients and doctors data
      // This would be replaced with actual API calls
      setPatients([
        { id: '1', name: 'John Doe', nationalId: '1234567890', age: 35, status: 'active', assignedDoctors: [] },
        { id: '2', name: 'Jane Smith', nationalId: '0987654321', age: 28, status: 'active', assignedDoctors: ['doc1'] },
        { id: '3', name: 'Bob Johnson', nationalId: '1122334455', age: 42, status: 'active', assignedDoctors: [] }
      ]);

      setDoctors([
        { id: 'doc1', name: 'Dr. Sarah Wilson', specialization: 'Cardiology', licenseNumber: 'DOC001', currentPatientCount: 15, isAvailable: true },
        { id: 'doc2', name: 'Dr. Michael Brown', specialization: 'Neurology', licenseNumber: 'DOC002', currentPatientCount: 8, isAvailable: true },
        { id: 'doc3', name: 'Dr. Emily Davis', specialization: 'Pediatrics', licenseNumber: 'DOC003', currentPatientCount: 25, isAvailable: false }
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load data'
      });
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatient || !selectedDoctor) {
      showNotification({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select both a patient and a doctor'
      });
      return;
    }

    if (!assignmentReason.trim()) {
      showNotification({
        type: 'error',
        title: 'Reason Required',
        message: 'Please provide a reason for the assignment'
      });
      return;
    }

    setIsLoading(true);
    try {
      // This would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showNotification({
        type: 'success',
        title: 'Assignment Successful',
        message: `${selectedPatient.name} has been assigned to ${selectedDoctor.name}`
      });

      // Update local state
      setPatients(prev => prev.map(p => 
        p.id === selectedPatient.id 
          ? { ...p, assignedDoctors: [...p.assignedDoctors, selectedDoctor.id] }
          : p
      ));

      setSelectedPatient(null);
      setSelectedDoctor(null);
      setAssignmentReason('');
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Assignment Failed',
        message: 'Failed to assign patient to doctor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="p-6">
          <Logo size="md" />
        </div>
        
        <nav className="px-4 space-y-1">
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md">
            <Users className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
            <UserPlus className="w-5 h-5 mr-3" />
            Patient Registration
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
            <Stethoscope className="w-5 h-5 mr-3" />
            Doctor Assignment
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
            <Search className="w-5 h-5 mr-3" />
            Search Patients
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
            <Calendar className="w-5 h-5 mr-3" />
            Appointments
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="ml-2 text-xl font-semibold text-gray-900">Receptionist Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                    <p className="text-2xl font-semibold text-gray-900">{patients.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Stethoscope className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Available Doctors</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctors.filter(d => d.isAvailable).length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unassigned Patients</p>
                    <p className="text-2xl font-semibold text-gray-900">{patients.filter(p => p.assignedDoctors.length === 0).length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Assignment Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Doctor Assignment</h2>
                <p className="text-sm text-gray-500">Assign patients to available doctors</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Patient
                    </label>
                    <select
                      value={selectedPatient?.id || ''}
                      onChange={(e) => {
                        const patient = patients.find(p => p.id === e.target.value);
                        setSelectedPatient(patient || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} - {patient.nationalId}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor
                    </label>
                    <select
                      value={selectedDoctor?.id || ''}
                      onChange={(e) => {
                        const doctor = doctors.find(d => d.id === e.target.value);
                        setSelectedDoctor(doctor || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Choose a doctor...</option>
                      {doctors.filter(d => d.isAvailable).map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assignment Reason */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Reason
                  </label>
                  <textarea
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    placeholder="Enter reason for assignment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Assign Button */}
                <div className="mt-6">
                  <button
                    onClick={handleAssignPatient}
                    disabled={isLoading || !selectedPatient || !selectedDoctor}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Patient to Doctor
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">John Doe assigned to Dr. Sarah Wilson</p>
                    <span className="text-xs text-gray-400">2 minutes ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">New patient registration: Jane Smith</p>
                    <span className="text-xs text-gray-400">15 minutes ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">Appointment scheduled for Bob Johnson</p>
                    <span className="text-xs text-gray-400">1 hour ago</span>
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

export default ReceptionistDashboard;











