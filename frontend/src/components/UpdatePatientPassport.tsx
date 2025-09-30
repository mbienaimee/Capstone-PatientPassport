import React, { useState } from 'react';
import { Home, Search, Users, FileText, X, Upload, Facebook, Twitter, Instagram, Linkedin, Menu } from 'lucide-react';

interface Condition {
  id: number;
  name: string;
}

interface Allergy {
  id: number;
  name: string;
}

interface Surgery {
  id: number;
  name: string;
}

interface Medication {
  id: number;
  name: string;
  dosage: string;
  prescribingDoctor: string;
  datePrescribed: string;
}

interface TestResult {
  id: number;
  type: string;
  date: string;
  findings: string;
}

interface UploadedImage {
  id: number;
  url: string;
}

const UpdatePatientPassport: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, name: 'Type 2 Diabetes' },
    { id: 2, name: 'Hypertension' }
  ]);
  const [allergies, setAllergies] = useState<Allergy[]>([
    { id: 1, name: 'Penicillin' }
  ]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([
    { id: 1, name: 'Appendectomy (2010)' }
  ]);
  const [medications, setMedications] = useState<Medication[]>([
    { id: 1, name: 'Metformin', dosage: '500mg BID', prescribingDoctor: 'Dr. Emily White', datePrescribed: '2023-01-15' },
    { id: 2, name: 'Lisinopril', dosage: '10mg Daily', prescribingDoctor: 'Dr. Mark Chen', datePrescribed: '2023-02-10' }
  ]);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 1, type: 'Blood Panel', date: '2024-01-10', findings: 'Elevated A1C. Central blood function.' },
    { id: 2, type: 'MRI Scan', date: '2024-03-01', findings: 'No significant abnormalities found in certain spine.' }
  ]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([
    { id: 1, url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400' },
    { id: 2, url: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400' }
  ]);
  const [doctorNotes, setDoctorNotes] = useState('Patient presented with stable blood pressure during the last visit. Discussed kidney inflammation and importance of regular exercise. Schedule follow-up in 3 months.');

  const removeCondition = (id: number) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const removeAllergy = (id: number) => {
    setAllergies(allergies.filter(a => a.id !== id));
  };

  const removeSurgery = (id: number) => {
    setSurgeries(surgeries.filter(s => s.id !== id));
  };

  const removeMedication = (id: number) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const removeTestResult = (id: number) => {
    setTestResults(testResults.filter(t => t.id !== id));
  };

  const removeImage = (id: number) => {
    setUploadedImages(uploadedImages.filter(img => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">✚</span>
            </div>
            <span className="text-xl font-bold text-green-600">logo</span>
          </div>

          <nav className="space-y-2">
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium">Doctor Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
              <span className="font-medium">Search Patient</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium">My Patients</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-600 rounded-lg">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Update Passport</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Home</a>
                <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Doctor Dashboard</a>
                <a href="#" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Logout</a>
              </nav>
              <div className="flex items-center space-x-4 ml-auto">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Users className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 lg:px-8 py-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Update Patient Passport</h1>

          {/* Patient Identification */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Identification</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Patient Name</p>
                <p className="text-gray-900">Jane Doe</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">National ID</p>
                <p className="text-gray-900">123-456-7890</p>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Medical History</h2>
            
            {/* Conditions */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Conditions</h3>
              <div className="space-y-2">
                {conditions.map(condition => (
                  <div key={condition.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <span className="text-gray-900">{condition.name}</span>
                    <button onClick={() => removeCondition(condition.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-3 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors">
                Add Condition
              </button>
            </div>

            {/* Allergies */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Allergies</h3>
              <div className="space-y-2">
                {allergies.map(allergy => (
                  <div key={allergy.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <span className="text-gray-900">{allergy.name}</span>
                    <button onClick={() => removeAllergy(allergy.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-3 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors">
                Add Allergie
              </button>
            </div>

            {/* Surgeries */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Surgeries</h3>
              <div className="space-y-2">
                {surgeries.map(surgery => (
                  <div key={surgery.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <span className="text-gray-900">{surgery.name}</span>
                    <button onClick={() => removeSurgery(surgery.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-3 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors">
                Add Surgerie
              </button>
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Medications</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dosage</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Prescribing Doctor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Prescribed</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medications.map(med => (
                    <tr key={med.id}>
                      <td className="px-4 py-3 text-gray-900">{med.name}</td>
                      <td className="px-4 py-3 text-gray-900">{med.dosage}</td>
                      <td className="px-4 py-3 text-gray-900">{med.prescribingDoctor}</td>
                      <td className="px-4 py-3 text-gray-900">{med.datePrescribed}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeMedication(med.id)} className="text-red-500 hover:text-red-700 text-sm">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors">
              Add Medication
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
            {testResults.map(test => (
              <div key={test.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Type</p>
                    <p className="text-gray-900">{test.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Date</p>
                    <p className="text-gray-900">{test.date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Findings</p>
                    <p className="text-gray-900">{test.findings}</p>
                  </div>
                </div>
                <button onClick={() => removeTestResult(test.id)} className="text-red-500 hover:text-red-700 text-sm">
                  Remove
                </button>
              </div>
            ))}
            <button className="mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors">
              Add Test Result
            </button>
          </div>

          {/* Doctor's Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Doctor's Notes</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500"
              />
            </div>
          </div>

          {/* Image Uploads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Image Uploads</h2>
            <p className="text-sm text-gray-600 mb-4">Upload X-rays, scans, or other relevant medical images.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-green-500 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Drag & drop image here, or click to browse</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt="Medical" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors">
              Save Passport
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-4 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <nav className="flex gap-6">
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">About</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Support</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Legal</a>
              </nav>
              <div className="flex gap-4">
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-green-600 flex items-center justify-center text-gray-600 hover:text-white transition-all">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default UpdatePatientPassport;