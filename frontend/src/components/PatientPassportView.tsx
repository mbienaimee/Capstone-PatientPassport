import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Heart, 
  Pill, 
  Activity, 
  FileText, 
  AlertTriangle,
  Clock,
  Shield,
  X,
  Download,
  Printer,
  Edit3,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface PatientData {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  contactNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
  status: 'active' | 'inactive';
}

interface MedicalCondition {
  _id: string;
  name: string;
  details: string;
  diagnosed?: string;
  procedure?: string;
  status: 'active' | 'resolved' | 'chronic';
  doctor?: string;
  hospital?: string;
}

interface TestResult {
  _id: string;
  name: string;
  date: string;
  status: 'normal' | 'critical' | 'abnormal';
  findings: string;
  doctor: string;
  hospital?: string;
}

interface Medication {
  _id: string;
  name: string;
  dosage: string;
  status: 'active' | 'past';
  prescribingDoctor: string;
  datePrescribed: string;
  endDate?: string;
  hospital?: string;
}

interface HospitalVisit {
  _id: string;
  hospital: string;
  reason: string;
  date: string;
  doctor: string;
  notes?: string;
  diagnosis?: string;
}

interface PatientPassportViewProps {
  patientId: string;
  patientName: string;
  accessToken: string;
  onClose: () => void;
}

