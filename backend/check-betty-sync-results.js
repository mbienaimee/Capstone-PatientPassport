const mongoose = require('mongoose');
require('dotenv').config();

async function checkBettySyncedRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const bettyUser = await mongoose.connection.db.collection('users').findOne({ 
      name: /betty williams/i 
    });

    if (!bettyUser) {
      console.log('❌ Betty Williams not found in users collection');
      mongoose.disconnect();
      return;
    }

    const bettyPatient = await mongoose.connection.db.collection('patients').findOne({ 
      user: bettyUser._id 
    });

    if (!bettyPatient) {
      console.log('❌ Betty Williams patient record not found');
      mongoose.disconnect();
      return;
    }

    const bettyRecords = await mongoose.connection.db.collection('medicalrecords')
      .find({ patient: bettyPatient._id })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('============================================================');
    console.log('✅ Betty Williams Medical Records Synced:', bettyRecords.length);
    console.log('============================================================\n');

    if (bettyRecords.length > 0) {
      console.log('📋 Most Recent 15 Records:\n');
      bettyRecords.slice(0, 15).forEach((r, i) => {
        console.log(`${i+1}. Type: ${r.type}`);
        console.log(`   Date: ${new Date(r.date).toLocaleDateString()}`);
        console.log(`   Description: ${r.description || 'N/A'}`);
        console.log(`   Created: ${new Date(r.createdAt).toLocaleString()}`);
        console.log('');
      });

      // Count by type
      const typeCount = {};
      bettyRecords.forEach(r => {
        typeCount[r.type] = (typeCount[r.type] || 0) + 1;
      });

      console.log('\n============================================================');
      console.log('📊 Records by Type:');
      console.log('============================================================\n');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} records`);
      });
    } else {
      console.log('⚠️  No medical records found for Betty Williams');
      console.log('This could mean:');
      console.log('   1. Sync hasn\'t run yet');
      console.log('   2. OpenMRS has no observations for Betty Williams');
      console.log('   3. Duplicate detection is preventing records');
    }

    mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBettySyncedRecords();
