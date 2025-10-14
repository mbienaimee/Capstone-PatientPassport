const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;

async function debugPasswordIssue() {
  try {
    console.log('Debugging Password Issue...\n');

    // Find King Faisal user
    const kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');

    if (!kingFaisalUser) {
      console.log('❌ King Faisal user not found');
      return;
    }

    console.log('User Details:');
    console.log('- ID:', kingFaisalUser._id);
    console.log('- Name:', kingFaisalUser.name);
    console.log('- Email:', kingFaisalUser.email);
    console.log('- Role:', kingFaisalUser.role);
    console.log('- Password field exists:', 'password' in kingFaisalUser);
    console.log('- Password value:', kingFaisalUser.password);
    console.log('- Password type:', typeof kingFaisalUser.password);
    console.log('- Password length:', kingFaisalUser.password ? kingFaisalUser.password.length : 0);

    // Test direct password update
    console.log('\n=== Testing Direct Password Update ===');
    const bcrypt = require('bcryptjs');
    const testPassword = 'password123';
    const newHash = await bcrypt.hash(testPassword, 12);
    
    console.log('New hash:', newHash);
    console.log('New hash length:', newHash.length);
    
    // Update password directly
    kingFaisalUser.password = newHash;
    await kingFaisalUser.save();
    
    console.log('Password updated, re-fetching...');
    
    // Re-fetch user
    const updatedUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');
    
    console.log('Updated user password:', updatedUser.password);
    console.log('Updated password length:', updatedUser.password ? updatedUser.password.length : 0);
    
    // Test comparison
    console.log('\n=== Testing Password Comparison ===');
    try {
      const comparisonResult = await updatedUser.comparePassword(testPassword);
      console.log('Comparison result:', comparisonResult);
      
      // Test with bcrypt directly
      const directComparison = await bcrypt.compare(testPassword, updatedUser.password);
      console.log('Direct bcrypt comparison:', directComparison);
      
    } catch (error) {
      console.log('Comparison error:', error.message);
    }

    // Test with a completely new user
    console.log('\n=== Testing with New User ===');
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('testpass123', 12),
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });
    
    console.log('Test user created:', testUser._id);
    
    const testUserWithPassword = await User.findById(testUser._id).select('+password');
    const testComparison = await testUserWithPassword.comparePassword('testpass123');
    console.log('Test user password comparison:', testComparison);
    
    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log('Test user cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('Error debugging password issue:', error);
    process.exit(1);
  }
}

debugPasswordIssue();
