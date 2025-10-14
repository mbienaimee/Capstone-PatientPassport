const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;

async function testPasswordVerification() {
  try {
    console.log('Testing Password Verification...\n');

    // Find King Faisal user with password
    const kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');

    if (!kingFaisalUser) {
      console.log('❌ King Faisal user not found');
      return;
    }

    console.log('User Details:');
    console.log('- Name:', kingFaisalUser.name);
    console.log('- Email:', kingFaisalUser.email);
    console.log('- Role:', kingFaisalUser.role);
    console.log('- Has Password:', !!kingFaisalUser.password);
    console.log('- Password Length:', kingFaisalUser.password ? kingFaisalUser.password.length : 0);
    console.log('- Password Preview:', kingFaisalUser.password ? kingFaisalUser.password.substring(0, 20) + '...' : 'No password');

    // Test password verification
    console.log('\nTesting password verification...');
    
    try {
      const result1 = await kingFaisalUser.comparePassword('password123');
      console.log('Password "password123" result:', result1);
    } catch (error) {
      console.log('Error testing password123:', error.message);
    }

    try {
      const result2 = await kingFaisalUser.comparePassword('wrongpassword');
      console.log('Password "wrongpassword" result:', result2);
    } catch (error) {
      console.log('Error testing wrongpassword:', error.message);
    }

    // Test with bcrypt directly
    console.log('\nTesting with bcrypt directly...');
    const bcrypt = require('bcryptjs');
    
    try {
      const directResult = await bcrypt.compare('password123', kingFaisalUser.password);
      console.log('Direct bcrypt comparison result:', directResult);
    } catch (error) {
      console.log('Direct bcrypt error:', error.message);
    }

    // Create a new password hash to test
    console.log('\nCreating new password hash...');
    const newHash = await bcrypt.hash('password123', 12);
    console.log('New hash created:', newHash.substring(0, 20) + '...');
    
    try {
      const newHashResult = await bcrypt.compare('password123', newHash);
      console.log('New hash comparison result:', newHashResult);
    } catch (error) {
      console.log('New hash comparison error:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error testing password verification:', error);
    process.exit(1);
  }
}

testPasswordVerification();
