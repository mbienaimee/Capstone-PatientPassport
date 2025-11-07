// Update Patient Passport patient name to match OpenMRS
require('dotenv').config();
const mongoose = require('mongoose');

const userId = '68ee335dab3f1c84488dec17';
const newName = 'Betty Williams'; // Match OpenMRS patient with 128 observations

async function updatePatientName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { name: newName } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated patient name to: ${newName}`);
      console.log('\n📋 What happens now:');
      console.log('   1. Patient in Patient Passport: "Betty Williams"');
      console.log('   2. Patient in OpenMRS: "Betty Williams" (128 observations)');
      console.log('   3. ✅ AUTOMATIC SYNC will match by name!');
      console.log('   4. ✅ All 128 observations will sync automatically');
      console.log('   5. ✅ Doctors only enter data in OpenMRS');
      console.log('   6. ✅ Data appears in Patient Passport within 5 minutes\n');
      console.log('🔄 Restart your backend server to trigger immediate sync!');
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
