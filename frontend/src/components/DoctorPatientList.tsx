import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { X, Search, User, Calendar, Phone, MapPin, Eye } from 'lucide-react';

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
}

interface DoctorPatientListProps {
  doctor: {
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    licenseNumber: string;
    specialization: string;
  };
  onClose: () => void;
}

const DoctorPatientList: React.FC<DoctorPatientListProps> = ({ doctor, onClose }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [permissionReason, setPermissionReason] = useState('');
  const [requestedData, setRequestedData] = useState<string[]>([]);
  const [submittingPermission, setSubmittingPermission] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Filter patients based on search term
    const filtered = patients.filter(patient =>
      patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nationalId.includes(searchTerm) ||
      patient.contactNumber.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/patients');
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patientId: string) => {
    try {
      // First check if doctor already has access
      const accessCheckResponse = await apiService.request(`/access-control/check-access/${patientId}`);
      
      if (accessCheckResponse.success && accessCheckResponse.data.hasAccess) {
        // Doctor has access, open patient passport
        window.open(`/patient-passport/${patientId}`, '_blank');
      } else {
        // Doctor doesn't have access, show permission request modal
        setSelectedPatient(patientId);
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      // If error, show permission request modal
      setSelectedPatient(patientId);
      setShowPermissionModal(true);
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

  const handlePermissionRequest = async () => {
    if (!selectedPatient || !permissionReason.trim() || requestedData.length === 0) {
      alert('Please provide a reason and select at least one data type to request.');
      return;
    }

    try {
      setSubmittingPermission(true);
      
      // Get hospital ID from doctor's context (you might need to adjust this)
      const hospitalId = '68e42c3f7987fd304342bd9d'; // This should come from doctor's hospital
      
      const response = await apiService.request('/access-control/request', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient List</h2>
            <p className="text-sm text-gray-600">Dr. {doctor.user.name} - {doctor.specialization}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search patients by name, ID, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <User className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No patients match your search criteria.' : 'No patients are registered in the system.'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredPatients.map((patient) => (
                  <div key={patient._id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{patient.user.name}</h4>
                          <p className="text-sm text-gray-600">ID: {patient.nationalId}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {calculateAge(patient.dateOfBirth)} years
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(patient.dateOfBirth)}</span>
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
                    </div>
                    
                    <button
                      onClick={() => handleViewPatient(patient._id)}
                      className="w-full bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Patient Passport
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredPatients.length} of {patients.length} patients
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Permission Request Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Request Patient Access</h3>
              <p className="text-sm text-gray-600 mt-1">
                Request permission to view this patient's medical records
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
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
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

export default DoctorPatientList;

