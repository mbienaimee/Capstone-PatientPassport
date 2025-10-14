const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;

async function fixKingFaisalPassword() {
  try {
    console.log('Fixing King Faisal Password...\n');

    // Find King Faisal user
    const kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    });

    if (!kingFaisalUser) {
      console.log('❌ King Faisal user not found');
      return;
    }

    console.log('Before fix:');
    console.log('- Name:', kingFaisalUser.name);
    console.log('- Email:', kingFaisalUser.email);
    console.log('- Has Password:', !!kingFaisalUser.password);
    console.log('- Password Preview:', kingFaisalUser.password ? kingFaisalUser.password.substring(0, 20) + '...' : 'No password');

    // Create a fresh password hash
    const bcrypt = require('bcryptjs');
    const newPassword = 'password123';
    const freshHash = await bcrypt.hash(newPassword, 12);
    
    console.log('\nNew password hash created:');
    console.log('- Hash:', freshHash.substring(0, 20) + '...');
    console.log('- Length:', freshHash.length);

    // Test the new hash
    const testResult = await bcrypt.compare(newPassword, freshHash);
    console.log('- Test comparison result:', testResult);

    // Update the user with the fresh hash
    kingFaisalUser.password = freshHash;
    await kingFaisalUser.save();

    console.log('\nAfter fix:');
    console.log('- Password updated successfully');
    console.log('- New password preview:', kingFaisalUser.password.substring(0, 20) + '...');

    // Test the updated password
    console.log('\nTesting updated password...');
    const updatedUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');

    try {
      const verificationResult = await updatedUser.comparePassword('password123');
      console.log('Password verification result:', verificationResult);
      
      if (verificationResult) {
        console.log('✅ Password verification works!');
      } else {
        console.log('❌ Password verification still failing');
      }
    } catch (error) {
      console.log('Password verification error:', error.message);
    }

    console.log('\n🎉 King Faisal Password Fix Complete!');
    console.log('\nLogin Credentials:');
    console.log('Email: kingfaisal@hospital.com');
    console.log('Password: password123');
    console.log('Role: hospital');
    console.log('✅ Can login directly to hospital dashboard');
    console.log('✅ No OTP verification required');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing King Faisal password:', error);
    process.exit(1);
  }
}

fixKingFaisalPassword();
