import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import Logo from "./Logo";

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

const PatientPassport: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [expandedCondition, setExpandedCondition] = useState<number | null>(null);
  const [medicalData, setMedicalData] = useState({
    conditions: [],
    medications: [],
    tests: [],
    visits: [],
    images: []
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/patient-login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch medical records when component mounts
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setDataLoading(true);
          // First, get the patient profile to get the correct patient ID
          const patientResponse = await apiService.getCurrentUser();
          if (patientResponse.success && patientResponse.data) {
            // For now, we'll use the user ID as patient ID since they're the same in this system
            // In a real system, you'd have a separate Patient model with its own ID
            const response = await apiService.getPatientMedicalRecords(user.id);
            if (response.success) {
              setMedicalData(response.data);
            }
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
      }
    };

    fetchMedicalRecords();
  }, [isAuthenticated, user?.id]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
  const medicalHistory: MedicalCondition[] = medicalData.conditions.map((record: any) => ({
    name: record.data.name || '',
    details: record.data.details || '',
    diagnosed: record.data.diagnosed || '',
    procedure: record.data.procedure || ''
  }));

  const medications: Medication[] = medicalData.medications.map((record: any) => ({
    name: record.data.medicationName || '',
    dosage: record.data.dosage || '',
    status: record.data.status || 'Active'
  }));

  const testResults: TestResult[] = medicalData.tests.map((record: any) => ({
    name: record.data.testName || '',
    date: record.data.testDate || '',
    status: record.data.status || 'Normal'
  }));

  const hospitalVisits: HospitalVisit[] = medicalData.visits.map((record: any) => ({
    hospital: record.data.hospital || '',
    reason: record.data.reason || '',
    date: record.data.visitDate || ''
  }));

  const medicalImages = medicalData.images.map((record: any) => ({
    url: record.data.imageUrl || '',
    alt: record.data.description || 'Medical Image'
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
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
              onClick={() => navigate('/update-passport')}
              className="nav-link"
            >
              Update Passport
            </button>
            <button 
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="nav-link"
            >
              Logout
            </button>
          </nav>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              AS
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
          <p className="body-sm text-gray-600 mt-2">
            Complete medical history and health information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Information */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Patient Information
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Name</span>
                <span className="text-sm font-semibold text-gray-900">{user?.name || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm font-semibold text-gray-900">{user?.email || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Role</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{user?.role || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Account Status</span>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="text-sm font-medium text-gray-500">Member Since</span>
                <span className="text-sm font-semibold text-gray-900 text-right">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Doctor */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Primary Doctor
              </h2>
            </div>
            <div className="flex items-start space-x-4">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200"
                alt="Dr. Ben Carter"
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <span className="text-sm font-semibold text-gray-900">Dr. Ben Carter</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Specialty</span>
                  <span className="text-sm font-semibold text-gray-900">Cardiologist</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Hospital</span>
                  <span className="text-sm font-semibold text-gray-900">City General Hospital</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Contact</span>
                  <span className="text-sm font-semibold text-gray-900">+1 (555) 987-6543</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="text-sm font-semibold text-gray-900">ben.carter@hospital.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="dashboard-card mb-8">
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
                    <span className="badge-gray">
                      {condition.diagnosed
                        ? `Diagnosed: ${condition.diagnosed}`
                        : `Procedure: ${condition.procedure}`}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate('/update-passport')}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                        aria-label={`Edit ${condition.name}`}
                      >
                        Edit
                      </button>
                    </div>
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
        <div className="dashboard-card mb-8">
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
                  <button
                    onClick={() => navigate('/update-passport')}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                    aria-label={`Edit ${med.name} medication`}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Test Results */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Test Results
              </h2>
            </div>
            <div className="space-y-3">
              {testResults.length === 0 ? (
                <EmptyState 
                  title="No Test Results" 
                  description="Your lab tests and diagnostic results will appear here once added by your healthcare providers."
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
                      className="text-xs text-green-600 hover:text-green-700 font-semibold transition-colors"
                      aria-label={`View ${test.name} report`}
                    >
                      View Report
                    </button>
                    <button
                      onClick={() => navigate('/update-passport')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      aria-label={`Edit ${test.name} result`}
                    >
                      Edit
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
            <div className="space-y-4">
              {hospitalVisits.length === 0 ? (
                <EmptyState 
                  title="No Hospital Visits" 
                  description="Your hospital visits and appointments will appear here once added by your healthcare providers."
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
                    <button
                      onClick={() => navigate('/update-passport')}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                      aria-label={`Edit visit to ${visit.hospital}`}
                    >
                      Edit
                    </button>
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
            <p className="text-sm text-gray-600 mt-2">
              Uploaded X-rays, scans, and other diagnostic images
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {medicalImages.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="No Medical Images" 
                  description="Your X-rays, scans, and other diagnostic images will appear here once uploaded by your healthcare providers."
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
                  <svg className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/update-passport');
                    }}
                    className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
                    aria-label={`Edit ${img.alt}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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