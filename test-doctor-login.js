// Test doctor login directly
const API_BASE_URL = 'http://localhost:5000/api';

async function testDoctorLogin() {
  try {
    console.log('Testing doctor login...');
    
    // Try to login as doctor
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
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginData.data.user);
      console.log('Token:', loginData.data.token ? 'Present' : 'Missing');
      
      // Now test patients API with the token
      const token = loginData.data.token;
      console.log('\nTesting patients API...');
      
      const patientsResponse = await fetch(`${API_BASE_URL}/patients?limit=1000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Patients API status:', patientsResponse.status);
      const patientsData = await patientsResponse.json();
      console.log('Patients API response:', patientsData);
      
    } else {
      console.error('❌ Login failed:', loginData.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDoctorLogin();

