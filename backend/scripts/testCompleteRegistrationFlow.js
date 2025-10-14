const fetch = require('node-fetch');

async function testCompleteRegistrationFlow() {
  try {
    console.log('Testing complete registration flow...');

    const testData = {
      name: 'Test Patient Complete',
      email: 'test.complete@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'patient',
      nationalId: '1234567890123456',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      contactNumber: '+250123456789',
      address: 'Kigali, Rwanda',
      emergencyContact: {
        name: 'Test Emergency',
        relationship: 'Sister',
        phone: '+250987654321'
      },
      bloodType: 'A+'
    };

    console.log('Sending registration request with data:', testData);

    const response = await fetch('https://capstone-patientpassport.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Registration response:', result);

    if (result.success) {
      console.log('✅ Registration successful!');
      console.log('User created:', result.data.user);
      
      // Now test login to see if patient profile was created
      console.log('\nTesting login...');
      const loginResponse = await fetch('https://capstone-patientpassport.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testData.email,
          password: testData.password
        })
      });

      const loginResult = await loginResponse.json();
      console.log('Login response:', loginResult);

      if (loginResult.success) {
        console.log('✅ Login successful!');
        
        // Test /auth/me to see if patient profile exists
        console.log('\nTesting /auth/me endpoint...');
        const meResponse = await fetch('https://capstone-patientpassport.onrender.com/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginResult.data.token}`
          }
        });

        const meResult = await meResponse.json();
        console.log('/auth/me response:', meResult);

        if (meResult.success && meResult.data.profile) {
          console.log('✅ Patient profile exists!');
          console.log('Patient profile data:', meResult.data.profile);
        } else {
          console.log('❌ Patient profile missing!');
        }
      } else {
        console.log('❌ Login failed:', loginResult.message);
      }
    } else {
      console.log('❌ Registration failed:', result.message);
    }

  } catch (error) {
    console.error('Error testing registration flow:', error);
  }
}

testCompleteRegistrationFlow();
