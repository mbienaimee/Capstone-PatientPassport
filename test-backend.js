// Simple test to check if backend is running
const API_BASE_URL = 'http://localhost:5000/api';

async function testBackend() {
  console.log('Testing backend connectivity...');
  
  try {
    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Backend response status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Backend is running (401 is expected without auth)');
    } else if (response.status === 200) {
      console.log('✅ Backend is running and responding');
    } else {
      console.log('⚠️ Backend responded with status:', response.status);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('❌ Backend is not accessible:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  }
}

testBackend();

