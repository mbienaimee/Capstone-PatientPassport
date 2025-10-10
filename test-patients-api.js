// Test script to verify patients API endpoint
const fetch = require('node-fetch');

async function testPatientsAPI() {
  try {
    console.log('Testing patients API endpoint...');
    
    // First, let's login as a doctor to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'bienaimee@gmail.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.success && loginData.data.token) {
      const token = loginData.data.token;
      console.log('Token received:', token.substring(0, 20) + '...');
      
      // Now test the patients endpoint with the token
      const patientsResponse = await fetch('http://localhost:5000/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const patientsData = await patientsResponse.json();
      console.log('Patients API response status:', patientsResponse.status);
      console.log('Patients API response:', patientsData);
      
      if (patientsData.success && patientsData.data) {
        console.log('Number of patients found:', patientsData.data.length);
        patientsData.data.forEach((patient, index) => {
          console.log(`${index + 1}. ${patient.name || 'No name'} (${patient.nationalId || 'No ID'})`);
        });
      }
    } else {
      console.error('Login failed:', loginData);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPatientsAPI();






