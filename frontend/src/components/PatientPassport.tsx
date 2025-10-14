import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import Logo from "./Logo";
import { 
  FiUser, 
  FiMail, 
  FiShield, 
  FiCalendar, 
  FiPhone, 
  FiHeart, 
  FiActivity, 
  FiHome, 
  FiImage, 
  FiChevronDown, 
  FiEye, 
  FiBell,
  FiLogOut
} from 'react-icons/fi';

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

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface PatientProfile {
  _id: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  address: string;
  emergencyContact: EmergencyContact;
  bloodType?: string;
  allergies?: string[];
  status: string;
}

const PatientPassport: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [expandedCondition, setExpandedCondition] = useState<number | null>(null);
  const [medicalData, setMedicalData] = useState<{
    conditions: MedicalCondition[];
    medications: Medication[];
    tests: TestResult[];
    visits: HospitalVisit[];
    images: unknown[];
  }>({
    conditions: [],
    medications: [],
    tests: [],
    visits: [],
    images: []
  });
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/patient-login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch medical records and patient profile when component mounts
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setDataLoading(true);
          console.log('Fetching complete patient passport data...');
          
          // Get the patient profile including emergency contact information
          const patientResponse = await apiService.getCurrentUser();
          console.log('Patient profile response:', patientResponse);
          
          if (patientResponse.success && patientResponse.data) {
            // Set patient profile data (includes emergency contact)
            const profile = (patientResponse.data as unknown as { profile: PatientProfile }).profile;
            console.log('Patient profile data:', profile);
            console.log('Emergency contact:', profile?.emergencyContact);
            setPatientProfile(profile);
            
            // Fetch complete passport data using the new endpoint
            if (profile?._id) {
              const response = await apiService.getPatientPassport(profile._id);
              console.log('Complete passport response:', response);
              
              if (response.success && response.data) {
                const passportData = response.data;
                console.log('Passport data:', passportData);
                
                // Set medical data from the passport response
                if (passportData.medicalRecords) {
                  setMedicalData(passportData.medicalRecords);
                }
                
                // Update patient profile with complete data if available
                if (passportData.patient) {
                  setPatientProfile(passportData.patient);
                }
              }
            } else {
              console.warn('No patient profile ID found');
              // Set empty data if no profile ID
              setMedicalData({
                conditions: [],
                medications: [],
                tests: [],
                visits: [],
                images: []
              });
            }
          } else {
            console.warn('Failed to fetch patient profile:', patientResponse.message);
            // Set empty data on error
            setMedicalData({
              conditions: [],
              medications: [],
              tests: [],
              visits: [],
              images: []
            });
            setPatientProfile(null);
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
          setPatientProfile(null);
        } finally {
          setDataLoading(false);
        }
      }
    };

    fetchMedicalRecords();
  }, [isAuthenticated, user?.id]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Transform database records to component format
  const medicalHistory: MedicalCondition[] = (medicalData.conditions || []).map((record: unknown) => {
    const r = record as { data?: { name?: string; details?: string; diagnosed?: string; procedure?: string } };
    return {
      name: r.data?.name || '',
      details: r.data?.details || '',
      diagnosed: r.data?.diagnosed || '',
      procedure: r.data?.procedure || ''
    };
  });

  const medications: Medication[] = (medicalData.medications || []).map((record: unknown) => {
    const r = record as { data?: { medicationName?: string; dosage?: string; status?: string } };
    return {
      name: r.data?.medicationName || '',
      dosage: r.data?.dosage || '',
      status: (r.data?.status || 'Active') as "Active" | "Past"
    };
  });

  const testResults: TestResult[] = (medicalData.tests || []).map((record: unknown) => {
    const r = record as { data?: { testName?: string; testDate?: string; status?: string } };
    return {
      name: r.data?.testName || '',
      date: r.data?.testDate || '',
      status: (r.data?.status || 'Normal') as "Normal" | "Critical" | "Normal Sinus Rhythm"
    };
  });

  const hospitalVisits: HospitalVisit[] = (medicalData.visits || []).map((record: unknown) => {
    const r = record as { data?: { hospital?: string; reason?: string; visitDate?: string } };
    return {
      hospital: r.data?.hospital || '',
      reason: r.data?.reason || '',
      date: r.data?.visitDate || ''
    };
  });

  const medicalImages = (medicalData.images || []).map((record: unknown) => {
    const r = record as { data?: { imageUrl?: string; description?: string } };
    return {
      url: r.data?.imageUrl || '',
      alt: r.data?.description || 'Medical Image'
    };
  });

  // Empty state component
  const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div className="text-center py-6">
      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="nav-link"
            >
              Home
            </button>
            <button className="nav-link-active">
              My Passport
            </button>
            <button 
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="nav-link flex items-center gap-2"
            >
              <FiLogOut className="w-4 h-4" />
              Logout
            </button>
          </nav>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <FiBell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Patient'}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="dashboard-card-header">
          <h1 className="heading-lg text-gray-900">
            Patient Passport Overview
          </h1>
          <p className="body-sm text-gray-600 mt-1">
            Complete medical history and health information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Information */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Patient Information
              </h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiShield className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Patient ID</span>
                  <p className="text-sm font-semibold text-gray-900 font-mono">{patientProfile?._id || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiMail className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-sm font-semibold text-gray-900">{user?.email || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiShield className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Role</span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{user?.role || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiShield className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">National ID</span>
                  <p className="text-sm font-semibold text-gray-900">{patientProfile?.nationalId || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {patientProfile?.dateOfBirth ? new Date(patientProfile.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Gender</span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{patientProfile?.gender || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Contact Number</span>
                  <p className="text-sm font-semibold text-gray-900">{patientProfile?.contactNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiHome className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Address</span>
                  <p className="text-sm font-semibold text-gray-900">{patientProfile?.address || 'N/A'}</p>
                </div>
              </div>
              {patientProfile?.bloodType && (
                <div className="flex items-center gap-3 py-2">
                  <FiHeart className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500">Blood Type</span>
                    <p className="text-sm font-semibold text-gray-900">{patientProfile.bloodType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Emergency Contact
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                {patientProfile?.emergencyContact ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block sm:inline">Name</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {patientProfile.emergencyContact.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiHeart className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block sm:inline">Relationship</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {patientProfile.emergencyContact.relationship || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block sm:inline">Phone</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {patientProfile.emergencyContact.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FiPhone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No emergency contact information available</p>
                    <p className="text-gray-400 text-xs mt-1">Please update your profile to add emergency contact details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="dashboard-card mb-6">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title text-green-600">
              Medical History
            </h2>
          </div>
          <div className="space-y-3">
            {medicalHistory.length === 0 ? (
              <EmptyState 
                title="No Medical History" 
                description="Your medical conditions and procedures will appear here once added by your healthcare providers."
                icon={FiActivity}
              />
            ) : (
              medicalHistory.map((condition, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
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
                    <span className="badge-gray">
                      {condition.diagnosed
                        ? `Diagnosed: ${condition.diagnosed}`
                        : `Procedure: ${condition.procedure}`}
                    </span>
                    <FiChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedCondition === idx ? "rotate-180" : ""
                      }`}
                    />
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
        <div className="dashboard-card mb-6">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title text-green-600">
              Medications
            </h2>
          </div>
          <div className="space-y-3">
            {medications.length === 0 ? (
              <EmptyState 
                title="No Medications" 
                description="Your current and past medications will appear here once added by your healthcare providers."
                icon={FiActivity}
              />
            ) : (
              medications.map((med, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-600">{med.dosage}</p>
                </div>
                <div className="flex items-center space-x-3">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Test Results */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Test Results
              </h2>
            </div>
            <div className="space-y-2">
              {testResults.length === 0 ? (
                <EmptyState 
                  title="No Test Results" 
                  description="Your lab tests and diagnostic results will appear here once added by your healthcare providers."
                  icon={FiActivity}
                />
              ) : (
                testResults.map((test, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {test.name}
                    </p>
                    <p className="text-xs text-gray-600">{test.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
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
                    <button 
                      onClick={() => navigate('/patient-passport')}
                      className="text-xs text-green-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-1"
                      aria-label={`View ${test.name} report`}
                    >
                      <FiEye className="w-3 h-3" />
                      View Report
                    </button>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Hospital Visits */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Hospital Visits
              </h2>
            </div>
            <div className="space-y-2">
              {hospitalVisits.length === 0 ? (
                <EmptyState 
                  title="No Hospital Visits" 
                  description="Your hospital visits and appointments will appear here once added by your healthcare providers."
                  icon={FiHome}
                />
              ) : (
                hospitalVisits.map((visit, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {visit.hospital}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{visit.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">{visit.date}</p>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </div>

        {/* Medical Images */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title text-green-600">
              Medical Images
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Uploaded X-rays, scans, and other diagnostic images
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {medicalImages.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="No Medical Images" 
                  description="Your X-rays, scans, and other diagnostic images will appear here once uploaded by your healthcare providers."
                  icon={FiImage}
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
                  <FiEye className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
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

export default PatientPassport;