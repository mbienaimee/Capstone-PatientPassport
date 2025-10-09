import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Phone, 
  MapPin, 
  Shield, 
  LogOut, 
  UserPlus, 
  Edit, 
  Trash2, 
  Key, 
  LogIn,
  Stethoscope,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import Logo from './Logo';
import DoctorManagement from './DoctorManagement';
import { apiService } from '../services/api';

const HospitalDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'patients'>('overview');
  const [hospitalId, setHospitalId] = useState<string>('');
  const [hospitalInfo, setHospitalInfo] = useState<{
    _id: string;
    name: string;
    address: string;
    contact: string;
    licenseNumber: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is a hospital
    if (user && user.role !== 'hospital') {
      navigate('/');
      return;
    }
    fetchHospitalInfo();
  }, [user, navigate]);

  const fetchHospitalInfo = async () => {
    try {
      setLoading(true);
      // Get hospital dashboard data which includes hospital info
      const response = await apiService.request('/dashboard/hospital');
      console.log('Hospital dashboard response:', response);
      
      if (response.success && response.data) {
        const { hospital } = response.data;
        if (hospital) {
          setHospitalId(hospital._id);
          setHospitalInfo(hospital);
          console.log('Hospital info loaded:', hospital);
        } else {
          console.error('No hospital data found in response:', response);
        }
      } else {
        console.error('Failed to get hospital dashboard:', response);
      }
    } catch (error) {
      console.error('Error fetching hospital info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/hospital-login');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if hospital info not found
  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Hospital Information</h1>
          <p className="text-gray-600 mb-6">Please wait while we load your hospital information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-xl mr-4">
                <Logo size="sm" className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
                <p className="text-sm text-green-600 font-medium">Medical Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user?.name}</p>
                <p className="text-xs text-green-600">Hospital Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Hospital Management Center</h2>
          <p className="text-lg text-gray-600">Manage your hospital operations and medical staff efficiently</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 mb-8">
          <nav className="flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-6 px-4 border-b-4 font-semibold text-lg transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300'
              }`}
            >
              <Building2 className="inline-block w-5 h-5 mr-2" />
              Hospital Details
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`py-6 px-4 border-b-4 font-semibold text-lg transition-all duration-200 ${
                activeTab === 'doctors'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300'
              }`}
            >
              <Stethoscope className="inline-block w-5 h-5 mr-2" />
              Medical Staff
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`py-6 px-4 border-b-4 font-semibold text-lg transition-all duration-200 ${
                activeTab === 'patients'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300'
              }`}
            >
              <Users className="inline-block w-5 h-5 mr-2" />
              Patients
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hospital Information Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-green-100 rounded-2xl mr-6">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Hospital Information</h3>
                  <p className="text-gray-600">Complete hospital details and status</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-3">
                    <Building2 className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="font-semibold text-gray-900">Hospital Name</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-800">{hospitalInfo.name}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-3">
                    <Shield className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="font-semibold text-gray-900">License Number</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-800">{hospitalInfo.licenseNumber}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-3">
                    <Activity className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="font-semibold text-gray-900">Status</h4>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    hospitalInfo.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {hospitalInfo.status === 'active' ? '✓ Active' : '⚠ Pending'}
                  </span>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 md:col-span-2">
                  <div className="flex items-center mb-3">
                    <MapPin className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="font-semibold text-gray-900">Address</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-800">{hospitalInfo.address}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-3">
                    <Phone className="h-6 w-6 text-green-600 mr-3" />
                    <h4 className="font-semibold text-gray-900">Contact</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-800">{hospitalInfo.contact}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="flex items-center mb-3">
                    <Stethoscope className="h-8 w-8 mr-3" />
                    <h4 className="text-xl font-bold">Manage Doctors</h4>
                  </div>
                  <p className="text-green-100">Add, edit, and manage medical staff</p>
                </button>
                
                <button
                  onClick={() => navigate('/doctor-patient-passport')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="flex items-center mb-3">
                    <Users className="h-8 w-8 mr-3" />
                    <h4 className="text-xl font-bold">Patient Records</h4>
                  </div>
                  <p className="text-blue-100">Access patient medical records</p>
                </button>
                
                <button
                  onClick={() => navigate('/search-patient')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="flex items-center mb-3">
                    <Calendar className="h-8 w-8 mr-3" />
                    <h4 className="text-xl font-bold">Search Patients</h4>
                  </div>
                  <p className="text-purple-100">Find and view patient information</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && hospitalId && (
          <DoctorManagement hospitalId={hospitalId} />
        )}
      </main>
    </div>
  );
};

export default HospitalDashboard;

