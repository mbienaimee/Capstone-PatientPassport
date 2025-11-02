import React, { useState, useEffect } from 'react';
import { 
  User, 
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
  Trash2,
  Stethoscope,
  Building
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState(passportData);
  const [newRecords, setNewRecords] = useState<any[]>([]); // Track newly added records
  const [doctorProfile, setDoctorProfile] = useState<{ doctorName: string; hospitalName: string } | null>(null);

  // Doctors cannot edit existing records - they are read-only
  const isDoctor = user?.role === 'doctor';
  const canEdit = !isDoctor; // Only non-doctors can edit

  useEffect(() => {
    setEditedData(passportData);
  }, [passportData]);

  // Fetch doctor profile with hospital information
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (isDoctor && user) {
        try {
          console.log('Fetching doctor profile...');
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            const profile = (response.data as any).profile;
            if (profile) {
              // Extract doctor name and hospital name
              const doctorName = profile.user?.name || user.name || 'Unknown Doctor';
              const hospitalName = profile.hospital?.name || profile.hospital?.hospitalName || 'Unknown Hospital';
              
              console.log('Doctor profile fetched:', { doctorName, hospitalName });
              setDoctorProfile({ doctorName, hospitalName });
            }
          }
        } catch (error) {
          console.error('Error fetching doctor profile:', error);
          // Fallback to user name if profile fetch fails
          setDoctorProfile({
            doctorName: user.name || 'Unknown Doctor',
            hospitalName: 'Unknown Hospital'
          });
        }
      }
    };

    fetchDoctorProfile();
  }, [isDoctor, user]);

  const handleSave = async () => {
    // Validate new records before saving
    if (newRecords.length > 0) {
      const invalidRecords = newRecords.filter(record => {
        // At least diagnosis or visit type should be filled
        const hasBasicInfo = record.diagnosis || record.visitType;
        // At least one medication or test should be filled
        const hasMedications = record.medications && record.medications.some((m: any) => m.name);
        const hasTests = record.testResults && record.testResults.some((t: any) => t.testType);
        return !hasBasicInfo && !hasMedications && !hasTests;
      });

      if (invalidRecords.length > 0) {
        showNotification({
          type: 'warning',
          title: 'Incomplete Records',
          message: 'Please fill in at least diagnosis or visit type, or add at least one medication or test result before saving.'
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // If there are new records, convert them to passport format and merge
      const dataToSave = { ...editedData };
      
      if (newRecords.length > 0 && isDoctor) {
        console.log(`💾 Saving ${newRecords.length} new record(s)...`);
        // Convert new records to passport format
        newRecords.forEach((newRecord, index) => {
          console.log(`   Processing record ${index + 1}:`, newRecord);
          // Add hospital visit
          const hospitalVisit = {
            visitDate: new Date(newRecord.date),
            hospital: newRecord.hospitalName,
            doctor: newRecord.doctorName,
            reason: newRecord.diagnosis || newRecord.visitType,
            diagnosis: newRecord.diagnosis,
            treatment: newRecord.notes,
            notes: newRecord.notes
          };
          
          // Add to hospital visits
          if (!dataToSave.hospitalVisits) {
            dataToSave.hospitalVisits = [];
          }
          dataToSave.hospitalVisits = [hospitalVisit, ...dataToSave.hospitalVisits];
          
          // Add medical condition if diagnosis exists
          if (newRecord.diagnosis) {
            const condition = {
              condition: newRecord.diagnosis,
              diagnosedDate: new Date(newRecord.date),
              diagnosedBy: newRecord.doctorName,
              status: 'active',
              notes: newRecord.notes
            };
            
            if (!dataToSave.medicalInfo) {
              dataToSave.medicalInfo = {};
            }
            if (!dataToSave.medicalInfo.medicalConditions) {
              dataToSave.medicalInfo.medicalConditions = [];
            }
            dataToSave.medicalInfo.medicalConditions = [condition, ...dataToSave.medicalInfo.medicalConditions];
          }
          
          // Add medications
          if (newRecord.medications && newRecord.medications.length > 0) {
            newRecord.medications.forEach((med: any) => {
              if (med.name) { // Only add if name is filled
                if (!dataToSave.medicalInfo) {
                  dataToSave.medicalInfo = {};
                }
                if (!dataToSave.medicalInfo.currentMedications) {
                  dataToSave.medicalInfo.currentMedications = [];
                }
                dataToSave.medicalInfo.currentMedications = [
                  {
                    name: med.name,
                    dosage: med.dosage,
                    frequency: med.frequency,
                    prescribedBy: med.prescribedBy,
                    startDate: med.startDate,
                    endDate: med.endDate || undefined,
                    status: 'active'
                  },
                  ...dataToSave.medicalInfo.currentMedications
                ];
              }
            });
          }
          
          // Add test results
          if (newRecord.testResults && newRecord.testResults.length > 0) {
            newRecord.testResults.forEach((test: any) => {
              if (test.testType) { // Only add if test type is filled
                if (!dataToSave.testResults) {
                  dataToSave.testResults = [];
                }
                dataToSave.testResults = [
                  {
                    testType: test.testType,
                    testDate: new Date(test.date || newRecord.date),
                    results: test.results,
                    status: test.status,
                    normalRange: test.normalRange || ''
                  },
                  ...dataToSave.testResults
                ];
              }
            });
          }
        });
      }
      
      console.log('📤 Sending update to backend...', { patientId, dataToSave });
      const response = await apiService.updatePatientPassport(patientId, dataToSave);
      
      if (response.success) {
        const savedCount = newRecords.length;
        showNotification({
          type: 'success',
          title: 'Records Saved Successfully',
          message: `${savedCount} new historical record${savedCount > 1 ? 's have' : ' has'} been added to the patient passport.`
        });
        
        console.log('✅ Passport updated successfully');
        console.log('   Updated data:', response.data);
        
        // Clear new records after successful save
        setNewRecords([]);
        onUpdate(response.data);
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Failed to update passport');
      }
    } catch (error) {
      console.error('❌ Update passport error:', error);
      if (error instanceof ApiError) {
        showNotification({
          type: 'error',
          title: 'Save Failed',
          message: error.message || 'Failed to save records. Please try again.'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Save Failed',
          message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
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

  // Add new historical record (complete card with diagnosis, medications, tests)
  const addNewHistoricalRecord = () => {
    // Use doctor profile if available, otherwise fallback to user name
    const doctorName = doctorProfile?.doctorName || user?.name || 'Unknown Doctor';
    const hospitalName = doctorProfile?.hospitalName || 'Unknown Hospital';
    
    const newRecord = {
      id: `new-record-${Date.now()}`,
      isNew: true,
      createdBy: doctorName,
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      medications: [
        {
          name: '',
          dosage: '',
          frequency: '',
          prescribedBy: doctorName,
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        }
      ],
      testResults: [
        {
          testType: '',
          results: '',
          status: 'normal',
          date: new Date().toISOString().split('T')[0]
        }
      ],
      doctorName: doctorName,
      hospitalName: hospitalName,
      visitType: 'General Visit',
      notes: ''
    };
    
    // Add to new records state (will appear at top)
    setNewRecords([newRecord, ...newRecords]);
  };
  
  // Update new historical record
  const updateNewHistoricalRecord = (recordId: string, field: string, value: any) => {
    setNewRecords(newRecords.map(record => {
      if (record.id === recordId) {
        if (field.includes('.')) {
          // Handle nested fields like 'medications.0.name'
          const [parent, index, child] = field.split('.');
          if (parent === 'medications') {
            const medications = [...record.medications];
            medications[parseInt(index)] = {
              ...medications[parseInt(index)],
              [child]: value
            };
            return { ...record, medications };
          } else if (parent === 'testResults') {
            const testResults = [...record.testResults];
            testResults[parseInt(index)] = {
              ...testResults[parseInt(index)],
              [child]: value
            };
            return { ...record, testResults };
          }
        }
        return { ...record, [field]: value };
      }
      return record;
    }));
  };
  
  // Add medication to new record
  const addMedicationToNewRecord = (recordId: string) => {
    setNewRecords(newRecords.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          medications: [
            ...record.medications,
            {
              name: '',
              dosage: '',
              frequency: '',
              prescribedBy: user?.name || 'Unknown Doctor',
              startDate: new Date().toISOString().split('T')[0],
              endDate: ''
            }
          ]
        };
      }
      return record;
    }));
  };
  
  // Remove medication from new record
  const removeMedicationFromNewRecord = (recordId: string, medIndex: number) => {
    setNewRecords(newRecords.map(record => {
      if (record.id === recordId) {
        const medications = [...record.medications];
        medications.splice(medIndex, 1);
        return { ...record, medications };
      }
      return record;
    }));
  };
  
  // Add test result to new record
  const addTestResultToNewRecord = (recordId: string) => {
    setNewRecords(newRecords.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          testResults: [
            ...record.testResults,
            {
              testType: '',
              results: '',
              status: 'normal',
              date: new Date().toISOString().split('T')[0]
            }
          ]
        };
      }
      return record;
    }));
  };
  
  // Remove test result from new record
  const removeTestResultFromNewRecord = (recordId: string, testIndex: number) => {
    setNewRecords(newRecords.map(record => {
      if (record.id === recordId) {
        const testResults = [...record.testResults];
        testResults.splice(testIndex, 1);
        return { ...record, testResults };
      }
      return record;
    }));
  };
  
  // Remove new historical record
  const removeNewHistoricalRecord = (recordId: string) => {
    setNewRecords(newRecords.filter(record => record.id !== recordId));
  };


  // Combine medical history data into consolidated records
  const getConsolidatedMedicalHistory = () => {
    const records: any[] = [];
    
    // FIRST: Add new records at the top (most recent first)
    newRecords.forEach(newRecord => {
      records.push({
        ...newRecord,
        isNew: true,
        isEditable: true
      });
    });
    
    // Then process existing hospital visits - they contain the most complete information
    const hospitalVisits = editedData?.hospitalVisits || editedData?.medicalInfo?.hospitalVisits || [];
    const medicalConditions = editedData?.medicalInfo?.medicalConditions || [];
    const medications = editedData?.medicalInfo?.currentMedications || [];
    const testResults = editedData?.testResults || [];

    // Helper function to extract name from object or string
    const getName = (obj: any): string => {
      if (!obj) return 'Unknown';
      if (typeof obj === 'string') return obj;
      if (obj.name) return obj.name;
      if (obj.user?.name) return obj.user.name;
      return 'Unknown';
    };

    // Helper function to check if dates are close (within same day)
    const datesMatch = (date1: any, date2: any): boolean => {
      if (!date1 || !date2) return false;
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return d1.toDateString() === d2.toDateString();
    };

    // Create consolidated records from hospital visits
    hospitalVisits.forEach((visit: any, index: number) => {
      const visitDate = visit.visitDate || visit.date || new Date();
      
      // Find related conditions (diagnosed on the same date)
      const relatedConditions = medicalConditions.filter((c: any) => 
        datesMatch(c.diagnosedDate, visitDate)
      );
      
      // Find related medications (prescribed around visit date)
      const relatedMedications = medications.filter((m: any) => {
        if (!m.startDate) return false;
        const medDate = new Date(m.startDate);
        const visit = new Date(visitDate);
        // Medication started within 7 days of visit
        const daysDiff = Math.abs((medDate.getTime() - visit.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      });

      // Find related tests (tested on the same date or within 3 days)
      const relatedTests = testResults.filter((t: any) => {
        if (!t.testDate) return false;
        const testDate = new Date(t.testDate);
        const visit = new Date(visitDate);
        const daysDiff = Math.abs((testDate.getTime() - visit.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 3;
      });

      // Extract doctor name
      const doctorName = getName(visit.doctor) || 
                        visit.doctorName || 
                        visit.attendingDoctor || 
                        visit.diagnosedBy || 
                        'Unknown';

      // Extract hospital name
      const hospitalName = getName(visit.hospital) || 
                          visit.hospitalName || 
                          visit.hospital || 
                          'Unknown';

      // Get diagnosis from visit or related conditions
      const diagnosis = visit.diagnosis || 
                       visit.reason ||
                       relatedConditions.map((c: any) => c.condition).join(', ') || 
                       'No diagnosis recorded';

      records.push({
        id: visit._id || visit.id || `visit-${index}`,
        date: visitDate,
        diagnosis: diagnosis,
        medications: relatedMedications.map((m: any) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          startDate: m.startDate,
          endDate: m.endDate,
          prescribedBy: m.prescribedBy || getName(m.prescribedBy)
        })),
        testResults: relatedTests.map((t: any) => ({
          testType: t.testType,
          results: t.results,
          status: t.status,
          date: t.testDate || t.date,
          normalRange: t.normalRange,
          labTechnician: t.labTechnician
        })),
        doctorName: doctorName,
        hospitalName: hospitalName,
        visitType: visit.visitType || visit.type || visit.reason || 'General Visit',
        notes: visit.notes || visit.description || visit.treatment || '',
        treatment: visit.treatment,
        followUpRequired: visit.followUpRequired,
        followUpDate: visit.followUpDate,
        isNew: false,
        isEditable: false // Existing records cannot be edited by doctors
      });
    });

    // Add standalone conditions without visits
    medicalConditions.forEach((condition: any, index: number) => {
      const conditionDate = condition.diagnosedDate || new Date();
      const hasVisit = hospitalVisits.some((visit: any) => {
        const visitDate = visit.visitDate || visit.date;
        return datesMatch(visitDate, conditionDate);
      });

      if (!hasVisit) {
        // Find medications and tests around this condition date
        const relatedMedications = medications.filter((m: any) => {
          if (!m.startDate) return false;
          return datesMatch(m.startDate, conditionDate);
        });

        const relatedTests = testResults.filter((t: any) => {
          if (!t.testDate) return false;
          return datesMatch(t.testDate, conditionDate);
        });

        records.push({
          id: condition._id || condition.id || `condition-${index}`,
          date: conditionDate,
          diagnosis: condition.condition || 'No diagnosis',
          medications: relatedMedications.map((m: any) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            startDate: m.startDate,
            endDate: m.endDate,
            prescribedBy: m.prescribedBy || getName(m.prescribedBy)
          })),
          testResults: relatedTests.map((t: any) => ({
            testType: t.testType,
            results: t.results,
            status: t.status,
            date: t.testDate
          })),
          doctorName: condition.diagnosedBy || getName(condition.diagnosedBy) || 'Unknown',
          hospitalName: 'Unknown',
          visitType: 'Diagnosis Only',
          notes: condition.notes || '',
          isNew: false,
          isEditable: false // Existing records cannot be edited by doctors
        });
      }
    });

    // Sort by date (most recent first), but keep new records at top
    return records.sort((a, b) => {
      // New records always appear first
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      
      // Then sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  };

  const consolidatedRecords = getConsolidatedMedicalHistory();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header - Green Theme */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Patient Passport</h2>
                <p className="text-green-100">{editedData?.personalInfo?.fullName || 'Unknown Patient'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isDoctor && (
                <span className="px-3 py-1 bg-white bg-opacity-20 text-white rounded-lg text-sm">
                  👨‍⚕️ View Only
                </span>
              )}
              {!isDoctor && isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 font-medium"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : !isDoctor ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              ) : null}
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
                <User className="h-5 w-5 mr-2 text-green-600" />
                Personal Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {canEdit && isEditing ? (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  {canEdit && isEditing ? (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {editedData?.personalInfo?.dateOfBirth ? new Date(editedData.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-gray-900 capitalize">{editedData?.personalInfo?.gender || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                    <p className="text-gray-900">{editedData?.personalInfo?.bloodType || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <p className="text-gray-900">{editedData?.personalInfo?.contactNumber || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{editedData?.personalInfo?.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900">{editedData?.personalInfo?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Medical Information Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-600" />
                Medical Summary
              </h3>

              {/* Allergies */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <p className="text-gray-900">
                    {(editedData?.medicalInfo?.allergies || []).length > 0 
                      ? editedData.medicalInfo.allergies.join(', ') 
                      : 'No known allergies'
                    }
                  </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Medical Conditions</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(editedData?.medicalInfo?.medicalConditions || []).length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Current Medications</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(editedData?.medicalInfo?.currentMedications || []).filter((m: any) => 
                      m.status === 'active' || !m.endDate || new Date(m.endDate) > new Date()
                    ).length}
                  </p>
                          </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Test Results</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(editedData?.testResults || []).length}
                  </p>
                          </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Hospital Visits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(editedData?.hospitalVisits || []).length}
                  </p>
                        </div>
                    </div>
                </div>
              </div>

          {/* Consolidated Medical History - All in One Card */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Activity className="h-6 w-6 mr-2 text-green-600" />
                  Medical History
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete medical records with diagnosis, medications, tests, and visit information
                </p>
              </div>
              {/* Allow doctors to add new historical records */}
              {isDoctor && (
                <button
                  onClick={addNewHistoricalRecord}
                  disabled={!doctorProfile && isDoctor}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!doctorProfile ? 'Loading doctor profile...' : 'Add a new historical record'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Record
                  {!doctorProfile && isDoctor && (
                    <span className="ml-2 text-xs">(Loading...)</span>
                  )}
                </button>
              )}
                </div>
                
            <div className="space-y-4">
              {consolidatedRecords.length > 0 ? (
                consolidatedRecords.map((record: any, index: number) => (
                  <div 
                    key={record.id || index}
                    className={`bg-gradient-to-r from-green-50 to-emerald-50 border-2 ${record.isNew ? 'border-yellow-400 border-dashed' : 'border-green-200'} rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {record.isNew && (
                      <div className="mb-4 flex items-center justify-between">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          New Record (Editable)
                        </span>
                        <button
                          onClick={() => removeNewHistoricalRecord(record.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                          title="Remove this new record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Header */}
                    <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            {record.isNew && record.isEditable ? (
                              <input
                                type="date"
                                value={record.date || ''}
                                onChange={(e) => updateNewHistoricalRecord(record.id, 'date', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Select date"
                              />
                            ) : (
                              <span className="font-semibold text-gray-900">
                                {new Date(record.date).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                            {record.isNew && record.isEditable ? (
                              <input
                                type="text"
                                value={record.visitType || ''}
                                onChange={(e) => updateNewHistoricalRecord(record.id, 'visitType', e.target.value)}
                                placeholder="e.g., General Checkup, Emergency, Follow-up"
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            ) : (
                              <span className="text-sm font-medium text-green-700">{record.visitType}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                            <Building className="h-4 w-4 text-green-600" />
                            {record.isNew && record.isEditable ? (
                              <input
                                type="text"
                                value={record.hospitalName || ''}
                                onChange={(e) => updateNewHistoricalRecord(record.id, 'hospitalName', e.target.value)}
                                placeholder="Hospital Name"
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-40 bg-gray-50"
                                readOnly
                                title="Auto-detected from your profile"
                              />
                            ) : (
                              <span className="text-green-700">{record.hospitalName}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                            <User className="h-4 w-4 text-blue-600" />
                            {record.isNew && record.isEditable ? (
                              <input
                                type="text"
                                value={record.doctorName || ''}
                                onChange={(e) => updateNewHistoricalRecord(record.id, 'doctorName', e.target.value)}
                                placeholder="Doctor Name"
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-40 bg-gray-50"
                                readOnly
                                title="Auto-detected from your profile"
                              />
                            ) : (
                              <span className="text-blue-700">{record.doctorName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-red-500" />
                        Diagnosis
                      </h4>
                      {record.isNew && record.isEditable ? (
                        <input
                          type="text"
                          value={record.diagnosis || ''}
                          onChange={(e) => updateNewHistoricalRecord(record.id, 'diagnosis', e.target.value)}
                          placeholder="e.g., Hypertension, Diabetes Type 2, Common Cold"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                      ) : (
                        <p className="text-gray-900 bg-white p-3 rounded border border-green-200">
                          {record.diagnosis || 'No diagnosis recorded'}
                        </p>
                      )}
                    </div>

                    {/* Medications */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                          <Pill className="h-4 w-4 mr-1 text-blue-500" />
                          Medications
                        </h4>
                        {record.isNew && record.isEditable && (
                          <button
                            onClick={() => addMedicationToNewRecord(record.id)}
                            className="text-xs text-green-600 hover:text-green-700 flex items-center"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Medication
                          </button>
                        )}
                      </div>
                      {record.medications && record.medications.length > 0 ? (
                        <div className="space-y-2">
                          {record.medications.map((med: any, medIndex: number) => (
                            <div key={medIndex} className="bg-white p-3 rounded border border-green-200">
                              {record.isNew && record.isEditable ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={med.name || ''}
                                    onChange={(e) => updateNewHistoricalRecord(record.id, `medications.${medIndex}.name`, e.target.value)}
                                    placeholder="e.g., Paracetamol 500mg, Amoxicillin 250mg"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <input
                                    type="text"
                                    value={med.dosage || ''}
                                    onChange={(e) => updateNewHistoricalRecord(record.id, `medications.${medIndex}.dosage`, e.target.value)}
                                    placeholder="e.g., 500mg, 1 tablet"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <input
                                    type="text"
                                    value={med.frequency || ''}
                                    onChange={(e) => updateNewHistoricalRecord(record.id, `medications.${medIndex}.frequency`, e.target.value)}
                                    placeholder="e.g., Twice daily, Once every 8 hours"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="date"
                                      value={med.startDate || ''}
                                      onChange={(e) => updateNewHistoricalRecord(record.id, `medications.${medIndex}.startDate`, e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                                    />
                                    <input
                                      type="date"
                                      value={med.endDate || ''}
                                      onChange={(e) => updateNewHistoricalRecord(record.id, `medications.${medIndex}.endDate`, e.target.value)}
                                      placeholder="End Date"
                                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                                    />
                                    <button
                                      onClick={() => removeMedicationFromNewRecord(record.id, medIndex)}
                                      className="text-red-600 hover:text-red-700 px-2"
                                      title="Remove medication"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{med.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">
                                      {med.dosage || 'N/A'} - {med.frequency || 'N/A'}
                                    </p>
                                    {med.prescribedBy && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Prescribed by: {med.prescribedBy}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right text-xs text-gray-500">
                                    {med.startDate && (
                                      <p>Start: {new Date(med.startDate).toLocaleDateString()}</p>
                                    )}
                                    {med.endDate && (
                                      <p>End: {new Date(med.endDate).toLocaleDateString()}</p>
                                    )}
                                    {!med.endDate && (
                                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs mt-1">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        record.isNew && record.isEditable ? null : (
                          <p className="text-gray-500 text-sm">No medications recorded</p>
                        )
                      )}
                    </div>

                    {/* Test Results */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                          <Activity className="h-4 w-4 mr-1 text-green-500" />
                          Test Results
                        </h4>
                        {record.isNew && record.isEditable && (
                          <button
                            onClick={() => addTestResultToNewRecord(record.id)}
                            className="text-xs text-green-600 hover:text-green-700 flex items-center"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Test
                          </button>
                        )}
                      </div>
                      {record.testResults && record.testResults.length > 0 ? (
                        <div className="space-y-2">
                          {record.testResults.map((test: any, testIndex: number) => (
                            <div key={testIndex} className="bg-white p-3 rounded border border-green-200">
                              {record.isNew && record.isEditable ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={test.testType || ''}
                                    onChange={(e) => updateNewHistoricalRecord(record.id, `testResults.${testIndex}.testType`, e.target.value)}
                                    placeholder="e.g., Blood Test, X-Ray, ECG"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <input
                                    type="text"
                                    value={test.results || ''}
                                    onChange={(e) => updateNewHistoricalRecord(record.id, `testResults.${testIndex}.results`, e.target.value)}
                                    placeholder="e.g., Normal, Elevated glucose levels, Clear"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <select
                                    value={test.status || 'normal'}
                                    onChange={(e) => updateNewHistoricalRecord(record.id, `testResults.${testIndex}.status`, e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="abnormal">Abnormal</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <input
                                      type="date"
                                      value={test.date || ''}
                                      onChange={(e) => updateNewHistoricalRecord(record.id, `testResults.${testIndex}.date`, e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                                    />
                                    <button
                                      onClick={() => removeTestResultFromNewRecord(record.id, testIndex)}
                                      className="text-red-600 hover:text-red-700 px-2"
                                      title="Remove test"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{test.testType || 'N/A'}</p>
                                    <p className="text-sm text-gray-700 mt-1">{test.results || 'N/A'}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    test.status === 'normal' ? 'bg-green-100 text-green-800' :
                                    test.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {test.status || 'normal'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        record.isNew && record.isEditable ? null : (
                          <p className="text-gray-500 text-sm">No test results recorded</p>
                        )
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mt-4 pt-4 border-t border-green-300">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                      {record.isNew && record.isEditable ? (
                        <textarea
                          value={record.notes || ''}
                          onChange={(e) => updateNewHistoricalRecord(record.id, 'notes', e.target.value)}
                          placeholder="e.g., Patient responded well to treatment. Recommended follow-up in 2 weeks. Rest advised."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border border-green-200">
                          {record.notes || 'No notes recorded'}
                        </p>
                      )}
                    </div>

                    {/* No medications or tests message */}
                    {(!record.medications || record.medications.length === 0) && 
                     (!record.testResults || record.testResults.length === 0) && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No medications or test results recorded for this visit
                </div>
                  )}
              </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No medical history records available</p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button for New Records */}
          {isDoctor && newRecords.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors shadow-lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving Records...' : `Save ${newRecords.length} New Record${newRecords.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Access History */}
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
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
