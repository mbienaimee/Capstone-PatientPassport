import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Notification } from './ui/Notification';

interface FederatedPatientData {
  universalId: string;
  patientName: string;
  gender: string;
  birthdate: string;
  hospitalData: HospitalData[];
  lastUpdated: string;
}

interface HospitalData {
  hospitalId: string;
  hospitalName: string;
  fhirData: string;
  lastSync: string;
  availableResources: string[];
}

interface ConsentToken {
  id: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
  purpose: string;
  usedAt?: string;
}

interface AuditLog {
  id: string;
  action: string;
  accessType: string;
  details: string;
  accessTime: string;
  user: string;
  hospital: string;
}

const FederatedPatientPassport: React.FC = () => {
  const [federatedData, setFederatedData] = useState<FederatedPatientData | null>(null);
  const [consentTokens, setConsentTokens] = useState<ConsentToken[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'audit' | 'proxies'>('overview');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenDuration, setTokenDuration] = useState(60);

  useEffect(() => {
    loadFederatedData();
    loadConsentTokens();
    loadAuditLogs();
  }, []);

  const loadFederatedData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/federated/patient-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFederatedData(data.data);
      }
    } catch (err) {
      setError('Failed to load federated patient data');
    } finally {
      setLoading(false);
    }
  };

  const loadConsentTokens = async () => {
    try {
      const response = await fetch('/api/federated/consent-tokens', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsentTokens(data.data);
      }
    } catch (err) {
      console.error('Failed to load consent tokens:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/federated/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const generateConsentToken = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/federated/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          duration: tokenDuration,
          purpose: 'Patient Generated Token'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsentTokens(prev => [data.data, ...prev]);
        setShowTokenModal(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate token');
      }
    } catch (err) {
      setError('Failed to generate consent token');
    } finally {
      setLoading(false);
    }
  };

  const revokeConsentToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/federated/revoke-token/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setConsentTokens(prev => prev.filter(token => token.id !== tokenId));
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to revoke token');
      }
    } catch (err) {
      setError('Failed to revoke consent token');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'consent':
        return 'bg-green-100 text-green-800';
      case 'regular':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !federatedData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Federated Patient Passport</h1>
        <p className="text-gray-600 mt-2">
          Manage your medical records across multiple hospitals
        </p>
      </div>

      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'tokens', label: 'Access Tokens' },
            { id: 'audit', label: 'Access History' },
            { id: 'proxies', label: 'Proxies' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {federatedData && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Universal ID</label>
                    <p className="text-lg font-mono">{federatedData.universalId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg">{federatedData.patientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-lg">{federatedData.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="text-lg">{formatDate(federatedData.birthdate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Hospital Records</CardTitle>
            </CardHeader>
            <CardContent>
              {federatedData?.hospitalData.length ? (
                <div className="space-y-4">
                  {federatedData.hospitalData.map((hospital) => (
                    <div key={hospital.hospitalId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{hospital.hospitalName}</h3>
                          <p className="text-sm text-gray-500">ID: {hospital.hospitalId}</p>
                        </div>
                        <Badge variant="outline">
                          Last Sync: {formatDate(hospital.lastSync)}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Available Resources: {hospital.availableResources.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hospital records found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Access Tokens</h2>
            <Button onClick={() => setShowTokenModal(true)}>
              Generate New Token
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              {consentTokens.length ? (
                <div className="space-y-4">
                  {consentTokens.map((token) => (
                    <div key={token.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-lg">{token.token}</p>
                          <p className="text-sm text-gray-500">{token.purpose}</p>
                          <p className="text-sm text-gray-500">
                            Expires: {formatDate(token.expiresAt)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge
                            variant={token.isActive ? 'default' : 'secondary'}
                          >
                            {token.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {token.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revokeConsentToken(token.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No consent tokens found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Access History</h2>

          <Card>
            <CardContent className="p-6">
              {auditLogs.length ? (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{log.action}</p>
                          <p className="text-sm text-gray-500">{log.details}</p>
                          <p className="text-sm text-gray-500">
                            {log.user} at {log.hospital}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getAccessTypeColor(log.accessType)}>
                            {log.accessType}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(log.accessTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No audit logs found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proxies Tab */}
      {activeTab === 'proxies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Authorized Proxies</h2>
            <Button>Add Proxy</Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Proxy management feature coming soon</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Generation Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Generate Access Token</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={tokenDuration}
                  onChange={(e) => setTokenDuration(parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTokenModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={generateConsentToken} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederatedPatientPassport;

