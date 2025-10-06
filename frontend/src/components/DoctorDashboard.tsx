import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Eye, 
  Calendar, 
  Phone, 
  MapPin, 
  Shield, 
  LogOut,
  Bell,
  Settings,
  FileText,
  Activity
} from 'lucide-react';

interface Patient {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  nationalId: string;
  dateOfBirth: string;
  contactNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  gender: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
}

interface DoctorDashboardProps {
  onLogout?: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [permissionReason, setPermissionReason] = useState('');
  const [requestedData, setRequestedData] = useState<string[]>([]);
  const [submittingPermission, setSubmittingPermission] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentRequests: 0,
    activeAccess: 0
  });

  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []);

  useEffect(() => {
    // Filter patients based on search term
    const filtered = patients.filter(patient =>
      patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nationalId.includes(searchTerm) ||
      patient.contactNumber.includes(searchTerm) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/patients');
      if (response.success) {
        setPatients(response.data);
        setStats(prev => ({ ...prev, totalPatients: response.data.length }));
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch additional stats if needed
      // This could include access requests, recent activity, etc.
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    try {
      // First check if doctor already has access
      const accessCheckResponse = await apiService.request(`/access-control/check-access/${patient._id}`);
      
      if (accessCheckResponse.success && accessCheckResponse.data.hasAccess) {
        // Doctor has access, open patient passport
        window.open(`/patient-passport/${patient._id}`, '_blank');
      } else {
        // Doctor doesn't have access, show permission request modal
        setSelectedPatient(patient);
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      // If error, show permission request modal
      setSelectedPatient(patient);
      setShowPermissionModal(true);
    }
  };

  const handlePermissionRequest = async () => {
    if (!selectedPatient || !permissionReason.trim() || requestedData.length === 0) {
      alert('Please provide a reason and select at least one data type to request.');
      return;
    }

    try {
      setSubmittingPermission(true);
      
      // Get hospital ID from doctor's context
      const hospitalId = '68e42c3f7987fd304342bd9d'; // This should come from doctor's hospital
      
      const response = await apiService.request('/access-control/request', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient._id,
          hospitalId: hospitalId,
          requestType: 'view',
          reason: permissionReason,
          requestedData: requestedData,
          expiresInHours: 24
        })
      });

      if (response.success) {
        alert('Permission request sent successfully! The patient will be notified and can approve or deny your request.');
        setShowPermissionModal(false);
        setSelectedPatient(null);
        setPermissionReason('');
        setRequestedData([]);
      } else {
        alert('Failed to send permission request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending permission request:', error);
      alert('Failed to send permission request. Please try again.');
    } finally {
      setSubmittingPermission(false);
    }
  };

  const handleDataTypeToggle = (dataType: string) => {
    setRequestedData(prev => 
      prev.includes(dataType) 
        ? prev.filter(type => type !== dataType)
        : [...prev, dataType]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const dataTypes = [
    { key: 'medical_history', label: 'Medical History' },
    { key: 'medications', label: 'Current Medications' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'lab_results', label: 'Lab Results' },
    { key: 'imaging', label: 'Imaging Reports' },
    { key: 'emergency_contacts', label: 'Emergency Contacts' },
    { key: 'insurance', label: 'Insurance Information' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">
                    {user?.name?.charAt(0) || 'D'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Doctor</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    await logout();
                    window.location.href = '/';
                  }
                }}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recentRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Access</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeAccess}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search patients by name, ID, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4">
                <button
                  onClick={fetchPatients}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Patient Records</h2>
            <p className="text-sm text-gray-500">Click "View Passport" to request access to patient medical records</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No patients match your search criteria.' : 'No patients are registered in the system.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                  <div key={patient._id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{patient.user.name}</h4>
                          <p className="text-sm text-gray-600">ID: {patient.nationalId}</p>
                          <p className="text-xs text-gray-500">{patient.user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {calculateAge(patient.dateOfBirth)} years
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Born: {formatDate(patient.dateOfBirth)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{patient.contactNumber}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                      {patient.emergencyContact.name && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Emergency:</span> {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                        </div>
                      )}
                      {patient.bloodType && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Blood Type:</span> {patient.bloodType}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleViewPatient(patient)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Patient Passport
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permission Request Modal */}
      {showPermissionModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Request Patient Access</h3>
              <p className="text-sm text-gray-600 mt-1">
                Request permission to view {selectedPatient.user.name}'s medical records
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Reason for Access */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Access *
                </label>
                <textarea
                  value={permissionReason}
                  onChange={(e) => setPermissionReason(e.target.value)}
                  placeholder="Please explain why you need access to this patient's medical records..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              {/* Data Types to Request */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Data Types to Request *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {dataTypes.map((dataType) => (
                    <label key={dataType.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requestedData.includes(dataType.key)}
                        onChange={() => handleDataTypeToggle(dataType.key)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{dataType.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Access Duration */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Access Duration</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This access request will expire in 24 hours. The patient will be notified and can approve or deny your request.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedPatient(null);
                  setPermissionReason('');
                  setRequestedData([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                onClick={handlePermissionRequest}
                disabled={submittingPermission || !permissionReason.trim() || requestedData.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPermission ? 'Sending Request...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;