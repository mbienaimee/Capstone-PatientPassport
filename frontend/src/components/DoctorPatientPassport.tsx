import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, Filter, Eye, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import EmergencyAccessModal from './EmergencyAccessModal';

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
  status: string;
}

const DoctorPatientPassport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState({
    name: '',
    licenseNumber: ''
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDoctorForm, setShowDoctorForm] = useState(true);
  const [selectedPatientForEmergency, setSelectedPatientForEmergency] = useState<Patient | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorInfo.name || !doctorInfo.licenseNumber) {
      alert('Please enter both doctor name and license number');
      return;
    }

    setLoading(true);
    try {
      // Fetch real patients from the database
      const response = await apiService.getPatients();
      
      if (response.success && response.data) {
        // Transform the API response to match our Patient interface
        const patientsData: Patient[] = response.data.map((patient: any) => ({
          _id: patient._id || patient.id,
          user: {
            _id: patient.user?._id || patient.user?.id || patient._id,
            name: patient.user?.name || patient.name,
            email: patient.user?.email || patient.email
          },
          nationalId: patient.nationalId,
          dateOfBirth: patient.dateOfBirth,
          contactNumber: patient.contactNumber,
          address: patient.address,
          status: patient.status || 'active'
        }));

        setPatients(patientsData);
        setFilteredPatients(patientsData);
        setShowDoctorForm(false);
      } else {
        throw new Error(response.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      alert('Error fetching patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatientPassport = (patient: Patient) => {
    // Navigate to access request form
    navigate('/doctor-access-request', { 
      state: { 
        patientId: patient._id, 
        patientName: patient.user.name,
        doctorName: doctorInfo.name,
        licenseNumber: doctorInfo.licenseNumber
      } 
    });
  };

  const handleEmergencyAccess = (patient: Patient) => {
    setSelectedPatientForEmergency(patient);
    setShowEmergencyModal(true);
  };

  const handleEmergencyAccessSuccess = (accessData: any) => {
    // Navigate to patient passport with emergency access granted
    navigate('/doctor-access-request', { 
      state: { 
        patientId: selectedPatientForEmergency?._id, 
        patientName: selectedPatientForEmergency?.user.name,
        doctorName: doctorInfo.name,
        licenseNumber: doctorInfo.licenseNumber,
        emergencyAccess: true,
        emergencyOverrideId: accessData.emergencyOverride._id
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏥 Patient Passport Access</h1>
              <p className="text-sm text-gray-600">Access patient medical records through Patient Passport system</p>
            </div>
            <button
              onClick={() => navigate('/hospital-dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {showDoctorForm ? (
          /* Doctor Information Form */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Verification</h2>
                <p className="text-gray-600">Enter your information to access Patient Passport</p>
              </div>

              <form onSubmit={handleDoctorSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={doctorInfo.name}
                    onChange={(e) => setDoctorInfo({ ...doctorInfo, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={doctorInfo.licenseNumber}
                    onChange={(e) => setDoctorInfo({ ...doctorInfo, licenseNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your license number"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Access Patient Passport'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Patient List */
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Registered Patients</h2>
                  <p className="text-sm text-gray-600">Dr. {doctorInfo.name} - License: {doctorInfo.licenseNumber}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowDoctorForm(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Change Doctor
                  </button>
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.map((patient) => (
                    <div key={patient._id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{patient.user.name}</h3>
                            <p className="text-sm text-gray-600">{patient.nationalId}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {patient.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {patient.user.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">DOB:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {patient.contactNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {patient.address}
                        </p>
                      </div>

                      <button
                        onClick={() => handleViewPatientPassport(patient)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Patient Passport
                      </button>

                      {/* Emergency Access Button */}
                      <button
                        onClick={() => handleEmergencyAccess(patient)}
                        className="w-full mt-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center border-2 border-red-700"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        🚨 Emergency Access
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Access Modal */}
        {showEmergencyModal && selectedPatientForEmergency && (
          <EmergencyAccessModal
            isOpen={showEmergencyModal}
            onClose={() => {
              setShowEmergencyModal(false);
              setSelectedPatientForEmergency(null);
            }}
            patientId={selectedPatientForEmergency._id}
            patientName={selectedPatientForEmergency.user.name}
            onSuccess={handleEmergencyAccessSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorPatientPassport;
