const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/ussd';

async function testUSSDWithNationalID() {
  console.log('\n🧪 Testing USSD with National ID: 1234567891012345');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/test`, {
      sessionId: `test-${Date.now()}`,
      phoneNumber: '+250788123456',
      text: '1*1*1234567891012345' // English -> National ID -> Marie's ID
    });

    if (response.data.success) {
      console.log('✅ TEST PASSED!');
      console.log('\nResponse Data:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\nUSSD Screen Output:');
      console.log('─'.repeat(60));
      console.log(response.data.data.response);
      console.log('─'.repeat(60));
    } else {
      console.log('❌ TEST FAILED!');
      console.log('Error:', response.data.message);
    }
  } catch (error) {
    console.log('❌ REQUEST FAILED!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function testUSSDWithEmail() {
  console.log('\n🧪 Testing USSD with Email: m.bienaimee@alustudent.com');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/test`, {
      sessionId: `test-${Date.now()}`,
      phoneNumber: '+250788123456',
      text: '1*2*m.bienaimee@alustudent.com' // English -> Email -> Marie's email
    });

    if (response.data.success) {
      console.log('✅ TEST PASSED!');
      console.log('\nResponse Data:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\nUSSD Screen Output:');
      console.log('─'.repeat(60));
      console.log(response.data.data.response);
      console.log('─'.repeat(60));
    } else {
      console.log('❌ TEST FAILED!');
      console.log('Error:', response.data.message);
    }
  } catch (error) {
    console.log('❌ REQUEST FAILED!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         USSD PASSPORT ACCESS - VERIFICATION TESTS          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  await testUSSDWithNationalID();
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  await testUSSDWithEmail();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                     TESTS COMPLETED                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

runTests().catch(console.error);
