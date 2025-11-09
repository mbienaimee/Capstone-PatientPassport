require('dotenv').config();
const mongoose = require('mongoose');

async function checkBettyWilliamsUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      isActive: Boolean
    }));

    // Search for Betty Williams user
    console.log('🔍 Searching for Betty Williams in Users collection...\n');

    const users = await User.find({
      name: /betty.*williams/i,
      role: 'patient'
    });

    console.log(`📋 Found ${users.length} users matching "Betty Williams":\n`);

    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log('');
      });
    } else {
      console.log('❌ No patient user found for Betty Williams\n');
      
      // Check all patient users
      const allPatients = await User.find({ role: 'patient' }).limit(10);
      console.log(`📊 First 10 patient users in database:`);
      allPatients.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBettyWilliamsUser();
