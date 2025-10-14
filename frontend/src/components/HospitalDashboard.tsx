import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  LogOut, 
  Stethoscope,
  User,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Activity,
  FileText,
  Bell
} from 'lucide-react';
import Logo from './Logo';
import DoctorManagement from './DoctorManagement';
import PatientList from './PatientList';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface HospitalInfo {
  _id: string;
  name: string;
  address: string;
  contact: string;
  licenseNumber: string;
  status: string;
}

interface UserResponse {
  success: boolean;
  data: {
    profile?: HospitalInfo;
    [key: string]: unknown;
  };
}

interface HospitalStats {
  totalDoctors: number;
  totalPatients: number;
  recentPatients: unknown[];
  recentMedicalConditions: unknown[];
  recentTestResults: unknown[];
}

const HospitalDashboard: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'patients'>('doctors');
  const [hospitalId, setHospitalId] = useState<string>('');
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats | null>(null);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHospitalInfo = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('=== FETCHING HOSPITAL INFO ===');
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('User ID:', user?._id);

      // Check if user is properly authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (user.role !== 'hospital') {
        throw new Error('User is not a hospital');
      }

      // Add caching to prevent excessive API calls
      const cacheKey = `hospital-info-${user._id}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = 30000; // 30 seconds cache
      
      if (!isRetry && cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < cacheTime) {
            console.log('Using cached hospital data');
            setHospitalId(parsed.data.hospital._id);
            setHospitalInfo(parsed.data.hospital);
            setHospitalStats(parsed.data.stats || null);
            return;
          }
        } catch (error) {
          console.error('Error parsing cached data:', error);
        }
      }

      // Try to get hospital dashboard data
      console.log('Calling hospital dashboard API...');
      let response;
      try {
        response = await apiService.request('/dashboard/hospital');
        console.log('Hospital dashboard response:', response);
      } catch (dashboardError) {
        console.error('Dashboard endpoint failed, trying fallback method:', dashboardError);
        
        // Fallback: Get hospital info directly from user profile
        console.log('Trying fallback method to get hospital info...');
        const userResponse = await apiService.request('/auth/me');
        console.log('User profile response:', userResponse);
        
        if (userResponse.success && (userResponse as UserResponse).data.profile) {
          const hospitalProfile = (userResponse as UserResponse).data.profile!;
          response = {
            success: true,
            data: {
              hospital: {
                _id: hospitalProfile._id,
                name: hospitalProfile.name,
                address: hospitalProfile.address || '',
                contact: hospitalProfile.contact || '',
                licenseNumber: hospitalProfile.licenseNumber || '',
                status: hospitalProfile.status || 'active'
              },
              stats: {
                totalDoctors: 0,
                totalPatients: 0,
                recentPatients: [],
                recentMedicalConditions: [],
                recentTestResults: []
              }
            }
          };
          console.log('Fallback hospital data:', response);
        } else {
          throw dashboardError; // Re-throw original error if fallback fails
        }
      }
      
      if (response.success && response.data) {
        const data = response.data as { 
          hospital?: HospitalInfo;
          stats?: HospitalStats;
        };
        
        console.log('Dashboard data received:', data);
        
        if (data.hospital) {
          setHospitalId(data.hospital._id);
          setHospitalInfo(data.hospital);
          setHospitalStats(data.stats || null);
          console.log('Hospital info loaded successfully:', data.hospital);
          
          // Cache the data
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
          }));
          
          showNotification({
            type: 'success',
            title: 'Dashboard Loaded',
            message: `Welcome to ${data.hospital.name} dashboard`
          });
        } else {
          console.error('No hospital data found in response:', response);
          throw new Error('Hospital data not found in response');
        }
      } else {
        console.error('Failed to get hospital dashboard:', response);
        throw new Error(response.message || 'Failed to load hospital dashboard');
      }
    } catch (error) {
      console.error('Error fetching hospital info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Show user-friendly error message
      showNotification({
        type: 'error',
        title: 'Dashboard Error',
        message: `Failed to load hospital dashboard: ${errorMessage}`
      });

      // If it's an authentication error, redirect to login
      if (errorMessage.includes('not authenticated') || errorMessage.includes('401')) {
        console.log('Authentication error detected, redirecting to login...');
        setTimeout(() => {
          logout();
          navigate('/hospital-login');
        }, 2000);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, logout, navigate, showNotification]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchHospitalInfo(true);
  };

  const handleRefresh = () => {
    fetchHospitalInfo(true);
  };

  useEffect(() => {
    console.log('=== HOSPITAL DASHBOARD EFFECT ===');
    console.log('User:', user);
    console.log('IsLoading:', isLoading);
    
    // Wait for auth to complete
    if (isLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // Check if user is a hospital
    if (user && user.role !== 'hospital') {
      console.log('User is not a hospital, redirecting...');
      navigate('/');
      return;
    }

    // If no user, redirect to login
    if (!user) {
      console.log('No user found, redirecting to login...');
      navigate('/hospital-login');
      return;
    }

    // Fetch hospital info
    console.log('User is hospital, fetching info...');
    fetchHospitalInfo();
  }, [user, isLoading, navigate, fetchHospitalInfo]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/hospital-login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('hospitalAuth');
      navigate('/hospital-login');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !hospitalId) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={refreshing}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Retrying...' : 'Try Again'}</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              Retry attempt: {retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error if hospital info not found
  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hospital Information Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load hospital information. Please contact support.</p>
          <button
            onClick={handleLogout}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Show error if hospital info is not loaded
  if (!hospitalInfo) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Hospital Information</h1>
          <p className="text-gray-600 mb-6">Please wait while we load your hospital information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" className="text-green-600" />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Hospital Portal</h1>
                <p className="text-xs sm:text-sm text-gray-600">Medical Management System</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Dashboard"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 border border-green-200"
                >
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-green-600">Hospital Admin</p>
                  </div>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-xl shadow-xl border border-green-200 py-2 z-50">
                    <div className="px-3 sm:px-4 py-3 border-b border-green-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-green-600 font-medium">{hospitalInfo?.name}</p>
                    </div>
                    <button
                      onClick={handleLogout}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Welcome to {hospitalInfo?.name}</h1>
                    <p className="text-green-100 text-sm sm:text-base lg:text-lg">Comprehensive Medical Management System</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 lg:mt-0 lg:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30">
                  <div className="text-center">
                    <p className="text-green-100 text-xs sm:text-sm font-medium">System Status</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Online</p>
                    <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{width: '100%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Total Doctors</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{hospitalStats?.totalDoctors || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-12 sm:w-16 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Total Patients</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{hospitalStats?.totalPatients || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-12 sm:w-16 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Active Cases</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{hospitalStats?.recentPatients?.length || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-12 sm:w-16 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">System Health</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">100%</p>
                </div>
              </div>
              <div className="text-right">
                <div className="h-2 w-12 sm:w-16 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-green-200/50 mb-6">
          <nav className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Hospital Details</span>
              <span className="sm:hidden">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'doctors'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Medical Staff</span>
              <span className="sm:hidden">Doctors</span>
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === 'patients'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Patients</span>
              <span className="sm:hidden">Patients</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hospital Information */}
            <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Hospital Information</h2>
                    <p className="text-sm text-gray-600">Complete hospital details and status</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide">Hospital Name</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{hospitalInfo?.name}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide">License Number</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{hospitalInfo?.licenseNumber}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      hospitalInfo?.status === 'active' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : hospitalInfo?.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {hospitalInfo?.status === 'active' ? '✅ Active' : 
                       hospitalInfo?.status === 'pending' ? '⏳ Pending' : '❌ Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 md:col-span-2">
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide">Address</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{hospitalInfo?.address}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <label className="text-xs font-semibold text-green-600 uppercase tracking-wide">Contact</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{hospitalInfo?.contact}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <p className="text-sm text-gray-600">Latest hospital operations and updates</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">New Patient Registration</p>
                    <p className="text-xs text-gray-600">Patient John Doe registered successfully</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">2 min ago</span>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Doctor Assignment</p>
                    <p className="text-xs text-gray-600">Dr. Smith assigned to Patient ID #12345</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">15 min ago</span>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Medical Report Generated</p>
                    <p className="text-xs text-gray-600">Lab results for Patient ID #12345 completed</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">1 hour ago</span>
                </div>
              </div>
            </div>

            {/* Hospital Statistics */}
            {hospitalStats && (
              <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Stethoscope className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.totalDoctors}</p>
                    <p className="text-sm text-gray-600">Total Doctors</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.totalPatients}</p>
                    <p className="text-sm text-gray-600">Total Patients</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Building2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.recentPatients?.length || 0}</p>
                    <p className="text-sm text-gray-600">Recent Patients</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="flex items-center p-4 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Stethoscope className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Doctors</h4>
                    <p className="text-sm text-gray-500">Add and manage medical staff</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/doctor-patient-passport')}
                  className="flex items-center p-4 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Patient Records</h4>
                    <p className="text-sm text-gray-500">Access patient medical records</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && hospitalId && (
          <DoctorManagement hospitalId={hospitalId} />
        )}

        {activeTab === 'patients' && hospitalId && (
          <PatientList 
            hospitalId={hospitalId} 
            onViewPatient={(patient) => {
              console.log('View patient:', patient);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default HospitalDashboard;