import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { UserPlus, UserMinus, Edit, Eye, Trash2, Key, LogIn, X, Stethoscope, Users, Mail, Shield } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-4 bg-green-100 rounded-2xl mr-6">
              <Stethoscope className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Medical Staff Management</h2>
              <p className="text-lg text-gray-600">Manage doctors and medical professionals in your hospital</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center font-semibold"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add New Doctor
          </button>
        </div>
      </div>

      {/* Add/Edit Doctor Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingDoctor ? 'Edit Doctor Information' : 'Add New Doctor'}
            </h3>
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
            
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
              >
                {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white rounded-2xl shadow-xl border border-green-100">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-xl mr-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Current Medical Staff</h3>
          </div>
          
          {doctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 bg-green-50 rounded-2xl inline-block mb-6">
                <Stethoscope className="h-16 w-16 text-green-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Medical Staff Yet</h3>
              <p className="text-lg text-gray-600 mb-8">Add your first doctor to start building your medical team</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
              >
                <UserPlus className="h-5 w-5 mr-2 inline-block" />
                Add First Doctor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="bg-white rounded-xl p-6 border border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h4 className="text-lg font-bold text-gray-900">Dr. {doctor.user.name}</h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            doctor.isActive 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {doctor.isActive ? '✓ Active' : '⚠ Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6 mt-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2 text-green-500" />
                            <span>{doctor.user.email}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Shield className="h-4 w-4 mr-2 text-green-500" />
                            <span>License: {doctor.licenseNumber}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-green-500" />
                            <span>Patients: {doctor.patients.length}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium text-green-600">{doctor.specialization}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDoctorLogin(doctor)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm flex items-center font-semibold"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </button>
                      <button
                        onClick={() => handleChangePassword(doctor)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 text-sm flex items-center font-semibold"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Password
                      </button>
                      <button
                        onClick={() => handleEditDoctor(doctor)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 text-sm flex items-center font-semibold"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveDoctor(doctor._id)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 text-sm flex items-center font-semibold"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    </div>
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
