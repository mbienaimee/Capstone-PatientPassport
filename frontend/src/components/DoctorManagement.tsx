import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { UserPlus, UserMinus, Edit, Eye, Trash2, Key, LogIn, X } from 'lucide-react';
import DoctorLogin from './DoctorLogin';
import DoctorPatientList from './DoctorPatientList';

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
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showDoctorLogin, setShowDoctorLogin] = useState<Doctor | null>(null);
  const [showPatientList, setShowPatientList] = useState<Doctor | null>(null);
  const [showChangePassword, setShowChangePassword] = useState<Doctor | null>(null);

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
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      console.error('Hospital ID used:', hospitalId);
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

  const handleDoctorLogin = (doctor: Doctor) => {
    setShowDoctorLogin(doctor);
  };

  const handleLoginSuccess = (data: { doctor: Doctor; patients: any[] }) => {
    setShowPatientList(data.doctor);
    setShowDoctorLogin(null);
  };

  const handleChangePassword = (doctor: Doctor) => {
    setShowChangePassword(doctor);
  };

  const handlePasswordChange = async (doctor: Doctor, newPassword: string) => {
    try {
      const url = `/auth/users/${doctor.user._id}/change-password`;
      console.log('Changing password for doctor:', doctor.user._id);
      console.log('Using URL:', url);
      
      const response = await apiService.request(url, {
        method: 'PUT',
        body: JSON.stringify({ newPassword })
      });
      
      console.log('Change password response:', response);
      
      if (response.success) {
        alert('Password changed successfully!');
        setShowChangePassword(null);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👨‍⚕️ Doctor Management</h2>
          <p className="text-gray-600">Manage doctors in your hospital</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Doctor
        </button>
      </div>

      {/* Add/Edit Doctor Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h3>
          
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Doctors</h3>
          
          {doctors.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors yet</h3>
              <p className="text-gray-600 mb-4">Add your first doctor to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add First Doctor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <UserPlus className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{doctor.user.name}</h4>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {doctor.user.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">License:</span> {doctor.licenseNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Patients:</span> {doctor.patients.length}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDoctorLogin(doctor)}
                      className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <LogIn className="h-3 w-3 mr-1" />
                      Login
                    </button>
                    <button
                      onClick={() => handleChangePassword(doctor)}
                      className="bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Password
                    </button>
                    <button
                      onClick={() => handleEditDoctor(doctor)}
                      className="bg-yellow-600 text-white py-2 px-3 rounded-md hover:bg-yellow-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveDoctor(doctor._id)}
                      className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Doctor Login Modal */}
      {showDoctorLogin && (
        <DoctorLogin
          doctor={showDoctorLogin}
          onClose={() => setShowDoctorLogin(null)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Doctor Patient List Modal */}
      {showPatientList && (
        <DoctorPatientList
          doctor={showPatientList}
          onClose={() => setShowPatientList(null)}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          doctor={showChangePassword}
          onClose={() => setShowChangePassword(null)}
          onPasswordChange={handlePasswordChange}
        />
      )}
    </div>
  );
};

// Change Password Modal Component
const ChangePasswordModal: React.FC<{
  doctor: Doctor;
  onClose: () => void;
  onPasswordChange: (doctor: Doctor, newPassword: string) => void;
}> = ({ doctor, onClose, onPasswordChange }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    setLoading(true);
    await onPasswordChange(doctor, newPassword);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-600">Dr. {doctor.user.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorManagement;
