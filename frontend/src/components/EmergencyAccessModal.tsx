import React, { useState } from 'react';
import { apiService } from '../services/api';

interface EmergencyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessData: any) => void;
  patientName: string;
  patientId: string;
  hospitals?: Array<{ _id: string; name: string }>;
}

const EmergencyAccessModal: React.FC<EmergencyAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientName,
  patientId,
  hospitals = []
}) => {
  const [justification, setJustification] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (justification.trim().length < 20) {
      setError('Please provide a detailed justification (minimum 20 characters)');
      return;
    }

    if (!acknowledged) {
      setError('You must acknowledge that this access will be logged and audited');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚨 Submitting emergency access request...');
      
      // Call the emergency access API
      const response = await apiService.requestEmergencyAccess({
        patientId,
        justification: justification.trim(),
        hospitalId: hospitalId || undefined
      });

      if (response.success) {
        console.log('✅ Emergency access granted successfully!');
        
        // Reset form and close modal immediately
        setJustification('');
        setHospitalId('');
        setAcknowledged(false);
        setIsSubmitting(false);
        
        // Call the success callback with the response data
        onSuccess(response);
      } else {
        throw new Error(response.message || 'Failed to request emergency access');
      }
    } catch (err) {
      console.error('❌ Emergency access request failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request emergency access';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setJustification('');
    setHospitalId('');
    setAcknowledged(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Emergency Access Request</h2>
              <button
                onClick={handleCancel}
                className="text-white hover:text-gray-200 transition-colors text-sm font-medium"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Warning Box */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">Important Notice</h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>• This action is logged and audited</p>
                <p>• Patient will be immediately notified</p>
                <p>• Access will be reviewed by compliance team</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-900"><span className="font-semibold">Patient:</span> {patientName}</p>
            </div>

            {/* Hospital Selection */}
            {hospitals.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hospital <span className="text-gray-500">(Optional)</span>
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isSubmitting}
                >
                  <option value="">Select hospital...</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Justification */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Emergency Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why emergency access is needed (minimum 20 characters)"
                rows={4}
                maxLength={500}
                className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  error && justification.length < 20 ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                required
              />
              <span className={`text-xs ${
                justification.length < 20 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {justification.length < 20 
                  ? `${20 - justification.length} more characters needed` 
                  : `${justification.length}/500`}
              </span>
            </div>

            {/* Acknowledgment */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                  required
                />
                <span className="text-xs text-gray-700">
                  I acknowledge this access will be logged, audited, and the patient will be notified. I am accessing this for legitimate emergency medical purposes only.
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || justification.length < 20 || !acknowledged}
                className={`flex-1 px-3 py-2 text-sm rounded font-medium text-white transition-colors ${
                  isSubmitting || justification.length < 20 || !acknowledged
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                {isSubmitting ? 'Requesting...' : 'Request Access'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccessModal;
