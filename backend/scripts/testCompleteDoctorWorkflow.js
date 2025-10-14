const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testCompleteDoctorWorkflow() {
  try {
    console.log('🧪 Testing Complete Doctor Workflow...\n');

    // Step 1: Login as doctor
    console.log('=== Step 1: Doctor Login ===');
    const doctorCredentials = {
      email: 'm36391038@gmail.com',
      password: 'Umurerwa123!'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, doctorCredentials);
    console.log('✅ Doctor login successful');
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('Doctor details:', {
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Step 2: Get patient list
    console.log('\n=== Step 2: Get Patient List ===');
    const patientsResponse = await axios.get(`${API_BASE_URL}/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (patientsResponse.data.data.length === 0) {
      console.log('❌ No patients found for testing');
      return;
    }

    const testPatient = patientsResponse.data.data[0];
    console.log('✅ Patient list loaded:', {
      count: patientsResponse.data.data.length,
      testPatient: {
        name: testPatient.user.name,
        nationalId: testPatient.nationalId,
        id: testPatient._id
      }
    });

    // Step 3: Doctor clicks "View" - Request OTP
    console.log('\n=== Step 3: Doctor Clicks "View" - Request OTP ===');
    try {
      const otpRequestResponse = await axios.post(`${API_BASE_URL}/passport-access/request-otp`, {
        patientId: testPatient._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ OTP request successful');
      console.log('📧 OTP sent to:', otpRequestResponse.data.data.patientEmail);
      console.log('⏰ OTP expires in:', otpRequestResponse.data.data.otpExpiry);
      
      console.log('\n📋 Instructions for Doctor:');
      console.log('1. Ask the patient to check their email:', otpRequestResponse.data.data.patientEmail);
      console.log('2. Patient should share the 6-digit OTP code with you');
      console.log('3. Enter the code in the OTP field');
      console.log('4. You will then have access to view and update their passport');

      // Step 4: Simulate patient sharing OTP (in real scenario, doctor enters this)
      console.log('\n=== Step 4: Patient Shares OTP Code ===');
      console.log('💬 Patient says: "Here is my OTP code: 123456"');
      
      // Note: In real scenario, doctor would enter the actual OTP from patient
      // For testing, we'll use a mock OTP (this will fail in real scenario)
      const mockOTP = '123456';
      console.log('🔢 Doctor enters OTP:', mockOTP);

      // Step 5: Verify OTP and get passport access
      console.log('\n=== Step 5: Verify OTP and Access Passport ===');
      try {
        const otpVerifyResponse = await axios.post(`${API_BASE_URL}/passport-access/verify-otp`, {
          patientId: testPatient._id,
          otpCode: mockOTP
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ OTP verification successful!');
        console.log('🎉 Doctor now has access to patient passport');
        
        const passportData = otpVerifyResponse.data.data.passport;
        console.log('📄 Passport data received:', {
          id: passportData._id,
          patientName: passportData.personalInfo?.fullName,
          nationalId: passportData.personalInfo?.nationalId,
          version: passportData.version,
          lastUpdated: passportData.lastUpdated
        });

        // Step 6: Doctor can now view and update passport
        console.log('\n=== Step 6: Doctor Updates Passport ===');
        const updateData = {
          personalInfo: {
            ...passportData.personalInfo,
            bloodType: 'O+',
            address: 'Updated Address, City, Country'
          },
          medicalInfo: {
            ...passportData.medicalInfo,
            allergies: ['Peanuts', 'Shellfish'],
            medicalConditions: [
              {
                condition: 'Hypertension',
                diagnosedDate: new Date(),
                diagnosedBy: 'Dr. Smith',
                status: 'active',
                notes: 'Controlled with medication'
              }
            ]
          }
        };

        const updateResponse = await axios.put(`${API_BASE_URL}/passport-access/${testPatient._id}`, updateData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Passport update successful!');
        console.log('📝 Updated passport version:', updateResponse.data.data.version);
        console.log('🕒 Last updated:', updateResponse.data.data.lastUpdated);

        console.log('\n🎉 Complete Workflow Summary:');
        console.log('✅ Doctor login successful');
        console.log('✅ Patient list loaded');
        console.log('✅ OTP sent to patient email');
        console.log('✅ Doctor receives OTP from patient');
        console.log('✅ OTP verification successful');
        console.log('✅ Passport access granted');
        console.log('✅ Doctor can view passport data');
        console.log('✅ Doctor can update passport');
        console.log('✅ All changes saved successfully');

      } catch (otpError) {
        console.log('❌ OTP verification failed:', otpError.response?.data?.message || otpError.message);
        console.log('💡 This is expected if OTP is invalid or expired');
        console.log('💡 In real scenario, doctor would enter the correct OTP from patient');
      }

    } catch (otpRequestError) {
      console.log('❌ OTP request failed:', otpRequestError.response?.data?.message || otpRequestError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/auth/me`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the backend server first.');
      console.log('Run: cd backend && npm run dev');
      return false;
    }
    return true; // Server is running but endpoint might require auth
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testCompleteDoctorWorkflow();
  }
}

main();
