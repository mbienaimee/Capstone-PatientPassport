import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [expandedCondition, setExpandedCondition] = useState<number | null>(
    null
  );

  const medicalHistory: MedicalCondition[] = [
    {
      name: "Hypertension (High Blood Pressure)",
      details:
        "Managed with medication (Lisinopril) and lifestyle changes. Regular monitoring required.",
      diagnosed: "2018-03-10",
    },
    {
      name: "Type 2 Diabetes",
      details: "",
      diagnosed: "2020-07-22",
    },
    {
      name: "Appendectomy",
      details: "",
      procedure: "2005-11-01",
    },
  ];

  const medications: Medication[] = [
    { name: "Lisinopril", dosage: "10mg • Once daily", status: "Active" },
    { name: "Metformin", dosage: "500mg • Once daily", status: "Active" },
    { name: "Simvastatin", dosage: "20mg • Once daily", status: "Active" },
    {
      name: "Amoxicillin",
      dosage: "250mg • Three times daily",
      status: "Past",
    },
    { name: "Ibuprofen", dosage: "200mg • As needed", status: "Active" },
  ];

  const testResults: TestResult[] = [
    {
      name: "Complete Blood Count (CBC)",
      date: "2023-10-26",
      status: "Normal",
    },
    { name: "Lipid Panel", date: "2023-09-15", status: "Normal" },
    { name: "HbA1c Level", date: "2023-08-01", status: "Critical" },
    {
      name: "Electrocardiogram (ECG)",
      date: "2023-07-19",
      status: "Normal Sinus Rhythm",
    },
    { name: "Urinalysis", date: "2023-06-05", status: "Normal" },
  ];

  const hospitalVisits: HospitalVisit[] = [
    {
      hospital: "City General Hospital",
      reason: "Routine Checkup",
      date: "2023-05-20 - 2023-05-20",
    },
    {
      hospital: "Saint Mary's Clinic",
      reason: "Follow-up for Diabetes",
      date: "2022-11-10 - 2022-11-10",
    },
    {
      hospital: "County Emergency Room",
      reason: "Hypertensive Crisis",
      date: "2021-04-12 - 2021-04-13",
    },
  ];

  const medicalImages = [
    {
      url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
      alt: "Chest X-ray",
    },
    {
      url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
      alt: "Brain MRI",
    },
    {
      url: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400",
      alt: "Ultrasound",
    },
    {
      url: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400",
      alt: "Medical scan",
    },
  ];

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
              onClick={() => navigate('/')}
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
                <span className="text-sm font-semibold text-gray-900">Anya Sharma</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">National ID</span>
                <span className="text-sm font-semibold text-gray-900">PPM-7890-1234</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                <span className="text-sm font-semibold text-gray-900">1992-05-15</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <span className="text-sm font-semibold text-gray-900">+1 (555) 123-4567</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm font-semibold text-gray-900">anya.sharma@example.com</span>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="text-sm font-medium text-gray-500">Address</span>
                <span className="text-sm font-semibold text-gray-900 text-right max-w-xs">
                  456 Oak Avenue, Springfield, IL 62704
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
            {medicalHistory.map((condition, idx) => (
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
            ))}
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
            {medications.map((med, idx) => (
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
            ))}
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
              {testResults.map((test, idx) => (
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
              ))}
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
              {hospitalVisits.map((visit, idx) => (
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
              ))}
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
            {medicalImages.map((img, idx) => (
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientPassport;