import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import Logo from "./Logo";
import { Clock, User, Mail, Phone, MapPin, Calendar, Droplets, AlertTriangle, Shield, X } from "lucide-react";

interface MedicalCondition {
  name: string;
  details: string;
  diagnosed?: string;
  procedure?: string;
}

interface Medication {
  name: string;
  dosage: string;
  status: "Active" | "Past";
}

interface TestResult {
  name: string;
  date: string;
  status: "Normal" | "Critical" | "Normal Sinus Rhythm";
}

interface HospitalVisit {
  hospital: string;
  reason: string;
  date: string;
}

interface PatientPassportViewProps {
  patientId: string;
  accessToken: string;
  onClose: () => void;
  isEditable?: boolean; // New prop to enable editing
}

const PatientPassportView: React.FC<PatientPassportViewProps> = ({
  patientId,
  accessToken,
  onClose,
  isEditable = false
}) => {
  const [expandedCondition, setExpandedCondition] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [medicalData, setMedicalData] = useState({
    conditions: [],
    medications: [],
    tests: [],
    visits: [],
    images: []
  });
  const [patientInfo, setPatientInfo] = useState<Record<string, unknown> | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string>('');

  // Fetch medical records when component mounts
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!patientId || !accessToken) {
        console.error('Missing patientId or accessToken:', { patientId, accessToken });
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);
        console.log('Fetching patient passport for:', patientId);
        const response = await apiService.getPatientPassportWithAccess(patientId, accessToken);
        if (response.success) {
          setPatientInfo(response.data.patient);
          setMedicalData(response.data.medicalRecords);
          setAccessExpiresAt(response.data.accessExpiresAt);
        }
      } catch (error) {
        console.error('Error fetching medical records:', error);
        // Set empty data on error to show empty state
        setMedicalData({
          conditions: [],
          medications: [],
          tests: [],
          visits: [],
          images: []
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchMedicalRecords();
  }, [patientId, accessToken]);

  // Edit functions
  const handleEdit = () => {
    setEditData({ ...patientInfo });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!isEditable) return;
    
    try {
      setIsUpdating(true);
      
      // Transform the edit data to match backend expectations
      const updateData = {
        contactNumber: editData.contactNumber,
        address: editData.address,
        bloodType: editData.bloodType,
        emergencyContact: editData.emergencyContact,
        allergies: editData.allergies,
        medicalHistory: editData.medicalHistory || [],
        medications: editData.medications || [],
        testResults: editData.testResults || [],
        hospitalVisits: editData.hospitalVisits || [],
        medicalImages: editData.medicalImages || []
      };
      
      const response = await apiService.updatePatientPassportWithAccess(patientId, accessToken, updateData);
      if (response.success) {
        setPatientInfo(response.data.patient);
        setIsEditing(false);
        setEditData({});
        alert('Patient passport updated successfully!');
        
        // Refresh the medical data to show updated records
        const refreshResponse = await apiService.getPatientPassportWithAccess(patientId, accessToken);
        if (refreshResponse.success) {
          setMedicalData(refreshResponse.data.medicalRecords);
        }
      }
    } catch (error) {
      console.error('Error updating patient passport:', error);
      alert('Failed to update patient passport. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setEditData((prev: Record<string, unknown>) => ({
      ...prev,
      [field]: value
    }));
  };

  // Transform database records to component format
  const medicalHistory: MedicalCondition[] = medicalData.conditions.map((record: Record<string, unknown>) => ({
    name: record.name as string || '',
    details: record.details as string || '',
    diagnosed: record.diagnosed ? new Date(record.diagnosed as string).toLocaleDateString() : '',
    procedure: record.procedure as string || ''
  }));

  const medications: Medication[] = medicalData.medications.map((record: Record<string, unknown>) => ({
    name: record.name as string || '',
    dosage: record.dosage as string || '',
    status: (record.status as "Active" | "Past") || 'Active'
  }));

  const testResults: TestResult[] = medicalData.tests.map((record: Record<string, unknown>) => ({
    name: record.name as string || '',
    date: record.date ? new Date(record.date as string).toLocaleDateString() : '',
    status: (record.status as "Normal" | "Critical" | "Normal Sinus Rhythm") || 'Normal'
  }));

  const hospitalVisits: HospitalVisit[] = medicalData.visits.map((record: Record<string, unknown>) => ({
    hospital: (record.hospital as Record<string, unknown>)?.name as string || '',
    reason: record.reason as string || '',
    date: record.date ? new Date(record.date as string).toLocaleDateString() : ''
  }));

  const medicalImages = medicalData.images.map((record: Record<string, unknown>) => ({
    url: record.url as string || '',
    alt: record.alt as string || 'Medical Image'
  }));

  // Empty state component
  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient passport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center space-x-4">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Close Patient Passport"
            >
              <X className="w-6 h-6" />
            </button>
            {/* Access Timer */}
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Access expires: {new Date(accessExpiresAt).toLocaleString()}
              </span>
            </div>
            <div className="flex space-x-2">
              {isEditable && !isEditing && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit Passport
                </button>
              )}
              {isEditable && isEditing && (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Patient Passport - {patientInfo?.name || 'Loading...'}
          </h1>
          <p className="text-gray-600">
            Complete medical history and health information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Patient Information
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <p className="text-sm font-semibold text-gray-900">{(patientInfo?.name as string) || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-sm font-semibold text-gray-900">{(patientInfo?.email as string) || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {patientInfo?.dateOfBirth ? new Date(patientInfo.dateOfBirth as string).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Contact</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={(editData.contactNumber as string) || ''}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="w-full mt-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter contact number"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{(patientInfo?.contactNumber as string) || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Address</span>
                  {isEditing ? (
                    <textarea
                      value={editData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full mt-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{patientInfo?.address || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Droplets className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Blood Type</span>
                  {isEditing ? (
                    <select
                      value={editData.bloodType || ''}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      className="w-full mt-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{patientInfo?.bloodType || 'N/A'}</p>
                  )}
                </div>
              </div>
              
              {/* Allergies Section */}
              <div className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Allergies</span>
                  {isEditing ? (
                    <div className="mt-1">
                      <textarea
                        value={Array.isArray(editData.allergies) ? editData.allergies.join(', ') : (editData.allergies || '')}
                        onChange={(e) => handleInputChange('allergies', e.target.value.split(',').map(a => a.trim()).filter(a => a))}
                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter allergies separated by commas"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple allergies with commas</p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">
                      {patientInfo?.allergies && patientInfo.allergies.length > 0 
                        ? patientInfo.allergies.join(', ') 
                        : 'No known allergies'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Emergency Contact Section */}
              <div className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">Emergency Contact</span>
                </div>
                <div className="ml-8 space-y-2">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-500">Name</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.emergencyContact?.name || ''}
                          onChange={(e) => handleInputChange('emergencyContact', { ...editData.emergencyContact, name: e.target.value })}
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Emergency contact name"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{patientInfo?.emergencyContact?.name || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-500">Relationship</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.emergencyContact?.relationship || ''}
                          onChange={(e) => handleInputChange('emergencyContact', { ...editData.emergencyContact, relationship: e.target.value })}
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Relationship (e.g., Spouse, Parent)"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{patientInfo?.emergencyContact?.relationship || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-500">Phone</span>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.emergencyContact?.phone || ''}
                          onChange={(e) => handleInputChange('emergencyContact', { ...editData.emergencyContact, phone: e.target.value })}
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Emergency contact phone"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{patientInfo?.emergencyContact?.phone || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History Edit Section */}
          {isEditing && (
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Add Medical History</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Condition</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter medical condition"
                    onChange={(e) => handleInputChange('newMedicalCondition', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter details about the condition"
                    rows={3}
                    onChange={(e) => handleInputChange('newMedicalDetails', e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    if (editData.newMedicalCondition) {
                      const newHistory = [...(editData.medicalHistory || []), editData.newMedicalCondition];
                      handleInputChange('medicalHistory', newHistory);
                      handleInputChange('newMedicalCondition', '');
                      handleInputChange('newMedicalDetails', '');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Medical History
                </button>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Emergency Contact
              </h2>
            </div>
            <div className="space-y-4">
              {patientInfo?.emergencyContact?.name ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Name</span>
                    <span className="text-sm font-semibold text-gray-900">{patientInfo.emergencyContact.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Relationship</span>
                    <span className="text-sm font-semibold text-gray-900">{patientInfo.emergencyContact.relationship}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <span className="text-sm font-semibold text-gray-900">{patientInfo.emergencyContact.phone}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">No emergency contact information available</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Medical History
            </h2>
            {isEditing && (
                <button
                  onClick={() => {
                    if (editData.newMedicalCondition && editData.newMedicalDetails) {
                      const newHistory = [...(editData.medicalHistory || []), {
                        name: editData.newMedicalCondition,
                        details: editData.newMedicalDetails,
                        diagnosed: editData.newMedicalDiagnosed || new Date().toISOString().split('T')[0],
                        procedure: editData.newMedicalProcedure || ''
                      }];
                      handleInputChange('medicalHistory', newHistory);
                      handleInputChange('newMedicalCondition', '');
                      handleInputChange('newMedicalDetails', '');
                      handleInputChange('newMedicalDiagnosed', '');
                      handleInputChange('newMedicalProcedure', '');
                    } else {
                      alert('Please fill in both condition name and details');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Medical History
                </button>
            )}
          </div>
          
          {/* Add Medical History Form */}
          {isEditing && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Add New Medical Condition</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition Name</label>
                  <input
                    type="text"
                    value={editData.newMedicalCondition || ''}
                    onChange={(e) => handleInputChange('newMedicalCondition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter medical condition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Date</label>
                  <input
                    type="date"
                    value={editData.newMedicalDiagnosed || ''}
                    onChange={(e) => handleInputChange('newMedicalDiagnosed', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                  <textarea
                    value={editData.newMedicalDetails || ''}
                    onChange={(e) => handleInputChange('newMedicalDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter details about the condition"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedure (Optional)</label>
                  <input
                    type="text"
                    value={editData.newMedicalProcedure || ''}
                    onChange={(e) => handleInputChange('newMedicalProcedure', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter procedure if any"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {medicalHistory.length === 0 ? (
              <EmptyState 
                title="No Medical History" 
                description="No medical conditions or procedures recorded."
              />
            ) : (
              medicalHistory.map((condition, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-lg"
                    onClick={() =>
                      setExpandedCondition(expandedCondition === idx ? null : idx)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setExpandedCondition(expandedCondition === idx ? null : idx);
                      }
                    }}
                    aria-expanded={expandedCondition === idx}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {condition.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newHistory = medicalHistory.filter((_, i) => i !== idx);
                            handleInputChange('medicalHistory', newHistory);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove this condition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <span className="badge-gray">
                        {condition.diagnosed
                          ? `Diagnosed: ${condition.diagnosed}`
                          : `Procedure: ${condition.procedure}`}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedCondition === idx ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  {expandedCondition === idx && condition.details && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mt-3">
                        {condition.details}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Medications
            </h2>
            {isEditing && (
              <button
                onClick={() => {
                  if (editData.newMedicationName && editData.newMedicationDosage) {
                    const newMedications = [...(editData.medications || []), {
                      name: editData.newMedicationName,
                      dosage: editData.newMedicationDosage,
                      frequency: editData.newMedicationFrequency || 'Once daily',
                      status: editData.newMedicationStatus || 'active',
                      startDate: new Date().toISOString().split('T')[0],
                      notes: editData.newMedicationNotes || ''
                    }];
                    handleInputChange('medications', newMedications);
                    handleInputChange('newMedicationName', '');
                    handleInputChange('newMedicationDosage', '');
                    handleInputChange('newMedicationFrequency', 'Once daily');
                    handleInputChange('newMedicationStatus', 'active');
                    handleInputChange('newMedicationNotes', '');
                  } else {
                    alert('Please fill in both medication name and dosage');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Medication
              </button>
            )}
          </div>
          
          {/* Add Medication Form */}
          {isEditing && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Add New Medication</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={editData.newMedicationName || ''}
                    onChange={(e) => handleInputChange('newMedicationName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter medication name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={editData.newMedicationDosage || ''}
                    onChange={(e) => handleInputChange('newMedicationDosage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 10mg daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={editData.newMedicationFrequency || 'Once daily'}
                    onChange={(e) => handleInputChange('newMedicationFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="As needed">As needed</option>
                    <option value="Before meals">Before meals</option>
                    <option value="After meals">After meals</option>
                    <option value="At bedtime">At bedtime</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editData.newMedicationStatus || 'active'}
                    onChange={(e) => handleInputChange('newMedicationStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={editData.newMedicationNotes || ''}
                    onChange={(e) => handleInputChange('newMedicationNotes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {medications.length === 0 ? (
              <EmptyState 
                title="No Medications" 
                description="No medications recorded."
              />
            ) : (
              medications.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {med.name}
                    </p>
                    <p className="text-xs text-gray-600">{med.dosage}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isEditing && (
                      <button
                        onClick={() => {
                          const newMedications = medications.filter((_, i) => i !== idx);
                          handleInputChange('medications', newMedications);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove this medication"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <span
                      className={med.status === "Active" ? "badge-success" : "badge-gray"}
                    >
                      {med.status === "Past" ? "Past (Completed)" : med.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Test Results
              </h2>
              {isEditing && (
                <button
                  onClick={() => {
                    if (editData.newTestName && editData.newTestFindings) {
                      const newTests = [...(editData.testResults || []), {
                        name: editData.newTestName,
                        date: editData.newTestDate || new Date().toISOString().split('T')[0],
                        status: editData.newTestStatus || 'normal',
                        findings: editData.newTestFindings,
                        notes: editData.newTestNotes || ''
                      }];
                      handleInputChange('testResults', newTests);
                      handleInputChange('newTestName', '');
                      handleInputChange('newTestDate', '');
                      handleInputChange('newTestStatus', 'normal');
                      handleInputChange('newTestFindings', '');
                      handleInputChange('newTestNotes', '');
                    } else {
                      alert('Please fill in both test name and findings');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Add Test
                </button>
              )}
            </div>
            
            {/* Add Test Form */}
            {isEditing && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Add New Test Result</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      value={editData.newTestName || ''}
                      onChange={(e) => handleInputChange('newTestName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter test name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editData.newTestDate || ''}
                      onChange={(e) => handleInputChange('newTestDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editData.newTestStatus || 'normal'}
                      onChange={(e) => handleInputChange('newTestStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="critical">Critical</option>
                      <option value="abnormal">Abnormal</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
                    <textarea
                      value={editData.newTestFindings || ''}
                      onChange={(e) => handleInputChange('newTestFindings', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter test findings"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={editData.newTestNotes || ''}
                      onChange={(e) => handleInputChange('newTestNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {testResults.length === 0 ? (
                <EmptyState 
                  title="No Test Results" 
                  description="No lab tests or diagnostic results recorded."
                />
              ) : (
                testResults.map((test, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {test.name}
                      </p>
                      <p className="text-xs text-gray-600">{test.date}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newTests = testResults.filter((_, i) => i !== idx);
                            handleInputChange('testResults', newTests);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove this test"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <span
                        className={
                          test.status === "Critical"
                            ? "badge-danger"
                            : test.status === "Normal Sinus Rhythm"
                            ? "badge-info"
                            : "badge-success"
                        }
                      >
                        {test.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hospital Visits */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Hospital Visits
              </h2>
              {isEditing && (
                <button
                  onClick={() => {
                    if (editData.newVisitReason) {
                      const newVisits = [...(editData.hospitalVisits || []), {
                        reason: editData.newVisitReason,
                        date: editData.newVisitDate || new Date().toISOString().split('T')[0],
                        notes: editData.newVisitNotes || '',
                        diagnosis: editData.newVisitDiagnosis || '',
                        treatment: editData.newVisitTreatment || ''
                      }];
                      handleInputChange('hospitalVisits', newVisits);
                      handleInputChange('newVisitReason', '');
                      handleInputChange('newVisitDate', '');
                      handleInputChange('newVisitNotes', '');
                      handleInputChange('newVisitDiagnosis', '');
                      handleInputChange('newVisitTreatment', '');
                    } else {
                      alert('Please fill in the reason for visit');
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Add Visit
                </button>
              )}
            </div>
            
            {/* Add Hospital Visit Form */}
            {isEditing && (
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">Add New Hospital Visit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                    <input
                      type="date"
                      value={editData.newVisitDate || ''}
                      onChange={(e) => handleInputChange('newVisitDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                    <input
                      type="text"
                      value={editData.newVisitReason || ''}
                      onChange={(e) => handleInputChange('newVisitReason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter reason for visit"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis (Optional)</label>
                    <input
                      type="text"
                      value={editData.newVisitDiagnosis || ''}
                      onChange={(e) => handleInputChange('newVisitDiagnosis', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter diagnosis if any"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment (Optional)</label>
                    <textarea
                      value={editData.newVisitTreatment || ''}
                      onChange={(e) => handleInputChange('newVisitTreatment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter treatment details"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={editData.newVisitNotes || ''}
                      onChange={(e) => handleInputChange('newVisitNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {hospitalVisits.length === 0 ? (
                <EmptyState 
                  title="No Hospital Visits" 
                  description="No hospital visits recorded."
                />
              ) : (
                hospitalVisits.map((visit, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {visit.hospital}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{visit.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">{visit.date}</p>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newVisits = hospitalVisits.filter((_, i) => i !== idx);
                            handleInputChange('hospitalVisits', newVisits);
                          }}
                          className="text-red-600 hover:text-red-800 p-1 ml-2"
                          title="Remove this visit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Medical Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Medical Images
            </h2>
            {isEditing && (
              <button
                onClick={() => {
                  const newImages = [...(editData.medicalImages || []), {
                    url: editData.newImageUrl || '',
                    alt: editData.newImageDescription || 'Medical Image'
                  }];
                  handleInputChange('medicalImages', newImages);
                  handleInputChange('newImageUrl', '');
                  handleInputChange('newImageDescription', '');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Add Image
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Uploaded X-rays, scans, and other diagnostic images
          </p>
          
          {/* Add Medical Image Form */}
          {isEditing && (
            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">Add New Medical Image</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={editData.newImageUrl || ''}
                    onChange={(e) => handleInputChange('newImageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter image URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={editData.newImageDescription || ''}
                    onChange={(e) => handleInputChange('newImageDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter image description"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {medicalImages.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="No Medical Images" 
                  description="No medical images uploaded."
                />
              </div>
            ) : (
              medicalImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity shadow-md hover:shadow-lg group"
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity flex space-x-2">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newImages = medicalImages.filter((_, i) => i !== idx);
                            handleInputChange('medicalImages', newImages);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium"
                          title="Remove this image"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientPassportView;

