const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const password = 'password123';
    
    // Test bcrypt directly
    console.log('🔍 Testing bcrypt directly...');
    const hash = await bcrypt.hash(password, 12);
    console.log('Hash created:', hash.substring(0, 20) + '...');
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('Direct bcrypt test:', isValid);

    // Test with User model
    console.log('\n🔍 Testing with User model...');
    const User = require('./dist/models/User').default;
    
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hash,
      role: 'hospital'
    });
    
    const userIsValid = await testUser.comparePassword(password);
    console.log('User model test:', userIsValid);

    // Test with existing user
    console.log('\n🔍 Testing with existing user...');
    const existingUser = await User.findOne({ email: 'reine123e@gmail.com' }).select('+password');
    if (existingUser) {
      console.log('User found:', existingUser.email);
      console.log('Password field exists:', !!existingUser.password);
      console.log('Password length:', existingUser.password ? existingUser.password.length : 'No password');
      
      const existingIsValid = await existingUser.comparePassword(password);
      console.log('Existing user test:', existingIsValid);
    } else {
      console.log('No existing user found');
    }

  } catch (error) {
    console.error('❌ Error debugging password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the debug
debugPassword();
