import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { UserPlus, Edit, Trash2, X, Stethoscope, Users, Mail, Shield } from 'lucide-react';

interface Doctor {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  licenseNumber: string;
  specialization: string;
  isActive: boolean;
  patients: any[];
}

interface DoctorManagementProps {
  hospitalId: string;
}

const DoctorManagement: React.FC<DoctorManagementProps> = ({ hospitalId }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    licenseNumber: '',
    specialization: 'General Practice'
  });

  const specializations = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Hematology',
    'Infectious Disease',
    'Nephrology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Rheumatology',
    'Urology',
    'Emergency Medicine',
    'Anesthesiology',
    'Radiology',
    'Pathology',
    'Surgery',
    'Internal Medicine',
    'Family Medicine',
    'Obstetrics and Gynecology',
    'Ophthalmology',
    'Orthopedics',
    'Otolaryngology'
  ];

  useEffect(() => {
    fetchDoctors();
  }, [hospitalId]);

  const fetchDoctors = async () => {
    if (!hospitalId) {
      console.error('No hospital ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching doctors for hospital ID:', hospitalId);
      const response = await apiService.request(`/hospitals/${hospitalId}/doctors`);
      console.log('Doctors response:', response);
      if (response.success) {
        setDoctors((response.data as any) || []);
      } else {
        console.error('Failed to fetch doctors:', response.message);
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      console.error('Hospital ID used:', hospitalId);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('user no longer exists')) {
          alert('Your session has expired. Please login again.');
          localStorage.clear();
          window.location.href = '/hospital-login';
        } else if (error.message.includes('Hospital not found')) {
          alert('Hospital not found. Please contact support.');
        } else {
          alert(`Error loading doctors: ${error.message}`);
        }
      } else {
        alert('An unexpected error occurred while loading doctors.');
      }
      
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hospitalId) {
      console.error('No hospital ID provided for adding doctor');
      return;
    }
    
    try {
      if (editingDoctor) {
        // Update doctor logic would go here
        console.log('Update doctor:', editingDoctor._id, formData);
      } else {
        // Add new doctor
        console.log('Adding new doctor for hospital ID:', hospitalId);
        console.log('Doctor data:', formData);
        const response = await apiService.request(`/hospitals/${hospitalId}/doctors`, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        console.log('Add doctor response:', response);
        if (response.success) {
          setShowAddForm(false);
          setFormData({
            name: '',
            email: '',
            password: '',
            licenseNumber: '',
            specialization: 'General Practice'
          });
          fetchDoctors();
        }
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      console.error('Hospital ID used:', hospitalId);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('user no longer exists')) {
          alert('Your session has expired. Please login again.');
          // Clear auth data and redirect
          localStorage.clear();
          window.location.href = '/hospital-login';
        } else {
          alert(`Error saving doctor: ${error.message}`);
        }
      } else {
        alert('An unexpected error occurred while saving the doctor.');
      }
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to remove this doctor?')) {
      try {
        const response = await apiService.request(`/hospitals/${hospitalId}/doctors/${doctorId}`, {
          method: 'DELETE'
        });
        
        if (response.success) {
          fetchDoctors();
        }
      } catch (error) {
        console.error('Error removing doctor:', error);
      }
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.user.name,
      email: doctor.user.email,
      password: '',
      licenseNumber: doctor.licenseNumber,
      specialization: doctor.specialization
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDoctor(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      licenseNumber: '',
      specialization: 'General Practice'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Stethoscope className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Medical Staff Management</h2>
              <p className="text-sm text-gray-500">Manage doctors and medical professionals in your hospital</p>
              <p className="text-xs text-green-600 mt-1">💡 Click "Login" next to any doctor to access their patient dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Add/Edit Doctor Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <UserPlus className="h-5 w-5 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDoctor ? 'Edit Doctor Information' : 'Add New Doctor'}
              </h3>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required={!editingDoctor}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow-sm border border-green-200">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Users className="h-5 w-5 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Current Medical Staff</h3>
          </div>
          
          {doctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-green-50 rounded-lg inline-block mb-4">
                <Stethoscope className="h-12 w-12 text-green-400 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Staff Yet</h3>
              <p className="text-gray-500 mb-6">Add your first doctor to start building your medical team</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <UserPlus className="h-4 w-4 mr-2 inline-block" />
                Add First Doctor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">Dr. {doctor.user.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            doctor.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {doctor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {doctor.user.email}
                          </span>
                          <span className="flex items-center">
                            <Shield className="h-3 w-3 mr-1" />
                            {doctor.licenseNumber}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {doctor.patients.length} patients
                          </span>
                          <span className="font-medium text-green-600">{doctor.specialization}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditDoctor(doctor)}
                        className="bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveDoctor(doctor._id)}
                        className="bg-red-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorManagement;
