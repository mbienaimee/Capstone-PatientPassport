require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function checkPassword() {
  try {
    console.log('✅ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'm.bienaimee@alustudent.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔒 Has password: ${!!user.password}`);
    console.log(`🔐 Password hash: ${user.password}\n`);

    // Test common passwords
    const testPasswords = ['password', 'Password123', 'Betty123', 'betty123', '123456'];
    
    console.log('🔍 Testing common passwords...\n');
    for (const testPass of testPasswords) {
      const match = await bcrypt.compare(testPass, user.password);
      console.log(`   "${testPass}": ${match ? '✅ MATCH!' : '❌ no match'}`);
      if (match) break;
    }

    console.log('\n✅ Disconnected from MongoDB');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkPassword();
