import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Phone, Mail, Calendar, Filter, Eye, UserPlus, X } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface Patient {
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
  status: 'active' | 'inactive';
  createdAt: string;
  assignedDoctors?: Array<{
    _id: string;
    specialization: string;
    user: {
      name: string;
    };
  }>;
}

interface PatientListProps {
  hospitalId: string;
  onViewPatient?: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ hospitalId, onViewPatient }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  const hasFetchedRef = useRef(false);
  const currentHospitalIdRef = useRef<string | null>(null);
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
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching patients for hospital:', hospitalId);
      const response = await apiService.getHospitalPatients(hospitalId);
      console.log('📊 Patients API response:', response);
      
      if (response.success && response.data) {
        // Handle both array and object responses
        let patientsData = Array.isArray(response.data) ? response.data : [];
        
        console.log('✅ Setting patients, count:', patientsData.length);
        console.log('📝 First patient sample:', patientsData[0]);
        
        setPatients(patientsData);
        hasFetchedRef.current = true;
        
        if (patientsData.length === 0) {
          console.log('⚠️  No patients returned from API');
        }
      } else {
        console.error('❌ Failed to fetch patients:', response);
        setError(response.message || 'Failed to fetch patients');
      }
    } catch (err: any) {
      console.error('❌ Error fetching patients:', err);
      setError(err.message || 'Error loading patients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    // Only fetch if hospitalId changed or it's the first fetch
    if (hospitalId && (!hasFetchedRef.current || currentHospitalIdRef.current !== hospitalId)) {
      console.log('🏥 PatientList: hospitalId changed, fetching patients:', hospitalId);
      currentHospitalIdRef.current = hospitalId;
      fetchPatients();
    } else if (hospitalId && hasFetchedRef.current) {
      console.log('✅ PatientList: Data already loaded for this hospital, skipping refetch');
    }
  }, [hospitalId, fetchPatients]);

  const filteredPatients = patients.filter(patient => {
    // Safety check: skip patients without user data
    if (!patient.user || !patient.user.name) {
      console.warn('⚠️  Patient missing user data:', patient._id);
      return false;
    }
    
    const matchesSearch = 
      patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contactNumber.includes(searchTerm) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  console.log('🔍 Filter Debug:', {
    totalPatients: patients.length,
    filteredCount: filteredPatients.length,
    searchTerm,
    statusFilter
  });

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
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: ''
    });
  };

  const handleSubmitNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const patientData = {
        name: newPatientForm.name,
        email: newPatientForm.email,
        nationalId: newPatientForm.nationalId,
        dateOfBirth: newPatientForm.dateOfBirth,
        gender: newPatientForm.gender,
        contactNumber: newPatientForm.contactNumber,
        address: newPatientForm.address,
        bloodType: newPatientForm.bloodType || undefined,
        allergies: newPatientForm.allergies ? newPatientForm.allergies.split(',').map(a => a.trim()) : [],
        emergencyContact: {
          name: newPatientForm.emergencyContactName,
          phone: newPatientForm.emergencyContactPhone,
          relation: newPatientForm.emergencyContactRelation
        },
        hospitalId: hospitalId
      };

      const response = await apiService.request('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData)
      });

      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Patient Added',
          message: `${newPatientForm.name} has been added successfully!`
        });
        
        handleCloseAddPatientForm();
        // Force refetch by resetting the flag
        hasFetchedRef.current = false;
        fetchPatients(); // Refresh the patient list
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add patient. Please try again.'
      });
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setNewPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading patients...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Patients</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPatients}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <User className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Patient List</h2>
            <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredPatients.length} patients
            </span>
          </div>
          <button
            onClick={handleAddPatient}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Patient
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name, ID, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No patients match your search criteria.' 
                : 'No patients have visited this hospital yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPatients.map((patient) => (
              <div key={patient._id} className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">{patient.user.name}</span>
                    <div className="text-sm text-gray-500">
                      ID: {patient.nationalId} • {patient.contactNumber}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  {user?.role === 'doctor' && onViewPatient && (
                    <button
                      onClick={() => onViewPatient(patient)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-green-200 sticky top-0 bg-white">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Add New Patient</h3>
              </div>
              <button
                onClick={handleCloseAddPatientForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitNewPatient} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newPatientForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newPatientForm.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      National ID *
                    </label>
                    <input
                      type="text"
                      value={newPatientForm.nationalId}
                      onChange={(e) => handleFormChange('nationalId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={newPatientForm.dateOfBirth}
                      onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={newPatientForm.gender}
                      onChange={(e) => handleFormChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={newPatientForm.contactNumber}
                      onChange={(e) => handleFormChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      value={newPatientForm.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Type
                    </label>
                    <select
                      value={newPatientForm.bloodType}
                      onChange={(e) => handleFormChange('bloodType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allergies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newPatientForm.allergies}
                      onChange={(e) => handleFormChange('allergies', e.target.value)}
                      placeholder="e.g., Penicillin, Peanuts"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newPatientForm.emergencyContactName}
                        onChange={(e) => handleFormChange('emergencyContactName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={newPatientForm.emergencyContactPhone}
                        onChange={(e) => handleFormChange('emergencyContactPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relation *
                      </label>
                      <input
                        type="text"
                        value={newPatientForm.emergencyContactRelation}
                        onChange={(e) => handleFormChange('emergencyContactRelation', e.target.value)}
                        placeholder="e.g., Mother, Spouse"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseAddPatientForm}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Add Patient
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
