require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./dist/models/User').default;
const Doctor = require('./dist/models/Doctor').default;

const checkJake = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find jake by email
    const jake = await User.findOne({ 
      $or: [
        { email: /jake/i },
        { name: /jake/i }
      ]
    });

    if (!jake) {
      console.log('❌ No user found with name/email containing "jake"');
      console.log('\nSearching all users...');
      const allUsers = await User.find().select('email name role');
      console.log('All users:');
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name}) - Role: ${u.role}`));
    } else {
      console.log('\n✅ Found user:');
      console.log(`   ID: ${jake._id}`);
      console.log(`   Email: ${jake.email}`);
      console.log(`   Name: ${jake.name}`);
      console.log(`   Role: ${jake.role}`);
      console.log(`   Active: ${jake.isActive}`);

      // Check if jake has a Doctor record
      const doctorRecord = await Doctor.findOne({ user: jake._id });
      
      if (doctorRecord) {
        console.log('\n✅ Doctor record found:');
        console.log(`   Doctor ID: ${doctorRecord._id}`);
        console.log(`   Specialization: ${doctorRecord.specialization}`);
        console.log(`   License Number: ${doctorRecord.licenseNumber}`);
        console.log(`   Hospital: ${doctorRecord.hospital}`);
      } else {
        console.log('\n❌ No Doctor record found for this user');
      }

      // If role is wrong and doctor record exists, suggest fix
      if (doctorRecord && jake.role !== 'doctor') {
        console.log('\n⚠️  ROLE MISMATCH DETECTED!');
        console.log(`   User has Doctor record but role is '${jake.role}'`);
        console.log(`   Should be: 'doctor'`);
        console.log('\n   Fixing now...');
        jake.role = 'doctor';
        await jake.save();
        console.log('✅ Role updated to "doctor"');
      } else if (!doctorRecord && jake.role === 'doctor') {
        console.log('\n⚠️  ROLE MISMATCH DETECTED!');
        console.log(`   User role is 'doctor' but no Doctor record exists`);
      } else {
        console.log('\n✅ Role matches record type');
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkJake();
