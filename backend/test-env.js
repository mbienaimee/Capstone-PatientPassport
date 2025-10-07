require('dotenv').config();

console.log('🔍 Environment Variables Check');
console.log('==============================');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***' : 'undefined');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'undefined');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Gmail credentials are loaded correctly');
} else {
  console.log('❌ Gmail credentials are missing');
}




