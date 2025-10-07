import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const DoctorAccessRequest: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId, patientName, doctorName, licenseNumber } = location.state || {};

  const [formData, setFormData] = useState({
    requestType: 'view',
    reason: '',
    requestedData: [] as string[],
    expiresInHours: 24
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const DATA_TYPES = [
    { value: 'medical_history', label: 'Medical History' },
    { value: 'medications', label: 'Current Medications' },
    { value: 'allergies', label: 'Allergies' },
    { value: 'lab_results', label: 'Lab Results' },
    { value: 'imaging', label: 'Imaging Reports' },
    { value: 'emergency_contacts', label: 'Emergency Contacts' },
    { value: 'insurance', label: 'Insurance Information' }
  ];

  const REQUEST_TYPES = [
    { value: 'view', label: 'View Only', description: 'Read-only access to medical records' },
    { value: 'edit', label: 'Edit Access', description: 'Can modify medical records' },
    { value: 'emergency', label: 'Emergency Access', description: 'Immediate access for urgent cases' }
  ];

  const handleDataChange = (value: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        requestedData: [...formData.requestedData, value]
      });
    } else {
      setFormData({
        ...formData,
        requestedData: formData.requestedData.filter(item => item !== value)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      alert('Access request sent successfully! The patient will be notified.');
      
      // Navigate back to patient list
      navigate('/doctor-patient-passport');
    } catch (error) {
      console.error('Error sending access request:', error);
      alert('Error sending access request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patientId || !patientName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h1>
          <p className="text-gray-600 mb-6">Please select a patient first.</p>
          <button 
            onClick={() => navigate('/doctor-patient-passport')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔐 Request Patient Passport Access</h1>
              <p className="text-sm text-gray-600">Request access to patient's medical records</p>
            </div>
            <button
              onClick={() => navigate('/doctor-patient-passport')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Patients
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Patient Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{patientName}</h2>
                <p className="text-gray-600">Patient ID: {patientId}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Requesting Doctor:</span>
                  <p className="text-gray-900">{doctorName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">License Number:</span>
                  <p className="text-gray-900">{licenseNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Access Request Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Request Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type of Access Request
                </label>
                <div className="space-y-3">
                  {REQUEST_TYPES.map((type) => (
                    <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="requestType"
                        value={type.value}
                        checked={formData.requestType === type.value}
                        onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Requested Data Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Data Types to Access
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DATA_TYPES.map((dataType) => (
                    <label key={dataType.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requestedData.includes(dataType.value)}
                        onChange={(e) => handleDataChange(dataType.value, e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{dataType.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Access
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Please provide a detailed reason for requesting access to this patient's medical records..."
                  required
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Duration
                </label>
                <select
                  value={formData.expiresInHours}
                  onChange={(e) => setFormData({ ...formData, expiresInHours: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value={2}>2 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                </select>
              </div>

              {/* Emergency Warning */}
              {formData.requestType === 'emergency' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Emergency Access</h3>
                      <p className="mt-1 text-sm text-red-700">
                        This request will be automatically approved and will expire in 2 hours. 
                        Use only for genuine medical emergencies.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/doctor-patient-passport')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.requestedData.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Send Access Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAccessRequest;







