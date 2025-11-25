import { useState, useEffect } from 'react';
import { verifyApiIntegration, DEPLOYED_SWAGGER_URL, API_BASE_URL } from '../config/api.config';

interface IntegrationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

interface IntegrationResult {
  success: boolean;
  checks: IntegrationCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

const ApiIntegrationStatus: React.FC = () => {
  const [result, setResult] = useState<IntegrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const verificationResult = await verifyApiIntegration();
      setResult(verificationResult);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Integration verification failed:', error);
      setResult({
        success: false,
        checks: [
          {
            name: 'Verification Process',
            status: 'fail',
            message: `Failed to run verification: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          warnings: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-verify on mount
    handleVerify();
  }, []);

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return '✓';
      case 'fail':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return '?';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API Integration Status</h2>
        <p className="text-gray-600">
          Verify connectivity and configuration with the deployed API at{' '}
          <a
            href={DEPLOYED_SWAGGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {DEPLOYED_SWAGGER_URL}
          </a>
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            <strong>API Base URL:</strong> {API_BASE_URL}
          </p>
          {lastChecked && (
            <p className="text-xs text-gray-500 mt-1">
              Last checked: {lastChecked.toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify Integration'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Summary</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.success ? 'All Checks Passed' : 'Some Checks Failed'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total:</span>{' '}
                <span className="font-semibold">{result.summary.total}</span>
              </div>
              <div>
                <span className="text-green-600">Passed:</span>{' '}
                <span className="font-semibold text-green-700">{result.summary.passed}</span>
              </div>
              <div>
                <span className="text-red-600">Failed:</span>{' '}
                <span className="font-semibold text-red-700">{result.summary.failed}</span>
              </div>
              <div>
                <span className="text-yellow-600">Warnings:</span>{' '}
                <span className="font-semibold text-yellow-700">{result.summary.warnings}</span>
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 mb-2">Detailed Checks</h3>
            {result.checks.map((check, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl font-bold">{getStatusIcon(check.status)}</span>
                    <div>
                      <h4 className="font-semibold mb-1">{check.name}</h4>
                      <p className="text-sm">{check.message}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      check.status === 'pass'
                        ? 'bg-green-200 text-green-800'
                        : check.status === 'fail'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {check.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Links</h3>
            <div className="flex flex-wrap gap-2">
              <a
                href={DEPLOYED_SWAGGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                View Swagger Documentation
              </a>
              <a
                href={`${API_BASE_URL.replace('/api', '')}/health`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Check API Health
              </a>
              <a
                href={API_BASE_URL.replace('/api', '')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                API Root
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && !result && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Verifying API integration...</p>
        </div>
      )}
    </div>
  );
};

export default ApiIntegrationStatus;

