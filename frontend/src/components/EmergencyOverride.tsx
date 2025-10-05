import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Notification } from './ui/Notification';

interface EmergencyOverrideProps {
  patientId: string;
  patientName: string;
  onOverride: (justification: string) => void;
  onCancel: () => void;
}

const EmergencyOverride: React.FC<EmergencyOverrideProps> = ({
  patientId,
  patientName,
  onOverride,
  onCancel
}) => {
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!justification.trim()) {
      setError('Justification is required');
      return;
    }

    if (justification.length < 10) {
      setError('Justification must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/medical/emergency-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patientId,
          justification: justification.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        onOverride(justification);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to perform emergency override');
      }
    } catch (err) {
      setError('An error occurred while performing emergency override');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Emergency Override Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                You are about to access patient records without explicit consent.
              </p>
              <p className="font-semibold text-gray-900">
                Patient: {patientName}
              </p>
              <p className="text-sm text-gray-500">
                ID: {patientId}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification for Emergency Access *
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Please provide a detailed justification for accessing this patient's records without consent..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters. This will be logged for audit purposes.
                </p>
              </div>

              {error && (
                <Notification
                  type="error"
                  message={error}
                  onClose={() => setError(null)}
                />
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading || !justification.trim()}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Override Access'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This action will be logged and may be subject to review.
                Only use emergency override in genuine emergency situations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyOverride;

