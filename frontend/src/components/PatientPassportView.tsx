import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import Logo from "./Logo";
import { Clock, User, Mail, Phone, MapPin, Calendar, Droplets, AlertTriangle, Shield } from "lucide-react";

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
}

const PatientPassportView: React.FC<PatientPassportViewProps> = ({
  patientId,
  accessToken,
  onClose
}) => {
  const navigate = useNavigate();
  const [expandedCondition, setExpandedCondition] = useState<number | null>(null);
  const [medicalData, setMedicalData] = useState({
    conditions: [],
    medications: [],
    tests: [],
    visits: [],
    images: []
  });
  const [patientInfo, setPatientInfo] = useState<any>(null);
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
            {/* Access Timer */}
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Access expires: {new Date(accessExpiresAt).toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Close
            </button>
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
                  <p className="text-sm font-semibold text-gray-900">{patientInfo?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-sm font-semibold text-gray-900">{patientInfo?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {patientInfo?.dateOfBirth ? new Date(patientInfo.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact</span>
                  <p className="text-sm font-semibold text-gray-900">{patientInfo?.contactNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Address</span>
                  <p className="text-sm font-semibold text-gray-900">{patientInfo?.address || 'N/A'}</p>
                </div>
              </div>
              {patientInfo?.bloodType && (
                <div className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                  <Droplets className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-500">Blood Type</span>
                    <p className="text-sm font-semibold text-gray-900">{patientInfo.bloodType}</p>
                  </div>
                </div>
              )}
              {patientInfo?.allergies && patientInfo.allergies.length > 0 && (
                <div className="flex items-start space-x-3 py-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-gray-500">Allergies</span>
                    <p className="text-sm font-semibold text-red-600">
                      {patientInfo.allergies.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Medical History
          </h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Medications
          </h2>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Test Results
            </h2>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hospital Visits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hospital Visits
            </h2>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Medical Images
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Uploaded X-rays, scans, and other diagnostic images
          </p>
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
                    <svg className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
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

