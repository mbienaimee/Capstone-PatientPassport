import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import accessControlService, { AccessRequestData } from '../../services/accessControlService';
import { hospitalAuthService } from '../../services/hospitalAuthService';
import { toast } from 'react-hot-toast';

interface DoctorAccessRequestFormProps {
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

const DoctorAccessRequestForm: React.FC<DoctorAccessRequestFormProps> = ({
  patientId,
  patientName,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AccessRequestData>();

  const selectedRequestType = watch('requestType');

  const onSubmit = async (data: AccessRequestData) => {
    try {
      setIsSubmitting(true);
      
      // Get hospital ID from hospital authentication
      const hospitalAuth = hospitalAuthService.getHospitalAuthData();
      const hospitalId = hospitalAuth?.hospital?.id;
      
      if (!hospitalId) {
        throw new Error('Hospital authentication required');
      }
      
      const requestData: AccessRequestData = {
        ...data,
        patientId,
        hospitalId,
        expiresInHours: data.requestType === 'emergency' ? 2 : 24
      };

      await accessControlService.createAccessRequest(requestData);
      
      toast.success('Access request sent successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating access request:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to send access request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🏥 Request Access to Patient Passport</h2>
        <p className="text-gray-600">Requesting access to Patient Passport medical records for: <span className="font-semibold">{patientName}</span></p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Request Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type of Access Request
          </label>
          <div className="space-y-3">
            {REQUEST_TYPES.map((type) => (
              <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  {...register('requestType', { required: 'Please select a request type' })}
                  type="radio"
                  value={type.value}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.requestType && (
            <p className="mt-1 text-sm text-red-600">{errors.requestType.message}</p>
          )}
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
                  {...register('requestedData', { required: 'Please select at least one data type' })}
                  type="checkbox"
                  value={dataType.value}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{dataType.label}</span>
              </label>
            ))}
          </div>
          {errors.requestedData && (
            <p className="mt-1 text-sm text-red-600">{errors.requestedData.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Access
          </label>
          <textarea
            {...register('reason', { 
              required: 'Please provide a reason for access',
              minLength: { value: 10, message: 'Reason must be at least 10 characters' },
              maxLength: { value: 500, message: 'Reason must be less than 500 characters' }
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Please provide a detailed reason for requesting access to this patient's medical records..."
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>

        {/* Emergency Warning */}
        {selectedRequestType === 'emergency' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Emergency Access</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This request will be automatically approved and will expire in 2 hours. Use only for genuine medical emergencies.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending Request...' : 'Send Access Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorAccessRequestForm;
