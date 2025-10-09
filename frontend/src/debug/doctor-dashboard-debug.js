// Debug script for doctor dashboard issues
console.log('=== DOCTOR DASHBOARD DEBUG ===');

// Check localStorage
console.log('1. Checking localStorage:');
console.log('User:', localStorage.getItem('user'));
console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

// Check if user is authenticated
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (user) {
  console.log('2. User details:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
  
  if (user.role !== 'doctor') {
    console.error('❌ User is not a doctor! Role:', user.role);
  } else {
    console.log('✅ User is authenticated as doctor');
  }
} else {
  console.error('❌ No user found in localStorage');
}

// Test API connectivity
async function testAPI() {
  console.log('3. Testing API connectivity...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No token found');
    return;
  }
  
  try {
    // Test patients API
    console.log('Testing /api/patients endpoint...');
    const patientsResponse = await fetch('http://localhost:5000/api/patients?limit=1000', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Patients API Status:', patientsResponse.status);
    const patientsData = await patientsResponse.json();
    console.log('Patients API Response:', patientsData);
    
    if (patientsData.success) {
      console.log('✅ Patients API working, found', patientsData.data.length, 'patients');
    } else {
      console.error('❌ Patients API failed:', patientsData.message);
    }
    
    // Test doctor dashboard API
    console.log('Testing /api/dashboard/doctor endpoint...');
    const dashboardResponse = await fetch('http://localhost:5000/api/dashboard/doctor', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard API Status:', dashboardResponse.status);
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard API Response:', dashboardData);
    
    if (dashboardData.success) {
      console.log('✅ Dashboard API working');
      if (dashboardData.data?.stats?.recentPatients) {
        console.log('Found', dashboardData.data.stats.recentPatients.length, 'patients in dashboard');
      }
    } else {
      console.error('❌ Dashboard API failed:', dashboardData.message);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testAPI();

console.log('=== END DEBUG ===');

