import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import PassportAccessOTP from './PassportAccessOTP';
import PatientPassportView from './PatientPassportView';
import Logo from './Logo';
import { 
  Users, 
  Eye, 
  Shield, 
  LogOut,
  Bell,
  Activity,
  User,
  ChevronDown
} from 'lucide-react';

interface DoctorPatient {
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

interface DashboardResponse {
  stats?: {
    recentPatients?: DoctorPatient[];
    totalMedicalConditions?: number;
    totalMedications?: number;
  };
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onLogout }) => {
  console.log('DoctorDashboard component rendered');
  const { user, logout, isLoading } = useAuth();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
  const [showPassportView, setShowPassportView] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
    console.log('User role:', user?.role);
    console.log('User authenticated:', !!user);
    console.log('User object details:', JSON.stringify(user, null, 2));
    
    // Check if user is authenticated and is a doctor
    if (!user || user.role !== 'doctor') {
      console.error('User not authenticated or not a doctor', { user });
      console.log('User check failed - user exists:', !!user, 'role is doctor:', user?.role === 'doctor');
      return;
    }
    
    console.log('User is authenticated as doctor, fetching data...');
    fetchPatients();
    fetchStats();
  }, [user]);


  const fetchPatients = async (isRefresh = false) => {
    console.log('fetchPatients called, isRefresh:', isRefresh);
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Fetching patients...');
      let patientsData: DoctorPatient[] = [];
      
      try {
        // Try to fetch all patients from the patients endpoint
        const response = await apiService.getPatients();
        console.log('Patients API response:', response);
        
        if (response.success && response.data) {
          console.log('Successfully fetched patients from /patients endpoint:', response.data.length);
          patientsData = Array.isArray(response.data) ? response.data as unknown as DoctorPatient[] : [];
        } else {
          console.warn('Failed to fetch patients from /patients endpoint:', response.message);
          throw new Error('Patients API failed');
        }
      } catch (patientsError) {
        console.warn('Patients API failed, trying doctor dashboard endpoint:', patientsError);
        
        // Fallback: try to get patients from doctor dashboard
        try {
          const dashboardResponse = await apiService.request('/dashboard/doctor');
          if (dashboardResponse.success && dashboardResponse.data && (dashboardResponse.data as DashboardResponse).stats?.recentPatients) {
            console.log('Successfully fetched patients from doctor dashboard:', (dashboardResponse.data as DashboardResponse).stats!.recentPatients!.length);
            patientsData = Array.isArray((dashboardResponse.data as DashboardResponse).stats!.recentPatients) ? (dashboardResponse.data as DashboardResponse).stats!.recentPatients! : [];
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
        const stats = (response.data as DashboardResponse).stats;
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

  const handleViewPatient = async (patient: DoctorPatient) => {
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

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric'
  //   });
  // };

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

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'doctor')) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileDropdown) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!user || user.role !== 'doctor') {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Logo size="sm" className="text-green-600" />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900">Doctor Portal</h1>
                <p className="text-sm text-gray-600">Patient Management System</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 border border-green-200"
              >
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-green-600">Doctor</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-green-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-green-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-green-600 font-medium">Medical Doctor</p>
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
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Welcome back, Dr. {user?.name?.split(' ')[1] || user?.name}</h1>
                    <p className="text-green-100 text-lg">Manage your patients and access medical records</p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="text-center">
                    <p className="text-green-100 text-sm font-medium">Total Patients</p>
                    <p className="text-4xl font-bold text-white">{stats.totalPatients}</p>
                    <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentRequests}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-16 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Active Access</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAccess}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-16 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width: '80%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">System Status</p>
                  <p className="text-lg font-bold text-green-600">Online</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient List Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-200/50 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Patient Management</h2>
                </div>
                <p className="text-green-100 text-lg">Access and manage patient medical records</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                  <span className="text-sm font-semibold text-white">{stats.totalPatients} Patients</span>
                </div>
                <button
                  onClick={() => fetchPatients(true)}
                  disabled={refreshing}
                  className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Activity className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search and Filter Row */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-3">
                  🔍 Search Patients
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by name, national ID, or email..."
                    className="w-full pl-4 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="lg:w-64">
                <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-3">
                  📊 Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg bg-gray-50 hover:bg-white transition-colors"
                >
                  <option value="all">All Patients</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Showing {currentPatients.length} of {filteredPatients.length} patients
                  </span>
                  {searchTerm && (
                    <span className="text-sm text-green-700 bg-green-200 px-3 py-1 rounded-full font-medium">
                      Matching "{searchTerm}"
                    </span>
                  )}
                </div>
                {filteredPatients.length > 0 && (
                  <div className="text-sm text-gray-600 font-medium">
                    Page {currentPage} of {Math.ceil(filteredPatients.length / patientsPerPage)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-200/50 overflow-hidden">
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600 font-medium">Loading patients...</p>
                </div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchTerm || filterStatus !== 'all' ? 'No patients found' : 'No patients registered'}
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria to find patients.' 
                      : 'No patients are currently registered in the system.'}
                  </p>
                  {(searchTerm || filterStatus !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentPatients.map((patient) => (
                  <div key={patient._id} className="group bg-gradient-to-r from-white to-green-50/30 rounded-xl border border-green-200/50 hover:border-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                            {patient.user?.name || 'Unknown Patient'}
                          </h3>
                          <p className="text-sm text-gray-600">ID: {patient.nationalId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          patient.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {patient.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleViewPatient(patient)}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Records</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
      </main>

      {/* OTP Modal */}
      {showOTPModal && selectedPatient && (
        <PassportAccessOTP
          patientId={selectedPatient._id}
          patientName={selectedPatient.user?.name || 'Unknown'}
          patientEmail={selectedPatient.user?.email || 'Unknown'}
          onSuccess={handleOTPSuccess}
          onCancel={handleCancelOTP}
        />
      )}

      {/* Patient Passport View */}
      {showPassportView && selectedPatient && accessToken && (
        <PatientPassportView
          patientId={selectedPatient._id}
          patientName={selectedPatient.user?.name || 'Unknown Patient'}
          accessToken={accessToken}
          onClose={handleClosePassportView}
        />
      )}

      {/* Permission Request Modal */}
      {showPermissionModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Request Patient Access</h3>
              <p className="text-sm text-gray-600 mt-1">
                Request permission to view {selectedPatient.user?.name || 'Unknown Patient'}'s medical records
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