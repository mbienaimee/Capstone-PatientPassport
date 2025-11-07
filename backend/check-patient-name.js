// Check patient name from user ID
require('dotenv').config();
const mongoose = require('mongoose');

const userId = '68ee335dab3f1c84488dec17';
const MONGODB_URI = process.env.MONGODB_URI;

async function checkPatient() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Get user info
    const user = await mongoose.connection.db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(userId) 
    });
    
    if (user) {
      console.log('✅ Patient User Found:');
      console.log('   Name:', user.name);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
    } else {
      console.log('❌ User not found');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPatient();
