// Simple test script to check if the patients API is working
const API_BASE_URL = 'http://localhost:5000/api';

async function testPatientsAPI() {
  try {
    console.log('Testing patients API...');
    
    // First, let's try to login as a doctor
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'doctor@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');
    
    // Now try to fetch patients
    const patientsResponse = await fetch(`${API_BASE_URL}/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const patientsData = await patientsResponse.json();
    console.log('Patients response status:', patientsResponse.status);
    console.log('Patients response:', patientsData);
    
    if (patientsData.success) {
      console.log('Success! Found', patientsData.data.length, 'patients');
      if (patientsData.data.length > 0) {
        console.log('First patient:', patientsData.data[0]);
      }
    } else {
      console.error('Failed to fetch patients:', patientsData.message);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPatientsAPI();

