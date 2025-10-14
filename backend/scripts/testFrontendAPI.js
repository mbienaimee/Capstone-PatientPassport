const fetch = require('node-fetch');

async function testFrontendAPI() {
  try {
    console.log('Testing frontend API calls...');

    // First, let's login to get a token
    const loginResponse = await fetch('https://capstone-patientpassport.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'm.bienaimee@alustudent.com',
        password: 'password123' // You'll need to provide the correct password
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }

    const token = loginData.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // Now test the /auth/me endpoint
    const meResponse = await fetch('https://capstone-patientpassport.onrender.com/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const meData = await meResponse.json();
    console.log('\n=== /auth/me Response ===');
    console.log(JSON.stringify(meData, null, 2));

    if (meData.success && meData.data.profile) {
      const patientId = meData.data.profile._id;
      console.log('\nPatient ID:', patientId);

      // Test the passport endpoint
      const passportResponse = await fetch(`https://capstone-patientpassport.onrender.com/api/patients/passport/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const passportData = await passportResponse.json();
      console.log('\n=== /patients/passport/:patientId Response ===');
      console.log(JSON.stringify(passportData, null, 2));
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testFrontendAPI();
