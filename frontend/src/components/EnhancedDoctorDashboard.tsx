import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import PassportAccessOTP from './PassportAccessOTP';
import PatientPassportView from './PatientPassportView';
import EmergencyAccessModal from './EmergencyAccessModal';
import Logo from './Logo';
import { 
  Users, 
  Eye, 
  Shield, 
  LogOut,
  Bell,
  Activity,
  User,
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  Pill,
  Stethoscope,
  UserPlus,
  X
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

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
    console.log('=== DOCTOR DASHBOARD EFFECT ===');
    console.log('User:', user);
    console.log('IsLoading:', isLoading);
    
    // Wait for auth to complete
    if (isLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // Check if user is a doctor
    if (user && user.role !== 'doctor') {
      console.log('User is not a doctor, redirecting...');
      showNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to access the doctor dashboard.'
      });
      
      // Redirect based on user role
      if (user.role === 'patient') {
        navigate('/patient-passport');
      } else if (user.role === 'hospital') {
        navigate('/hospital-dashboard');
      } else {
        navigate('/');
      }
      return;
    }

    // If no user, redirect to login
    if (!user) {
      console.log('No user found, redirecting to login...');
      navigate('/doctor-login');
      return;
    }

    // User is doctor, initialize dashboard
    console.log('User is doctor, initializing dashboard...');
    initializeDashboard();
  }, [user, isLoading, navigate]);

  // Initialize dashboard
  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      return;
    }
    
    initializeDashboard();
  }, [user]);

  const initializeDashboard = async () => {
    try {
      setError(null);
      await Promise.all([
        fetchPatients(),
        fetchStats()
      ]);
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
      
      console.log('Fetching patients for doctor dashboard...');
      
      // Try multiple endpoints to get patients
      let patientsData: DoctorPatient[] = [];
      
      try {
        // Primary: Get all patients
        const response = await apiService.getPatients();
        console.log('Patients API response:', response);
        
        if (response.success && response.data) {
          patientsData = Array.isArray(response.data) ? response.data as unknown as DoctorPatient[] : [];
          console.log(`Successfully fetched ${patientsData.length} patients`);
        }
      } catch (patientsError) {
        console.warn('Primary patients API failed, trying alternative:', patientsError);
        
        // Fallback: Try doctor dashboard endpoint
        try {
          const dashboardResponse = await apiService.request('/dashboard/doctor');
          if (dashboardResponse.success && dashboardResponse.data) {
            const dashboardData = dashboardResponse.data as any;
            if (dashboardData.stats?.recentPatients) {
              patientsData = Array.isArray(dashboardData.stats.recentPatients) ? dashboardData.stats.recentPatients : [];
              console.log(`Fetched ${patientsData.length} patients from dashboard`);
            }
          }
        } catch (dashboardError) {
          console.error('All patient endpoints failed:', dashboardError);
          throw new Error('Unable to fetch patients from any endpoint');
        }
      }
      
      setPatients(patientsData);
      setStats(prev => ({ 
        ...prev, 
        totalPatients: patientsData.length
      }));
      
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
      setStats(prev => ({ 
        ...prev, 
        systemStatus: 'offline'
      }));
    }
  };

  // Patient access workflow
  const handleViewPatient = async (patient: DoctorPatient) => {
    console.log('Doctor requesting access to patient:', patient.user?.name);
    setSelectedPatient(patient);
    setShowOTPModal(true);
  };

  // Emergency access workflow
  const handleEmergencyAccess = (patient: DoctorPatient) => {
    console.log('Doctor requesting EMERGENCY access to patient:', patient.user?.name);
    setEmergencyPatient(patient);
    setShowEmergencyModal(true);
  };

  const handleEmergencyAccessSuccess = async (accessData: any) => {
    console.log('🚨 EMERGENCY ACCESS GRANTED - Opening passport...');
    
    // Close modal and show loading immediately for better UX
    setShowEmergencyModal(false);
    setIsLoadingEmergencyAccess(true);
    setIsEmergencyAccess(true);
    
    try {
      const patientId = accessData.data?.patientId || emergencyPatient?._id;
      
      if (!patientId) {
        throw new Error('Patient ID not found');
      }
      
      console.log('📋 Fetching passport data...');
      
      // Fetch passport data
      const passportResponse = await apiService.getPatientPassport(patientId);
      
      if (passportResponse.success && passportResponse.data) {
        console.log('✅ Passport fetched successfully');
        
        // Set all state and open passport view
        setPassportData(passportResponse.data);
        setSelectedPatient(emergencyPatient);
        setShowPassportView(true);
        
        showNotification({
          type: 'success',
          title: '🚨 Emergency Access Granted',
          message: `Access to ${emergencyPatient?.user?.name}'s records is now active.`
        });
      } else {
        throw new Error(passportResponse.message || 'Failed to fetch passport');
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      
      showNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to open passport: ${error.message || 'Unknown error'}`
      });
      
      // Reset emergency state on error
      setIsEmergencyAccess(false);
    } finally {
      setIsLoadingEmergencyAccess(false);
    }
  };

  const handleOTPSuccess = async (otpResponseData: any) => {
    console.log('OTP verification successful, granting access to:', selectedPatient?.user?.name);
    console.log('OTP Response data:', otpResponseData);
    
    try {
      // Extract patientId from OTP response
      const patientId = otpResponseData.patientId || selectedPatient?._id;
      
      if (!patientId) {
        console.error('No patientId found in OTP response');
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to retrieve patient information. Please try again.'
        });
        return;
      }
      
      console.log('Fetching complete passport data for patient:', patientId);
      
      // Fetch the complete passport data with medicalRecords
      const passportResponse = await apiService.getPatientPassport(patientId);
      
      if (passportResponse.success && passportResponse.data) {
        console.log('✅ Complete passport data fetched:', passportResponse.data);
        setPassportData(passportResponse.data);
        setShowOTPModal(false);
        setIsEmergencyAccess(false); // This is normal access, not emergency
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
      console.error('Error fetching complete passport data:', error);
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
    setIsEmergencyAccess(false); // Reset emergency flag
    
    showNotification({
      type: 'info',
      title: 'Access Closed',
      message: 'Patient passport access has been closed.'
    });
  };

  const handlePassportUpdate = (updatedPassport: any) => {
    console.log('Passport updated:', updatedPassport);
    setPassportData(updatedPassport); // Update the passport data
    showNotification({
      type: 'success',
      title: 'Passport Updated',
      message: 'Patient passport has been updated successfully.'
    });
  };

  const handleCancelOTP = () => {
    console.log('OTP request cancelled');
    setShowOTPModal(false);
    setSelectedPatient(null);
    
    showNotification({
      type: 'info',
      title: 'Access Request Cancelled',
      message: 'Patient passport access request was cancelled.'
    });
  };

  // Add Patient Functions
  const handleAddPatient = () => {
    setShowAddPatientForm(true);
  };

  const handleCloseAddPatientForm = () => {
    setShowAddPatientForm(false);
    setNewPatientForm({
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
        fetchPatients(true); // Refresh patient list
      }
    } catch (error) {
      console.error('Error adding patient:', error);
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
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setNewPatientForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Search and filter functions
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

  // Authentication check
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not a doctor
  if (!user || user.role !== 'doctor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access the doctor dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Emergency Access Loading Overlay */}
      {isLoadingEmergencyAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="text-lg font-semibold text-gray-900">Opening Patient Passport...</p>
              <p className="text-sm text-gray-600">Emergency access granted</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" className="text-green-600" />
            </div>
            <div className="relative flex items-center gap-4">
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Doctor Portal</h1>
                {/* <p className="text-xs sm:text-sm text-gray-600">Patient Passport Management System</p> */}
                <p className="text-xs text-green-600 mt-1">👥 View your assigned patients below</p>
              </div>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 border border-green-200"
              >
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-green-600">Doctor</p>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 top-12 mt-2 w-40 sm:w-48 bg-white rounded-xl shadow-xl border border-green-200 py-2 z-[999]">
                  <div className="px-3 sm:px-4 py-3 border-b border-green-100">
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
                    className="w-full flex items-center px-3 sm:px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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
      
              {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-md shadow border border-green-200/50 px-4 py-2 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-16 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-md shadow border border-green-200/50 px-4 py-2 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
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

          <div className="bg-white rounded-md shadow border border-green-200/50 px-4 py-2 hover:shadow-md transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 bg-gradient-to-br rounded-md flex items-center justify-center ${
                  stats.systemStatus === 'online' 
                    ? 'from-green-500 to-green-600' 
                    : 'from-red-500 to-red-600'
                }`}>
                  {stats.systemStatus === 'online' ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">System Status</p>
                  <p className={`text-lg font-bold ${
                    stats.systemStatus === 'online' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.systemStatus === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`h-3 w-3 rounded-full animate-pulse ${
                  stats.systemStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-md p-4 sm:p-6 lg:px-4 lg:py-4 mb-6 sm:mb-8 text-gray-900 shadow">
          <div className="absolute inset-0 bg-white"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500/30" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Welcome back, Dr. {user?.name?.split(' ')[1] || user?.name}</h1>
                    <p className="text-green-700 text-sm sm:text-base lg:text-lg">Access patient passports and manage medical records</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 lg:mt-0 lg:block">
                <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-green-500/30">
                  <div className="text-center">
                    <p className="text-green-700 text-xs sm:text-sm font-medium">Total Patients</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">{stats.totalPatients}</p>
                    <div className="mt-2 h-1 bg-green-500/30 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500/60 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Management Section */}
        <div className="bg-white rounded-md border border-slate-200 border-green-200/50 mb-8 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700">Patient Passport Access</h2>
                </div>
                <p className="text-green-800 text-lg">Request OTP access to view patient medical records</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-green-500/30">
                  <span className="text-sm font-semibold text-green-700">{stats.totalPatients} Patients Available</span>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-6 py-2 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-700 rounded-xl hover:bg-green-500/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-3">
                  🔍 Search Patients
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by name, national ID, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="lg:w-64">
                <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-3">
                  📊 Filter by Status
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={handleFilterChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-gray-50 hover:bg-white transition-colors"
                  >
                    <option value="all">All Patients</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
              <div className="lg:w-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  ➕ Actions
                </label>
                <button
                  onClick={handleAddPatient}
                  className="w-full lg:w-auto px-6 py-2 text-sm bg-green-700 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow hover:shadow-md flex items-center justify-center space-x-2"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Add New Patient</span>
                </button>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="bg-green-100 border border-green-200 rounded-md px-6 py-2 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-base font-semibold text-gray-900">
                    📋 Showing {currentPatients.length} of {filteredPatients.length} patients
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
        <div className="bg-white rounded shadow border border-green-200/50 overflow-hidden">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600 font-medium">Loading patients...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-dashed border-red-300">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <AlertCircle className="h-12 w-12 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Error Loading Patients</h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="bg-red-600 text-white px-8 py-4 rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchTerm || filterStatus !== 'all' ? '🔍 No patients found' : '📋 No patients registered'}
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
                  <div key={patient._id} className="group bg-gradient-to-r from-white to-green-50/30 rounded-md border border-green-200/50 hover:border-green-300 transition-all duration-300 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded flex items-center justify-center shadow">
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
                            {patient.user?.name || 'Unknown Patient'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">ID: {patient.nationalId || 'N/A'}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">Email: {patient.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="group-hover:flex hidden flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                          patient.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {patient.status === 'active' ? '✅ Active' : '❌ Inactive'}
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Request Access</span>
                          </button>
                          <button
                            onClick={() => handleEmergencyAccess(patient)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 border-2 border-green-800"
                          >
                            <span>Emergency Access</span>
                          </button>
                        </div>
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
      {showPassportView && selectedPatient && passportData && (
        <PatientPassportView
          passportData={passportData}
          patientId={selectedPatient._id}
          onClose={handleClosePassportView}
          onUpdate={handlePassportUpdate}
          isEmergencyAccess={isEmergencyAccess}
        />
      )}

      {/* Add Patient Modal */}
      {showAddPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Add New Patient</h2>
                <p className="text-green-100 text-sm mt-1">Enter patient information to create a new record</p>
              </div>
              <button
                onClick={handleCloseAddPatientForm}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPatient} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-green-600" />
                    Personal Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newPatientForm.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newPatientForm.email}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID *
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={newPatientForm.nationalId}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="1234567890123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={newPatientForm.dateOfBirth}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={newPatientForm.gender}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={newPatientForm.contactNumber}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={newPatientForm.address}
                    onChange={handleFormChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="123 Main St, City, Country"
                  />
                </div>

                {/* Medical Information */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                    Medical Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    value={newPatientForm.bloodType}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={newPatientForm.allergies}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Penicillin, Peanuts"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-600" />
                    Emergency Contact
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={newPatientForm.emergencyContact.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={newPatientForm.emergencyContact.relationship}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Spouse, Parent, Sibling"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={newPatientForm.emergencyContact.phone}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseAddPatientForm}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Patient...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Access Modal */}
      {showEmergencyModal && emergencyPatient && (
        <EmergencyAccessModal
          isOpen={showEmergencyModal}
          onClose={() => {
            setShowEmergencyModal(false);
            setEmergencyPatient(null);
          }}
          patientId={emergencyPatient._id}
          patientName={emergencyPatient.user.name}
          onSuccess={handleEmergencyAccessSuccess}
        />
      )}
    </div>
  );
};

export default EnhancedDoctorDashboard;















