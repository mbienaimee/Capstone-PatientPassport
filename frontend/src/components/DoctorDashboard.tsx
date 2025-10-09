import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import PassportAccessOTP from './PassportAccessOTP';
import PatientPassportView from './PatientPassportView';
import { 
  Users, 
  Eye, 
  Shield, 
  LogOut,
  Bell,
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
  status: 'active' | 'inactive';
}

interface DoctorDashboardProps {
  onLogout?: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPassportView, setShowPassportView] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentRequests: 0,
    activeAccess: 0
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionReason, setPermissionReason] = useState('');
  const [requestedData, setRequestedData] = useState<string[]>([]);
  const [submittingPermission, setSubmittingPermission] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const dataTypes = [
    { key: 'medicalHistory', label: 'Medical History' },
    { key: 'medications', label: 'Current Medications' },
    { key: 'testResults', label: 'Test Results' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'emergencyContact', label: 'Emergency Contact' },
    { key: 'hospitalVisits', label: 'Hospital Visits' }
  ];

  useEffect(() => {
    console.log('DoctorDashboard useEffect triggered, user:', user);
    // Check if user is authenticated and is a doctor
    if (!user || user.role !== 'doctor') {
      console.error('User not authenticated or not a doctor', { user });
      return;
    }
    
    console.log('User is authenticated as doctor, fetching data...');
    fetchPatients();
    fetchStats();
  }, [user]);


  const fetchPatients = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Fetching patients...');
      let patientsData = [];
      
      try {
        // Try to fetch all patients from the patients endpoint
        const response = await apiService.getPatients();
        console.log('Patients API response:', response);
        
        if (response.success && response.data) {
          console.log('Successfully fetched patients from /patients endpoint:', response.data.length);
          patientsData = Array.isArray(response.data) ? response.data : [];
        } else {
          console.warn('Failed to fetch patients from /patients endpoint:', response.message);
          throw new Error('Patients API failed');
        }
      } catch (patientsError) {
        console.warn('Patients API failed, trying doctor dashboard endpoint:', patientsError);
        
        // Fallback: try to get patients from doctor dashboard
        try {
          const dashboardResponse = await apiService.request('/dashboard/doctor');
          if (dashboardResponse.success && dashboardResponse.data?.stats?.recentPatients) {
            console.log('Successfully fetched patients from doctor dashboard:', dashboardResponse.data.stats.recentPatients.length);
            patientsData = Array.isArray(dashboardResponse.data.stats.recentPatients) ? dashboardResponse.data.stats.recentPatients : [];
          } else {
            console.warn('No patients found in doctor dashboard response');
            patientsData = [];
          }
        } catch (dashboardError) {
          console.error('Both patients API and doctor dashboard failed:', dashboardError);
          patientsData = [];
        }
      }
      
      setPatients(patientsData);
      setStats(prev => ({ 
        ...prev, 
        totalPatients: patientsData.length,
        recentRequests: 0, // This will be updated by fetchStats
        activeAccess: 0 // This will be updated by fetchStats
      }));
      
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Set empty array on error
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch doctor dashboard stats
      const response = await apiService.request('/dashboard/doctor');
      if (response.success && response.data) {
        const stats = response.data.stats;
        setStats(prev => ({ 
          ...prev, 
          recentRequests: stats?.totalMedicalConditions || 0,
          activeAccess: stats?.totalMedications || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    // Show OTP modal for passport access
    setSelectedPatient(patient);
    setShowOTPModal(true);
  };

  const handleOTPSuccess = (token: string) => {
    console.log('OTP Success - Patient:', selectedPatient?._id, 'Token:', token);
    setAccessToken(token);
    setShowOTPModal(false);
    setShowPassportView(true);
  };

  const handleClosePassportView = () => {
    setShowPassportView(false);
    setAccessToken('');
    setSelectedPatient(null);
  };

  const handleCancelOTP = () => {
    setShowOTPModal(false);
    setSelectedPatient(null);
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

  // Filter and paginate patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchTerm === '' || 
      patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nationalId.includes(searchTerm) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDataTypeToggle = (dataType: string) => {
    setRequestedData(prev => 
      prev.includes(dataType) 
        ? prev.filter(item => item !== dataType)
        : [...prev, dataType]
    );
  };

  const handlePermissionRequest = async () => {
    if (!selectedPatient || !permissionReason.trim() || requestedData.length === 0) {
      return;
    }

    try {
      setSubmittingPermission(true);
      
      // Here you would typically make an API call to request permission
      // For now, we'll just simulate the request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message or handle the response
      alert('Permission request sent successfully!');
      
      // Close modal and reset state
      setShowPermissionModal(false);
      setSelectedPatient(null);
      setPermissionReason('');
      setRequestedData([]);
      
    } catch (error) {
      console.error('Error sending permission request:', error);
      alert('Failed to send permission request. Please try again.');
    } finally {
      setSubmittingPermission(false);
    }
  };

  // Check authentication
  if (!user || user.role !== 'doctor') {
    // Redirect to home page if not authenticated as doctor
    React.useEffect(() => {
      window.location.href = '/';
    }, []);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in as a doctor to access this page.</p>
          <p className="text-sm text-gray-500 mb-4">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

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

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Records</h2>
                <p className="text-sm text-gray-600">View and access patient medical records</p>
              </div>
              <button
                onClick={() => fetchPatients(true)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {/* Search and Filter Row */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Patients
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by name, national ID, or email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="sm:w-48">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Patients</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {currentPatients.length} of {filteredPatients.length} patients
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No patients found' : 'No patients registered'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No patients are registered in the system.'}
                </p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPatients.map((patient) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{patient.user.name}</div>
                              <div className="text-sm text-gray-500">ID: {patient.nationalId}</div>
                              <div className="text-xs text-gray-400">{patient.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.contactNumber}</div>
                          {patient.emergencyContact.name && (
                            <div className="text-xs text-gray-500">
                              Emergency: {patient.emergencyContact.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {calculateAge(patient.dateOfBirth)} years
                          </span>
                          {patient.bloodType && (
                            <div className="text-xs text-gray-500 mt-1">
                              {patient.bloodType}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            patient.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{patient.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Request OTP Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {filteredPatients.length > patientsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstPatient + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastPatient, filteredPatients.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredPatients.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-green-50 border-green-500 text-green-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && selectedPatient && (
        <PassportAccessOTP
          patientId={selectedPatient._id}
          patientName={selectedPatient.user.name}
          patientEmail={selectedPatient.user.email}
          onSuccess={handleOTPSuccess}
          onCancel={handleCancelOTP}
        />
      )}

      {/* Patient Passport View */}
      {showPassportView && selectedPatient && (
        <PatientPassportView
          patientId={selectedPatient._id}
          accessToken={accessToken}
          onClose={handleClosePassportView}
          isEditable={true}
        />
      )}

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
                <div className="mt-1 flex justify-between text-sm">
                  <span className={`${permissionReason.trim().length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                    Minimum 10 characters required
                  </span>
                  <span className={`${permissionReason.trim().length > 500 ? 'text-red-600' : 'text-gray-500'}`}>
                    {permissionReason.trim().length}/500
                  </span>
                </div>
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
                disabled={submittingPermission || !permissionReason.trim() || permissionReason.trim().length < 10 || permissionReason.trim().length > 500 || requestedData.length === 0}
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