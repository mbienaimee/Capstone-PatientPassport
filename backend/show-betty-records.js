const mongoose = require('mongoose');
require('dotenv').config();

async function showBettyRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const bettyUser = await mongoose.connection.db.collection('users').findOne({ 
      name: /betty williams/i 
    });

    if (!bettyUser) {
      console.log('❌ Betty Williams not found');
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

    console.log('Betty Williams Patient ID:', bettyPatient._id.toString());
    console.log('');

    const bettyRecords = await mongoose.connection.db.collection('medicalrecords')
      .find({ patientId: bettyPatient._id })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('============================================================');
    console.log('✅ Betty Williams Medical Records:', bettyRecords.length);
    console.log('============================================================\n');

    if (bettyRecords.length > 0) {
      console.log('📋 All Records:\n');
      bettyRecords.forEach((r, i) => {
        console.log(`${i+1}. Type: ${r.type}`);
        console.log(`   Date: ${new Date(r.date).toLocaleString()}`);
        console.log(`   Description: ${r.description || 'N/A'}`);
        console.log(`   Data:`, JSON.stringify(r.data, null, 2));
        console.log(`   Created: ${new Date(r.createdAt).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No medical records found with patientId matching Betty');
    }

    mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showBettyRecords();
