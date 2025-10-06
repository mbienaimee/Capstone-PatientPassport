import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Settings, LogOut } from 'lucide-react';
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
      // Get current user's hospital info
      const response = await apiService.getCurrentUser();
      console.log('Current user response:', response);
      
      if (response.success && response.data) {
        // Check if profile exists in the response
        const profile = (response.data as { profile?: { _id: string; name: string; address: string; contact: string; licenseNumber: string; status: string } }).profile;
        if (profile) {
          // The profile should contain hospital info
          const hospital = profile;
          setHospitalId(hospital._id);
          setHospitalInfo(hospital);
          console.log('Hospital info loaded:', hospital);
        } else {
          console.error('No hospital profile found in response:', response);
          // If no profile found, try to get hospital info from localStorage
          const hospitalAuth = localStorage.getItem('hospitalAuth');
          if (hospitalAuth) {
            try {
              const hospitalData = JSON.parse(hospitalAuth);
              if (hospitalData.hospital) {
                setHospitalId(hospitalData.hospital._id);
                setHospitalInfo(hospitalData.hospital);
                console.log('Hospital info loaded from localStorage:', hospitalData.hospital);
              }
            } catch (error) {
              console.error('Error parsing hospital auth data:', error);
            }
          }
        }
      } else {
        console.error('Failed to get current user:', response);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="sm" className="mr-4" />
              <h1 className="text-xl font-semibold text-gray-900">Hospital Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Management</h2>
          <p className="text-gray-600">Manage your hospital operations and patient records</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'patients'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Patients
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Hospital Information */}
            <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏥 Hospital Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Hospital Name</p>
                  <p className="font-medium text-gray-900">{hospitalInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">License Number</p>
                  <p className="font-medium text-gray-900">{hospitalInfo.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{hospitalInfo.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium text-gray-900">{hospitalInfo.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    hospitalInfo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {hospitalInfo.status}
                  </span>
                </div>
              </div>
            </div>

        {/* Patient Passport Section */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🏥 Patient Passport Access</h2>
              <p className="text-gray-600">Access patient medical records through Patient Passport system</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Access */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">👨‍⚕️ Doctor Access</h3>
              <p className="text-sm text-gray-600 mb-4">Doctors can access Patient Passport records with proper authorization</p>
              <button
                onClick={() => navigate('/doctor-patient-passport')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Access Patient Passport
              </button>
            </div>

            {/* Patient Management */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">👥 Patient Management</h3>
              <p className="text-sm text-gray-600 mb-4">Manage patients registered in Patient Passport system</p>
              <button
                onClick={() => navigate('/patient-list')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Patients
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Medical Records Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Medical Records</h3>
                <p className="text-sm text-gray-600">Access patient medical data</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/search-patient')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Search Records
              </button>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Hospital configuration</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/hospital-settings')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Total Patients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Active Records</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
            </div>
          </div>
        </div>
          </div>
        )}

        {activeTab === 'doctors' && hospitalId && (
          <DoctorManagement hospitalId={hospitalId} />
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Management</h3>
            <p className="text-gray-600">Patient management features will be available here.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HospitalDashboard;

