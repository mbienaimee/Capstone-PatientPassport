// Update patient name to match OpenMRS
require('dotenv').config();
const mongoose = require('mongoose');

const userId = '68ee335dab3f1c84488dec17';
const newName = 'Betty Williams'; // Match OpenMRS patient

const MONGODB_URI = process.env.MONGODB_URI;

async function updatePatientName() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Update user name
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { name: newName } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Patient name updated successfully!');
      console.log(`   Old Name: Marie Reine`);
      console.log(`   New Name: ${newName}`);
      console.log('');
      console.log('🔄 The sync service will now match this patient with OpenMRS!');
      console.log('   Wait for the next sync cycle (5 minutes) or restart the server.');
    } else {
      console.log('⚠️ No changes made');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePatientName();
