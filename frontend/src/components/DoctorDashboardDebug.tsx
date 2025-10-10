import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const DoctorDashboardDebug: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('DoctorDashboardDebug mounted');
    console.log('User:', user);
    console.log('User type:', typeof user);
    console.log('User role:', user?.role);
    console.log('User role type:', typeof user?.role);
    console.log('Role comparison:', user?.role === 'doctor');
    console.log('Role comparison (strict):', user?.role === 'doctor');
    console.log('Role comparison (loose):', user?.role == 'doctor');
    
    // Check localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    console.log('Stored user:', storedUser);
    console.log('Stored token:', storedToken ? 'Present' : 'Missing');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Parsed stored user:', parsedUser);
        console.log('Stored user role:', parsedUser.role);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    if (user && user.role === 'doctor') {
      fetchPatients();
    } else {
      setError(`User not authenticated as doctor. Role: "${user?.role}" (${typeof user?.role})`);
      setLoading(false);
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching patients...');
      console.log('Token from localStorage:', localStorage.getItem('token'));
      console.log('User from localStorage:', localStorage.getItem('user'));
      
      const response = await apiService.getPatients();
      console.log('API Response:', response);
      
      setDebugInfo({
        success: response.success,
        message: response.message,
        dataLength: response.data?.length || 0,
        hasData: !!response.data,
        fullResponse: response,
        tokenPresent: !!localStorage.getItem('token'),
        userPresent: !!localStorage.getItem('user')
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

  const testDirectAPI = async () => {
    try {
      console.log('Testing direct API call...');
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Direct API Response:', data);
      setDebugInfo(prev => ({ ...prev, directAPIResponse: data }));
    } catch (err) {
      console.error('Direct API Error:', err);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hospitalAuth');
    console.log('LocalStorage cleared');
    setDebugInfo(prev => ({ ...prev, storageCleared: true }));
  };

  const extractUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Extracted user from storage:', parsedUser);
        setDebugInfo(prev => ({ ...prev, extractedUser: parsedUser }));
      }
    } catch (e) {
      console.error('Error extracting user:', e);
    }
  };

  const testAPIService = async () => {
    try {
      console.log('Testing API service...');
      console.log('Token before API call:', localStorage.getItem('token'));
      console.log('User before API call:', localStorage.getItem('user'));
      
      const response = await apiService.getPatients();
      console.log('API Service Response:', response);
      setDebugInfo(prev => ({ ...prev, apiServiceResponse: response }));
    } catch (err) {
      console.error('API Service Error:', err);
      setDebugInfo(prev => ({ ...prev, apiServiceError: err.message }));
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: 'red' }}>No User Found in AuthContext</h1>
        <p>The authentication context does not have a user object.</p>
        
        <h2>LocalStorage Debug:</h2>
        <p><strong>Token:</strong> {localStorage.getItem('token') || 'Not found'}</p>
        <p><strong>User:</strong> {localStorage.getItem('user') || 'Not found'}</p>
        <p><strong>Hospital Auth:</strong> {localStorage.getItem('hospitalAuth') || 'Not found'}</p>
        
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => window.location.href = '/doctor-login'}>
            Go to Doctor Login
          </button>
          <button onClick={() => window.location.reload()} style={{ marginLeft: '10px' }}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'doctor') {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: 'red' }}>User Role Issue</h1>
        <p><strong>User Role:</strong> "{user?.role || 'undefined'}" (type: {typeof user?.role})</p>
        <p><strong>User Object:</strong></p>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        
        <h2>LocalStorage Debug:</h2>
        <p><strong>Token:</strong> {localStorage.getItem('token') || 'Not found'}</p>
        <p><strong>User:</strong> {localStorage.getItem('user') || 'Not found'}</p>
        
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => window.location.href = '/doctor-login'}>
            Go to Doctor Login
          </button>
          <button onClick={() => window.location.reload()} style={{ marginLeft: '10px' }}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Doctor Dashboard Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>User Info:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        <div style={{ marginTop: '10px' }}>
          <p><strong>User Role:</strong> "{user?.role}" (type: {typeof user?.role})</p>
          <p><strong>Role Check:</strong> {user?.role === 'doctor' ? '✅ TRUE' : '❌ FALSE'}</p>
          <p><strong>User ID:</strong> {user?._id || user?.id}</p>
          <p><strong>User Name:</strong> {user?.name}</p>
          <p><strong>User Email:</strong> {user?.email}</p>
        </div>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h3>LocalStorage Debug:</h3>
          <p><strong>Stored User:</strong> {localStorage.getItem('user') || 'Not found'}</p>
          <p><strong>Stored Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          <p><strong>Token Preview:</strong> {localStorage.getItem('token') ? localStorage.getItem('token')?.substring(0, 20) + '...' : 'None'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Debug Info:</h2>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={fetchPatients} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Patients'}
        </button>
        <button onClick={testDirectAPI} style={{ marginLeft: '10px' }}>
          Test Direct API
        </button>
        <button onClick={testAPIService} style={{ marginLeft: '10px' }}>
          Test API Service
        </button>
        <button onClick={clearStorage} style={{ marginLeft: '10px', backgroundColor: '#ff6b6b', color: 'white' }}>
          Clear Storage
        </button>
               <button onClick={reloadPage} style={{ marginLeft: '10px', backgroundColor: '#4ecdc4', color: 'white' }}>
                 Reload Page
               </button>
               <button onClick={() => window.location.href = '/doctor-dashboard'} style={{ marginLeft: '10px', backgroundColor: '#2ecc71', color: 'white', padding: '10px 20px', fontSize: '16px', fontWeight: 'bold' }}>
                 🎨 Go to Enhanced Dashboard
               </button>
        <button onClick={extractUserFromStorage} style={{ marginLeft: '10px', backgroundColor: '#ff9f43', color: 'white' }}>
          Extract User
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      <div>
        <h2>Patients ({patients.length}):</h2>
        {patients.length > 0 ? (
          <ul>
            {patients.map((patient, index) => (
              <li key={index}>
                {patient.user?.name || 'No name'} - {patient.nationalId || 'No ID'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No patients found</p>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardDebug;
