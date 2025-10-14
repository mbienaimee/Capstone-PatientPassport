#!/usr/bin/env node

/**
 * Test Doctor Login API Call
 * 
 * This script will test the actual login API to see what's happening
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testDoctorLoginAPI() {
  console.log('🧪 Testing Doctor Login API Call...\n');
  
  const credentials = {
    email: 'test@doctor.com',
    password: 'Password123'
  };
  
  console.log('📋 Login Credentials:');
  console.log(`Email: ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
  
  try {
    console.log('\n🚀 Making login API call...');
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    console.log('✅ Login API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    if (response.data.success) {
      console.log('\n📊 User Data:');
      console.log('Name:', response.data.data.user.name);
      console.log('Email:', response.data.data.user.email);
      console.log('Role:', response.data.data.user.role);
      console.log('Token Present:', !!response.data.data.token);
      
      // Test patient list with the token
      console.log('\n📋 Testing Patient List with Token...');
      const patientResponse = await axios.get(`${BASE_URL}/patients`, {
        headers: {
          'Authorization': `Bearer ${response.data.data.token}`
        }
      });
      
      if (patientResponse.data.success) {
        console.log('✅ Patient list loaded successfully!');
        console.log(`Found ${patientResponse.data.data.length} patients`);
      } else {
        console.log('❌ Patient list failed:', patientResponse.data.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Login API Error:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Full Error:', error.response?.data);
    
    // Try with different credentials
    console.log('\n🔄 Trying with different credentials...');
    
    const alternativeCredentials = [
      { email: 'test@doctor.com', password: 'TestPass123' },
      { email: 'm36391038@gmail.com', password: 'password123' },
      { email: 'm36391038@gmail.com', password: 'Password123' }
    ];
    
    for (const creds of alternativeCredentials) {
      try {
        console.log(`\nTrying: ${creds.email} / ${creds.password}`);
        const altResponse = await axios.post(`${BASE_URL}/auth/login`, creds);
        
        if (altResponse.data.success) {
          console.log('✅ Alternative login successful!');
          console.log(`Doctor: ${altResponse.data.data.user.name}`);
          console.log(`Role: ${altResponse.data.data.user.role}`);
          
          // Test patient list
          const patientResponse = await axios.get(`${BASE_URL}/patients`, {
            headers: {
              'Authorization': `Bearer ${altResponse.data.data.token}`
            }
          });
          
          if (patientResponse.data.success) {
            console.log('✅ Patient list loaded successfully!');
            console.log(`Found ${patientResponse.data.data.length} patients`);
            
            console.log('\n🎉 SUCCESS! Doctor login and patient list are working!');
            console.log('\n📋 Working Credentials:');
            console.log(`Email: ${creds.email}`);
            console.log(`Password: ${creds.password}`);
            
            return true;
          }
        }
      } catch (altError) {
        console.log(`❌ Failed: ${altError.response?.data?.message || altError.message}`);
      }
    }
  }
  
  return false;
}

async function runTest() {
  console.log('🔍 Testing Doctor Login API...\n');
  
  const success = await testDoctorLoginAPI();
  
  if (success) {
    console.log('\n✅ Doctor login and patient list functionality is working correctly!');
  } else {
    console.log('\n❌ There are still issues with the doctor login.');
    console.log('\n🔧 Next steps:');
    console.log('1. Check if the backend server is running properly');
    console.log('2. Verify the database connection');
    console.log('3. Check the authentication middleware');
  }
}

runTest().catch(console.error);