const PatientPassportView: React.FC<PatientPassportViewProps> = ({
  patientId,
  patientName,
  accessToken,
  onClose
}) => {
  const { showNotification } = useNotification();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [medicalData, setMedicalData] = useState<{
    conditions: MedicalCondition[];
    medications: Medication[];
    tests: TestResult[];
    visits: HospitalVisit[];
  }>({
    conditions: [],
    medications: [],
    tests: [],
    visits: []
  });

  // Ensure medicalData arrays are always arrays
  const ensureArray = (data: any, key: string) => {
    if (!data || typeof data !== 'object') return [];
    if (!Array.isArray(data[key])) return [];
    return data[key];
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'conditions' | 'medications' | 'tests' | 'visits'>('overview');
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingData, setEditingData] = useState<PatientData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'condition' | 'medication' | 'test' | 'visit' | null>(null);
  const [addFormData, setAddFormData] = useState({
    name: '',
    details: '',
    date: '',
    dosage: '',
    status: 'active',
    doctor: '',
    hospital: ''
  });
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [patientId, accessToken]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch patient passport data with access token
      try {
        const response = await apiService.getPatientPassportWithAccess(patientId, accessToken);
        
        if (response.success && response.data) {
          const data = response.data;
          setPatientData(data.patient || data);
          
          // Set medical data if available
          if (data.medicalData) {
            setMedicalData(data.medicalData);
          } else {
            // If medical data is not included, fetch it separately
            await fetchMedicalData();
          }
        } else {
          setError('Failed to load patient data');
        }
      } catch (passportError) {
        console.log('Passport access API failed, trying alternative approach:', passportError);
        
        // Fallback: Try to get basic patient data without passport access
        try {
          const patientResponse = await apiService.getPatient(patientId);
          if (patientResponse.success && patientResponse.data) {
            setPatientData((patientResponse.data as any) || null);
            await fetchMedicalData();
          } else {
            setError('Failed to load patient data');
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setError('Unable to load patient data. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Error loading patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalData = async (isRefresh = false) => {
    console.log('Fetching medical data for patient:', patientId);
    
    if (isRefresh) {
      setRefreshing(true);
    }
    
    try {
      const newMedicalData = {
        conditions: [],
        medications: [],
        tests: [],
        visits: []
      };

      // Use the access token for fetching medical data
      const makeAuthenticatedGetRequest = async (endpoint: string) => {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      };

      // Try to fetch medical conditions
      try {
        const conditionsResponse = await makeAuthenticatedGetRequest(`/medical/conditions/patient/${patientId}`);
        if (conditionsResponse.success && conditionsResponse.data) {
          newMedicalData.conditions = conditionsResponse.data;
          console.log('Fetched conditions:', conditionsResponse.data.length);
        }
      } catch (err) {
        console.log('Medical conditions endpoint not available or no data:', err);
      }

      // Try to fetch medications
      try {
        const medicationsResponse = await makeAuthenticatedGetRequest(`/medical/medications/patient/${patientId}`);
        if (medicationsResponse.success && medicationsResponse.data) {
          newMedicalData.medications = medicationsResponse.data;
          console.log('Fetched medications:', medicationsResponse.data.length);
        }
      } catch (err) {
        console.log('Medications endpoint not available or no data:', err);
      }

      // Try to fetch test results
      try {
        const testsResponse = await makeAuthenticatedGetRequest(`/medical/test-results/patient/${patientId}`);
        if (testsResponse.success && testsResponse.data) {
          newMedicalData.tests = testsResponse.data;
          console.log('Fetched tests:', testsResponse.data.length);
        }
      } catch (err) {
        console.log('Test results endpoint not available or no data:', err);
      }

      // Try to fetch hospital visits
      try {
        const visitsResponse = await makeAuthenticatedGetRequest(`/medical/hospital-visits/patient/${patientId}`);
        if (visitsResponse.success && visitsResponse.data) {
          newMedicalData.visits = visitsResponse.data;
          console.log('Fetched visits:', visitsResponse.data.length);
        }
      } catch (err) {
        console.log('Hospital visits endpoint not available or no data:', err);
      }

      // Update state with all fetched data
      setMedicalData(newMedicalData);
      console.log('Updated medical data:', newMedicalData);
      
    } catch (err) {
      console.log('Medical data endpoints not available - continuing with basic patient data:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a downloadable version of the passport
    const element = document.createElement('a');
    const file = new Blob([document.getElementById('passport-content')?.innerHTML || ''], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${patientName}-passport.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      setEditingData(patientData ? { ...patientData } : null);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSavePatientData = async () => {
    if (!editingData || !patientData) return;

    setSaving(true);
    try {
      // Update patient data with access token
      const response = await apiService.updatePatientPassportWithAccess(
        patientId, 
        accessToken, 
        editingData
      );

      if (response.success) {
        setPatientData(editingData);
        setIsEditMode(false);
        showNotification({
          type: 'success',
          title: 'Success!',
          message: 'Patient data updated successfully'
        });
      } else {
        throw new Error(response.message || 'Failed to update patient data');
      }
    } catch (error) {
      console.error('Error saving patient data:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update patient data. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingData(null);
  };

  const handleAddNew = (type: 'condition' | 'medication' | 'test' | 'visit') => {
    setAddModalType(type);
    setAddFormData({
      name: '',
      details: '',
      date: '',
      dosage: '',
      status: 'active',
      doctor: '',
      hospital: ''
    });
    setShowAddModal(true);
  };

  const handleDeleteItem = async (type: 'condition' | 'medication' | 'test' | 'visit', id: string) => {
    try {
      if (!accessToken) {
        showNotification({
          type: 'error',
          title: 'Authentication Error',
          message: 'Access token not found. Please request OTP again.'
        });
        return;
      }

      // Use the access token for API calls instead of the regular apiService.request
      const makeAuthenticatedDeleteRequest = async (endpoint: string) => {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}${endpoint}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Request failed');
        }

        return await response.json();
      };

      let response;
      switch (type) {
        case 'condition':
          response = await makeAuthenticatedDeleteRequest(`/medical/conditions/${id}`);
          break;
        case 'medication':
          response = await makeAuthenticatedDeleteRequest(`/medical/medications/${id}`);
          break;
        case 'test':
          response = await makeAuthenticatedDeleteRequest(`/medical/test-results/${id}`);
          break;
        case 'visit':
          response = await makeAuthenticatedDeleteRequest(`/medical/hospital-visits/${id}`);
          break;
      }

      if (response?.success) {
        // Refresh medical data from server to ensure consistency
        await fetchMedicalData(true);
        
        showNotification({
          type: 'success',
          title: 'Deleted',
          message: `${type} deleted successfully`
        });
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete ${type}. Please try again.`
      });
    }
  };

  const handleAddSave = async () => {
    if (!addModalType || !addFormData.name.trim() || !addFormData.details.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    // Get current user info for doctor ID
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = currentUser._id || currentUser.id;

    if (!doctorId) {
      showNotification({
        type: 'error',
        title: 'Authentication Error',
        message: 'Doctor ID not found. Please log in again.'
      });
      return;
    }

    if (!patientId) {
      showNotification({
        type: 'error',
        title: 'Data Error',
        message: 'Patient ID not found.'
      });
      return;
    }

    if (!accessToken) {
      showNotification({
        type: 'error',
        title: 'Authentication Error',
        message: 'Access token not found. Please request OTP again.'
      });
      return;
    }

    setAdding(true);
    try {
      let response;
      
      console.log('Current user:', currentUser);
      console.log('Doctor ID:', doctorId);
      console.log('Patient ID:', patientId);
      console.log('Access Token:', accessToken ? 'Present' : 'Missing');
      console.log('Add form data:', addFormData);

      // Use the access token for API calls instead of the regular apiService.request
      const makeAuthenticatedRequest = async (endpoint: string, body: any) => {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}${endpoint}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Request failed');
        }

        return await response.json();
      };

      switch (addModalType) {
        case 'condition':
          response = await makeAuthenticatedRequest('/medical/conditions', {
            patient: patientId,
            doctor: doctorId,
            name: addFormData.name,
            details: addFormData.details,
            diagnosed: addFormData.date || new Date().toISOString(),
            status: addFormData.status as 'active' | 'resolved' | 'chronic',
            hospital: addFormData.hospital || 'Current Hospital'
          });
          break;
        case 'medication':
          response = await makeAuthenticatedRequest('/medical/medications', {
            patient: patientId,
            doctor: doctorId,
            name: addFormData.name,
            dosage: addFormData.dosage,
            datePrescribed: addFormData.date || new Date().toISOString(),
            status: addFormData.status as 'active' | 'past',
            prescribingDoctor: addFormData.doctor || 'Current Doctor',
            hospital: addFormData.hospital || 'Current Hospital'
          });
          break;
        case 'test':
          response = await makeAuthenticatedRequest('/medical/test-results', {
            patient: patientId,
            doctor: doctorId,
            name: addFormData.name,
            date: addFormData.date || new Date().toISOString(),
            status: addFormData.status as 'normal' | 'critical' | 'abnormal',
            findings: addFormData.details,
            hospital: addFormData.hospital || 'Current Hospital'
          });
          break;
        case 'visit':
          response = await makeAuthenticatedRequest('/medical/hospital-visits', {
            patient: patientId,
            doctor: doctorId,
            hospital: addFormData.hospital || 'Current Hospital',
            reason: addFormData.name,
            date: addFormData.date || new Date().toISOString(),
            notes: addFormData.details
          });
          break;
      }

      if (response?.success && response.data) {
        console.log('Success response:', response);
        console.log('Adding to medical data:', addModalType, response.data);
        
        // Refresh medical data from server to ensure consistency
        await fetchMedicalData(true);

        showNotification({
          type: 'success',
          title: 'Success!',
          message: `${addModalType} added successfully`
        });

        setShowAddModal(false);
        setAddModalType(null);
        setAddFormData({
          name: '',
          details: '',
          date: '',
          dosage: '',
          status: 'active',
          doctor: '',
          hospital: ''
        });
      } else {
        console.error('API response failed:', response);
        throw new Error(response?.message || 'Failed to add medical data');
      }
    } catch (error) {
      console.error(`Error adding ${addModalType}:`, error);
      console.error('Error details:', error);
      
      let errorMessage = `Failed to add ${addModalType}. Please try again.`;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      showNotification({
        type: 'error',
        title: 'Add Failed',
        message: errorMessage
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">Loading patient passport...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Passport</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={fetchPatientData}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Patient Passport</h2>
                <p className="text-green-100">{patientName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Access Valid for 1 Hour</span>
              </div>
              
              {/* Edit Mode Controls */}
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSavePatientData}
                    disabled={saving}
                    className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    title="Save Changes"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    title="Cancel Edit"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Edit Patient Data"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => fetchMedicalData(true)}
                disabled={refreshing}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <Activity className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Download Passport"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'conditions', label: 'Medical Conditions', icon: Heart },
              { id: 'medications', label: 'Medications', icon: Pill },
              { id: 'tests', label: 'Test Results', icon: Activity },
              { id: 'visits', label: 'Hospital Visits', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]" id="passport-content">
          <div className="p-6">
            {activeTab === 'overview' && patientData && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editingData?.user?.name || ''}
                          onChange={(e) => setEditingData(prev => prev ? {
                            ...prev,
                            user: { ...prev.user, name: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{patientData.user?.name || 'Not available'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">National ID</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editingData?.nationalId || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, nationalId: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{patientData.nationalId || 'Not available'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      {isEditMode ? (
                        <input
                          type="date"
                          value={editingData?.dateOfBirth || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {patientData.dateOfBirth ? `${calculateAge(patientData.dateOfBirth)} years` : 'Not available'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      {isEditMode ? (
                        <select
                          value={editingData?.gender || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, gender: e.target.value as any } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900 capitalize">{patientData.gender || 'Not specified'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Blood Type</label>
                      {isEditMode ? (
                        <select
                          value={editingData?.bloodType || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, bloodType: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Blood Type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{patientData.bloodType || 'Not specified'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      {isEditMode ? (
                        <select
                          value={editingData?.status || 'active'}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, status: e.target.value as 'active' | 'inactive' } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          patientData.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {patientData.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      {isEditMode ? (
                        <input
                          type="email"
                          value={editingData?.user?.email || ''}
                          onChange={(e) => setEditingData(prev => prev ? {
                            ...prev,
                            user: { ...prev.user, email: e.target.value }
                          } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {patientData.user?.email || 'Not available'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      {isEditMode ? (
                        <input
                          type="tel"
                          value={editingData?.contactNumber || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, contactNumber: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {patientData.contactNumber || 'Not available'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      {isEditMode ? (
                        <textarea
                          value={editingData?.address || ''}
                          onChange={(e) => setEditingData(prev => prev ? { ...prev, address: e.target.value } : null)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {patientData.address || 'Not available'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {patientData.emergencyContact && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-lg font-semibold text-gray-900">{patientData.emergencyContact.name || 'Not available'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Relationship</label>
                        <p className="text-lg font-semibold text-gray-900">{patientData.emergencyContact.relationship || 'Not specified'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-lg font-semibold text-gray-900">{patientData.emergencyContact.phone || 'Not available'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Allergies */}
                {patientData.allergies && patientData.allergies.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                      Known Allergies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {patientData.allergies.map((allergy, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'conditions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-green-600" />
                    Medical Conditions
                  </h3>
                  <button
                    onClick={() => handleAddNew('condition')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Condition</span>
                  </button>
                </div>
                {medicalData.conditions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No medical conditions recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.conditions.map((condition) => (
                      <div key={condition._id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{condition.name}</h4>
                            <p className="text-gray-600 mb-3">{condition.details}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {condition.diagnosed && (
                                <div>
                                  <span className="font-medium text-gray-500">Diagnosed:</span>
                                  <p className="text-gray-900">{formatDate(condition.diagnosed)}</p>
                                </div>
                              )}
                              {condition.doctor && (
                                <div>
                                  <span className="font-medium text-gray-500">Doctor:</span>
                                  <p className="text-gray-900">{condition.doctor}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              condition.status === 'active' 
                                ? 'bg-red-100 text-red-800' 
                                : condition.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {condition.status === 'active' ? 'Active' : condition.status === 'resolved' ? 'Resolved' : 'Chronic'}
                            </span>
                            <button
                              onClick={() => handleDeleteItem('condition', condition._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Condition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'medications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-green-600" />
                    Medications
                  </h3>
                  <button
                    onClick={() => handleAddNew('medication')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Medication</span>
                  </button>
                </div>
                {medicalData.medications.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No medications recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.medications.map((medication) => (
                      <div key={medication._id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{medication.name}</h4>
                            <p className="text-gray-600 mb-3">Dosage: {medication.dosage}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Prescribed:</span>
                                <p className="text-gray-900">{formatDate(medication.datePrescribed)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Doctor:</span>
                                <p className="text-gray-900">{medication.prescribingDoctor}</p>
                              </div>
                              {medication.endDate && (
                                <div>
                                  <span className="font-medium text-gray-500">End Date:</span>
                                  <p className="text-gray-900">{formatDate(medication.endDate)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              medication.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {medication.status === 'active' ? 'Active' : 'Past'}
                            </span>
                            <button
                              onClick={() => handleDeleteItem('medication', medication._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Medication"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Test Results
                </h3>
                {medicalData.tests.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No test results recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.tests.map((test) => (
                      <div key={test._id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{test.name}</h4>
                            <p className="text-gray-600 mb-3">{test.findings}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Date:</span>
                                <p className="text-gray-900">{formatDate(test.date)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Doctor:</span>
                                <p className="text-gray-900">{test.doctor}</p>
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            test.status === 'normal' 
                              ? 'bg-green-100 text-green-800' 
                              : test.status === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {test.status === 'normal' ? 'Normal' : test.status === 'critical' ? 'Critical' : 'Abnormal'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  Hospital Visits
                </h3>
                {medicalData.visits.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hospital visits recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalData.visits.map((visit) => (
                      <div key={visit._id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{visit.reason}</h4>
                            {visit.diagnosis && (
                              <p className="text-gray-600 mb-3">Diagnosis: {visit.diagnosis}</p>
                            )}
                            {visit.notes && (
                              <p className="text-gray-600 mb-3">Notes: {visit.notes}</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-500">Date:</span>
                                <p className="text-gray-900">{formatDate(visit.date)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Doctor:</span>
                                <p className="text-gray-900">{visit.doctor}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">Hospital:</span>
                                <p className="text-gray-900">{visit.hospital}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Medical Data Modal */}
      {showAddModal && addModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add New {addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder={`Enter ${addModalType} name`}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
                  <textarea
                    rows={3}
                    value={addFormData.details}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, details: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder={`Enter ${addModalType} details`}
                    required
                  />
                </div>
                
                {(addModalType === 'medication' || addModalType === 'test' || addModalType === 'visit') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={addFormData.date}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                )}
                
                {addModalType === 'medication' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={addFormData.dosage}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 10mg twice daily"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={addFormData.status}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {addModalType === 'condition' ? (
                      <>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="chronic">Chronic</option>
                      </>
                    ) : addModalType === 'medication' ? (
                      <>
                        <option value="active">Active</option>
                        <option value="past">Past</option>
                      </>
                    ) : addModalType === 'test' ? (
                      <>
                        <option value="normal">Normal</option>
                        <option value="abnormal">Abnormal</option>
                        <option value="critical">Critical</option>
                      </>
                    ) : (
                      <option value="active">Active</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <input
                    type="text"
                    value={addFormData.doctor}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, doctor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Doctor name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                  <input
                    type="text"
                    value={addFormData.hospital}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, hospital: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Hospital name (optional)"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSave}
                  disabled={adding}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {adding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add {addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPassportView;
