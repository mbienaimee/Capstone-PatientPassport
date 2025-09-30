import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
            </svg>
            <span className="text-lg font-semibold text-green-600">logo</span>
          </div>
          <nav className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Home
            </button>
            <button className="text-sm text-green-600 font-medium">
              My Passport
            </button>
            <button 
              onClick={() => navigate('/update-passport')}
              className="text-sm text-blue-600 hover:text-blue-900"
            >
              Update Passport
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </nav>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Patient Passport Overview
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-green-600 mb-4">
              Patient Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">Anya Sharma</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">National ID</p>
                <p className="text-sm text-gray-900">PPM-7890-1234</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="text-sm text-gray-900">1992-05-15</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">+1 (555) 123-4567</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">anya.sharma@example.com</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900">
                  456 Oak Avenue, Springfield, IL 62704
                </p>
              </div>
            </div>
          </div>

          {/* Primary Doctor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-green-600 mb-4">
              Primary Doctor
            </h2>
            <div className="flex items-start space-x-4">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200"
                alt="Dr. Ben Carter"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    Dr. Ben Carter
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Specialty</p>
                  <p className="text-sm text-gray-900">Cardiologist</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hospital</p>
                  <p className="text-sm text-gray-900">City General Hospital</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="text-sm text-gray-900">+1 (555) 987-6543</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">
                    ben.carter@hospital.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-green-600 mb-4">
            Medical History
          </h2>
          <div className="space-y-2">
            {medicalHistory.map((condition, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedCondition(expandedCondition === idx ? null : idx)
                  }
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {condition.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-xs text-gray-500">
                      {condition.diagnosed
                        ? `Diagnosed: ${condition.diagnosed}`
                        : `Procedure: ${condition.procedure}`}
                    </p>
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
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-green-600 mb-4">
            Medications
          </h2>
          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {med.name}
                  </p>
                  <p className="text-xs text-gray-500">{med.dosage}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    med.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {med.status === "Past" ? "Past (Completed)" : med.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-green-600 mb-4">
              Test Results
            </h2>
            <div className="space-y-3">
              {testResults.map((test, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {test.name}
                    </p>
                    <p className="text-xs text-gray-500">{test.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        test.status === "Critical"
                          ? "bg-red-100 text-red-700"
                          : test.status === "Normal Sinus Rhythm"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {test.status}
                    </span>
                    <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hospital Visits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-green-600 mb-4">
              Hospital Visits
            </h2>
            <div className="space-y-4">
              {hospitalVisits.map((visit, idx) => (
                <div
                  key={idx}
                  className="pb-3 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {visit.hospital}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{visit.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">{visit.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medical Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-green-600 mb-2">
            Medical Images
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Uploaded X-rays, scans, and other diagnostic images
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {medicalImages.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientPassport;