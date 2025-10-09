// Test script to verify doctor dashboard functionality
console.log('Testing Doctor Dashboard...');

// Test 1: Check if user is authenticated
const user = JSON.parse(localStorage.getItem('user') || 'null');
console.log('Current user:', user);

if (!user) {
  console.error('No user found in localStorage');
} else if (user.role !== 'doctor') {
  console.error('User is not a doctor, role:', user.role);
} else {
  console.log('User is authenticated as doctor');
}

// Test 2: Check if token exists
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

// Test 3: Test API call
async function testAPICall() {
  try {
    const response = await fetch('http://localhost:5000/api/patients?limit=1000', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);
    
    if (data.success) {
      console.log('Success! Found', data.data.length, 'patients');
      if (data.data.length > 0) {
        console.log('First patient structure:', data.data[0]);
      }
    } else {
      console.error('API Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Run the test
testAPICall();

