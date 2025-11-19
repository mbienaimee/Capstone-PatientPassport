/**
 * Africa's Talking Setup Helper
 * 
 * This script helps you configure Africa's Talking credentials
 * and test the SMS service.
 * 
 * Usage:
 *   node setup-africastalking.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  AFRICA\'S TALKING SETUP HELPER');
  console.log('='.repeat(60) + '\n');

  console.log('This script will help you configure Africa\'s Talking for:');
  console.log('  - USSD Service (patient passport access)');
  console.log('  - SMS Service (sending passport summaries)\n');

  console.log('ℹ️  You need an Africa\'s Talking account.');
  console.log('   Sign up at: https://africastalking.com/\n');

  const hasAccount = await question('Do you have an Africa\'s Talking account? (yes/no): ');

  if (hasAccount.toLowerCase() !== 'yes' && hasAccount.toLowerCase() !== 'y') {
    console.log('\n📝 Steps to create an account:');
    console.log('   1. Visit: https://africastalking.com/');
    console.log('   2. Click "Sign Up"');
    console.log('   3. Choose "Sandbox" for testing (FREE)');
    console.log('   4. Verify your email');
    console.log('   5. Generate API Key from Dashboard → Settings\n');
    console.log('Run this script again after creating your account.\n');
    rl.close();
    return;
  }

  console.log('\n' + '-'.repeat(60));
  console.log('STEP 1: Choose Environment');
  console.log('-'.repeat(60) + '\n');
  console.log('1. Sandbox (FREE - for testing)');
  console.log('2. Production (requires payment)\n');

  const envChoice = await question('Choose environment (1 or 2): ');
  const isSandbox = envChoice === '1';

  console.log('\n' + '-'.repeat(60));
  console.log('STEP 2: Get Your Credentials');
  console.log('-'.repeat(60) + '\n');

  console.log('Login to your Africa\'s Talking dashboard:');
  console.log(isSandbox 
    ? '  https://account.africastalking.com/apps/sandbox'
    : '  https://account.africastalking.com/');
  console.log('\nNavigate to: Settings → API Key\n');

  const apiKey = await question('Enter your API Key: ');
  const username = isSandbox 
    ? 'sandbox' 
    : await question('Enter your Username: ');

  console.log('\n' + '-'.repeat(60));
  console.log('STEP 3: Update .env File');
  console.log('-'.repeat(60) + '\n');

  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('   Please create .env from .env.example first.\n');
    rl.close();
    return;
  }

  // Read current .env
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update Africa's Talking credentials
  envContent = envContent.replace(
    /AFRICASTALKING_API_KEY=.*/,
    `AFRICASTALKING_API_KEY=${apiKey}`
  );
  envContent = envContent.replace(
    /AFRICASTALKING_USERNAME=.*/,
    `AFRICASTALKING_USERNAME=${username}`
  );

  // Write back to .env
  fs.writeFileSync(envPath, envContent);

  console.log('✅ .env file updated!\n');
  console.log('Updated values:');
  console.log(`  AFRICASTALKING_API_KEY=${apiKey.substring(0, 10)}...`);
  console.log(`  AFRICASTALKING_USERNAME=${username}\n`);

  console.log('\n' + '-'.repeat(60));
  console.log('STEP 4: Test Configuration');
  console.log('-'.repeat(60) + '\n');

  const shouldTest = await question('Test SMS service now? (yes/no): ');

  if (shouldTest.toLowerCase() === 'yes' || shouldTest.toLowerCase() === 'y') {
    console.log('\n📞 Testing SMS service...\n');

    try {
      // Dynamically import and test
      const AfricasTalking = require('africastalking');
      const client = AfricasTalking({ apiKey, username });
      const sms = client.SMS;

      const testPhone = await question('Enter test phone number (e.g., +250788123456): ');

      console.log('\n📤 Sending test SMS...');
      
      const response = await sms.send({
        to: [testPhone],
        message: 'Test from Patient Passport System. Your Africa\'s Talking SMS service is working!'
      });

      console.log('\n✅ SMS SENT SUCCESSFULLY!');
      console.log('Response:', JSON.stringify(response, null, 2));
      
    } catch (error) {
      console.log('\n❌ SMS Test Failed:');
      console.log('Error:', error.message);
      
      if (error.message.includes('Invalid credentials')) {
        console.log('\n🔧 Possible issues:');
        console.log('  1. API Key is incorrect');
        console.log('  2. Username is incorrect');
        console.log('  3. Account not activated\n');
      } else if (error.message.includes('Insufficient balance')) {
        console.log('\n🔧 Issue: Insufficient SMS credits');
        console.log('  Add credits to your Africa\'s Talking account\n');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SETUP COMPLETE!');
  console.log('='.repeat(60) + '\n');

  console.log('✅ Next steps:');
  console.log('  1. Restart your backend server: npm run dev');
  console.log('  2. Test USSD service:');
  console.log('     curl -X POST http://localhost:5000/api/ussd/callback \\');
  console.log('       -H "Content-Type: application/json" \\');
  console.log('       -d \'{"sessionId":"test","phoneNumber":"+250788123456","text":""}\'');
  console.log('  3. Check server logs for: ✅ Africa\'s Talking SMS service initialized\n');

  if (isSandbox) {
    console.log('📱 Sandbox Testing:');
    console.log('  - Download Africa\'s Talking Simulator app');
    console.log('  - Use USSD code: *384*40767#');
    console.log('  - SMS will only be sent to verified numbers\n');
  } else {
    console.log('🚀 Production Setup:');
    console.log('  - Purchase USSD code from dashboard');
    console.log('  - Configure webhook: https://your-domain.com/api/ussd/callback');
    console.log('  - Test with real phone\n');
  }

  console.log('📖 Documentation:');
  console.log('  - Read: USSD_SETUP_COMPLETE_GUIDE.md');
  console.log('  - Visit: https://developers.africastalking.com/\n');

  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
