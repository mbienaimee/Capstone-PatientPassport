import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Calendar, Filter, Eye } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getHospitalPatients(hospitalId);
      
      if (response.success && response.data) {
        setPatients((response.data as any) || []);
      } else {
        setError('Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Error loading patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hospitalId) {
      fetchPatients();
    }
  }, [hospitalId]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contactNumber.includes(searchTerm) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
    </div>
  );
};

export default PatientList;
