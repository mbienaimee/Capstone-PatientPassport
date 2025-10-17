import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart, 
  Pill, 
  Activity, 
  FileText, 
  Shield,
  Edit3,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { apiService, ApiError } from '../services/api';

interface PatientPassportViewProps {
  passportData: any;
  patientId: string;
  onClose: () => void;
  onUpdate: (updatedPassport: any) => void;
}

const PatientPassportView: React.FC<PatientPassportViewProps> = ({
  passportData,
  patientId,
  onClose,
  onUpdate
}) => {
  const { showNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState(passportData);

  useEffect(() => {
    setEditedData(passportData);
  }, [passportData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiService.updatePatientPassport(patientId, editedData);
      
      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Passport Updated',
          message: 'Patient passport has been updated successfully.'
        });
        
        onUpdate(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update passport error:', error);
      if (error instanceof ApiError) {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Failed to update passport.'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(passportData);
    setIsEditing(false);
  };

  const addMedicalCondition = () => {
    const newCondition = {
      condition: '',
      diagnosedDate: new Date(),
      diagnosedBy: '',
      status: 'active' as const,
      notes: ''
    };
    
    setEditedData({
      ...editedData,
      medicalInfo: {
        ...editedData.medicalInfo,
        medicalConditions: [
          ...(editedData.medicalInfo?.medicalConditions || []),
          newCondition
        ]
      }
    });
  };

  const removeMedicalCondition = (index: number) => {
    const conditions = [...(editedData.medicalInfo?.medicalConditions || [])];
    conditions.splice(index, 1);
    
    setEditedData({
      ...editedData,
      medicalInfo: {
        ...editedData.medicalInfo,
        medicalConditions: conditions
      }
    });
  };

  const addMedication = () => {
    const newMedication = {
      name: '',
      dosage: '',
      frequency: '',
      prescribedBy: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active' as const
    };
    
    setEditedData({
      ...editedData,
      medicalInfo: {
        ...editedData.medicalInfo,
        currentMedications: [
          ...(editedData.medicalInfo?.currentMedications || []),
          newMedication
        ]
      }
    });
  };

  const isMedicationActive = (medication: any) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check if medication is active based on status and dates
    if (medication.status !== 'active') return false;
    
    // Check start date
    if (medication.startDate) {
      const startDate = new Date(medication.startDate);
      if (startDate > now) return false;
    }
    
    // Check end date
    if (medication.endDate) {
      const endDate = new Date(medication.endDate);
      if (endDate < now) return false;
    }
    
    // If no time constraints, medication is active
    if (!medication.startTime && !medication.endTime) return true;
    
    // Check time constraints
    if (medication.startTime) {
      const [startHour, startMinute] = medication.startTime.split(':').map(Number);
      const startTimeMinutes = startHour * 60 + startMinute;
      if (currentTime < startTimeMinutes) return false;
    }
    
    if (medication.endTime) {
      const [endHour, endMinute] = medication.endTime.split(':').map(Number);
      const endTimeMinutes = endHour * 60 + endMinute;
      if (currentTime > endTimeMinutes) return false;
    }
    
    return true;
  };

  const removeMedication = (index: number) => {
    const medications = [...(editedData.medicalInfo?.currentMedications || [])];
    medications.splice(index, 1);
    
    setEditedData({
      ...editedData,
      medicalInfo: {
        ...editedData.medicalInfo,
        currentMedications: medications
      }
    });
  };

  const addTestResult = () => {
    const newTest = {
      testType: '',
      testDate: new Date(),
      results: '',
      normalRange: '',
      status: 'normal' as const,
      labTechnician: '',
      notes: ''
    };
    
    setEditedData({
      ...editedData,
      testResults: [
        ...(editedData.testResults || []),
        newTest
      ]
    });
  };

  const removeTestResult = (index: number) => {
    const tests = [...(editedData.testResults || [])];
    tests.splice(index, 1);
    
    setEditedData({
      ...editedData,
      testResults: tests
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Patient Passport</h2>
                <p className="text-blue-100">{editedData?.personalInfo?.fullName || 'Unknown Patient'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData?.personalInfo?.fullName || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          fullName: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{editedData?.personalInfo?.fullName || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                  <p className="text-gray-900">{editedData?.personalInfo?.nationalId || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData?.personalInfo?.dateOfBirth ? new Date(editedData.personalInfo.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          dateOfBirth: new Date(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {editedData?.personalInfo?.dateOfBirth ? new Date(editedData.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      value={editedData?.personalInfo?.gender || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          gender: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{editedData?.personalInfo?.gender || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  {isEditing ? (
                    <select
                      value={editedData?.personalInfo?.bloodType || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          bloodType: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <p className="text-gray-900">{editedData?.personalInfo?.bloodType || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedData?.personalInfo?.contactNumber || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          contactNumber: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{editedData?.personalInfo?.contactNumber || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedData?.personalInfo?.email || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          email: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{editedData?.personalInfo?.email || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditing ? (
                    <textarea
                      value={editedData?.personalInfo?.address || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        personalInfo: {
                          ...editedData.personalInfo,
                          address: e.target.value
                        }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{editedData?.personalInfo?.address || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-600" />
                Medical Information
              </h3>

              {/* Allergies */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                {isEditing ? (
                  <div>
                    <textarea
                      value={(editedData?.medicalInfo?.allergies || []).join(', ')}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        medicalInfo: {
                          ...editedData.medicalInfo,
                          allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                        }
                      })}
                      placeholder="Enter allergies separated by commas"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {(editedData?.medicalInfo?.allergies || []).length > 0 
                      ? editedData.medicalInfo.allergies.join(', ') 
                      : 'No known allergies'
                    }
                  </p>
                )}
              </div>

              {/* Medical Conditions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                  {isEditing && (
                    <button
                      onClick={addMedicalCondition}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {(editedData?.medicalInfo?.medicalConditions || []).map((condition: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <input
                              type="text"
                              value={condition.condition}
                              onChange={(e) => {
                                const conditions = [...(editedData.medicalInfo?.medicalConditions || [])];
                                conditions[index].condition = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    medicalConditions: conditions
                                  }
                                });
                              }}
                              placeholder="Condition name"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => removeMedicalCondition(index)}
                              className="ml-2 p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={condition.diagnosedDate ? new Date(condition.diagnosedDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const conditions = [...(editedData.medicalInfo?.medicalConditions || [])];
                                conditions[index].diagnosedDate = new Date(e.target.value);
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    medicalConditions: conditions
                                  }
                                });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={condition.diagnosedBy}
                              onChange={(e) => {
                                const conditions = [...(editedData.medicalInfo?.medicalConditions || [])];
                                conditions[index].diagnosedBy = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    medicalConditions: conditions
                                  }
                                });
                              }}
                              placeholder="Diagnosed by"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900">{condition.condition}</p>
                          <p className="text-sm text-gray-600">
                            Diagnosed: {condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString() : 'N/A'} 
                            by {condition.diagnosedBy || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">Status: {condition.status}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(editedData?.medicalInfo?.medicalConditions || []).length === 0 && (
                    <p className="text-gray-500 text-sm">No medical conditions recorded</p>
                  )}
                </div>
              </div>

              {/* Current Medications */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Current Medications</label>
                  {isEditing && (
                    <button
                      onClick={addMedication}
                      className="flex items-center px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {(editedData?.medicalInfo?.currentMedications || []).map((medication: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <input
                              type="text"
                              value={medication.name}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].name = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="Medication name"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => removeMedication(index)}
                              className="ml-2 p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={medication.dosage}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].dosage = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="Dosage"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={medication.frequency}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].frequency = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="Frequency"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={medication.prescribedBy}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].prescribedBy = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="Prescribed by"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="date"
                              value={medication.startDate}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].startDate = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={medication.startTime || ''}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].startTime = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="Start time (HH:MM)"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="time"
                              value={medication.endTime || ''}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].endTime = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="End time (HH:MM)"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={medication.endDate || ''}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].endDate = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={medication.notes || ''}
                              onChange={(e) => {
                                const medications = [...(editedData.medicalInfo?.currentMedications || [])];
                                medications[index].notes = e.target.value;
                                setEditedData({
                                  ...editedData,
                                  medicalInfo: {
                                    ...editedData.medicalInfo,
                                    currentMedications: medications
                                  }
                                });
                              }}
                              placeholder="Notes"
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{medication.name}</p>
                              <p className="text-sm text-gray-600">
                                {medication.dosage} - {medication.frequency}
                              </p>
                              <p className="text-sm text-gray-500">Prescribed by: {medication.prescribedBy || 'Unknown'}</p>
                              {(medication.startTime || medication.endTime) && (
                                <p className="text-sm text-blue-600 mt-1">
                                  Active: {medication.startTime || '00:00'} - {medication.endTime || '23:59'}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                isMedicationActive(medication) 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {isMedicationActive(medication) ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(editedData?.medicalInfo?.currentMedications || []).length === 0 && (
                    <p className="text-gray-500 text-sm">No current medications</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Test Results
              </h3>
              {isEditing && (
                <button
                  onClick={addTestResult}
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Test Result
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {(editedData?.testResults || []).map((test: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded border">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={test.testType}
                          onChange={(e) => {
                            const tests = [...(editedData.testResults || [])];
                            tests[index].testType = e.target.value;
                            setEditedData({
                              ...editedData,
                              testResults: tests
                            });
                          }}
                          placeholder="Test type"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeTestResult(index)}
                          className="ml-2 p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={test.testDate ? new Date(test.testDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const tests = [...(editedData.testResults || [])];
                            tests[index].testDate = new Date(e.target.value);
                            setEditedData({
                              ...editedData,
                              testResults: tests
                            });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={test.status}
                          onChange={(e) => {
                            const tests = [...(editedData.testResults || [])];
                            tests[index].status = e.target.value;
                            setEditedData({
                              ...editedData,
                              testResults: tests
                            });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <textarea
                        value={test.results}
                        onChange={(e) => {
                          const tests = [...(editedData.testResults || [])];
                          tests[index].results = e.target.value;
                          setEditedData({
                            ...editedData,
                            testResults: tests
                          });
                        }}
                        placeholder="Test results"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">{test.testType}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          test.status === 'normal' ? 'bg-green-100 text-green-800' :
                          test.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {test.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Date: {test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{test.results}</p>
                      {test.labTechnician && (
                        <p className="text-xs text-gray-500 mt-1">Lab Technician: {test.labTechnician}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {(editedData?.testResults || []).length === 0 && (
                <p className="text-gray-500 text-sm">No test results available</p>
              )}
            </div>
          </div>

          {/* Access History */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Access History
            </h3>
            
            <div className="space-y-2">
              {(editedData?.accessHistory || []).slice(0, 5).map((access: any, index: number) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {access.accessType === 'view' ? 'Viewed' : 'Updated'} passport
                      </p>
                      <p className="text-xs text-gray-500">
                        {access.accessDate ? new Date(access.accessDate).toLocaleString() : 'N/A'}
                      </p>
                      {access.reason && (
                        <p className="text-xs text-gray-600 mt-1">Reason: {access.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {access.otpVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          OTP Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(editedData?.accessHistory || []).length === 0 && (
                <p className="text-gray-500 text-sm">No access history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPassportView;