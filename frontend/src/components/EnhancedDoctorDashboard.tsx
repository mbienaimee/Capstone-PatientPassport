import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import PassportAccessOTP from './PassportAccessOTP';
import PatientPassportView from './PatientPassportView';
import EmergencyAccessModal from './EmergencyAccessModal';
import { useNotification } from '../contexts/NotificationContext';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiLogOut,
  FiActivity,
  FiSearch
} from 'react-icons/fi';

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

interface DashboardStats {
  totalPatients: number;
  recentRequests: number;
  activeAccess: number;
  systemStatus: 'online' | 'offline';
}

const EnhancedDoctorDashboard: React.FC<DoctorDashboardProps> = ({ onLogout }) => {
  const { user, logout, isLoading } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  // State management
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
  const [showPassportView, setShowPassportView] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  const [passportData, setPassportData] = useState<any>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyPatient, setEmergencyPatient] = useState<DoctorPatient | null>(null);
  const [isEmergencyAccess, setIsEmergencyAccess] = useState(false);
  const [isLoadingEmergencyAccess, setIsLoadingEmergencyAccess] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    recentRequests: 0,
    activeAccess: 0,
    systemStatus: 'online'
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('overview');
  
  // Add patient form state
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    email: '',
    nationalId: '',
    dateOfBirth: '',
    gender: 'male',
    contactNumber: '',
    address: '',
    bloodType: '',
    allergies: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  // Role-based access control
  useEffect(() => {
    if (isLoading) return;

    if (user && user.role !== 'doctor') {
      showNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to access the doctor dashboard.'
      });
      
      if (user.role === 'patient') {
        navigate('/patient-passport');
      } else if (user.role === 'hospital') {
        navigate('/hospital-dashboard');
      } else {
        navigate('/');
      }
      return;
    }

    if (!user) {
      navigate('/doctor-login');
      return;
    }

    initializeDashboard();
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'doctor') return;
    initializeDashboard();
  }, [user]);

  const initializeDashboard = async () => {
    try {
      setError(null);
      await Promise.all([fetchPatients(), fetchStats()]);
    } catch (err) {
      console.error('Error initializing dashboard:', err);
      setError('Failed to load dashboard data');
      showNotification({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard data. Please refresh the page.'
      });
    }
  };

  const fetchPatients = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      let patientsData: DoctorPatient[] = [];
      
      try {
        const response = await apiService.getPatients();
        if (response.success && response.data) {
          patientsData = Array.isArray(response.data) ? response.data as unknown as DoctorPatient[] : [];
        }
      } catch (patientsError) {
        try {
          const dashboardResponse = await apiService.request('/dashboard/doctor');
          if (dashboardResponse.success && dashboardResponse.data) {
            const dashboardData = dashboardResponse.data as any;
            if (dashboardData.stats?.recentPatients) {
              patientsData = Array.isArray(dashboardData.stats.recentPatients) ? dashboardData.stats.recentPatients : [];
            }
          }
        } catch (dashboardError) {
          console.error('All patient endpoints failed:', dashboardError);
          throw new Error('Unable to fetch patients from any endpoint');
        }
      }
      
      setPatients(patientsData);
      setStats(prev => ({ ...prev, totalPatients: patientsData.length }));
      
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients');
      setPatients([]);
      showNotification({
        type: 'error',
        title: 'Patient Load Error',
        message: 'Failed to load patient list. Please try refreshing.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.request('/dashboard/doctor');
      if (response.success && response.data) {
        const dashboardData = response.data as any;
        const stats = dashboardData.stats || {};
        setStats(prev => ({ 
          ...prev, 
          recentRequests: stats.totalMedicalConditions || 0,
          activeAccess: stats.totalMedications || 0,
          systemStatus: 'online'
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, systemStatus: 'offline' }));
    }
  };

  const handleViewPatient = async (patient: DoctorPatient) => {
    setSelectedPatient(patient);
    setShowOTPModal(true);
  };

  const handleEmergencyAccess = (patient: DoctorPatient) => {
    setEmergencyPatient(patient);
    setShowEmergencyModal(true);
  };

  const handleEmergencyAccessSuccess = async (accessData: any) => {
    setShowEmergencyModal(false);
    setIsLoadingEmergencyAccess(true);
    setIsEmergencyAccess(true);
    
    try {
      const patientId = accessData.data?.patientId || emergencyPatient?._id;
      if (!patientId) throw new Error('Patient ID not found');
      
      const passportResponse = await apiService.getPatientPassport(patientId);
      if (passportResponse.success && passportResponse.data) {
        setPassportData(passportResponse.data);
        setSelectedPatient(emergencyPatient);
        setShowPassportView(true);
        showNotification({
          type: 'success',
          title: 'Emergency Access Granted',
          message: `Access to ${emergencyPatient?.user?.name}'s records is now active.`
        });
      } else {
        throw new Error(passportResponse.message || 'Failed to fetch passport');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to open passport: ${error.message || 'Unknown error'}`
      });
      setIsEmergencyAccess(false);
    } finally {
      setIsLoadingEmergencyAccess(false);
    }
  };

  const handleOTPSuccess = async (otpResponseData: any) => {
    try {
      const patientId = otpResponseData.patientId || selectedPatient?._id;
      if (!patientId) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to retrieve patient information. Please try again.'
        });
        return;
      }
      
      const passportResponse = await apiService.getPatientPassport(patientId);
      if (passportResponse.success && passportResponse.data) {
        setPassportData(passportResponse.data);
        setShowOTPModal(false);
        setIsEmergencyAccess(false);
        setShowPassportView(true);
        showNotification({
          type: 'success',
          title: 'Access Granted!',
          message: `You now have access to ${selectedPatient?.user?.name}'s Patient Passport.`
        });
      } else {
        throw new Error('Failed to fetch complete passport data');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load patient passport. Please try again.'
      });
    }
  };

  const handleClosePassportView = () => {
    setShowPassportView(false);
    setPassportData(null);
    setSelectedPatient(null);
    setIsEmergencyAccess(false);
    showNotification({
      type: 'info',
      title: 'Access Closed',
      message: 'Patient passport access has been closed.'
    });
  };

  const handlePassportUpdate = (updatedPassport: any) => {
    setPassportData(updatedPassport);
    showNotification({
      type: 'success',
      title: 'Passport Updated',
      message: 'Patient passport has been updated successfully.'
    });
  };

  const handleCancelOTP = () => {
    setShowOTPModal(false);
    setSelectedPatient(null);
    showNotification({
      type: 'info',
      title: 'Access Request Cancelled',
      message: 'Patient passport access request was cancelled.'
    });
  };

  const handleAddPatient = () => setShowAddPatientForm(true);

  const handleCloseAddPatientForm = () => {
    setShowAddPatientForm(false);
    setNewPatientForm({
      name: '', email: '', nationalId: '', dateOfBirth: '', gender: 'male',
      contactNumber: '', address: '', bloodType: '', allergies: '',
      emergencyContact: { name: '', relationship: '', phone: '' }
    });
  };

  const handleSubmitNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const patientData = {
        ...newPatientForm,
        allergies: newPatientForm.allergies ? newPatientForm.allergies.split(',').map((a: string) => a.trim()) : []
      };
      const response = await apiService.request('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData)
      });
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Patient Added',
          message: `Patient ${newPatientForm.name} has been added successfully.`
        });
        handleCloseAddPatientForm();
        fetchPatients(true);
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add patient'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setNewPatientForm(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value }
      }));
    } else {
      setNewPatientForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchTerm === '' || 
      patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nationalId.includes(searchTerm) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchPatients(true);
    fetchStats();
  };

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'doctor')) {
      window.location.href = '/';
    }
  }, [user, isLoading]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileDropdown) setShowProfileDropdown(false);
    };
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-black font-medium">Loading Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
          <p className="text-black">You do not have permission to access the doctor dashboard.</p>
        </div>
      </div>
    );
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-green-50 text-black">
      {isLoadingEmergencyAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
          <div className="bg-white rounded-lg p-6 shadow-xl border border-green-500">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="text-lg font-semibold text-black">Opening Patient Passport...</p>
              <p className="text-sm text-green-500">Emergency access granted</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-screen overflow-hidden bg-green-50">
        {/* Left Sidebar - Green Theme */}
        <aside className="w-64 bg-gradient-to-b from-green-600 to-green-700 flex flex-col shadow-xl">
          {/* Logo Section */}
          <div className="p-6 border-b border-green-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiActivity className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">PatientPassport</h2>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <div className="space-y-1">
                {[
                  { id: 'overview', label: 'Dashboard', icon: FiHome },
                  { id: 'patients', label: 'Patients', icon: FiUsers }
                ].map((nav) => {
                  const Icon = nav.icon;
                  const isActive = activeNav === nav.id;
                  return (
                    <button
                      key={nav.id}
                      onClick={() => setActiveNav(nav.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-green-700'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-green-700' : 'text-white/80'}`} />
                      <span className="text-sm font-medium">{nav.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </nav>

          {/* Footer - User Profile */}
          <div className="p-4 border-t border-green-500/20">
            <div className="flex items-center space-x-3 mb-4 p-3 bg-white/10 rounded-lg">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials(user?.name || 'D')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-white/70">Doctor</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (onLogout) onLogout();
                else { await logout(); window.location.href = '/'; }
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-white/10 text-white/90 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-200"
            >
              <FiLogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-black">Dashboard</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Dashboards / Overview</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 pl-4">
                    <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getUserInitials(user?.name || 'D')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{user?.name}</p>
                      <p className="text-xs text-gray-500">Doctor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Greeting Card - Green Background */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 mb-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Hello {user?.name?.split(' ')[0] || 'Doctor'}!</h2>
                  <p className="text-green-50 text-base leading-relaxed">
                    Today you have {stats.recentRequests} new patient requests. 
                    {stats.totalPatients > 0 && ` You are managing ${stats.totalPatients} patients.`} 
                    {stats.activeAccess > 0 && ` ${stats.activeAccess} active access sessions.`}
                  </p>
                </div>
                <div className="hidden lg:block ml-6">
                  <div className="h-24 w-24 bg-white/20 rounded-lg flex items-center justify-center">
                    <FiUserCheck className="h-12 w-12 text-white/80" />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FiUsers className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-black mb-1">{stats.totalPatients}</p>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Patients</p>
                <div className="flex items-center text-blue-600 text-xs">
                  <span className="mr-1">↑</span>
                  <span>Active</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <FiActivity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-black mb-1">{stats.recentRequests}</p>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Requests</p>
                <div className="flex items-center text-green-600 text-xs">
                  <span className="mr-1">↑</span>
                  <span>New</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FiActivity className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-black mb-1">
                  {stats.systemStatus === 'online' ? '100%' : '0%'}
                </p>
                <p className="text-sm font-medium text-gray-600 mb-1">System Status</p>
                <div className="flex items-center text-emerald-600 text-xs">
                  <span className="mr-1">●</span>
                  <span>{stats.systemStatus === 'online' ? 'Operational' : 'Maintenance'}</span>
                </div>
              </div>
            </div>

            {/* Patient Management Section */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-black mb-1">Patient Management</h2>
                    <p className="text-sm text-gray-500">Access and manage patient medical records</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 border border-gray-200 text-sm font-medium"
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                      onClick={handleAddPatient}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Add Patient
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search by name, national ID, or email..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  <div className="md:w-48">
                    <select
                      value={filterStatus}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    >
                      <option value="all">All Patients</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-black">{currentPatients.length}</span> of <span className="font-semibold text-black">{filteredPatients.length}</span> patients
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading patients...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                    <p className="text-lg font-semibold mb-2 text-black">Error Loading Patients</p>
                    <p className="text-sm mb-4">{error}</p>
                    <button
                      onClick={handleRefresh}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                    <p className="text-lg font-semibold mb-2 text-black">
                      {searchTerm || filterStatus !== 'all' ? 'No patients found' : 'No patients registered'}
                    </p>
                    <p className="text-sm mb-4">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'No patients are currently registered in the system.'}
                    </p>
                    {(searchTerm || filterStatus !== 'all') && (
                      <button
                        onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">National ID</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPatients.map((patient) => (
                          <tr key={patient._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                  {getUserInitials(patient.user?.name || 'P')}
                                </div>
                                <span className="font-medium text-black text-sm">{patient.user?.name || 'Unknown Patient'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-black text-sm">{patient.nationalId || 'N/A'}</td>
                            <td className="py-4 px-4 text-black text-sm">{patient.user?.email || 'N/A'}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                patient.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {patient.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleViewPatient(patient)}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium"
                                >
                                  Request Access
                                </button>
                                <button
                                  onClick={() => handleEmergencyAccess(patient)}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium"
                                >
                                  Emergency
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredPatients.length > patientsPerPage && (
                  <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5">
                    <div>
                      <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-black">{indexOfFirstPatient + 1}</span> to{' '}
                        <span className="font-semibold text-black">{Math.min(indexOfLastPatient, filteredPatients.length)}</span>{' '}
                        of <span className="font-semibold text-black">{filteredPatients.length}</span> results
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-sm font-medium"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg transition-colors border text-sm font-medium ${
                            page === currentPage
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-sm font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showOTPModal && selectedPatient && (
        <PassportAccessOTP
          patientId={selectedPatient._id}
          patientName={selectedPatient.user?.name || 'Unknown'}
          patientEmail={selectedPatient.user?.email || 'Unknown'}
          onSuccess={handleOTPSuccess}
          onCancel={handleCancelOTP}
        />
      )}

      {showPassportView && selectedPatient && passportData && (
        <PatientPassportView
          passportData={passportData}
          patientId={selectedPatient._id}
          onClose={handleClosePassportView}
          onUpdate={handlePassportUpdate}
          isEmergencyAccess={isEmergencyAccess}
        />
      )}

      {showAddPatientForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white p-5 rounded-t-lg flex justify-between items-center border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-black">Add New Patient</h2>
                <p className="text-gray-500 text-sm mt-1">Enter patient information to create a new record</p>
              </div>
              <button
                onClick={handleCloseAddPatientForm}
                className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg p-2 transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitNewPatient} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h3 className="text-base font-semibold text-black mb-3">Personal Information</h3>
                </div>
                {[
                  { name: 'name', label: 'Full Name *', type: 'text', placeholder: 'John Doe' },
                  { name: 'email', label: 'Email *', type: 'email', placeholder: 'john.doe@example.com' },
                  { name: 'nationalId', label: 'National ID *', type: 'text', placeholder: '1234567890123456' },
                  { name: 'dateOfBirth', label: 'Date of Birth *', type: 'date' },
                  { name: 'gender', label: 'Gender *', type: 'select', options: ['male', 'female', 'other', 'prefer_not_to_say'] },
                  { name: 'contactNumber', label: 'Contact Number *', type: 'tel', placeholder: '+1234567890' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={newPatientForm[field.name as keyof typeof newPatientForm] as string}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      >
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={newPatientForm[field.name as keyof typeof newPatientForm] as string}
                        onChange={handleFormChange}
                        required
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
                  <textarea
                    name="address"
                    value={newPatientForm.address}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="123 Main St, City, Country"
                  />
                </div>
                <div className="md:col-span-2 mt-3">
                  <h3 className="text-base font-semibold text-black mb-3">Medical Information</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Type</label>
                  <select
                    name="bloodType"
                    value={newPatientForm.bloodType}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  >
                    <option value="">Select blood type</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Allergies (comma-separated)</label>
                  <input
                    type="text"
                    name="allergies"
                    value={newPatientForm.allergies}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="Penicillin, Peanuts"
                  />
                </div>
                <div className="md:col-span-2 mt-3">
                  <h3 className="text-base font-semibold text-black mb-3">Emergency Contact</h3>
                </div>
                {[
                  { name: 'emergencyContact.name', label: 'Contact Name *', placeholder: 'Jane Doe' },
                  { name: 'emergencyContact.relationship', label: 'Relationship *', placeholder: 'Spouse, Parent, Sibling' },
                  { name: 'emergencyContact.phone', label: 'Phone Number *', placeholder: '+1234567890' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                    <input
                      type={field.name.includes('phone') ? 'tel' : 'text'}
                      name={field.name}
                      value={field.name.includes('name') ? newPatientForm.emergencyContact.name : field.name.includes('relationship') ? newPatientForm.emergencyContact.relationship : newPatientForm.emergencyContact.phone}
                      onChange={handleFormChange}
                      required
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseAddPatientForm}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Adding Patient...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmergencyModal && emergencyPatient && (
        <EmergencyAccessModal
          isOpen={showEmergencyModal}
          onClose={() => { setShowEmergencyModal(false); setEmergencyPatient(null); }}
          patientId={emergencyPatient._id}
          patientName={emergencyPatient.user.name}
          onSuccess={handleEmergencyAccessSuccess}
        />
      )}
    </div>
  );
};

export default EnhancedDoctorDashboard;
