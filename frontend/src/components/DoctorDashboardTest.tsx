import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const DoctorDashboardTest: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('DoctorDashboardTest mounted');
    console.log('User:', user);
    
    if (user && user.role === 'doctor') {
      fetchPatients();
    } else {
      setError('User not authenticated as doctor');
      setLoading(false);
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching patients...');
      const response = await apiService.getPatients();
      console.log('API Response:', response);
      
      setDebugInfo({
        success: response.success,
        message: response.message,
        dataLength: response.data?.length || 0,
        hasData: !!response.data
      });
      
      if (response.success && response.data) {
        setPatients(response.data);
      } else {
        setError(response.message || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>No user found</div>;
  }

  if (user.role !== 'doctor') {
    return <div>User is not a doctor. Role: {user.role}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Doctor Dashboard Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={fetchPatients} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Patients'}
        </button>
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}
      
      {loading && <div>Loading patients...</div>}
      
      {!loading && patients.length === 0 && !error && (
        <div>No patients found</div>
      )}
      
      {patients.length > 0 && (
        <div>
          <h3>Patients ({patients.length}):</h3>
          <table style={{ border: '1px solid #ccc', borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>National ID</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {patient.user?.name || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {patient.user?.email || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {patient.nationalId || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {patient.status || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardTest;

