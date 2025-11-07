// Quick script to get Hospital MongoDB ID
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

async function getHospitalId() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get hospitals
    const hospitals = await mongoose.connection.db.collection('hospitals').find({}).toArray();
    
    if (hospitals.length === 0) {
      console.log('❌ No hospitals found in database');
      console.log('💡 You need to register a hospital first in Patient Passport');
    } else {
      console.log('📋 Available Hospitals:\n');
      hospitals.forEach((hospital, index) => {
        console.log(`${index + 1}. Hospital Name: ${hospital.name || 'N/A'}`);
        console.log(`   MongoDB ID: ${hospital._id}`);
        console.log(`   Location: ${hospital.location || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n📝 Copy the MongoDB ID above and paste it in your .env file:');
      console.log(`   HOSPITAL_1_ID=${hospitals[0]._id}`);
      console.log(`   HOSPITAL_1_ENABLED=true`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getHospitalId();
