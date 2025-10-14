const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Patient = require('../dist/models/Patient').default;

async function testAuthMe() {
  try {
    console.log('Testing /auth/me endpoint data...');

    // Find the user
    const user = await User.findOne({ email: 'm.bienaimee@alustudent.com' });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('User found:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Get role-specific profile with complete data
    let profile = null;
    
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id })
        .populate('medicalHistory')
        .populate('medications')
        .populate('testResults')
        .populate('hospitalVisits')
        .populate('assignedDoctors', 'specialization')
        .populate('assignedDoctors.user', 'name email');
    }

    console.log('Profile found:', profile ? {
      _id: profile._id,
      user: profile.user,
      nationalId: profile.nationalId,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      contactNumber: profile.contactNumber,
      address: profile.address,
      emergencyContact: profile.emergencyContact,
      status: profile.status
    } : 'No profile');

    // Simulate the response structure
    const response = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: user.getPublicProfile(),
        profile
      }
    };

    console.log('\n=== /auth/me Response Structure ===');
    console.log(JSON.stringify(response, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error testing auth/me:', error);
    process.exit(1);
  }
}

testAuthMe();
