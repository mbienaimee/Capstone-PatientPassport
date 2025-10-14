import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const HospitalDashboardDebug: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [apiTest, setApiTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Gather debug information
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const hospitalAuth = localStorage.getItem('hospitalAuth');

    setDebugInfo({
      token: token ? 'Present' : 'Missing',
      userData: userData ? 'Present' : 'Missing',
      hospitalAuth: hospitalAuth ? 'Present' : 'Missing',
      parsedUser: userData ? JSON.parse(userData) : null,
      parsedHospitalAuth: hospitalAuth ? JSON.parse(hospitalAuth) : null,
      authContextUser: user,
      isLoading: isLoading
    });
  }, [user, isLoading]);

  const testHospitalDashboardAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing hospital dashboard API...');
      const response = await apiService.request('/dashboard/hospital');
      console.log('API Response:', response);
      setApiTest({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('API Test Error:', error);
      setApiTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetCurrentUser = async () => {
    setLoading(true);
    try {
      console.log('Testing getCurrentUser API...');
      const response = await apiService.getCurrentUser();
      console.log('GetCurrentUser Response:', response);
      setApiTest({
        success: true,
        data: response,
        testType: 'getCurrentUser'
      });
    } catch (error) {
      console.error('GetCurrentUser Test Error:', error);
      setApiTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testType: 'getCurrentUser'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('hospitalAuth');
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
          <button onClick={() => window.location.href = '/hospital-login'}>
            Go to Hospital Login
          </button>
          <button onClick={() => window.location.reload()} style={{ marginLeft: '10px' }}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'hospital') {
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
          <button onClick={() => window.location.href = '/hospital-login'}>
            Go to Hospital Login
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
      <h1>Hospital Dashboard Debug</h1>
      
      <h2>Authentication Status</h2>
      <p><strong>User Authenticated:</strong> {user ? 'Yes' : 'No'}</p>
      <p><strong>User Role:</strong> {user?.role}</p>
      <p><strong>User ID:</strong> {user?._id}</p>
      <p><strong>User Name:</strong> {user?.name}</p>
      <p><strong>User Email:</strong> {user?.email}</p>
      <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>

      <h2>LocalStorage Debug</h2>
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <h2>API Tests</h2>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testGetCurrentUser} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Test Get Current User
        </button>
        <button 
          onClick={testHospitalDashboardAPI} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          Test Hospital Dashboard API
        </button>
      </div>

      {apiTest && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          <h3>API Test Result:</h3>
          <pre>{JSON.stringify(apiTest, null, 2)}</pre>
        </div>
      )}

      <h2>Actions</h2>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/hospital-dashboard'} 
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Go to Hospital Dashboard
        </button>
        <button 
          onClick={() => window.location.href = '/hospital-login'} 
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Go to Hospital Login
        </button>
        <button 
          onClick={clearStorage} 
          style={{ marginRight: '10px', padding: '10px', backgroundColor: '#ff4444', color: 'white' }}
        >
          Clear Storage & Reload
        </button>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px' }}
        >
          Reload Page
        </button>
      </div>

      <h2>Environment Info</h2>
      <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not set'}</p>
      <p><strong>Current URL:</strong> {window.location.href}</p>
      <p><strong>User Agent:</strong> {navigator.userAgent}</p>
    </div>
  );
};

export default HospitalDashboardDebug;















